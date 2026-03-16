import type { App } from "vue";
import { provideTheme } from "@/app/providers/provideTheme";
import { provideIdentity } from "@/app/providers/provideIdentity";

export function installAppProviders(app: App) {
  provideIdentity(app);
  provideTheme();
}
