import themes from "daisyui/src/theming/themes";
import { ternentDotDev, clubColors, concords } from "../themes";
import { buildThemes } from "../themes/util";

const customThemes = {
  ...buildThemes({ ...clubColors }),
  ...ternentDotDev,
  ...concords,
};

export default { ...themes, ...customThemes };
