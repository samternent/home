import clouds1 from "@/assets/game_background_1/layers/clouds_1.png";
import clouds2 from "@/assets/game_background_1/layers/clouds_2.png";
import clouds3 from "@/assets/game_background_2/layers/clouds_3.png";
import birds from "@/assets/game_background_2/layers/birds.png";
import rocks1 from "@/assets/game_background_2/layers/rocks_1.png";
import rocks2 from "@/assets/game_background_2/layers/rocks_2.png";
import rocks3 from "@/assets/game_background_2/layers/rocks_3.png";
import sky from "@/assets/game_background_2/layers/sky.png";
import pines from "@/assets/game_background_2/layers/pines.png";

interface IAsset {
  image: String;
  fixedY?: boolean;
  fixedX?: boolean;
  position?: string;
}
export default [
  { image: sky, fixedY: true, fixedX: true },
  { image: clouds1, fixedY: true },
  { image: birds, fixedY: true },
  { image: clouds2, fixedY: true },
  { image: clouds3, fixedY: true },
  { image: rocks3, fixedY: true },
  { image: rocks2, fixedY: true },
  { image: rocks1, fixedY: true },

  { image: pines, fixedY: true, position: "front" },
] as Array<IAsset>;
