import type { App } from "vue";
import { provideTheme } from "@/app/providers/provideTheme";
import { provideIdentity } from "@/app/providers/provideIdentity";
import { bootstrapPixpaxFamilyAccount } from "@/modules/family/usePixpaxFamilyAccount";

export function installAppProviders(app: App) {
  provideIdentity(app);
  provideTheme();
  bootstrapPixpaxFamilyAccount();
}
