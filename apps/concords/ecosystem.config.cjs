const { resolve } = require("path");

module.exports = {
  apps: [
    {
      name: "concords",
      script: resolve("api/main.mjs"),
      watch: resolve("api"),
    },
  ],
};
