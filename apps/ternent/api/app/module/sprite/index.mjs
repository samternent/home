export function generateSprite(path, w, h, frames) {
  const myImage = new Image();
  myImage.src = path;

  return {
    isReady: () => myImage.complete,
    sprite: [
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
    ],
  };
}
