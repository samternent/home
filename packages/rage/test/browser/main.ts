import {
  decryptTextWithIdentity,
  decryptTextWithPassphrase,
  encryptTextWithPassphrase,
  encryptTextWithRecipients,
  generateKeyPair,
  initRage,
} from "@ternent/rage";

const output = document.querySelector<HTMLPreElement>("#output");

async function main(): Promise<void> {
  if (!output) {
    return;
  }

  try {
    await initRage();

    const alice = await generateKeyPair();
    const bob = await generateKeyPair();

    const recipientCiphertext = await encryptTextWithRecipients({
      recipients: [alice.publicKey, bob.publicKey],
      text: "browser recipient",
    });
    const recipientPlaintext = await decryptTextWithIdentity({
      identity: bob.privateKey,
      data: recipientCiphertext,
    });

    const passphraseCiphertext = await encryptTextWithPassphrase({
      passphrase: "browser passphrase",
      text: "browser passphrase",
    });
    const passphrasePlaintext = await decryptTextWithPassphrase({
      passphrase: "browser passphrase",
      data: passphraseCiphertext,
    });

    document.body.dataset.status = "ok";
    output.textContent = JSON.stringify(
      {
        status: "ok",
        recipientPlaintext,
        passphrasePlaintext,
      },
      null,
      2
    );
  } catch (error) {
    const details =
      error instanceof Error
        ? {
            status: "error",
            name: error.name,
            message: error.message,
            code: "code" in error ? Reflect.get(error, "code") : undefined,
          }
        : {
            status: "error",
            message: String(error),
          };

    document.body.dataset.status = "error";
    output.textContent = JSON.stringify(details, null, 2);
  }
}

void main();
