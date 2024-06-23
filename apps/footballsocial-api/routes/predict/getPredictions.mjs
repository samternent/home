import { supabaseClient } from "../../services/supabase.mjs";

export default async function getPredictions(req, res) {
  const { competitionCode, gameweek, username, season } = req.params;

  const { data: predictionData } = await supabaseClient
    .from("predictions")
    .select()
    .eq("username", username)
    .eq("competitionCode", competitionCode)
    .eq("season", season)
    .eq("gameweek", Number(gameweek));

  return res.send({ predictions: predictionData });
}
