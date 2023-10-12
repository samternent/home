import { createClient } from "redis";

const redisPassword = process.env.REDIS_PASSWORD;
const redisUrl = process.env.REDIS_ENDPOINT_URI;

export const redisClient = createClient({
  url: `redis://default:${redisPassword}@${redisUrl}`,
});

redisClient.on("error", (error) => console.error(`Error : ${error}`));
const redisPromise = redisClient.connect();
