import {
  createLedger,
  deriveEntryId,
  deriveCommitId,
  hashData,
  getEntrySigningPayload,
} from "@ternent/concord-protocol-wasm";

// console.log(await createLedger());
// console.log(await deriveEntryId({
//   kind: "concord/user/added",
//   timestamp: "2026-01-01T00:00:00Z",
//   author: "author-1",
//   payload: { id: "user-1" },
//   signature: null,
// }));
// console.log(await getEntrySigningPayload({
//   kind: "concord/user/added",
//   timestamp: "2026-01-01T00:00:00Z",
//   author: "author-1",
//   payload: { id: "user-1" },
//   signature: null,
// }));
// console.log(await deriveCommitId({
//   parent: "commit-1",
//   timestamp: "2026-01-01T00:01:00Z",
//   metadata: { message: "init" },
//   entries: ["entry-1"],
// }));
// console.log(await hashData({ name: "sam" }));
