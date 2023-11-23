export const competitions = [
  // {
  //   code: "WC",
  //   name: "FIFA World Cup",
  // },
  {
    code: "PL",
    name: "Premier League",
  },
  // {
  //   code: "CL",
  //   name: "UEFA Champions League",
  // },
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

interface StringArray {
  [key: string]: number;
}

const gameweekDefinitions : StringArray = {
  PL: 38,
  PD: 38,
  ELC: 46,
  BL1: 34,
  SA: 38,
  FL1: 38,
  DED: 34,
};

export function getCompetitionGameweeks(competitionCode: string) {
  return Array.from(
    { length: gameweekDefinitions[competitionCode] },
    (_, i) => i + 1
  )
}