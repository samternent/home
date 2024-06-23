import { useAxios } from "../app/useAxios";

export function usePredictionService() {
  const api = useAxios();

  async function addPrediction(
    username,
    predictions,
    competitionCode,
    season,
    gameweek
  ) {
    const resp = await api.put(
      `/predict/${username}/${competitionCode}/${season}/${gameweek}`,
      { predictions }
    );

    return resp;
  }

  async function getPredictions(username, competitionCode, season, gameweek) {
    return api.get(
      `/predict/${username}/${competitionCode}/${season}/${gameweek}`
    );
  }

  async function fetchPredictionTable(
    competitionCode,
    season,
    gameweek,
    league
  ) {
    if (gameweek) {
      return api.get(
        `/predict/${competitionCode}/${season}/table/${gameweek}`,
        {
          params: { league },
        }
      );
    }
    return api.get(`/predict/${competitionCode}/${season}/table`, {
      params: { league },
    });
  }

  async function calculatePredictionTable(competitionCode, season, gameweek) {
    if (gameweek) {
      return api.post(
        `/predict/${competitionCode}/${season}/calculate/${gameweek}`
      );
    }
    return api.post(`/predict/${competitionCode}/${season}/calculate`);
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
