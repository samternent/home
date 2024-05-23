import footballDataProxy from "../../services/footballDataProxy.mjs";
import { redisClient } from "../../services/redis.mjs";
import { supabaseClient } from "../../services/supabase.mjs";

export default async function postPredictionTable(req, res) {
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
