import themes from "daisyui/src/theming/themes";
import { ternentDotDev, clubColors, sleek } from "../themes";
import { buildThemes } from "../themes/util";

const customThemes = {
  ...buildThemes({ ...clubColors }),
  ...ternentDotDev,
  sleekLight: sleek.light,
  sleekDark: sleek.dark,
};

export default { ...themes, ...customThemes };
