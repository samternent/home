interface Engine {
  start: Function;
  stop: Function;
  onLoop: Function;
  offLoop: Function;
}

export function createEngine(): Engine {
  let requestId: number | undefined;

  let secondsPassed: number;
  let oldTimeStamp: EpochTimeStamp;
  let fps: number;

  const loopCallbacks: Array<Function> = [];

  // Function to register a loop callback
  function onLoop(callback: Function) {
    loopCallbacks.push(callback);
  }

  // Function to unregister a draw callback
  function offLoop(callback: Function) {
    const index = loopCallbacks.indexOf(callback);
    if (index !== -1) {
      loopCallbacks.splice(index, 1);
    }
  }

  function gameLoop(timestamp: EpochTimeStamp) {
    for (const callback of loopCallbacks) {
      callback(timestamp);
    }

    // Keep requesting new frames
    requestId = requestAnimationFrame(gameLoop);
  }

  function start() {
    if (!requestId) {
      requestId = requestAnimationFrame(gameLoop);
    }
  }

  function stop() {
    if (requestId) cancelAnimationFrame(requestId);
    requestId = undefined;
  }

  // set the scene
  start();

  return {
    start,
    stop,
    onLoop,
    offLoop,
  };
}

