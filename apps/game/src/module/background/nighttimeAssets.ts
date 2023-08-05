import clouds1 from "@/assets/game_background_3/layers/clouds_1.png";
import clouds2 from "@/assets/game_background_3/layers/clouds_2.png";
import ground1 from "@/assets/game_background_3/layers/ground_1.png";
import ground2 from "@/assets/game_background_3/layers/ground_2.png";
import ground3 from "@/assets/game_background_3/layers/ground_3.png";
import plant from "@/assets/game_background_3/layers/plant.png";
import rocks from "@/assets/game_background_3/layers/rocks.png";
import sky from "@/assets/game_background_3/layers/sky.png";
interface IAsset {
  image: String;
  fixedY?: boolean;
  fixedX?: boolean;
  position?: string;
}
export default [
  { image: sky, fixedY: true, fixedX: true },
  { image: clouds1, fixedY: true },
  { image: rocks, fixedY: true },
  { image: ground1, fixedY: true },
  { image: clouds2, fixedY: true },
  { image: ground2, fixedY: true },
  { image: ground3 },
  { image: plant, position: 'front' },
] as Array<IAsset>;
