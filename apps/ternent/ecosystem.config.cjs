const { resolve } = require("path");

module.exports = {
  apps: [
    {
      name: "ternent",
      script: resolve("api/main.mjs"),
      watch: resolve("api"),
    },
  ],
};
