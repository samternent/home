import { createClient } from "redis";
import axios from "axios";

const redisPassword = process.env.REDIS_PASSWORD;
const redisUrl = process.env.REDIS_ENDPOINT_URI;
const footballDataKey = process.env.FOOTBALL_DATA_API_KEY;

export const redisClient = createClient({
  url: `redis://default:${redisPassword}@${redisUrl}`,
});

redisClient.on("error", (error) => console.error(`Error : ${error}`));
const redisPromise = redisClient.connect();

const apiProxy = async function (req, res) {
  try {
    const resp = await axios.get(
      `https://api.football-data.org/v4/${req.url.replace(
        "/football-data/",
        ""
      )}`,
      {
        headers: {
          "X-Auth-Token": footballDataKey,
        },
      }
    );

    res.setHeader("Cache-Control", "max-age=1, stale-while-revalidate");
    if (resp.status === 200) {
      await redisClient.set(req.url, JSON.stringify(resp.data), {
        EX: 300,
        NX: true,
      });
    }

    return { data: resp.data };
  } catch (error) {
    return { error };
  }
};

async function cacheRequest(req, res) {
  try {
    const cacheResults = await redisClient.get(req.url);
    if (!cacheResults) {
      return apiProxy(req, res);
    }
    return { data: JSON.parse(cacheResults) };
  } catch (error) {
    return { error };
  }
}

export default function footballDataProxy(req, res) {
  return cacheRequest(req, res);
}
