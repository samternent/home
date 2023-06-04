import { generateSprite } from "@core/sprite";
import { generateScene } from "@core/scene";

const {
  requestAnimationFrame,
  cancelAnimationFrame,
  addEventListener,
  removeEventListener,
} = window;

export function createEngine() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  let colorScheme =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light';

  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;

  // add resize observer

  let requestId = undefined;

  let secondsPassed;
  let oldTimeStamp;
  let fps;

  const character = generateSprite({
    path: "assets/character.png",
    width: 87,
    height: 150,
  });
  const scene = generateScene({
    path: `assets/game_background_${colorScheme}.png`,
  });

  const { draw: drawScene } = scene;
  const {
    draw: drawCharacter,
    start: startCharacter,
    stop: stopCharacter,
  } = character;

  function draw() {
    drawScene(ctx, fps);
    drawCharacter(ctx);
  }

  function gameLoop(timeStamp) {
    // Calculate the number of seconds passed since the last frame
    secondsPassed = (timeStamp - oldTimeStamp) / 1000;
    oldTimeStamp = timeStamp;

    // Calculate fps
    fps = Math.round(1 / secondsPassed);

    draw();

    // Keep requesting new frames
    requestId = requestAnimationFrame(gameLoop);
  }

  function handleKeydown(e) {
    if (e.key === "d" || e.key === "ArrowRight") {
      startCharacter();
    }
  }
  function handleKeyup(e) {
    if (!e.key) {
      stop();
    }
    if (!e.key || e.key === "d" || e.key === "ArrowRight") {
      stopCharacter();
    }
  }

  function start() {
    if (!requestId) {
      requestId = requestAnimationFrame(gameLoop);
    }
  }

  function stop() {
    requestId = cancelAnimationFrame(requestId);
  }

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (event) => {
      colorScheme = event.matches ? "dark" : "light";
    });

  // set the scene
  start();

  addEventListener("keydown", handleKeydown);
  addEventListener("keyup", handleKeyup);
  addEventListener("blur", handleKeyup);
  addEventListener("focus", start);

  return {
    engine: {
      start,
      stop,
    },
    character,
  };
}
