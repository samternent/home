import api from "../utils/api";
import { supabaseClient } from "../service/supabase";

export const addPrediction = async (
  username: string,
  predictions: any,
  competitionCode: string,
  gameweek: Number
) => {
  return supabaseClient
    .from("predictions")
    .insert(
      Object.keys(predictions).map((fixtureId) => ({
        id: `${username}_${fixtureId}_${gameweek}`,
        username,
        fixtureId,
        homeScore: predictions[fixtureId].homeScore,
        awayScore: predictions[fixtureId].awayScore,
        competitionCode,
        gameweek,
      })).filter(({ homeScore, awayScore }) => homeScore !== undefined && awayScore !== undefined)
    )
    .select();
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
  gameweek: Number
) => {
  if (gameweek) {
    return api.get(`/predict/${competitionCode}/table/${gameweek}`);
  }
  return api.get(`/predict/${competitionCode}/table`);
};

export const calculatePredictionTable = async (
  competitionCode: string,
  gameweek: Number
) => {
  if (gameweek) {
    return api.post(`/predict/${competitionCode}/calculate/${gameweek}`);
  }
  return api.post(`/predict/${competitionCode}/calculate`);
};
