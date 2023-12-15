import { provide, inject, shallowRef } from "vue";
const useDrawerRouteSymbol = Symbol("useDrawerRoute");

export function provideDrawerRoute() {
  const drawerRoutePath = shallowRef(null);

  provide(useDrawerRouteSymbol, drawerRoutePath);
}

export function useDrawerRoute() {
  const drawerRoutePath = inject(useDrawerRouteSymbol);

  return {
    drawerRoutePath,
    setDrawerRoutePath(path) {
      drawerRoutePath.value = path;
    },
  };
}
