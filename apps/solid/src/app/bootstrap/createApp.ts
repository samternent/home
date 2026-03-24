import type { App } from "vue";
import { provideTheme } from "@/app/providers/provideTheme";
import { provideSolidSession } from "@/app/providers/provideSolidSession";

export function installAppProviders(app: App) {
  provideSolidSession(app);
  provideTheme();
}
