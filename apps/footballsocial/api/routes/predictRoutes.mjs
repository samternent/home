import footballDataProxy from "../footballDataProxy.mjs";
import { supabaseClient } from "../supabase.mjs";

import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAPI_KEY,
});
const openai = new OpenAIApi(configuration);

export default function predictRoutes(router) {
  router.get(
    "/predict/:competitionCode/table/:gameweek?",
    async function (req, res) {
      const { competitionCode, gameweek } = req.params;

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

      return res.send(returnData);
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

  router.get(
    "/predict/:competitionCode/roundup/:gameweek",
    async function (req, res) {
      const { competitionCode, gameweek } = req.params;

      const { data: predictionData } = await supabaseClient
        .from("predictions")
        .select()
        .eq("username", username)
        .eq("competitionCode", competitionCode)
        .eq("gameweek", gameweek);

      const { data } = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello world" }],
      });

      return res.send(data);
    }
  );
}
