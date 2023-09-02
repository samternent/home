import { provide, inject, shallowRef } from "vue";

const appVersionSymbol = Symbol("appVersion");

export function provideAppVersion() {
  const appVersion = shallowRef(
    document.querySelector("html").dataset.appVersion
  );
  const serverVersion = shallowRef(null);
  provide(appVersionSymbol, { appVersion, serverVersion });
  return { appVersion, serverVersion };
}
export function useAppVersion() {
  return inject(appVersionSymbol);
}
