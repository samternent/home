import express from "express";
import routes from "./routes/index.mjs";
import bodyParser from "body-parser";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// App
const app = express();

app.use(bodyParser.json());

// Set port
const port = "4005";
app.set("port", port);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use("/assets", express.static(join(__dirname, "/assets")));
app.use("/app", express.static(join(__dirname, "/app")));

app.use("/", routes);

// Server
app.listen(port, () => console.log(`Server running on localhost:${port}`));
