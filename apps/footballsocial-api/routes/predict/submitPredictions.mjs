import { DateTime, Interval } from "luxon";
import jwt from "jsonwebtoken";
import footballDataProxy from "../../services/footballDataProxy.mjs";
import { supabaseClient } from "../../services/supabase.mjs";

export default async function submitPredictions(req, res) {
  const { competitionCode, gameweek, username, season } = req.params;
  const { predictions } = req.body;
  let myUsername = null;

  // Check the user is updating their own records using the JWT header
  const accessToken = req.headers["access-token"];
  if (accessToken) {
    const decoded = jwt.verify(accessToken, process.env.SUPABASE_JWT_SECRET);
    if (decoded.role === "authenticated") {
      const { data: profileData } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", decoded.sub);

      myUsername = profileData?.[0]?.username;
    }
  }

  if (!myUsername) {
    return res.status(401).send({ message: "Unauthorized" });
  }

  if (myUsername !== username) {
    return res.status(403).send({ message: "Forbidden" });
  }

  // Compare and filter fixtures against kickoff time
  const { data: fixtures } = await footballDataProxy(
    {
      ...req,
      url: `/football-data/competitions/${competitionCode}/matches?matchday=${gameweek}`,
    },
    res
  );

  const predictionsData = Object.keys(predictions)
    .map((fixtureId) => ({
      id: `${username}_${fixtureId}_${gameweek}_${season}`,
      username,
      fixtureId,
      homeScore: predictions[fixtureId].homeScore,
      awayScore: predictions[fixtureId].awayScore,
      competitionCode,
      gameweek,
      season,
    }))
    .filter((prediction) => {
      const fixture = fixtures?.matches?.find(({ id }) => {
        return id === Number(prediction.fixtureId);
      });

      const timeDiff = Interval.fromDateTimes(
        DateTime.now(),
        DateTime.fromISO(fixture.utcDate)
      ).length();

      if (isNaN(timeDiff)) {
        return false;
      }
      return (
        timeDiff > 0 &&
        prediction.homeScore !== undefined &&
        prediction.awayScore !== undefined
      );
    });

  const { data, error } = await supabaseClient
    .from("predictions")
    .upsert(predictionsData, { onConflict: "id" })
    .select();

  return res.send({ status: 200, predictions: predictionsData });
}
