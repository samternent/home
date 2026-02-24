import { createVaultTransitSigner } from "../../services/signing/vault-transit-signer.mjs";
import { createSigningIdentityRepo } from "../../services/signing/signing-identity-repo.mjs";
import { createPixbookRepo } from "./pixbook-repo.mjs";
import { createReceiptRepo } from "./receipt-repo.mjs";
import { createSpacesReceiptStore } from "./spaces-receipt-store.mjs";
import { createReceiptWriter } from "./receipt-writer.mjs";
import { createPixbookCommandService } from "./pixbook-command-service.mjs";
import { createPixbookQueryService } from "./pixbook-query-service.mjs";

let services = null;

export function getPixbookServices() {
  if (services) return services;
  const signer = createVaultTransitSigner();
  const pixbookRepo = createPixbookRepo();
  const receiptRepo = createReceiptRepo();
  const receiptStore = createSpacesReceiptStore();
  const signingIdentityRepo = createSigningIdentityRepo();
  const receiptWriter = createReceiptWriter({
    signer,
    receiptRepo,
    receiptStore,
  });
  const commandService = createPixbookCommandService({
    pixbookRepo,
    receiptRepo,
    receiptWriter,
    signingIdentityRepo,
    fallbackVaultKeyName: "pixbook-default",
  });
  const queryService = createPixbookQueryService({
    pixbookRepo,
    receiptRepo,
    receiptStore,
  });

  services = {
    signer,
    commandService,
    queryService,
  };
  return services;
}
