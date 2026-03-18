import { createAuthClient } from "better-auth/vue";
import { emailOTPClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

function resolveAuthBaseUrl() {
  const configured = String(import.meta.env.VITE_TERNENT_API_URL || "").trim();
  if (/^https?:\/\//i.test(configured)) {
    return new URL("/v1/auth", configured).toString();
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    const isLocalHost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]";
    if (import.meta.env.DEV || isLocalHost) {
      return new URL("/v1/auth", window.location.origin).toString();
    }
  }

  return "https://api.ternent.dev/v1/auth";
}

export const platformAuthClient = createAuthClient({
  baseURL: resolveAuthBaseUrl(),
  fetchOptions: {
    credentials: "include",
  },
  plugins: [emailOTPClient(), passkeyClient()],
});
