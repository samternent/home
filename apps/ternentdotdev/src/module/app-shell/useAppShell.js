import { onMounted, provide, inject, watch, shallowRef } from "vue";
import { useLocalStorage, useWindowSize } from "@vueuse/core";

const useAppShellSymbol = Symbol("useAppShell");

export function provideAppShell() {
  const { width } = useWindowSize();

  const appVersion = shallowRef(
    document.querySelector("html").dataset.appVersion
  );

  const isBottomPanelExpanded = useLocalStorage("isBottomPanelExpanded", false);
  const isLeftPanelExpanded = useLocalStorage("isLeftPanelExpanded", false);
  const isRightPanelExpanded = useLocalStorage("isRightPanelExpanded", false);
  const bottomPanelHeight = useLocalStorage(
    "bottomPanelHeight",
    width.value < 500 ? 620 : 320
  );

  watch(
    width,
    () => {
      if (width.value < 500) {
        bottomPanelHeight.value = window.innerHeight - 54;
      }
    },
    { immediate: true }
  );

  function setViewHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }

  onMounted(() => {
    setViewHeight();
    window.addEventListener("resize", setViewHeight);
  });

  const appShellInterface = {
    isBottomPanelExpanded,
    isLeftPanelExpanded,
    isRightPanelExpanded,
    bottomPanelHeight,
    appVersion,
  };

  provide(useAppShellSymbol, appShellInterface);
  return appShellInterface;
}

export function useAppShell() {
  return inject(useAppShellSymbol);
}
