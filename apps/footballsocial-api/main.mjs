import express from "express";
import routes from "./routes/index.mjs";
import bodyParser from "body-parser";
import cors from "cors";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import { isAuthenticated } from "./util/index.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// App
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(
  cors({
    optionsSuccessStatus: 200,
    exposedHeaders: ["X-App-Version", "X-Api-Version"],
  })
);
app.use(function (req, res, next) {
  res.setHeader("Content-Security-Policy", "default-src 'self';");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000 ; includeSubDomains"
  );
  next();
});

// Set port
const port = "3000";
app.set("port", port);

const unauthenticatedRoutes = [
  /\/landing-stats/,
  /\/football-data\//,
  /\/predict\/[A-Z]*\/calculate/,
  /\/predict\/[A-Z]*\/table/,
];

app.use(async function (req, res, next) {
  const { version: apiVersion } = JSON.parse(
    await readFileSync(join(__dirname, "./package.json"), "utf8")
  );
  res.setHeader("x-api-version", apiVersion);

  const isAuthorizedRoute = unauthenticatedRoutes.some((route) => {
    return route.test(req.url);
  });
  if (isAuthorizedRoute) {
    next();
    return;
  }

  if (isAuthenticated(req)) {
    next();
    return;
  } else {
    res.status(401).json({ status: 401 });
  }
});

app.use(express.static(join(__dirname, "public")));
app.use("/", routes);

// Server
app.listen(port, () => console.log("footballsocial-api is running."));
