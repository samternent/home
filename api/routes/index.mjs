import express from "express";
import { createClient } from "redis";
import dotenv from "dotenv";
import axios from "axios";
import pushNotificationRoutes from "./pushNotificationRoutes.mjs";
dotenv.config();

const redisPassword = process.env.REDIS_PASSWORD;
const redisUrl = process.env.REDIS_ENDPOINT_URI;
const footballDataKey = process.env.FOOTBALL_DATA_API_KEY;

const router = express.Router();

const redisClient = createClient({
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

    return res.send(resp.data);
  } catch (error) {
    return res.send(error);
  }
};

async function cacheRequest(req, res) {
  try {
    const cacheResults = await redisClient.get(req.url);
    if (!cacheResults) {
      return apiProxy(req, res);
    }
    return res.send(cacheResults);
  } catch (e) {
    console.log(e);
  }
}

router.get("/football-data/*", async function (req, res) {
  function applyProxy(req, res) {
    return cacheRequest(req, res);
  }

  return applyProxy(req, res);
});

pushNotificationRoutes(router);

export default router;
