import getPredictionTable from "./getPredictionTable.mjs";
import getPredictions from "./getPredictions.mjs";
import postPredictionTable from "./postPredictionTable.mjs";
import submitPredictions from "./submitPredictions.mjs";

export default function predictRoutes(router) {
  router.put(
    "/predict/:username/:competitionCode/:gameweek/:season",
    submitPredictions
  );

  router.get(
    "/predict/:competitionCode/table/:gameweek?/:members?",
    getPredictionTable
  );

  router.get("/predict/:username/:competitionCode/:gameweek", getPredictions);

  router.post(
    "/predict/:competitionCode/calculate/:gameweek",
    postPredictionTable
  );
}
