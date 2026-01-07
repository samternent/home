import shell from "shelljs";

const appsToPublish = [
  "../apps/concord",
  "../apps/footballsocial",
  "../apps/footballsocial-api",
  "../apps/ternent-api",
  "../apps/ternentdotdev",
];
const packagesToPublish = [
  "../packages/ledger",
  "../packages/encrypt",
  "../packages/identity",
  "../packages/utils",
  "../packages/concord-protocol",
  "../packages/game-kit",
  "../packages/ternent-ui",
  "../packages/ragejs",
];

const toPublish = [...appsToPublish, ...packagesToPublish];

let i = 0;
for (; i < toPublish.length; i++) {
  const { version, name } = (
    await import(`${toPublish[i]}/package.json`, { with: { type: "json" } })
  ).default;

  const fullChangelog = shell
    .exec(
      `gh pr list -B "main" -s merged -H changeset-release/"main" --json body --jq '.[].body' -L 1`,
      { silent: true }
    )
    .toString();

  const changelog = fullChangelog
    ?.split(`## ${name}@${version}`)[1]
    ?.split("## ")[1];

  if (changelog) {
    shell.exec(
      `gh release create "${name}-${version}" -t "${name}-${version}" -n "${name}-${version}" -n "${changelog}"`,
      { silent: true }
    );
  }
}
