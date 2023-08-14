import footballDataProxy, { redisClient } from "../footballDataProxy.mjs";
import { supabaseClient } from "../supabase.mjs";

import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAPI_KEY,
});
const openai = new OpenAIApi(configuration);

function sortTable(a, b) {
  if (a.points === b.points) {
    if (a.correctScore === b.correctScore) {
      return b.correctScore - a.correctScore;
    }
    if (a.totalCorrectResult === b.totalCorrectResult) {
      return b.toLowerCase() - a.toLowerCase();
    }
    return b.totalCorrectResult - a.totalCorrectResult;
  }
  return b.points - a.points;
}

export default function predictRoutes(router) {
  router.get(
    "/predict/:competitionCode/table/:gameweek?",
    async function (req, res) {
      const { competitionCode, gameweek } = req.params;

      const cacheResults = await redisClient.get(req.url);
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
        const { data } = await supabaseClient
          .from("gameweek_results")
          .select()
          .eq("competitionCode", competitionCode);
        returnData = data;
      }

      const table = returnData
        .sort(sortTable)
        .map((row, i) => {
          return { position: i + 1, ...row };
        });

      res.setHeader("Cache-Control", "max-age=1, stale-while-revalidate");
      if (table.length) {
        await redisClient.set(req.url, JSON.stringify(table), {
          EX: 300,
          NX: true,
        });
      }

      return res.send(table);
    }
  );

  router.get(
    "/predict/:competitionCode/roundup/:gameweek",
    async function (req, res) {
      const { competitionCode, gameweek } = req.params;

      const { data: predictionData } = await supabaseClient
        .from("predictions")
        .select()
        .eq("competitionCode", competitionCode)
        .eq("gameweek", gameweek);

      const {
        data: { matches },
      } = await footballDataProxy(
        {
          ...req,
          url: `/football-data/competitions/${competitionCode}/matches?matchday=${gameweek}`,
        },
        res
      );

      // league table
      const { data: results } = await supabaseClient
        .from("gameweek_results")
        .select()
        .eq("gameweek", gameweek)
        .eq("competitionCode", competitionCode);

      const formattedData = {
        predictionResults: matches.map((match) => {
          return {
            fixture: `${match.homeTeam.shortName} ${match.score.fullTime.home} -  ${match.score.fullTime.away} ${match.awayTeam.shortName}`,
            homeScore: match.score.fullTime.home,
            awayScore: match.score.fullTime.away,
            predictions: predictionData
              .filter((prediction) => {
                return prediction.fixtureId === match.id;
              })
              .map((prediction) => {
                return {
                  username: prediction.username,
                  homeScore: prediction.homeScore,
                  awayScore: prediction.awayScore,
                };
              }),
          };
        }),
        table: results.sort(sortTable).map((result, i) => {
          return {
            points: result.points,
            correctScore: result.correctScore,
            totalCorrectResult: result.correctResult,
            totalAwayGoals: result.totalAwayGoals,
            totalHomeGoals: result.totalHomeGoal,
            username: result.username,
            position: i,
          };
        }),
      };

      return res.send(formattedData);

      // const response = await openai.createEmbedding({
      //   model: "text-embedding-ada-002",
      //   input: "The food was delicious and the waiter...",
      // });

      // const completion = await openai.createCompletion({
      //   model: "text-davinci-003",
      //   prompt: `Given this prediction data and league table in JSON: ${JSON.stringify(formattedData)}. Can you summarise this weeks league in the style of Gary Neville?`,
      // });

      // return res.send(completion.data);
    }
  );

  router.post(
    "/predict/:competitionCode/calculate/:gameweek",
    async function (req, res) {
      const { competitionCode, gameweek } = req.params;

      const { data } = await footballDataProxy(
        {
          ...req,
          url: `/football-data/competitions/${competitionCode}/matches`,
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

        const match = matches.find(
          (_match) => _match.id === prediction.fixtureId
        );

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
              id: `${key}_${gameweek}`,
              username: key,
              ...val,
              competitionCode,
              gameweek,
            };
          }),
          { onConflict: "id" }
        )
        .select();

      return res.status(200).json(results);
    }
  );

  router.get(
    "/predict/:username/:competitionCode/:gameweek",
    async function (req, res) {
      const { competitionCode, gameweek, username } = req.params;

      const { data: predictionData } = await supabaseClient
        .from("predictions")
        .select()
        .eq("username", username)
        .eq("competitionCode", competitionCode)
        .eq("gameweek", gameweek);

      return res.send({ predictions: predictionData });
    }
  );
}
