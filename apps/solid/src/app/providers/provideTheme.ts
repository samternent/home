import { installUiProvider } from "@/modules/ui";

export function provideTheme() {
  const ui = installUiProvider();
  if (typeof window !== "undefined") {
    ui.start();
  }
  return ui;
}
