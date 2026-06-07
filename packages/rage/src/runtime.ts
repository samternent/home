import { createDirectRageRuntime } from "./direct-runtime.js";
import { RageInitError } from "./errors.js";
import type { RageRuntime } from "./runtime-types.js";
import { createWorkerRageRuntime } from "./worker-runtime.js";

type RageRuntimeMode = "direct" | "worker";

let runtime: RageRuntime | null = null;
let runtimeMode: RageRuntimeMode | null = null;

function shouldUseWorkerRuntime(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof Worker !== "undefined"
  );
}

function createRuntime(mode: RageRuntimeMode): RageRuntime {
  if (mode === "worker") {
    return createWorkerRageRuntime();
  }

  return createDirectRageRuntime();
}

export async function loadRageRuntime(): Promise<void> {
  if (!runtime || !runtimeMode) {
    runtimeMode = shouldUseWorkerRuntime() ? "worker" : "direct";
    runtime = createRuntime(runtimeMode);
  }

  try {
    await runtime.init();
  } catch (error) {
    if (runtimeMode !== "worker") {
      runtime = null;
      runtimeMode = null;
      if (error instanceof RageInitError) {
        throw error;
      }
      throw new RageInitError("RAGE_INIT_FAILED", "Failed to initialize Rage WASM.", error);
    }

    runtimeMode = "direct";
    runtime = createRuntime(runtimeMode);
    try {
      await runtime.init();
    } catch (fallbackError) {
      runtime = null;
      runtimeMode = null;
      if (fallbackError instanceof RageInitError) {
        throw fallbackError;
      }
      throw new RageInitError("RAGE_INIT_FAILED", "Failed to initialize Rage WASM.", fallbackError);
    }
  }
}

export function getRageRuntime(): RageRuntime {
  if (!runtime) {
    throw new RageInitError(
      "RAGE_INIT_FAILED",
      "Rage WASM is not initialized. Call initRage() before using @ternent/rage.",
    );
  }

  return runtime;
}
