```typescript
const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");

function drawScene() {
  if (!ctx) return;

  ctx.fill();
}
function drawCharacter() {
  if (!ctx) return;

  ctx.fill();
}

const { onLoop } = createEngine();

onLoop(drawScene);
onLoop(drawCharacter);
```
