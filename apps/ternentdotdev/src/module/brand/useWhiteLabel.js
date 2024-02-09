import { provide, inject, shallowRef } from "vue";

const useWhiteLabelSymbol = Symbol("useWhiteLabel");

export function provideWhiteLabel() {
  const whiteLabel = shallowRef({
    name: ["ternent", "dot", "dev"],
    description: "Specialists in Frontend and Platform Engineering.",
    themeName: "ternentdotdev",
  });

  if (window.location.host.includes("localhost")) {
    whiteLabel.value = {
      ...whiteLabel.value,
      name: ["ternent", "dot", "local"],
      description: "My localhost development",
      themeName: "mancity",
    };
  }
  if (window.location.host.includes("ternent.dev")) {
    whiteLabel.value = {
      ...whiteLabel.value,
      name: ["ternent", "dot", "dev"],
      description: "Specialists in Frontend and Platform Engineering.",
      themeName: "ternentdotdev",
    };
  }
  if (window.location.host.includes("concords.app")) {
    whiteLabel.value = {
      ...whiteLabel.value,
      name: ["concords", "dot", "app"],
      description: "Concords is a white labelled version of ternent.dev",
      themeName: "concords",
    };
  }

  provide(useWhiteLabelSymbol, whiteLabel);

  return whiteLabel;
}

export function useWhiteLabel() {
  return inject(useWhiteLabelSymbol);
}
