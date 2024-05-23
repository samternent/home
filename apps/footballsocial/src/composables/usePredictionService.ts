import { provide, inject } from "vue";
import { useAxios } from "./useAxios";

const usePredictionServiceSymbol = Symbol("usePredictionService");

export function providePredictionService() {
  const api = useAxios();

  async function addPrediction(
    username: string,
    predictions: any,
    competitionCode: string,
    gameweek: Number,
    season: string
  ) {
    const resp = await api.put(
      `/predict/${username}/${competitionCode}/${gameweek}/${season}`,
      { predictions }
    );

    return resp;
  }

  async function getPredictions(
    username: string,
    competitionCode: string,
    gameweek: Number
  ) {
    return api.get(`/predict/${username}/${competitionCode}/${gameweek}`);
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
