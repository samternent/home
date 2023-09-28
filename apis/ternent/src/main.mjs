import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import routes from "./routes/index.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// App
const app = express();

app.use(bodyParser.json());
app.use(cors({ exposedHeaders: ["X-Api-Version"] }));

// Set port
const port = "3000";
app.set("port", port);

app.use(async function (req, res, next) {
  const data = JSON.parse(
    await readFileSync(join(__dirname, "../package.json"), "utf8")
  );
  res.setHeader("x-api-version", data.version);
  next();
});

app.use(express.static(join(__dirname, "public")));
app.use("/", routes);

// Server
app.listen(port, () => console.log("ternent-api is running."));
