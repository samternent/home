import shell from "shelljs";

const appsToPublish = ["../apps/footballsocial", "../apps/concords"];

const packagesToPublish = [
  "../packages/ledger",
  "../packages/encrypt",
  "../packages/identity",
  "../packages/utils",
  "../packages/proof-of-work",
  "../packages/game-kit",
];

const toPublish = [...appsToPublish, ...packagesToPublish];

let i = 0;
for (; i < toPublish.length; i++) {
  const { version, name } = (
    await import(`${toPublish[i]}/package.json`, {
      assert: { type: "json" },
    })
  ).default;
  console.log(`${name}@${version}`);

  const fullChangelog = shell
    .exec(`gh release view ${name}-${version}`, {
    })
    .toString();

  console.log(fullChangelog);

  const changelog = fullChangelog
    .split(`## ${name}@${version}`)[1]
    .split("## ")[1];

  shell.exec(
    `gh release create "${name}-${version}" -t "${name}-${version}" -n "${name}-${version}" -n "${changelog}"`
  );
}
