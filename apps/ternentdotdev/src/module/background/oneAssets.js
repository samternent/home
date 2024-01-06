import clouds1 from "@/assets/game_background_1/layers/clouds_1.png";
import clouds2 from "@/assets/game_background_1/layers/clouds_2.png";
import clouds3 from "@/assets/game_background_1/layers/clouds_3.png";
import clouds4 from "@/assets/game_background_1/layers/clouds_4.png";
import rocks1 from "@/assets/game_background_1/layers/rocks_1.png";
import rocks2 from "@/assets/game_background_1/layers/rocks_2.png";
import sky from "@/assets/game_background_1/layers/sky.png";

export default [
  { image: sky, fixedY: true, fixedX: true },
  { image: clouds1, fixedY: true },
  { image: clouds2, fixedY: true },
  { image: clouds3, fixedY: true },
  { image: clouds4, fixedY: true },
  { image: rocks1, fixedY: true },
  { image: rocks2 },
];
