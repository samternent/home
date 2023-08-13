const { resolve } = require("path");

module.exports = {
  apps: [
    {
      name: "footballsocial",
      script: resolve("src/main.mjs"),
      watch: resolve("src"),
    },
  ],
};
