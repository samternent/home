import { inject, shallowRef } from "vue";

const useWhiteLabelSymbol = Symbol("useWhiteLabel");

export function provideWhiteLabel(app) {
  const whiteLabel = shallowRef({
    name: ["ternent", "dot", "dev"],
    description: "Specialists in Frontend and Platform Engineering.",
    themeName: "lofi",
    domain: "ternent.dev",
  });

  if (window.location.host.includes("localhost")) {
    whiteLabel.value = {
      ...whiteLabel.value,
      name: ["ternent", "dot", "local"],
      tag: "Hand-crafted Software. Birmingham, UK.",
      themeName: "azureBloom",
      domain: "localhost:5173",
    };
  }
  if (window.location.host.includes("ternent.dev")) {
    whiteLabel.value = {
      ...whiteLabel.value,
      name: ["ternent", "dot", "dev"],
      tag: "Hand-crafted Software. Birmingham, UK.",
      themeName: "azureBloom",
      domain: "ternent.dev",
    };
  }
  if (window.location.host.includes("concords.app")) {
    whiteLabel.value = {
      ...whiteLabel.value,
      name: ["concords", "ledger", ""],
      tag: "Encrypted, storage agnostic & tamper-proof.",
      themeName: "corporateProfessional",
      domain: "concords.app",
    };
  }

  app.provide(useWhiteLabelSymbol, whiteLabel);
}

export function useWhiteLabel() {
  return inject(useWhiteLabelSymbol);
}
