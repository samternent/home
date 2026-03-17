import {
  createSealIdentity,
  createSealMnemonicIdentity,
  exportIdentityJson,
} from "../crypto";

function formatMnemonicBackup(input: {
  mnemonic: string;
  passphrase?: string;
}): string {
  const lines = ["Seal seed phrase backup", "", "Mnemonic:", input.mnemonic];
  if (String(input.passphrase || "").trim()) {
    lines.push("", "Passphrase:", String(input.passphrase));
  }
  lines.push(
    "",
    "Store this file securely. Anyone with this recovery material can recreate the signer."
  );
  return `${lines.join("\n")}\n`;
}

export async function createIdentityArtifact(input: {
  withMnemonic?: boolean;
  words?: 12 | 24;
  passphrase?: string;
} = {}): Promise<{
  identity: import("@ternent/identity").SerializedIdentity;
  content: string;
  mnemonic: string | null;
  mnemonicContent: string | null;
}> {
  const useMnemonic =
    Boolean(input.withMnemonic) ||
    input.words === 12 ||
    input.words === 24 ||
    Boolean(input.passphrase);
  const created = useMnemonic
    ? await createSealMnemonicIdentity({
        words: input.words,
        passphrase: input.passphrase,
      })
    : {
        identity: await createSealIdentity(),
        mnemonic: null,
      };
  return {
    identity: created.identity,
    content: exportIdentityJson(created.identity),
    mnemonic: created.mnemonic,
    mnemonicContent: created.mnemonic
      ? formatMnemonicBackup({
          mnemonic: created.mnemonic,
          passphrase: input.passphrase,
        })
      : null,
  };
}
