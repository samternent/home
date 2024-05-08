import { cp, readdir, readFileSync, writeFileSync } from "fs";
import * as cheerio from "cheerio";

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

    const indexFile = readFileSync(`./slides/dist/${file}/index.html`, "utf8");
    const $ = cheerio.load(indexFile);

    $("link").attr("type", "text/css");
    const html = $.html();

    writeFileSync(`./dist/${file}.html`, html);
  }

  await cp(
    `./dist`,
    `../../.vercel/output/static/slides`,
    { recursive: true },
    (err) => {}
  );
});
