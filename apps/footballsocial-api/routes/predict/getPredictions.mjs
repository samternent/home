import { supabaseClient } from "../../services/supabase.mjs";

export default async function getPredictions(req, res) {
  const { competitionCode, gameweek, username } = req.params;

  const { data: predictionData } = await supabaseClient
    .from("predictions")
    .select()
    .eq("username", username)
    .eq("competitionCode", competitionCode)
    .eq("gameweek", Number(gameweek));

  return res.send({ predictions: predictionData });
}
