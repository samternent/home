import { cp, readdir } from "fs/promises";

const files = await readdir("./slides/dist");
for (const file of files) {
  console.log(`Processing: ${file}`);
  await cp(
    `./slides/dist/${file}/assets`,
    "./dist/assets",
    {
      recursive: true,
    },
    (err) => {}
  );

  await cp(
    `./slides/dist/${file}/index.html`,
    `./dist/slides/${file}.html`,
    {
      recursive: true,
    },
    (err) => {}
  );
}
console.log(`Completing`);
await cp(
  `./dist`,
  `../../.vercel/output/static`,
  { recursive: true, force: false },
  (err) => {}
);
