import { inject, shallowRef } from "vue";

const useWhiteLabelSymbol = Symbol("useWhiteLabel");

export function provideWhiteLabel(app) {
  const whiteLabel = shallowRef({
    name: ["ternent", "dot", "dev"],
    description: "Specialists in Frontend and Platform Engineering.",
    themeName: "ternentdotdev",
    domain: "ternent.dev",
  });

  if (window.location.host.includes("localhost")) {
    whiteLabel.value = {
      ...whiteLabel.value,
      name: ["ternent", "dot", "local"],
      description: "My localhost development",
      themeName: "greener",
      domain: "localhost:5173",
    };
  }
  if (window.location.host.includes("ternent.dev")) {
    whiteLabel.value = {
      ...whiteLabel.value,
      name: ["ternent", "dot", "dev"],
      description: "Specialists in Frontend and Platform Engineering.",
      themeName: "greener",
      domain: "ternent.dev",
    };
  }
  if (window.location.host.includes("concords.app")) {
    whiteLabel.value = {
      ...whiteLabel.value,
      name: ["concords", "ledger", ""],
      description: "Concords is a white labelled version of ternent.dev",
      themeName: "concords",
      domain: "concords.app",
    };
  }

  app.provide(useWhiteLabelSymbol, whiteLabel);
}

export function useWhiteLabel() {
  return inject(useWhiteLabelSymbol);
}
