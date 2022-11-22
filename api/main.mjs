import express from "express";
import routes from "./routes/index.mjs";
import bodyParser from "body-parser";

// App
const app = express();

app.use(bodyParser.json());

// Set port
const port = process.env.PORT || "4003";
app.set("port", port);

app.use("/api/", routes);

// Server
app.listen(port, () => console.log(`Server running on localhost:${port}`));
