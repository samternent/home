export const competitions = [
  // {
  //   code: "WC",
  //   name: "FIFA World Cup",
  // },
  // {
  //   code: "EC",
  //   name: "European Championship",
  // },
  {
    code: "PL",
    name: "Premier League",
  },
  {
    code: "CL",
    name: "UEFA Champions League",
  },
  {
    code: "ELC",
    name: "Championship",
  },
  {
    code: "PD",
    name: "La Liga",
  },
  {
    code: "BL1",
    name: "Bundesliga",
  },
  {
    code: "SA",
    name: "Serie A",
  },
  {
    code: "FL1",
    name: "Ligue 1",
  },
  {
    code: "DED",
    name: "Eredivisie",
  },
];

const gameweekDefinitions = {
  PL: 38,
  PD: 38,
  ELC: 46,
  BL1: 34,
  SA: 38,
  FL1: 38,
  DED: 34,
  EC: 7,
};

export function getCompetitionGameweeks(competitionCode) {
  return Array.from(
    { length: gameweekDefinitions[competitionCode] },
    (_, i) => i + 1
  );
}
