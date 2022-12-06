const { resolve } = require("path");

module.exports = {
  apps: [
    {
      name: "footballsocial",
      script: resolve("api/main.mjs"),
      watch: resolve("api"),
    },
  ],
};
