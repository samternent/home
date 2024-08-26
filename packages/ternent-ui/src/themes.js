import themes from "daisyui/src/theming/themes";
import { ternentDotDev, clubColors } from "../themes";
import { buildThemes } from "../themes/util";

const customThemes = {
  ...buildThemes({ ...clubColors }),
  ...ternentDotDev,
};

export default { ...themes, ...customThemes };
