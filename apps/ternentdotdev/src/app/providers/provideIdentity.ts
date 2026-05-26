import type { App } from "vue";
import { installIdentityProvider } from "@/modules/identity";

export function provideIdentity(app: App) {
  return installIdentityProvider(app);
}
