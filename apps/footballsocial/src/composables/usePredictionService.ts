import { provide, inject } from "vue";
import { useAxios } from "./useAxios";
import { supabaseClient } from "../service/supabase";

const usePredictionServiceSymbol = Symbol("usePredictionService");

export function providePredictionService() {
  const api = useAxios();

  async function addPrediction(
    username: string,
    predictions: any,
    competitionCode: string,
    gameweek: Number
  ) {
    return supabaseClient
      .from("predictions")
      .upsert(
        Object.keys(predictions)
          .map((fixtureId) => ({
            id: `${username}_${fixtureId}_${gameweek}`,
            username,
            fixtureId,
            homeScore: predictions[fixtureId].homeScore,
            awayScore: predictions[fixtureId].awayScore,
            competitionCode,
            gameweek,
          }))
          .filter(
            ({ homeScore, awayScore }) =>
              homeScore !== undefined && awayScore !== undefined
          ),
        { onConflict: "id" }
      )
      .select();
  }

  async function getPredictions(
    username: string,
    competitionCode: string,
    gameweek: Number
  ) {
    return api.get(`/predict/${username}/${competitionCode}/${gameweek}`);
  }

  async function getPredictionsCount(
    username: string,
    competitionCode: string,
    gameweek: Number
  ) {
    return supabaseClient
      .from("predictions")
      .select("*", { count: "exact", head: true });
  }

  async function fetchPredictionTable(
    competitionCode: string,
    gameweek: Number,
    league: string
  ) {
    if (gameweek) {
      return api.get(`/predict/${competitionCode}/table/${gameweek}`, {
        params: { league },
      });
    }
    return api.get(`/predict/${competitionCode}/table`, {
      params: { league },
    });
  }

  async function calculatePredictionTable(
    competitionCode: string,
    gameweek: Number
  ) {
    if (gameweek) {
      return api.post(`/predict/${competitionCode}/calculate/${gameweek}`);
    }
    return api.post(`/predict/${competitionCode}/calculate`);
  }

  async function fetchLandingStats() {
    return api.get(`/landing-stats`);
  }

  const predictionService = {
    getPredictions,
    addPrediction,
    getPredictionsCount,
    fetchPredictionTable,
    calculatePredictionTable,
    fetchLandingStats,
  };

  provide(usePredictionServiceSymbol, predictionService);
  return predictionService;
}
export function usePredictionService() {
  return inject(usePredictionServiceSymbol);
}
