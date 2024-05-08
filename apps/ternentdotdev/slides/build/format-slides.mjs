import { cp, readdir } from "fs/promises";

const files = await readdir("./slides/dist");

for (const file of files) {
  console.log(`Processing: ${file}`);
  await cp(
    `./slides/dist/${file}/assets`,
    "./slides/dist/formatted/slides/assets",
    {
      recursive: true,
    },
    (err) => {}
  );

  await cp(
    `./slides/dist/${file}/index.html`,
    `./slides/dist/formatted/slides/${file}.html`,
    {
      recursive: true,
    },
    (err) => {}
  );
}

console.log(`Completing`);
await cp(
  `./slides/dist/formatted/slides`,
  `../../.vercel/output/static/assets/slides`,
  { recursive: true, force: false },
  (err) => {}
);
