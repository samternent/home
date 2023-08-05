import { createSprite } from "@concords/game-kit";

export function useCharacter({
  pose,
  positionX,
  positionY,
  velocityX,
  velocityY,
  mass,
  radius,
  restitution,
  poses,
} = {}) {
  const { drawSprite } = createSprite(poses, {
    state: pose,
    width: radius * 2,
    height: radius * 2,
  });

  return
}
