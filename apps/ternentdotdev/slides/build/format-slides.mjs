import { cp, readdir, copyFile } from "fs/promises";

const files = await readdir("./slides/dist");

for (const file of files) {
  console.log(`Processing: ${file}`);
  await cp(
    `./slides/dist/${file}/assets`,
    `../../.vercel/output/static/assets`,
    {
      recursive: true,
    },
    (err) => {}
  );

  await cp(
    `./slides/dist/${file}/index.html`,
    `../../.vercel/output/static/${file}.html`,
    {},
    (err) => {}
  );
}
