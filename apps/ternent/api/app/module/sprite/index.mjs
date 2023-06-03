export function generateSprite({ path, width: w, height: h }) {
  const myImage = new Image();
  myImage.src = path;

  let lastDrew = 0;

  let spriteNum = 0;
  let posX = window.innerWidth / 4;
  let posY = window.innerHeight - 20;

  let isMoving = false;

  const sprite = [
    (posX, posY) => [myImage, w * 0, h * 0, w, h, 0 + posX, posY - h, w, h],
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
  ];

  return {
    start() {
      isMoving = true;
    },
    stop() {
      isMoving = false;
    },
    draw(ctx) {
      if (myImage.complete) {
        if (isMoving) {
          ctx.drawImage(...sprite[spriteNum](posX, posY));

          if (Date.now() - lastDrew > 60) {
            if (spriteNum < sprite.length - 1) {
              spriteNum++;
            } else {
              spriteNum = 0;
            }
            lastDrew = Date.now();
          }
        } else {
          ctx.drawImage(...sprite[0](posX, posY));

          spriteNum = 0;
          lastDrew = Date.now();
        }
      }
    },
  };
}
