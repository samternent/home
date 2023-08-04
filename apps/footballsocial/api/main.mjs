import express from "express";
import routes from "./routes/index.mjs";
import bodyParser from "body-parser";
import cors from "cors";

var corsOptions = {
  origin: "https://footballsocial.app",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

// App
const app = express();

app.use(bodyParser.json());
app.use(cors(corsOptions));

// Set port
const port = "4002";
app.set("port", port);

app.use("/", routes);

// Server
app.listen(port, () => console.log(`Server running on localhost:${port}`));
