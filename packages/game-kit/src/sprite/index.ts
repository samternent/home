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
  let lastState = state;

  function drawSprite(
    ctx: CanvasRenderingContext2D,
    {
      position: { x, y },
      state,
      repeatAnimation,
    }: {
      state: string;
      position: { x: number; y: number };
      repeatAnimation: boolean;
    }
  ) {
    myImage.src = states[state];

    if (lastState !== state) {
      spriteNum = 0;
    }

    if (myImage.complete) {
      ctx.strokeStyle = 'transparent';
      ctx.strokeRect(x, y - h / 2, w / 2, h / 2);
      ctx.drawImage(myImage, w * spriteNum, 0, w, h, x, y - (h / 2), w / 2, h / 2);

      if (Date.now() - lastDrew > 60) {
        if (spriteNum < myImage.width / w - 1) {
          spriteNum++;
        } else {
          if (repeatAnimation) {
            spriteNum = 0;
          }
        }
        lastDrew = Date.now();
      }
      lastState = state;
    }
  }

  return { drawSprite };
}
