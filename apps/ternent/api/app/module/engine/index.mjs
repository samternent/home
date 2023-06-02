function generateSprite(path, w, h) {
  const myImage = new Image();
  myImage.src = path;

  return {
    isReady: () => myImage.complete,
    sprite: [
      (posX, posY) => [
        myImage,
        w * 0,
        h * 0,
        w,
        h,
        0 + posX,
        posY - h,
        w,
        h,
      ],
      (posX, posY) => [
        myImage,
        w * 0,
        h * 2,
        87,
        150,
        0 + posX,
        posY - 150,
        87,
        150,
      ],
      (posX, posY) => [
        myImage,
        w * 1,
        h * 0,
        87,
        150,
        0 + posX,
        posY - 150,
        87,
        150,
      ],
      (posX, posY) => [
        myImage,
        w * 2,
        h * 0,
        87,
        150,
        0 + posX,
        posY - 150,
        87,
        150,
      ],
      (posX, posY) => [
        myImage,
        w * 3,
        h * 0,
        87,
        150,
        0 + posX,
        posY - 150,
        87,
        150,
      ],
      (posX, posY) => [
        myImage,
        w * 4,
        h * 0,
        87,
        150,
        0 + posX,
        posY - 150,
        87,
        150,
      ],
      // [myImage, w * 0, h * 1, 87, 150 + posX, window.innerHeight - 150, 0, 87, 150],
      (posX, posY) => [
        myImage,
        w * 1,
        h * 1,
        87,
        150,
        0 + posX,
        posY - 150,
        87,
        150,
      ],
      (posX, posY) => [
        myImage,
        w * 1,
        h * 2,
        87,
        150,
        0 + posX,
        posY - 150,
        87,
        150,
      ],
      (posX, posY) => [
        myImage,
        w * 2,
        h * 1,
        87,
        150,
        0 + posX,
        posY - 150,
        87,
        150,
      ],
      (posX, posY) => [
        myImage,
        w * 2,
        h * 2,
        87,
        150,
        0 + posX,
        posY - 150,
        87,
        150,
      ],
      (posX, posY) => [
        myImage,
        w * 3,
        h * 1,
        87,
        150,
        0 + posX,
        posY - 150,
        87,
        150,
      ],
    ]
  };
}

export function createEngine() {
  console.log("create engine");
  let secondsPassed;
  let oldTimeStamp;
  let fps;
  let lastDrew = 0;
  const message = "https://hub.ternent.dev";

  let spriteNum = 0;
  let posX = window.innerWidth / 4;
  let posY = window.innerHeight - 20;

  const {sprite, isReady} = generateSprite("assets/character.png", 87, 150);

  function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    ctx.font = "200 18px Work Sans";
    ctx.textAlign = "center";
    ctx.fillStyle = Math.random() > 0.1 ? "#aaa" : "#888";
    ctx.fillText(message, canvas.width - 110, canvas.height - 15);

    if (isReady) {
      ctx.drawImage(...sprite[spriteNum](posX, posY));
      if (Date.now() - lastDrew > 60) {
        if (spriteNum < sprite.length - 1) {
          spriteNum++;
        } else {
          spriteNum = 0;
        }
        lastDrew = Date.now();
      }
    }

    // Draw number to the screen
    ctx.font = "200 16px Work Sans";
    ctx.fillStyle = "white";
    ctx.fillText(`${fps} fps`, 32, 20);
  }

  function gameLoop(timeStamp) {
    // Calculate the number of seconds passed since the last frame
    secondsPassed = (timeStamp - oldTimeStamp) / 1000;
    oldTimeStamp = timeStamp;

    // Calculate fps
    fps = Math.round(1 / secondsPassed);

    draw();

    // Keep requesting new frames
    window.requestAnimationFrame(gameLoop);
  }

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;

  // Start the first frame request
  requestAnimationFrame(gameLoop);
}
