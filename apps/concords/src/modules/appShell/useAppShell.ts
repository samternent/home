import { onMounted, provide, inject } from "vue";
import { RemovableRef, useLocalStorage } from "@vueuse/core";

const useAppShellSymbol = Symbol("useAppShell");

interface IAppShell {
  isBottomPanelExpanded: RemovableRef<boolean>;
  isLeftPanelExpanded: RemovableRef<boolean>;
  isRightPanelExpanded: RemovableRef<boolean>;
  bottomPanelHeight: RemovableRef<number>;
}

export function provideAppShell(): IAppShell {
  const isBottomPanelExpanded = useLocalStorage("isBottomPanelExpanded", true);
  const isLeftPanelExpanded = useLocalStorage("isLeftPanelExpanded", true);
  const isRightPanelExpanded = useLocalStorage("isRightPanelExpanded", true);
  const bottomPanelHeight = useLocalStorage("bottomPanelHeight", 320);

  function setViewHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }

  onMounted(() => {
    setViewHeight();
    window.addEventListener("resize", setViewHeight);
  });

  const appShellInterface: IAppShell = {
    isBottomPanelExpanded,
    isLeftPanelExpanded,
    isRightPanelExpanded,
    bottomPanelHeight,
  };

  provide(useAppShellSymbol, appShellInterface);
  return appShellInterface;
}

export function useAppShell() {
  return inject(useAppShellSymbol);
}
