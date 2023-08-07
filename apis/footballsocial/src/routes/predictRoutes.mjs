import footballDataProxy from "../footballDataProxy.mjs";
import { supabaseClient } from "../supabase.mjs";

const competitions = {
  PL: "Premier League",
};
export default function predictRoutes(router) {
  router.get("/predict/:competitionCode/:gameweek", async function (req, res) {
    const { competitionCode, gameweek } = req.params;

    const { data } = await footballDataProxy(
      {
        ...req,
        url: `/football-data/competitions/${competitionCode}/matches?matchday=${gameweek}`,
      },
      res
    );

    const { resultSet, matches } = data;

    // if gameweek has finished, return the table.
    // get data from supabase - big calc here

    if (resultSet?.played > 0) {
      return res.send("Gameweek has already started");
    }

    return res.send(
      matches.map((match) => `${match.homeTeam.name} vs ${match.awayTeam.name}`)
    );
  });
}
