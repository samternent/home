import getPredictionTable from "./getPredictionTable.mjs";
import getPredictions from "./getPredictions.mjs";
import postPredictionTable from "./postPredictionTable.mjs";
import submitPredictions from "./submitPredictions.mjs";

export default function predictRoutes(router) {
  router.put(
    "/predict/:username/:competitionCode/:season/:gameweek/",
    submitPredictions
  );

  router.get(
    "/predict/:competitionCode/:season/table/:gameweek?/:members?",
    getPredictionTable
  );

  router.get(
    "/predict/:username/:competitionCode/:season/:gameweek",
    getPredictions
  );

  router.post(
    "/predict/:competitionCode/:season/calculate/:gameweek",
    postPredictionTable
  );
}
