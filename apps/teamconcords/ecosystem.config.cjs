const { resolve } = require("path");

module.exports = {
  apps: [
    {
      name: "teamconcords",
      script: resolve("api/main.mjs"),
      watch: resolve("api"),
    },
  ],
};
