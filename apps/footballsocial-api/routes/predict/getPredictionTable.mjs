import { redisClient } from "../../services/redis.mjs";
import { supabaseClient } from "../../services/supabase.mjs";
import { isAuthenticated } from "../../util/index.mjs";

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

export default async function getPredictionTable(req, res) {
  const { competitionCode, season, gameweek } = req.params;
  const { league } = req.query;

  const isLoggedIn = isAuthenticated(req);
  let lastUpdated = 0;

  const cacheResults = await redisClient.get(
    `${req.url}${league ? `-${league}` : ""}- ${
      isLoggedIn ? "loggedIn" : "loggedOut"
    }`
  );
  if (cacheResults) {
    return res.send(JSON.parse(cacheResults));
  }

  let members = [];
  if (league) {
    const { data: leagueData } = await supabaseClient
      .from("leagues")
      .select()
      .eq("league_code", league);

    if (leagueData?.length) {
      const { data: membersData } = await supabaseClient
        .from("league_members")
        .select()
        .eq("league_id", leagueData[0].id);

      members = membersData.map((member) => member.username);
    }
  }

  const query = supabaseClient
    .from("gameweek_results")
    .select()
    .eq("competitionCode", competitionCode);

  if (season) {
    query.eq("season", season);
  }
  if (gameweek) {
    query.eq("gameweek", gameweek);
  }

  if (league) {
    query.in("username", members);
  }
  const { data: returnData, error } = await query;

  if (error) {
    res.status(500).json(error);
  }

  lastUpdated = Date.now();

  if (!gameweek) {
    const currentGameweek = Math.max(
      ...returnData.map(({ gameweek }) => gameweek).sort()
    );

    function buildCombinedTableStructure(item, combinedTableStructure = {}) {
      if (combinedTableStructure[item.username]) {
        const vals = { ...combinedTableStructure[item.username] };
        combinedTableStructure[item.username] = {
          ...combinedTableStructure[item.username],
          points: vals.points + item.points,
          correctScore: vals.correctScore + item.correctScore,
          totalCorrectResult: vals.totalCorrectResult + item.totalCorrectResult,
          totalAwayGoals: vals.totalAwayGoals + item.totalAwayGoals,
          totalHomeGoals: vals.totalHomeGoals + item.totalHomeGoals,
        };
      } else {
        combinedTableStructure[item.username] = item;
      }

      return { ...combinedTableStructure };
    }

    let previousResults = {};
    let currentResults = {};

    returnData.forEach((item) => {
      if (item.gameweek === currentGameweek) {
        currentResults = buildCombinedTableStructure(item, currentResults);
      } else {
        previousResults = buildCombinedTableStructure(item, previousResults);
      }
    });

    // calculate previous position
    Object.values(previousResults)
      .sort(sortTable)
      .forEach((row, i) => {
        previousResults[row.username].lastPosition = i + 1;
      });

    // calculate current position
    Object.values(currentResults)
      .sort(sortTable)
      .forEach((row, i) => {
        currentResults[row.username].gameweekPosition = i + 1;
        currentResults[row.username].gameweekPoints =
          currentResults[row.username].points;
      });

    const allUsers = new Set([
      ...Object.keys(currentResults),
      ...Object.keys(previousResults),
    ]);

    const combinedResults = [...allUsers]
      .map((username) => {
        return [
          { ...previousResults[username] },
          { ...currentResults[username] },
        ].reduce((acc, curr) => {
          return {
            points: (acc.points || 0) + (curr.points || 0),
            correctScore: (acc.correctScore || 0) + (curr.correctScore || 0),
            totalCorrectResult:
              (acc.totalCorrectResult || 0) + (curr.totalCorrectResult || 0),
            totalAwayGoals:
              (acc.totalAwayGoals || 0) + (curr.totalAwayGoals || 0),
            totalHomeGoals:
              (acc.totalHomeGoals || 0) + (curr.totalHomeGoals || 0),
            lastPosition: acc.lastPosition || curr.lastPosition || 0,
            gameweekPosition:
              acc.gameweekPosition || curr.gameweekPosition || 0,
            gameweekPoints: acc.gameweekPoints || curr.gameweekPoints || 0,
            username: acc.username || curr.username,
          };
        }, {});
      })
      .sort(sortTable)
      .map((row, i) => {
        return {
          position: i + 1,
          ...row,
          username: isLoggedIn
            ? row.username
            : `${row.username[0]}***${row.username[row.username.length - 1]}`,
        };
      });

    res.setHeader("Cache-Control", "max-age=1, stale-while-revalidate");
    await redisClient.set(
      `${req.url}${league ? `-${league}` : ""}- ${
        isLoggedIn ? "loggedIn" : "loggedOut"
      }`,
      JSON.stringify({ table: combinedResults, lastUpdated }),
      {
        EX: 300,
        NX: true,
      }
    );

    return res.status(200).json({ table: combinedResults, lastUpdated });
  } else {
    const results = returnData.sort(sortTable).map((row, i) => {
      return {
        position: i + 1,
        ...row,
        username: isLoggedIn
          ? row.username
          : `${row.username[0]}******${row.username[row.username.length - 1]}`,
      };
    });

    res.setHeader("Cache-Control", "max-age=1, stale-while-revalidate");
    await redisClient.set(
      `${req.url}- ${isLoggedIn ? "loggedIn" : "loggedOut"}`,
      JSON.stringify({ table: results, lastUpdated }),
      {
        EX: 300,
        NX: true,
      }
    );

    return res.status(200).json({ table: results, lastUpdated });
  }
}
