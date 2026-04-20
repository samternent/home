import { RageInitError } from "./errors.js";
import { loadRageRuntime } from "./runtime.js";

let initialized = false;
let initPromise: Promise<void> | null = null;

export async function initRage(): Promise<void> {
  if (initialized) {
    return;
  }

  if (!initPromise) {
    initPromise = loadRageRuntime();
  }

  try {
    await initPromise;
    initialized = true;
  } catch (error) {
    initialized = false;
    initPromise = null;
    if (error instanceof RageInitError) {
      throw error;
    }
    throw new RageInitError(
      "RAGE_INIT_FAILED",
      "Failed to initialize Rage WASM.",
      error
    );
  }
}

export function assertRageInitialized(): void {
  if (!initialized) {
    throw new RageInitError(
      "RAGE_INIT_FAILED",
      "Rage WASM is not initialized. Call initRage() before using @ternent/rage."
    );
  }
}
