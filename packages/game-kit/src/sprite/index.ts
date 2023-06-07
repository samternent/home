interface IStates {
  [key: string]: string;
}

export function createSprite(
  states: IStates,
  {
    width: w,
    height: h,
    state,
  }: { width: number; height: number; state: string }
) {
  const myImage = new Image();
  myImage.src = states[state];

  let lastDrew = 0;
  let spriteNum = 0;

  function drawSprite(
    ctx: CanvasRenderingContext2D,
    { position: { x, y }, state }:
    {
      state: string
      position: { x: number; y: number,  }
    }
  ) {
    myImage.src = states[state];

    if (myImage.complete) {
      ctx.drawImage(
        myImage,
        w * spriteNum,
        h * 0,
        w,
        h,
        x,
        y - h * 4,
        w * 4,
        h * 4
      );
      if (Date.now() - lastDrew > 60) {
        if (spriteNum < myImage.width / w - 1) {
          spriteNum++;
        } else {
          spriteNum = 0;
        }
        lastDrew = Date.now();
      }
    }
  }

  return { drawSprite };
}
