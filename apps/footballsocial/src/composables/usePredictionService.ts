import api from "../utils/api";
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
            id: `${username}_${fixtureId}_${gameweek}`,
            username,
            fixtureId,
            homeScore: predictions[fixtureId].homeScore,
            awayScore: predictions[fixtureId].awayScore,
            competitionCode,
            gameweek,
          },
          { onConflict: "id", ignoreDuplicates: true }
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
  return api.get(`/predict/${username}/${competitionCode}/${gameweek}`);
};

export const fetchPredictionTable = async (
  competitionCode: string,
  gameweek: Number,
) => {
  if (gameweek) {
    return api.get(`/predict/${competitionCode}/table/${gameweek}`);
  }
  return api.get(`/predict/${competitionCode}/table`);
};

export const calculatePredictionTable = async (
  competitionCode: string,
  gameweek: Number,
) => {
  if (gameweek) {
    return api.post(`/predict/${competitionCode}/calculate/${gameweek}`);
  }
  return api.post(`/predict/${competitionCode}/calculate`);
};
