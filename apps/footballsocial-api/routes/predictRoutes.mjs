import footballDataProxy from "../services/footballDataProxy.mjs";
import { redisClient } from "../services/redis.mjs";
import { supabaseClient } from "../services/supabase.mjs";
import OpenAI from "openai";
import { isAuthenticated } from "../util/index.mjs";

const openai = new OpenAI({
  apiKey: process.env.OPENAPI_KEY,
});

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
    "/predict/:competitionCode/table/:gameweek?/:members?",
    async function (req, res) {
      const { competitionCode, gameweek } = req.params;
      const { league } = req.query;

      const isLoggedIn = isAuthenticated(req);
      let lastUpdated = 0;

      const cacheResults = await redisClient.get(
        `${req.url}${league ? `-${league}` : ""}- ${
          isLoggedIn ? "loggedIn" : "loggedOut"
        }`
      );
      if (cacheResults) {
        return res.send(JSON.parse(cacheResults));
      }

      let members = [];
      if (league) {
        console.log(league);
        const { data: leagueData } = await supabaseClient
          .from("leagues")
          .select()
          .eq("league_code", league);

        console.log(leagueData);
        if (leagueData?.length) {
          const { data: membersData } = await supabaseClient
            .from("league_members")
            .select()
            .eq("league_id", leagueData[0].id);

          members = membersData.map((member) => member.username);
        }
      }

      const query = supabaseClient
        .from("gameweek_results")
        .select()
        .eq("competitionCode", competitionCode);

      if (gameweek) {
        query.eq("gameweek", gameweek);
      }

      if (league) {
        query.in("username", members);
      }
      const { data: returnData, error } = await query;

      if (error) {
        res.status(500).json(error);
      }

      lastUpdated = Date.now();

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

          return { ...combinedTableStructure };
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
            currentResults[row.username].gameweekPoints =
              currentResults[row.username].points;
          });

        const allUsers = new Set([
          ...Object.keys(currentResults),
          ...Object.keys(previousResults),
        ]);

        const combinedResults = [...allUsers]
          .map((username) => {
            return [
              { ...previousResults[username] },
              { ...currentResults[username] },
            ].reduce((acc, curr) => {
              return {
                points: (acc.points || 0) + (curr.points || 0),
                correctScore:
                  (acc.correctScore || 0) + (curr.correctScore || 0),
                totalCorrectResult:
                  (acc.totalCorrectResult || 0) +
                  (curr.totalCorrectResult || 0),
                totalAwayGoals:
                  (acc.totalAwayGoals || 0) + (curr.totalAwayGoals || 0),
                totalHomeGoals:
                  (acc.totalHomeGoals || 0) + (curr.totalHomeGoals || 0),
                lastPosition: acc.lastPosition || curr.lastPosition || 0,
                gameweekPosition:
                  acc.gameweekPosition || curr.gameweekPosition || 0,
                gameweekPoints: acc.gameweekPoints || curr.gameweekPoints || 0,
                username: acc.username || curr.username,
              };
            }, {});
          })
          .sort(sortTable)
          .map((row, i) => {
            return {
              position: i + 1,
              ...row,
              username: isLoggedIn
                ? row.username
                : `${row.username[0]}***${
                    row.username[row.username.length - 1]
                  }`,
            };
          });

        res.setHeader("Cache-Control", "max-age=1, stale-while-revalidate");
        await redisClient.set(
          `${req.url}${league ? `-${league}` : ""}- ${
            isLoggedIn ? "loggedIn" : "loggedOut"
          }`,
          JSON.stringify({ table: combinedResults, lastUpdated }),
          {
            EX: 300,
            NX: true,
          }
        );

        return res.status(200).json({ table: combinedResults, lastUpdated });
      } else {
        const results = returnData.sort(sortTable).map((row, i) => {
          return {
            position: i + 1,
            ...row,
            username: isLoggedIn
              ? row.username
              : `${row.username[0]}******${
                  row.username[row.username.length - 1]
                }`,
          };
        });

        res.setHeader("Cache-Control", "max-age=1, stale-while-revalidate");
        await redisClient.set(
          `${req.url}- ${isLoggedIn ? "loggedIn" : "loggedOut"}`,
          JSON.stringify({ table: results, lastUpdated }),
          {
            EX: 300,
            NX: true,
          }
        );

        return res.status(200).json({ table: results, lastUpdated });
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

  async function generatePrediction(matches) {
    const prompt = constructPrompt(matches);

    try {
      const response = await openaiClient.complete({
        prompt,
        max_tokens: 10, // Adjust based on the desired length of the generated prediction
      });

      return response.choices[0].text.trim();
    } catch (error) {
      console.error("Error generating prediction from OpenAI:", error);
      throw error;
    }
  }

  // Usage to predict
  router.post("/predict-ai", async (req, res) => {
    try {
      const prediction = await generatePrediction(matches);
      res.json({ prediction });
    } catch (error) {
      res.status(500).json({ error: "Error generating prediction" });
    }
  });
}
