import { cp, readdir, copyFile } from "fs/promises";

const files = ["twa", "router-drawers"];

for (const file of files) {
  console.log(`Processing: ${file}`);

  await cp(
    "./slides/dist/assets",
    `../../.vercel/output/static/slides/${file}/assets`,
    {
      recursive: true,
    },
    (err) => {}
  );

  await cp(
    `./slides/dist/${file}/index.html`,
    `../../.vercel/output/static/slides/${file}.html`,
    {},
    (err) => {}
  );
}
