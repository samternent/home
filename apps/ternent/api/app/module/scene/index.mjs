export function generateScene({ path }) {
  const myImage = new Image();
  myImage.src = path;

  return {
    draw(ctx, fps) {
      if (myImage.complete) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        console.log(myImage.width)
        ctx.drawImage(myImage, 0, 0, myImage.width, window.innerHeight);

        ctx.font = "300 18px Work Sans";
        ctx.textAlign = "center";
        ctx.fillStyle = Math.random() > 0.1 ? "#fc0" : "#f0c";
        ctx.fillText("https://hub.ternent.dev", canvas.width - 110, canvas.height - 15);
        // Draw number to the screen
        ctx.font = "200 16px Work Sans";
        ctx.fillStyle = "white";
        ctx.fillText(`${fps} fps`, 32, 20);
      }
    },
  };
}
