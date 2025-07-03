/**
 * createScene function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function createScene(assetPath: string ) {
  const myImage = new Image();
  myImage.src = assetPath;

  function drawScene(
    ctx: CanvasRenderingContext2D,
    position: { x: number; y: number }
  ) {
    if (myImage.complete) {
      ctx.drawImage(
        myImage,
        0,
        0,
        position.x || myImage.width,
        position.y || myImage.height
      );
    }
  }

  return { drawScene };
}
