import { dbQuery, getPlatformDbPool, getPlatformDbStatus } from "../platform-db/index.mjs";

const DEFAULT_IDLE_SECONDS = 60 * 60 * 24 * 7;
const DEFAULT_ROLLING_SECONDS = 60 * 30;

let runtimePromise = null;

function parseCsv(input) {
  return String(input || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function boolEnv(name, fallback = false) {
  const raw = String(process.env[name] || "").trim().toLowerCase();
  if (!raw) return fallback;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

function numberEnv(name, fallback) {
  const parsed = Number.parseInt(String(process.env[name] || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isConfigured() {
  const secret = String(process.env.AUTH_SECRET || "").trim();
  const baseUrl = String(process.env.AUTH_BASE_URL || "").trim();
  const db = String(process.env.DATABASE_URL || "").trim();
  return Boolean(secret && baseUrl && db);
}

async function createOtpSender() {
  const host = String(process.env.SMTP_HOST || "").trim();
  const port = Number.parseInt(String(process.env.SMTP_PORT || "587"), 10);
  const user = String(process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || "").trim();
  const from = String(process.env.SMTP_FROM || "").trim();

  if (!host || !user || !pass || !from) {
    return async ({ email, otp, type }) => {
      console.warn(
        "[platform-auth] SMTP is not configured; OTP fallback code emitted to logs only.",
        JSON.stringify({ email, type, otp })
      );
    };
  }

  let nodemailer;
  try {
    nodemailer = await import("nodemailer");
  } catch (error) {
    console.warn("[platform-auth] nodemailer not installed; OTP fallback code emitted to logs only.", error);
    return async ({ email, otp, type }) => {
      console.warn("[platform-auth] OTP fallback", JSON.stringify({ email, type, otp }));
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number.isFinite(port) && port > 0 ? port : 587,
    secure: boolEnv("SMTP_SECURE", false),
    auth: { user, pass },
  });

  return async ({ email, otp, type }) => {
    await transporter.sendMail({
      from,
      to: email,
      subject: `Your Ternent verification code (${type})`,
      text: `Your verification code is ${otp}. It expires in 5 minutes.`,
    });
  };
}

async function buildRuntime() {
  if (!isConfigured()) {
    return {
      ok: false,
      reason: "Platform auth is not configured (AUTH_SECRET, AUTH_BASE_URL, DATABASE_URL).",
    };
  }

  const dbStatus = await getPlatformDbStatus();
  if (!dbStatus.ok) {
    return {
      ok: false,
      reason: `Platform auth database is unavailable: ${dbStatus.reason}`,
    };
  }

  let betterAuthMod;
  let betterAuthNode;
  let passkeyMod;
  let pluginsMod;
  let pgAdapterMod;

  try {
    betterAuthMod = await import("better-auth");
    betterAuthNode = await import("better-auth/node");
    passkeyMod = await import("@better-auth/passkey");
    pluginsMod = await import("better-auth/plugins");
    pgAdapterMod = await import("better-auth/adapters/pg");
  } catch (error) {
    return {
      ok: false,
      reason:
        "Better Auth dependencies are missing. Install better-auth, @better-auth/passkey, and adapter dependencies.",
      cause: error,
    };
  }

  const { betterAuth } = betterAuthMod;
  const { toNodeHandler, fromNodeHeaders } = betterAuthNode;
  const { passkey } = passkeyMod;
  const { emailOTP } = pluginsMod;
  const { pgAdapter } = pgAdapterMod;

  const pool = await getPlatformDbPool();
  if (!pool) {
    return {
      ok: false,
      reason: "Failed to initialize postgres pool.",
    };
  }

  const trustedOrigins = parseCsv(
    process.env.AUTH_TRUSTED_ORIGINS || process.env.CORS_ALLOW_ORIGINS || process.env.AUTH_BASE_URL
  );

  const sendOtp = await createOtpSender();

  const auth = betterAuth({
    appName: "Ternent",
    secret: String(process.env.AUTH_SECRET || "").trim(),
    baseURL: String(process.env.AUTH_BASE_URL || "").trim(),
    basePath: "/v1/auth",
    trustedOrigins,
    database: pgAdapter(pool, {
      provider: "pg",
    }),
    advanced: {
      useSecureCookies: true,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      },
    },
    session: {
      expiresIn: numberEnv("AUTH_SESSION_IDLE_SECONDS", DEFAULT_IDLE_SECONDS),
      updateAge: numberEnv("AUTH_SESSION_ROLLING_SECONDS", DEFAULT_ROLLING_SECONDS),
    },
    plugins: [
      passkey(),
      emailOTP({
        expiresIn: numberEnv("AUTH_EMAIL_OTP_EXPIRY_SECONDS", 5 * 60),
        async sendVerificationOTP({ email, otp, type }) {
          await sendOtp({ email, otp, type });
        },
      }),
    ],
  });

  return {
    ok: true,
    auth,
    toNodeHandler,
    fromNodeHeaders,
  };
}

export async function getPlatformAuthRuntime() {
  if (!runtimePromise) {
    runtimePromise = buildRuntime();
  }
  return runtimePromise;
}

export async function getPlatformAuthNodeHandler() {
  const runtime = await getPlatformAuthRuntime();
  if (!runtime.ok) return null;
  return runtime.toNodeHandler(runtime.auth);
}

export async function getPlatformSession(req) {
  const runtime = await getPlatformAuthRuntime();
  if (!runtime.ok) {
    return {
      ok: false,
      statusCode: 503,
      error: runtime.reason,
    };
  }

  try {
    const session = await runtime.auth.api.getSession({
      headers: runtime.fromNodeHeaders(req.headers),
    });

    if (!session?.user?.id) {
      return {
        ok: false,
        statusCode: 401,
        error: "Unauthorized.",
      };
    }

    return {
      ok: true,
      statusCode: 200,
      session,
    };
  } catch (error) {
    return {
      ok: false,
      statusCode: 401,
      error: "Unauthorized.",
      cause: error,
    };
  }
}

export async function requireSession(req, res, next) {
  const resolved = await getPlatformSession(req);
  if (!resolved.ok) {
    res.status(resolved.statusCode).send({
      ok: false,
      error: resolved.error,
    });
    return;
  }

  req.platformSession = resolved.session;
  next();
}

export async function upsertAuthUserShadow(session) {
  const userId = String(session?.user?.id || "").trim();
  if (!userId) return;
  const email = String(session?.user?.email || "").trim();
  const name = String(session?.user?.name || "").trim();

  await dbQuery(
    `
    INSERT INTO auth_users (id, email, name)
    VALUES ($1, NULLIF($2, ''), NULLIF($3, ''))
    ON CONFLICT (id)
    DO UPDATE SET
      email = COALESCE(NULLIF(EXCLUDED.email, ''), auth_users.email),
      name = COALESCE(NULLIF(EXCLUDED.name, ''), auth_users.name),
      updated_at = NOW()
    `,
    [userId, email, name]
  );
}
