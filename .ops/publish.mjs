import shell from "shelljs";

const appsToPublish = [
  "../apps/armour",
  "../apps/concord",
  "../apps/concord-demo",
  "../apps/ledger",
  "../apps/seal",
  "../apps/ternent-api",
  "../apps/ternentdotdev",
];
const packagesToPublish = [
  "../packages/armour",
  "../packages/concord",
  "../packages/ledger",
  "../packages/ledger-v2",
  "../packages/encrypt",
  "../packages/identity",
  "../packages/identity-v2",
  "../packages/utils",
  "../packages/concord-protocol",
  "../packages/ternent-ui",
  "../packages/rage",
  "../packages/ragejs",
  "../packages/seal-cli",
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
      { silent: true },
    )
    .toString();

  const changelog = fullChangelog
    ?.split(`## ${name}@${version}`)[1]
    ?.split("## ")[1];

  if (changelog) {
    shell.exec(
      `gh release create "${name}-${version}" -t "${name}-${version}" -n "${name}-${version}" -n "${changelog}"`,
      { silent: true },
    );
  }
}
