import { provide, inject, shallowRef, onUnmounted } from "vue";

const useBreadcrumbsSymbol = Symbol("useBreadcrumbs");

function Breadcrumbs() {
  const breadcrumbs = shallowRef([]);

  return {
    breadcrumbs,
  };
}

export function provideBreadcrumbs() {
  const breadcrumbs = Breadcrumbs();
  provide(useBreadcrumbsSymbol, breadcrumbs);
  return breadcrumbs;
}

export function useBreadcrumbs(breadcrumb) {
  const { breadcrumbs } = inject(useBreadcrumbsSymbol);

  if (breadcrumb) {
    breadcrumbs.value = [...breadcrumbs.value, breadcrumb];
    onUnmounted(() => {
      breadcrumbs.value = breadcrumbs.value.filter((b) => b !== breadcrumb);
    });
  }

  return breadcrumbs;
}
