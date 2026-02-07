export const PACK_MODELS = Object.freeze({
  ALBUM: "album",
  DISCOVERY: "discovery",
});

export const PACK_MODEL_VALUES = Object.freeze(Object.values(PACK_MODELS));

// Reserved for Model 2 wiring in a later phase.
export const DISCOVERY_LEDGER_KINDS = Object.freeze({
  ARTIFACT_MINTED: "artifact.minted",
  PACK_DISCOVERED: "pack.discovered",
});

export function isPackModel(value) {
  return PACK_MODEL_VALUES.includes(String(value || "").trim().toLowerCase());
}
