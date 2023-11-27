import { lightBase, lightColors, darkBase, darkColors } from "./base";

export function buildThemes(themes) {
  return Object.keys(themes).reduce(
    (acc, curr) => {
      const lightTheme = {
        primary: themes[curr].primary,
        accent: themes[curr].accent,
        ...lightBase,
      };

      const darkTheme = {
        primary: themes[curr].primary,
        accent: themes[curr].accent,
        ...darkBase,
      };

      acc[`${curr}-light`] = lightTheme;
      acc[`${curr}-dark`] = darkTheme;

      return acc;
    },
    {
      light: {
        ...lightColors,
        ...lightBase,
      },
      dark: {
        ...darkColors,
        ...darkBase,
      },
    }
  );
}
