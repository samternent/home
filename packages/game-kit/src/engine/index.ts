/**
 * Represents a game engine with loop management capabilities
 */
interface Engine {
  /** Starts the game loop */
  start: Function;
  /** Stops the game loop */
  stop: Function;
  /** Registers a callback to be called on each loop iteration */
  onLoop: Function;
  /** Unregisters a loop callback */
  offLoop: Function;
}

/**
 * Creates a new game engine instance with animation loop management
 * @returns A game engine object with start, stop, onLoop, and offLoop methods
 * @example
 * ```typescript
 * const engine = createEngine();
 *
 * engine.onLoop((timestamp) => {
 *   console.log('Game loop running at:', timestamp);
 * });
 *
 * engine.start();
 * ```
 */
/**
 * createEngine function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function createEngine(): Engine {
  let requestId: number | undefined;

  let secondsPassed: number;
  let oldTimeStamp: EpochTimeStamp;
  let fps: number;

  const loopCallbacks: Array<Function> = [];

  /**
   * Registers a callback function to be called on each animation frame
   * @param callback - Function to call on each loop iteration
   */
  function onLoop(callback: Function) {
    loopCallbacks.push(callback);
  }

  /**
   * Unregisters a previously registered loop callback
   * @param callback - Function to remove from loop callbacks
   */
  function offLoop(callback: Function) {
    const index = loopCallbacks.indexOf(callback);
    if (index !== -1) {
      loopCallbacks.splice(index, 1);
    }
  }

  /**
   * Main game loop function that executes all registered callbacks
   * @param timestamp - Current timestamp from requestAnimationFrame
   */
  function gameLoop(timestamp: EpochTimeStamp) {
    for (const callback of loopCallbacks) {
      callback(timestamp);
    }

    // Keep requesting new frames
    requestId = requestAnimationFrame(gameLoop);
  }

  /**
   * Starts the game loop using requestAnimationFrame
   */
  function start() {
    if (!requestId) {
      requestId = requestAnimationFrame(gameLoop);
    }
  }

  /**
   * Stops the game loop and cancels the animation frame request
   */
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
