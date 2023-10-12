import express from "express";
import routes from "./routes/index.mjs";
import bodyParser from "body-parser";
import cors from "cors";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

const __dirname = dirname(fileURLToPath(import.meta.url));

// App
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(cors({ exposedHeaders: ["X-App-Version"] }));

// Set port
const port = "3000";
app.set("port", port);

const unauthenticatedRoutes = ["/landing-stats"];

app.use(async function (req, res, next) {
  // too tight. do fix
  const { version: appVersion } = JSON.parse(
    await readFileSync(
      join(__dirname, "../footballsocial/package.json"),
      "utf8"
    )
  );
  res.setHeader("x-app-version", appVersion);

  if (unauthenticatedRoutes.includes(req.url)) {
    next();
    return;
  }

  const accessToken = req.headers["access-token"];
  if (accessToken) {
    const decoded = jwt.verify(accessToken, process.env.SUPABASE_JWT_SECRET);
    if (decoded.role === "authenticated") {
      next();
      return;
    }
    res.status(401).json({ status: 401 });
  } else {
    res.status(401).json({ status: 401 });
  }
});

app.use(express.static(join(__dirname, "public")));
app.use("/", routes);

// Server
app.listen(port, () => console.log("footballsocial-api is running."));
