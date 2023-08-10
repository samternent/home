import footballDataProxy from "../footballDataProxy.mjs";
import { supabaseClient } from "../supabase.mjs";

const competitions = {
  PL: "Premier League",
};
export default function predictRoutes(router) {
  router.get(
    "/predict/calculate/:competitionCode/:gameweek",
    async function (req, res) {
      const { competitionCode, gameweek } = req.params;

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
        .eq("competitionCode", competitionCode);

      const userScores = {};

      let i = 0;
      for (; i < predictionData.length; i++) {
        const prediction = predictionData[i];

        const match = data.matches.find((_match) => _match.id === prediction.fixtureId);

        const scores = userScores[prediction.username] || {
          points: 0,
          totalHomeGoals: 0,
          totalAwayGoals: 0,
          totalCorrectResult: 0,
          correctScore: 0,
        };

        if (match.status === "FINISHED") {
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
            scores.points += 5;
            scores.correctScore += 1;
          }
        }

        userScores[prediction.username] = { ...scores };
      }

      return res.status(200).json(userScores);
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
