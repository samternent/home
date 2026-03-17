import { initRage } from "@ternent/rage";
import { toArmourInitError } from "./errors.js";

export async function initArmour(): Promise<void> {
  try {
    await initRage();
  } catch (error) {
    throw toArmourInitError(error);
  }
}
