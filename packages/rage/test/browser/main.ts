import {
  decryptTextWithIdentity,
  decryptTextWithPassphrase,
  encryptTextWithPassphrase,
  encryptTextWithRecipients,
  generateKeyPair,
  initRage,
} from "@ternent/rage";

const output = document.querySelector<HTMLPreElement>("#output");
const NativeWorker = globalThis.Worker;
let workerCreations = 0;
let workerMessages = 0;

if (NativeWorker) {
  class CountingWorker extends NativeWorker {
    constructor(url: string | URL, options?: WorkerOptions) {
      workerCreations += 1;
      super(url, options);
    }

    override postMessage(
      message: unknown,
      transferOrOptions?: StructuredSerializeOptions | Transferable[],
    ): void {
      workerMessages += 1;
      super.postMessage(message, transferOrOptions);
    }
  }

  globalThis.Worker = CountingWorker;
}

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
        workerCreations,
        workerMessages,
      },
      null,
      2,
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
