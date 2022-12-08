const { resolve } = require("path");

module.exports = {
  apps: [
    {
      name: "footballsocial",
      script: resolve("apps/footballsocial/api/main.mjs"),
      watch: resolve("apps/footballsocial/api"),
    },
    {
      name: "teamconcords",
      script: resolve("apps/teamconcords/api/main.mjs"),
      watch: resolve("apps/teamconcords/api"),
    },
    {
      name: "concords",
      script: resolve("apps/concords/api/main.mjs"),
      watch: resolve("apps/concords/api"),
    },
    {
      name: "ternent",
      script: resolve("apps/ternent/api/main.mjs"),
      watch: resolve("apps/ternent/api"),
    },
  ],
};
