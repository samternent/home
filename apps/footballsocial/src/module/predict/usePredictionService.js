import { useAxios } from "../app/useAxios";

export function usePredictionService() {
  const api = useAxios();

  async function addPrediction(
    username,
    predictions,
    competitionCode,
    gameweek,
    season
  ) {
    const resp = await api.put(
      `/predict/${username}/${competitionCode}/${gameweek}/${season}`,
      { predictions }
    );

    return resp;
  }

  async function getPredictions(username, competitionCode, gameweek) {
    return api.get(`/predict/${username}/${competitionCode}/${gameweek}`);
  }

  async function fetchPredictionTable(competitionCode, gameweek, league) {
    if (gameweek) {
      return api.get(`/predict/${competitionCode}/table/${gameweek}`, {
        params: { league },
      });
    }
    return api.get(`/predict/${competitionCode}/table`, {
      params: { league },
    });
  }

  async function calculatePredictionTable(competitionCode, gameweek) {
    if (gameweek) {
      return api.post(`/predict/${competitionCode}/calculate/${gameweek}`);
    }
    return api.post(`/predict/${competitionCode}/calculate`);
  }

  async function fetchLandingStats() {
    return api.get(`/landing-stats`);
  }

  return {
    getPredictions,
    addPrediction,
    fetchPredictionTable,
    calculatePredictionTable,
    fetchLandingStats,
  };
}
