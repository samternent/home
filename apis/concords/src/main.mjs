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
app.use(cors({ exposedHeaders: ["X-App-Version"] }));

// Set port
const port = "4003";
app.set("port", port);

app.use(async function (req, res, next) {
  const data = JSON.parse(
    await readFileSync(join(__dirname, "../package.json"), "utf8")
  );
  res.setHeader("x-app-version", data.version);
  next();
});

app.use("/", routes);

// Server
app.listen(port, () => console.log(`Server running on localhost:${port}`));
