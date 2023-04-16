import { supabaseClient } from "../service/supabase";

export const addPrediction = async (
  username: string,
  predictions: any,
  competitionCode: string,
  gameweek: Number
) => {
  await Promise.all(
    Object.keys(predictions).map((fixtureId) => {
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
    })
  );
};

export const getPredictions = async (
  username: string,
  competitionCode: string,
  gameweek: Number
) => {
  return supabaseClient
    .from("predictions")
    .select()
    .eq("username", username)
    .eq("competitionCode", competitionCode)
    .eq("gameweek", gameweek);
};
