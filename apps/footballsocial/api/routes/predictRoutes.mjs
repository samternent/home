import footballDataProxy, { redisClient } from "../footballDataProxy.mjs";
import { supabaseClient } from "../supabase.mjs";

import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAPI_KEY,
});
const openai = new OpenAIApi(configuration);

function sortTable(a, b) {
  if (a.points === b.points) {
    if (a.correctScore !== b.correctScore) {
      return b.correctScore - a.correctScore;
    }
    if (a.totalCorrectResult !== b.totalCorrectResult) {
      return b.totalCorrectResult - a.totalCorrectResult;
    }
    return b.username.toLowerCase() - a.username.toLowerCase();
  }
  return b.points - a.points;
}

export default function predictRoutes(router) {
  router.get(
    "/predict/:competitionCode/table/:gameweek?",
    async function (req, res) {
      const { competitionCode, gameweek } = req.params;

      // const cacheResults = null; //await redisClient.get(req.url);
      // if (cacheResults) {
      //   return res.send(JSON.parse(cacheResults));
      // }
      let returnData = null;

      if (gameweek) {
        const { data } = await supabaseClient
          .from("gameweek_results")
          .select()
          .eq("competitionCode", competitionCode)
          .eq("gameweek", gameweek);

        returnData = data;
      } else {
        const { data } = await supabaseClient
          .from("gameweek_results")
          .select()
          .eq("competitionCode", competitionCode);
        returnData = data;
      }

      const combinedTableStructure = {};

      returnData.forEach((item) => {
        if (combinedTableStructure[item.username]) {
          const vals = { ...combinedTableStructure[item.username] };
          combinedTableStructure[item.username] = {
            ...combinedTableStructure[item.username],
            points: vals.points + item.points,
            correctScore: vals.correctScore + item.correctScore,
            totalCorrectResult:
              vals.totalCorrectResult + item.totalCorrectResult,
            totalAwayGoals: vals.totalAwayGoals + item.totalAwayGoals,
            totalHomeGoals: vals.totalHomeGoals + item.totalHomeGoals,
          };
        } else {
          combinedTableStructure[item.username] = item;
        }
      });
      const table = Object.values(combinedTableStructure)
        .sort(sortTable)
        .map((row, i) => {
          return { position: i + 1, ...row };
        });

      // res.setHeader("Cache-Control", "max-age=1, stale-while-revalidate");
      // if (table.length) {
      //   await redisClient.set(req.url, JSON.stringify(table), {
      //     EX: 20,
      //     NX: true,
      //   });
      // }

      return res.send(table);
    }
  );

  // NOT ACTIVE
  router.get(
    "/predict/:competitionCode/roundup/:gameweek?",
    async function (req, res) {
      const { competitionCode, gameweek } = req.params;
      const { bypassCache } = req.query;

      const cacheResults = await redisClient.get(req.url);
      if (cacheResults && !Boolean(bypassCache)) {
        console.log(`${req.url} served from cache.`);
        return res.send(JSON.parse(cacheResults));
      }

      // const { data: predictionData } = await supabaseClient
      //   .from("predictions")
      //   .select()
      //   .eq("competitionCode", competitionCode)
      //   .eq("gameweek", gameweek);

      const {
        data: { matches },
      } = await footballDataProxy(
        {
          ...req,
          url: `/football-data/competitions/${competitionCode}/matches?matchday=${gameweek}`,
        },
        res
      );

      const filteredMatches = [
        ["homeTeam", "awayTeam", "homeScore", "awayScore"].join(","),
        ...matches.map((match) => [
          [
            match.homeTeam.shortName,
            match.awayTeam.shortName,
            match.score.fullTime.home,
            match.score.fullTime.away,
          ].join(","),
        ]),
      ];
      const filteredPredictions = [
        ["username", "homeScore", "awayScore"].join(","),
        ...matches.map((prediction) => [
          [
            prediction.homeScore,
            prediction.awayScore,
            prediction.username,
          ].join(","),
        ]),
      ];

      const { data } = await supabaseClient
        .from("gameweek_results")
        .select()
        .eq("competitionCode", competitionCode);

      const combinedTableStructure = {};

      data.forEach((item) => {
        if (combinedTableStructure[item.username]) {
          const vals = { ...combinedTableStructure[item.username] };
          combinedTableStructure[item.username] = {
            ...combinedTableStructure[item.username],
            points: vals.points + item.points,
            correctScore: vals.correctScore + item.correctScore,
            totalCorrectResult:
              vals.totalCorrectResult + item.totalCorrectResult,
            totalAwayGoals: vals.totalAwayGoals + item.totalAwayGoals,
            totalHomeGoals: vals.totalHomeGoals + item.totalHomeGoals,
          };
        } else {
          combinedTableStructure[item.username] = item;
        }
      });

      const table = Object.values(combinedTableStructure)
        .sort(sortTable)
        .map((row, i) => {
          return { position: i + 1, ...row };
        });

      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo-16k",
        messages: [
          {
            role: "system",
            content: "these are this weeks predictions in CSV",
          },
          { role: "system", content: JSON.stringify(filteredPredictions) },
          {
            role: "system",
            content: "these are the actual match results in CSV",
          },
          { role: "system", content: JSON.stringify(filteredMatches) },
          {
            role: "system",
            content: "here is the current league table in JSON",
          },
          { role: "system", content: JSON.stringify(table) },
          {
            role: "user",
            content:
              "Can you give me an analysis of this weeks gameweek, and how it impacted the current table? Breakdown into a few anecdotes of who predictioned which games",
          },
          {
            role: "system",
            content: "All output should be in markdown form.",
          },
          {
            role: "system",
            content: "Output should be in the style of roy keane",
          },
        ],
      });

      res.setHeader("Cache-Control", "max-age=1, stale-while-revalidate");
      if (response.data.choices[0]) {
        console.log(`${req.url} set redis cach4.`);

        await redisClient.set(
          req.url,
          JSON.stringify(response.data.choices[0]),
          {
            NX: true,
          }
        );
      }

      console.log(`${req.url} used openAI.`);
      return res.send(response.data.choices[0]);
    }
  );

  router.post(
    "/predict/:competitionCode/calculate/:gameweek",
    async function (req, res) {
      const { competitionCode, gameweek } = req.params;

      const cacheResults = await redisClient.get(req.url);
      if (cacheResults) {
        return res.send(JSON.parse(cacheResults));
      }

      console.log(`calculating results for ${competitionCode} gameweek ${gameweek}.`);

      const { data } = await footballDataProxy(
        {
          ...req,
          url: `/football-data/competitions/${competitionCode}/matches?matchday=${gameweek}`,
        },
        res
      );

      const { matches } = data;

      const { data: predictionData } = await supabaseClient
        .from("predictions")
        .select()
        .eq("competitionCode", competitionCode)
        .eq("gameweek", gameweek);

      const userScores = {};

      let i = 0;
      for (; i < predictionData.length; i++) {
        const prediction = predictionData[i];
        const match = matches.find((_match) => {
          return Number(_match.id) === Number(prediction.fixtureId);
        });

        if (!match) {
          continue;
        }

        const scores = {
          points: 0,
          totalHomeGoals: 0,
          totalAwayGoals: 0,
          totalCorrectResult: 0,
          correctScore: 0,
        };

        if (["FINISHED", "IN_PLAY", "PAUSED"].includes(match.status)) {
          let homeGoals = false;
          let awayGoals = false;
          let result = false;

          if (match.score.fullTime.home === prediction.homeScore) {
            homeGoals = true;
          }
          if (match.score.fullTime.away === prediction.awayScore) {
            awayGoals = true;
          }
          if (
            (match.score.fullTime.home > match.score.fullTime.away &&
              prediction.homeScore > prediction.awayScore) ||
            (match.score.fullTime.away > match.score.fullTime.home &&
              prediction.awayScore > prediction.homeScore) ||
            (match.score.fullTime.home === match.score.fullTime.away &&
              prediction.homeScore === prediction.awayScore)
          ) {
            // correct result
            result = true;
          }

          if (homeGoals) {
            scores.totalHomeGoals += 1;
            scores.points += 1;
          }
          if (awayGoals) {
            scores.totalAwayGoals += 1;
            scores.points += 1;
          }
          if (result) {
            scores.totalCorrectResult += 1;
            scores.points += 2;
          }

          if (homeGoals && awayGoals && result) {
            scores.points += 3;
            scores.correctScore += 1;
          }
        }

        Object.entries(scores).forEach(([key, value]) => {
          if (!userScores[prediction.username]) {
            userScores[prediction.username] = { [key]: value };
            return;
          }
          userScores[prediction.username][key] =
            value + (userScores[prediction.username][key] || 0);
        });
      }

      const results = await supabaseClient
        .from("gameweek_results")
        .upsert(
          Object.entries(userScores).map(([key, val]) => {
            return {
              id: `${key}_${competitionCode}_${gameweek}`,
              username: key,
              ...val,
              competitionCode,
              gameweek,
            };
          }),
          { onConflict: "id" }
        )
        .select();

      res.setHeader("Cache-Control", "max-age=1, stale-while-revalidate");
      await redisClient.set(req.url, JSON.stringify(results), {
        EX: 200,
        NX: true,
      });

      return res.status(200).json(results);
    }
  );

  router.post(
    "/predict/:competitionCode/calculate/table/:gameweek",
    async function (req, res) {
      const { competitionCode, gameweek } = req.params;

      // const cacheResults = null; //await redisClient.get(req.url);
      // if (cacheResults) {
      //   return res.send(JSON.parse(cacheResults));
      // }
      let returnData = null;

      if (gameweek) {
        const { data } = await supabaseClient
          .from("gameweek_results")
          .select()
          .eq("competitionCode", competitionCode)
          .eq("gameweek", gameweek);

        returnData = data;
      } else {
        const { data } = await supabaseClient
          .from("gameweek_results")
          .select()
          .eq("competitionCode", competitionCode);
        returnData = data;
      }

      const combinedTableStructure = {};

      returnData.forEach((item) => {
        if (combinedTableStructure[item.username]) {
          const vals = { ...combinedTableStructure[item.username] };
          combinedTableStructure[item.username] = {
            ...combinedTableStructure[item.username],
            points: vals.points + item.points,
            correctScore: vals.correctScore + item.correctScore,
            totalCorrectResult:
              vals.totalCorrectResult + item.totalCorrectResult,
            totalAwayGoals: vals.totalAwayGoals + item.totalAwayGoals,
            totalHomeGoals: vals.totalHomeGoals + item.totalHomeGoals,
          };
        } else {
          combinedTableStructure[item.username] = item;
        }
      });
      const table = Object.values(combinedTableStructure)
        .sort(sortTable)
        .map((row, i) => {
          return { position: i + 1, ...row };
        });

      // res.setHeader("Cache-Control", "max-age=1, stale-while-revalidate");
      // if (table.length) {
      //   await redisClient.set(req.url, JSON.stringify(table), {
      //     EX: 20,
      //     NX: true,
      //   });
      // }

      const results = await supabaseClient
        .from("gameweek_table")
        .upsert(
          Object.entries(userScores).map(([key, val]) => {
            return {
              id: `${key}_${competitionCode}_${gameweek}`,
              username: key,
              ...val,
              competitionCode,
              gameweek,
            };
          }),
          { onConflict: "id" }
        )
        .select();

      return res.status(200).json(results);
    }
  );

  router.get(
    "/predict/:username/:competitionCode/:gameweek",
    async function (req, res) {
      const { competitionCode, gameweek, username } = req.params;

      const { data: predictionData } = await supabaseClient
        .from("predictions")
        .select()
        .eq("username", username)
        .eq("competitionCode", competitionCode)
        .eq("gameweek", Number(gameweek));

      return res.send({ predictions: predictionData });
    }
  );
}
