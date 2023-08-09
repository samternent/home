import footballDataProxy from "../footballDataProxy.mjs";
import { supabaseClient } from "../supabase.mjs";

const competitions = {
  PL: "Premier League",
};
export default function predictRoutes(router) {
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

  router.post("/predict/calculate/:competitionCode/:gameweek", async function (req, res) {
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
      .eq("competitionCode", competitionCode)
      .eq("gameweek", gameweek);


    let points = 0;
    let totalHomeGoals = 0;
    let totalAwayGoals = 0;
    let totalCorrectResult = 0;
    let correctScore = 0;

    matches.forEach((match) => {
      const prediction = predictionData.find(
        ({ fixtureId }) => match.id === fixtureId
      );
      if (!prediction) {
        return;
      }

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
        totalHomeGoals += 1;
        points += 1;
      }
      if (awayGoals) {
        totalAwayGoals += 1;
        points += 1;
      }
      if (result) {
        totalCorrectResult += 1;
        points += 2;
      }

      if (homeGoals && awayGoals && result) {
        points += 5;
        correctScore += 1;
      }
    });

    return supabaseClient
      .from("predictions")
      .upsert(
        {
          id: `${username}_${fixtureId}`,
          username,
          fixtureId,
          homeScore: predictions[fixtureId].homeScore,
          awayScore: predictions[fixtureId].awayScore,
          competitionCode,
          gameweek,
        },
        { onConflict: "id" }
      )
      .select();

    return res.send({
      points,
      totalHomeGoals,
      totalAwayGoals,
      totalCorrectResult,
      correctScore,
    });
  });
}
