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

const { version } = JSON.parse(
  await readFileSync(
    join(__dirname, "../apps/footballsocial/package.json"),
    "utf8"
  )
);

try {
  await redisClient.set("footballsocial-app-version", version);
} catch (e) {
  console.error("unable to set redis");
} finally {
  redisClient.quit();
}
