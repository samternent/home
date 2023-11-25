const lightBase = {
  "color-scheme": "light",
  neutral: "#291334",
  "base-100": "#faf7f5",
  "base-200": "#efeae6",
  "base-300": "#e7e2df",
  "base-content": "#291334",
  "--rounded-btn": "1.9rem",
  "--tab-border": "2px",
  "--tab-radius": "0.7rem",
};
const darkBase = {
  "color-scheme": "dark",
  neutral: "#3B3B3B", // New neutral color - a dark gray tone
  "base-100": "#1E1E1E", // Darker background color
  "base-200": "#2B2B2B", // Slightly lighter shade for elements
  "base-300": "#333333", // Further darkened color for accents
  "base-content": "#DADADA", // Lighter text color for contrast
  "--rounded-btn": "1.9rem",
  "--tab-border": "2px",
  "--tab-radius": "0.7rem",
};

const teamColors = {
  arsenal: {
    primary: "#EF0107",
    accent: "#063672",
  },
  astonvilla: {
    primary: "#670E36",
    accent: "#95BFE5",
  },
  afcbournemouth: {
    primary: "#DA291C",
    accent: "#000000",
  },
  brighton: {
    primary: "#0057B8",
    accent: "#FFCD00",
  },
  brentford: {
    primary: "#e30613",
    accent: "#140e0c",
  },
  burnley: {
    primary: "#6C1D45",
    accent: "#99D6EA",
  },
  chelsea: {
    primary: "#034694",
    accent: "#EE242C",
  },
  crystalpalace: {
    primary: "#1B458F",
    accent: "#C4122E",
  },
  everton: {
    primary: "#003399",
    accent: "#FFFFFF",
  },
  fulham: {
    primary: "#000",
    accent: "#CC0000",
  },
  liverpoolfc: {
    primary: "#C8102E",
    accent: "#00A398",
  },
  luton: {
    primary: "#F78F1E",
    accent: "#002D62",
  },
  mancity: {
    primary: "#6CADDF",
    accent: "#FFCB05",
  },
  manutd: {
    primary: "#DA291C",
    accent: "#FBE122",
  },
  newcastle: {
    primary: "#241F20",
    accent: "#FFFFFF",
  },
  nottmforest: {
    primary: "#DD0000",
    accent: "#FFFFFF",
  },
  sheffieldutd: {
    primary: "#EE2737",
    accent: "#000000",
  },
  spurs: {
    primary: "#132257",
    accent: "#FFFFFF",
  },
  westham: {
    primary: "#7A263A",
    accent: "#1BB1E7",
  },
  wolves: {
    primary: "#FDB913",
    accent: "#231F20",
  },
  birmingham: {
    primary: "#0000FF",
    accent: "#ffffff",
  },
};

const themes = Object.keys(teamColors).reduce((result, team) => {
  const lightTheme = {
    primary: teamColors[team].primary,
    accent: teamColors[team].accent,
    ...lightBase,
  };

  const darkTheme = {
    primary: teamColors[team].primary,
    accent: teamColors[team].accent,
    ...darkBase,
  };

  result[`${team}-light`] = lightTheme;
  result[`${team}-dark`] = darkTheme;

  return result;
}, {});

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,vue}",
    "./components/**/*.{js,jsx,vue}",
    "./app/**/*.{js,jsx,vue}",
    "./src/**/*.{js,jsx,vue}",
  ],
  safelist: [
    {
      pattern:
        /(bg|text|border|btn)-(accent|primary|secondary|error|info|success)|(bg|text|btn)-(info|green|base|red|orange)-(100|200|300|400|500|600|700|800|900)|skeleton|input/,
      variants: ["hover"],
    },
  ],
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#4F46E5",
          accent: "#FC93AD",
          ...lightBase,
        },
        dark: {
          primary: "#6B63FF",
          accent: "#FFA8B0",
          ...darkBase,
        },
        ...themes,
      },
    ],
  },
};
