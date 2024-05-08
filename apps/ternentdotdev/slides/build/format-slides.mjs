import { cp, readdir } from "fs";

readdir("./slides/dist", async (err, files) => {
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

  await cp(
    `./dist`,
    `../../.vercel/output/static`,
    { recursive: true },
    (err) => {}
  );
});
