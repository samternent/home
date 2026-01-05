import { createClient } from "redis";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const redisPassword = process.env.REDIS_PASSWORD;
const redisUrl = process.env.REDIS_ENDPOINT_URI;

export const redisClient = createClient({
  url: `redis://default:${redisPassword}@${redisUrl}`,
});

redisClient.on("error", (error) => console.error(`Error : ${error}`));
redisClient.connect();

const { version: footballSocialVersion } = JSON.parse(
  await readFileSync(
    join(__dirname, "../apps/footballsocial/package.json"),
    "utf8"
  )
);

const { version: ternentdotdevVersion } = JSON.parse(
  await readFileSync(
    join(__dirname, "../apps/ternentdotdev/package.json"),
    "utf8"
  )
);

const { version: concordVersion } = JSON.parse(
  await readFileSync(join(__dirname, "../apps/concord/package.json"), "utf8")
);

try {
  await redisClient.set("footballsocial-app-version", footballSocialVersion);
  await redisClient.set("ternentdotdev-app-version", ternentdotdevVersion);
  await redisClient.set("concord-app-version", concordVersion);
} catch (e) {
  console.error("unable to set redis");
} finally {
  redisClient.quit();
}
