import { provide, inject, shallowRef } from "vue";

const useWhiteLabelSymbol = Symbol("useWhiteLabel");

export function provideWhiteLabel() {
  const whiteLabel = shallowRef({
    name: ["ternent", "dot", "dev"],
    description: "Specialists in Frontend and Platform Engineering.",
  });

  if (window.location.host.includes("localhost")) {
    whiteLabel.value = {
      ...whiteLabel.value,
      name: ["localhost", ":", "5173"],
      description: "My localhost development",
    };
  }
  if (window.location.host.includes("ternent.dev")) {
    whiteLabel.value = {
      ...whiteLabel.value,
      name: ["ternent", "dot", "dev"],
      description: "Specialists in Frontend and Platform Engineering.",
    };
  }
  if (window.location.host.includes("concords.dev")) {
    whiteLabel.value = {
      ...whiteLabel.value,
      name: ["concords", "dot", "app"],
      description: "Concords is a white labelled version of ternent.dev",
    };
  }

  provide(useWhiteLabelSymbol, whiteLabel);
}

export function useWhiteLabel() {
  return inject(useWhiteLabelSymbol);
}
