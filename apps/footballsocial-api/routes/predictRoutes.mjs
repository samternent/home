import footballDataProxy, {
  redisClient,
} from "../services/footballDataProxy.mjs";
import { supabaseClient } from "../services/supabase.mjs";

import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAPI_KEY,
});
const openai = new OpenAIApi(configuration);

function sortTable(a, b) {
  if (a.points === b.points) {
    if (a.correctScore !== b.correctScore) {
      return b.correctScore - a.correctScore;
    }
    if (a.totalCorrectResult !== b.totalCorrectResult) {
      return b.totalCorrectResult - a.totalCorrectResult;
    }
    return b.username.toLowerCase() - a.username.toLowerCase();
  }
  return b.points - a.points;
}

export default function predictRoutes(router) {
  // this gets the table
  router.get(
    "/predict/:competitionCode/table/:gameweek?",
    async function (req, res) {
      const { competitionCode, gameweek } = req.params;

      const cacheResults = null; //await redisClient.get(req.url);
      if (cacheResults) {
        return res.send(JSON.parse(cacheResults));
      }

      let returnData = null;

      if (gameweek) {
        const { data } = await supabaseClient
          .from("gameweek_results")
          .select()
          .eq("competitionCode", competitionCode)
          .eq("gameweek", gameweek);

        returnData = data;
      } else {
        const { data, error } = await supabaseClient
          .from("gameweek_results")
          .select()
          .eq("competitionCode", competitionCode);
        if (error) {
          res.status(500).json(error);
        }
        returnData = data || [];
      }

      if (!gameweek) {
        const currentGameweek = Math.max(
          ...returnData.map(({ gameweek }) => gameweek).sort()
        );

        function buildCombinedTableStructure(
          item,
          combinedTableStructure = {}
        ) {
          if (combinedTableStructure[item.username]) {
            const vals = { ...combinedTableStructure[item.username] };
            combinedTableStructure[item.username] = {
              ...combinedTableStructure[item.username],
              points: vals.points + item.points,
              correctScore: vals.correctScore + item.correctScore,
              totalCorrectResult:
                vals.totalCorrectResult + item.totalCorrectResult,
              totalAwayGoals: vals.totalAwayGoals + item.totalAwayGoals,
              totalHomeGoals: vals.totalHomeGoals + item.totalHomeGoals,
            };
          } else {
            combinedTableStructure[item.username] = item;
          }

          return combinedTableStructure;
        }

        let previousResults = {};
        let currentResults = {};

        returnData.forEach((item) => {
          if (item.gameweek === currentGameweek) {
            currentResults = buildCombinedTableStructure(item, currentResults);
          } else {
            previousResults = buildCombinedTableStructure(
              item,
              previousResults
            );
          }
        });

        // calculate previous position
        Object.values(previousResults)
          .sort(sortTable)
          .forEach((row, i) => {
            previousResults[row.username].lastPosition = i + 1;
          });

        // calculate current position
        Object.values(currentResults)
          .sort(sortTable)
          .forEach((row, i) => {
            currentResults[row.username].gameweekPosition = i + 1;
          });

        const combinedResults = Object.keys(previousResults)
          .map((username) => {
            return [previousResults[username], currentResults[username]].reduce(
              (acc, curr) => {
                if (!curr) {
                  return acc;
                }

                return {
                  id: acc.id || curr.id,
                  points: (acc.points || 0) + curr.points,
                  correctScore: (acc.correctScore || 0) + curr.correctScore,
                  totalCorrectResult:
                    (acc.totalCorrectResult || 0) + curr.totalCorrectResult,
                  totalAwayGoals:
                    (acc.totalAwayGoals || 0) + curr.totalAwayGoals,
                  totalHomeGoals:
                    (acc.totalHomeGoals || 0) + curr.totalHomeGoals,
                  lastPosition: acc.lastPosition || curr.lastPosition || 0,
                  gameweekPosition:
                    acc.gameweekPosition || curr.gameweekPosition || 0,
                  username: acc.username || curr.username,
                };
              },
              {}
            );
          })
          .sort(sortTable)
          .map((row, i) => {
            return { position: i + 1, ...row };
          });

        res.setHeader("Cache-Control", "max-age=1, stale-while-revalidate");
        await redisClient.set(req.url, JSON.stringify(combinedResults), {
          EX: 20,
          NX: true,
        });

        return res.status(200).json(combinedResults);
      } else {
        const results = returnData.sort(sortTable).map((row, i) => {
          return { position: i + 1, ...row };
        });

        res.setHeader("Cache-Control", "max-age=1, stale-while-revalidate");
        await redisClient.set(req.url, JSON.stringify(results), {
          EX: 20,
          NX: true,
        });

        return res.status(200).json(results);
      }
    }
  );

  // calculates the table... use sparingly
  router.post(
    "/predict/:competitionCode/calculate/:gameweek",
    async function (req, res) {
      const { competitionCode, gameweek } = req.params;

      const cacheResults = await redisClient.get(req.url);
      if (cacheResults) {
        return res.sendStatus(200);
      }

      console.log(
        `calculating results for ${competitionCode} gameweek ${gameweek}.`
      );

      const { data } = await footballDataProxy(
        {
          ...req,
          url: `/football-data/competitions/${competitionCode}/matches?matchday=${gameweek}`,
        },
        res
      );

      const { matches } = data;

      const { data: predictionData } = await supabaseClient
        .from("predictions")
        .select()
        .eq("competitionCode", competitionCode)
        .eq("gameweek", gameweek);

      const userScores = {};

      let i = 0;
      for (; i < predictionData.length; i++) {
        const prediction = predictionData[i];
        const match = matches.find((_match) => {
          return Number(_match.id) === Number(prediction.fixtureId);
        });

        if (!match) {
          continue;
        }

        const scores = {
          points: 0,
          totalHomeGoals: 0,
          totalAwayGoals: 0,
          totalCorrectResult: 0,
          correctScore: 0,
        };

        if (["FINISHED", "IN_PLAY", "PAUSED"].includes(match.status)) {
          let homeGoals = false;
          let awayGoals = false;
          let result = false;

          if (match.score.fullTime.home === prediction.homeScore) {
            homeGoals = true;
          }
          if (match.score.fullTime.away === prediction.awayScore) {
            awayGoals = true;
          }
          if (
            (match.score.fullTime.home > match.score.fullTime.away &&
              prediction.homeScore > prediction.awayScore) ||
            (match.score.fullTime.away > match.score.fullTime.home &&
              prediction.awayScore > prediction.homeScore) ||
            (match.score.fullTime.home === match.score.fullTime.away &&
              prediction.homeScore === prediction.awayScore)
          ) {
            // correct result
            result = true;
          }

          if (homeGoals) {
            scores.totalHomeGoals += 1;
            scores.points += 1;
          }
          if (awayGoals) {
            scores.totalAwayGoals += 1;
            scores.points += 1;
          }
          if (result) {
            scores.totalCorrectResult += 1;
            scores.points += 2;
          }

          if (homeGoals && awayGoals && result) {
            scores.points += 3;
            scores.correctScore += 1;
          }
        }

        Object.entries(scores).forEach(([key, value]) => {
          if (!userScores[prediction.username]) {
            userScores[prediction.username] = { [key]: value };
            return;
          }
          userScores[prediction.username][key] =
            value + (userScores[prediction.username][key] || 0);
        });
      }

      const results = await supabaseClient
        .from("gameweek_results")
        .upsert(
          Object.entries(userScores).map(([key, val]) => {
            return {
              id: `${key}_${competitionCode}_${gameweek}`,
              username: key,
              ...val,
              competitionCode,
              gameweek,
            };
          }),
          { onConflict: "id" }
        )
        .select();

      res.setHeader("Cache-Control", "max-age=1, stale-while-revalidate");
      await redisClient.set(req.url, JSON.stringify(results), {
        EX: 200,
        NX: true,
      });

      return res.sendStatus(200);
    }
  );

  // gets gameweek predictions
  router.get(
    "/predict/:username/:competitionCode/:gameweek",
    async function (req, res) {
      const { competitionCode, gameweek, username } = req.params;

      const { data: predictionData } = await supabaseClient
        .from("predictions")
        .select()
        .eq("username", username)
        .eq("competitionCode", competitionCode)
        .eq("gameweek", Number(gameweek));

      return res.send({ predictions: predictionData });
    }
  );
}
