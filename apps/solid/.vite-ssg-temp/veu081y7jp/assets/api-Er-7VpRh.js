import { _ as createMnemonicIdentity, g as createIdentityFromMnemonic, n as decryptTextWithPassphrase, r as encryptTextWithPassphrase, t as initArmour, x as validateIdentity, y as parseIdentity } from "./src-De70Jo1T.js";
import { readonly, ref, shallowRef } from "vue";
var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField$1 = (obj, key, value) => {
	__defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
	return value;
};
function canonicalStringify(value) {
	return JSON.stringify(canonicalize(value, /* @__PURE__ */ new WeakSet()));
}
function canonicalize(value, seen) {
	if (value === void 0) throw new TypeError("Cannot canonicalize undefined");
	const valueType = typeof value;
	if (valueType === "function" || valueType === "symbol") throw new TypeError(`Cannot canonicalize ${valueType} values`);
	if (valueType === "bigint") throw new TypeError("Cannot canonicalize bigint values");
	if (valueType === "number") {
		if (!Number.isFinite(value)) throw new TypeError("Cannot canonicalize non-finite number");
		return value;
	}
	if (value === null || valueType === "string" || valueType === "boolean") return value;
	if (typeof value.toJSON === "function") throw new TypeError("Cannot canonicalize toJSON values");
	if (Array.isArray(value)) return value.map((item) => canonicalize(item, seen));
	if (typeof value === "object") {
		if (seen.has(value)) throw new TypeError("Cannot canonicalize circular references");
		seen.add(value);
		const entries = Object.keys(value).sort();
		const result = {};
		for (const key of entries) result[key] = canonicalize(value[key], seen);
		seen.delete(value);
		return result;
	}
	throw new TypeError(`Cannot canonicalize unsupported value type: ${valueType}`);
}
function bytesToHex(bytes) {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function getNodeCrypto() {
	try {
		return Function("return require")()("crypto");
	} catch {
		return null;
	}
}
async function sha256Hex(bytes) {
	var _a;
	const subtle = (_a = globalThis.crypto) == null ? void 0 : _a.subtle;
	if (subtle) {
		const hashBuffer = await subtle.digest("SHA-256", bytes);
		return bytesToHex(new Uint8Array(hashBuffer));
	}
	const nodeCrypto = getNodeCrypto();
	if (!nodeCrypto) throw new Error("Node crypto is not available for SHA-256 hashing");
	const hash = nodeCrypto.createHash("sha256");
	hash.update(bytes);
	return hash.digest("hex");
}
function utf8Bytes(value) {
	return new TextEncoder().encode(value);
}
var PROTOCOL_SPEC = "concord-protocol@1.0";
var LEDGER_FORMAT$1 = "concord-ledger";
var LEDGER_VERSION$1 = "1.0";
var ConcordProtocolError = class extends Error {
	constructor(code, message) {
		super(message);
		__publicField$1(this, "code");
		this.name = "ConcordProtocolError";
		this.code = code;
	}
};
function hashCanonical(canonical) {
	return sha256Hex(utf8Bytes(canonical));
}
function getEntryCore(entry) {
	var _a;
	return {
		kind: entry.kind,
		timestamp: entry.timestamp,
		author: entry.author,
		payload: (_a = entry.payload) != null ? _a : null
	};
}
function getEntrySigningPayload(entry) {
	return canonicalStringify(getEntryCore(entry));
}
async function deriveEntryId(entry) {
	return hashCanonical(getEntrySigningPayload(entry));
}
function getCommitCore(commit) {
	var _a;
	return {
		parent: commit.parent,
		timestamp: commit.timestamp,
		metadata: (_a = commit.metadata) != null ? _a : null,
		entries: commit.entries
	};
}
function getCommitSigningPayload(commit) {
	return canonicalStringify(getCommitCore(commit));
}
async function deriveCommitId(commit) {
	return hashCanonical(getCommitSigningPayload(commit));
}
function getCommitChain(ledger) {
	var _a, _b;
	const chain = [];
	const visited = /* @__PURE__ */ new Set();
	if (!ledger.commits[ledger.head]) throw new ConcordProtocolError("MISSING_HEAD", `Missing head commit ${ledger.head}`);
	let current = (_a = ledger.head) != null ? _a : null;
	while (current !== null) {
		if (visited.has(current)) throw new ConcordProtocolError("COMMIT_CHAIN_CYCLE", `Commit chain cycle detected at ${current}`);
		visited.add(current);
		chain.push(current);
		const commit = ledger.commits[current];
		if (!commit) throw new ConcordProtocolError("MISSING_COMMIT", `Missing commit ${current}`);
		if (commit.parent === "") throw new ConcordProtocolError("INVALID_PARENT", "Commit parent must be null or a CommitID");
		current = (_b = commit.parent) != null ? _b : null;
	}
	return chain.reverse();
}
function validateEntry(entry) {
	const errors = [];
	if (!entry || typeof entry !== "object") {
		errors.push("Entry must be an object");
		return {
			ok: false,
			errors
		};
	}
	if (typeof entry.kind !== "string" || entry.kind.length === 0) errors.push("Entry.kind must be a non-empty string");
	if (typeof entry.timestamp !== "string" || entry.timestamp.length === 0) errors.push("Entry.timestamp must be a non-empty string");
	if (typeof entry.author !== "string" || entry.author.length === 0) errors.push("Entry.author must be a non-empty string");
	if (entry.signature !== void 0 && entry.signature !== null && typeof entry.signature !== "string") errors.push("Entry.signature must be a string or null");
	try {
		canonicalStringify(getEntryCore(entry));
	} catch (error) {
		errors.push(error instanceof Error ? error.message : "Entry payload is not valid JSON");
	}
	return {
		ok: errors.length === 0,
		errors
	};
}
function validateCommit(commit) {
	const errors = [];
	if (!commit || typeof commit !== "object") {
		errors.push("Commit must be an object");
		return {
			ok: false,
			errors
		};
	}
	if (commit.parent === "") errors.push("Commit.parent must be a non-empty string or null");
	else if (commit.parent !== null && typeof commit.parent !== "string") errors.push("Commit.parent must be a non-empty string or null");
	if (typeof commit.timestamp !== "string" || commit.timestamp.length === 0) errors.push("Commit.timestamp must be a non-empty string");
	if (!Array.isArray(commit.entries)) errors.push("Commit.entries must be an array");
	else if (commit.entries.some((entryId) => typeof entryId !== "string")) errors.push("Commit.entries must be an array of strings");
	if (commit.metadata !== void 0 && commit.metadata !== null && (typeof commit.metadata !== "object" || Array.isArray(commit.metadata))) errors.push("Commit.metadata must be an object or null");
	if (commit.signature !== void 0 && commit.signature !== null && typeof commit.signature !== "string") errors.push("Commit.signature must be a string or null");
	return {
		ok: errors.length === 0,
		errors
	};
}
function validateLedger(ledger, options) {
	var _a;
	const errors = [];
	const strictSpec = (_a = options == null ? void 0 : options.strictSpec) != null ? _a : true;
	if (!ledger || typeof ledger !== "object") {
		errors.push("Ledger must be an object");
		return {
			ok: false,
			errors
		};
	}
	if (ledger.format !== LEDGER_FORMAT$1) errors.push(`Ledger.format must be "${LEDGER_FORMAT$1}"`);
	if (ledger.version !== LEDGER_VERSION$1) errors.push(`Ledger.version must be "${LEDGER_VERSION$1}"`);
	if (!ledger.commits || typeof ledger.commits !== "object") errors.push("Ledger.commits must be an object");
	if (!ledger.entries || typeof ledger.entries !== "object") errors.push("Ledger.entries must be an object");
	if (typeof ledger.head !== "string") errors.push("Ledger.head must be a string");
	if (errors.length === 0) {
		if (!ledger.commits[ledger.head]) errors.push(`Ledger head ${ledger.head} does not exist in commits`);
		try {
			const chain = getCommitChain(ledger);
			if (chain.length === 0) errors.push("Ledger must include a head commit");
			else {
				const genesisId = chain[0];
				const genesis = ledger.commits[genesisId];
				if (!genesis) errors.push("Genesis commit is missing");
				else {
					if (genesis.parent !== null) errors.push("Genesis commit parent must be null");
					if (!Array.isArray(genesis.entries)) errors.push("Genesis commit entries must be an array");
					if (!genesis.metadata || typeof genesis.metadata !== "object" || Array.isArray(genesis.metadata)) errors.push("Genesis commit metadata must be an object");
					else {
						if (genesis.metadata.genesis !== true) errors.push("Genesis commit metadata.genesis must be true");
						if (!genesis.metadata.spec) errors.push("Genesis commit metadata.spec is required");
						else if (typeof genesis.metadata.spec !== "string") errors.push("Genesis commit metadata.spec must be a string");
						else if (strictSpec && genesis.metadata.spec !== PROTOCOL_SPEC) errors.push(`Genesis commit metadata.spec must be "${PROTOCOL_SPEC}"`);
					}
				}
			}
		} catch (error) {
			if (error instanceof ConcordProtocolError) errors.push(error.message);
			else errors.push("Ledger commit chain is invalid");
		}
		for (const [commitId, commit] of Object.entries(ledger.commits)) {
			const result = validateCommit(commit);
			if (!result.ok) errors.push(...result.errors.map((err) => `Commit ${commitId}: ${err}`));
			if (Array.isArray(commit.entries)) {
				for (const entryId of commit.entries) if (!ledger.entries[entryId]) errors.push(`Commit ${commitId} references missing entry ${entryId}`);
			}
		}
		for (const [entryId, entry] of Object.entries(ledger.entries)) {
			const result = validateEntry(entry);
			if (!result.ok) errors.push(...result.errors.map((err) => `Entry ${entryId}: ${err}`));
		}
	}
	return {
		ok: errors.length === 0,
		errors
	};
}
var LEDGER_FORMAT = "concord-ledger";
var LEDGER_VERSION = "1";
var LEDGER_SPEC = "@ternent/ledger@2";
var textEncoder = new TextEncoder();
var textDecoder = new TextDecoder();
var armourRuntimePromise = null;
var sealRuntimePromise = null;
var REPLAY_YIELD_INTERVAL$1 = 25;
async function loadArmourRuntime() {
	if (!armourRuntimePromise) armourRuntimePromise = import("./src-CnVHJWPM.js").then((module) => ({
		decryptWithIdentity: module.decryptWithIdentity,
		encryptForRecipients: module.encryptForRecipients,
		initArmour: module.initArmour
	}));
	return await armourRuntimePromise;
}
async function loadSealRuntime() {
	if (!sealRuntimePromise) sealRuntimePromise = import("./dist-DfRXKZUv.js").then((module) => ({
		createSealHash: module.createSealHash,
		createSealProof: module.createSealProof,
		verifySealProofAgainstBytes: module.verifySealProofAgainstBytes
	}));
	return await sealRuntimePromise;
}
async function yieldToHost$1() {
	if (typeof requestAnimationFrame === "function") {
		await new Promise((resolve) => {
			requestAnimationFrame(() => resolve());
		});
		return;
	}
	await new Promise((resolve) => {
		globalThis.setTimeout(resolve, 0);
	});
}
function cloneValue(value) {
	if (typeof structuredClone === "function") return structuredClone(value);
	return JSON.parse(JSON.stringify(value));
}
function normalizeMeta(value) {
	return value ?? null;
}
function normalizePayloadInput(value) {
	return value === void 0 ? null : value;
}
function isRecord$1(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function assertRecordOrNull(value, label) {
	if (value === null) return null;
	if (!isRecord$1(value)) throw new Error(`${label} must be an object or null.`);
	return value;
}
function base64UrlEncode(bytes) {
	return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function base64UrlDecode(value) {
	const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
	const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - normalized.length % 4);
	return new Uint8Array(Buffer.from(`${normalized}${pad}`, "base64"));
}
function toCiphertextBytes(payload) {
	return payload.encoding === "armor" ? textEncoder.encode(payload.data) : base64UrlDecode(payload.data);
}
function createShadowEntryCore(entry) {
	return {
		kind: entry.kind,
		timestamp: entry.authoredAt,
		author: entry.author,
		payload: {
			meta: entry.meta,
			payload: entry.payload
		},
		signature: null
	};
}
function createShadowEntry(entry) {
	return {
		...createShadowEntryCore(entry),
		signature: JSON.stringify(entry.seal)
	};
}
function buildUnsignedEntrySubject(entry) {
	return textEncoder.encode(getEntrySigningPayload(createShadowEntryCore(entry)));
}
function createShadowCommit(commit) {
	return {
		...createShadowCommitCore(commit),
		signature: JSON.stringify(commit.seal)
	};
}
function createShadowCommitCore(commit) {
	return {
		parent: commit.parentCommitId,
		timestamp: commit.committedAt,
		metadata: commit.metadata,
		entries: commit.entryIds,
		signature: null
	};
}
function createShadowContainer(container) {
	const commits = {};
	const entries = {};
	for (const [commitId, commit] of Object.entries(container.commits)) commits[commitId] = createShadowCommit(commit);
	for (const [entryId, entry] of Object.entries(container.entries)) entries[entryId] = createShadowEntry(entry);
	return {
		format: "concord-ledger",
		version: "1.0",
		commits,
		entries,
		head: container.head
	};
}
function validatePayloadShape(payload) {
	if (payload.type === "plain") return [];
	const errors = [];
	if (payload.scheme !== "age") errors.push("Encrypted payload scheme must be age.");
	if (payload.mode !== "recipients") errors.push("Encrypted payload mode must be recipients.");
	if (payload.encoding !== "armor" && payload.encoding !== "binary") errors.push("Encrypted payload encoding must be armor or binary.");
	if (typeof payload.data !== "string" || payload.data.length === 0) errors.push("Encrypted payload data must be a non-empty string.");
	if (typeof payload.payloadHash !== "string" || payload.payloadHash.length === 0) errors.push("Encrypted payload payloadHash must be a non-empty string.");
	return errors;
}
function validateEntryShape(entry) {
	const errors = [];
	if (typeof entry.entryId !== "string" || entry.entryId.length === 0) errors.push("Entry.entryId must be a non-empty string.");
	if (typeof entry.kind !== "string" || entry.kind.length === 0) errors.push("Entry.kind must be a non-empty string.");
	if (typeof entry.authoredAt !== "string" || entry.authoredAt.length === 0) errors.push("Entry.authoredAt must be a non-empty string.");
	if (typeof entry.author !== "string" || entry.author.length === 0) errors.push("Entry.author must be a non-empty string.");
	if (entry.meta !== null && !isRecord$1(entry.meta)) errors.push("Entry.meta must be an object or null.");
	errors.push(...validatePayloadShape(entry.payload));
	if (!isRecord$1(entry.seal)) errors.push("Entry.seal must be an object.");
	return errors;
}
function validateCommitShape(commit) {
	const errors = [];
	if (typeof commit.commitId !== "string" || commit.commitId.length === 0) errors.push("Commit.commitId must be a non-empty string.");
	if (commit.parentCommitId !== null && (typeof commit.parentCommitId !== "string" || commit.parentCommitId.length === 0)) errors.push("Commit.parentCommitId must be a non-empty string or null.");
	if (typeof commit.committedAt !== "string" || commit.committedAt.length === 0) errors.push("Commit.committedAt must be a non-empty string.");
	if (commit.metadata !== null && !isRecord$1(commit.metadata)) errors.push("Commit.metadata must be an object or null.");
	if (!Array.isArray(commit.entryIds)) errors.push("Commit.entryIds must be an array.");
	else if (commit.entryIds.some((entryId) => typeof entryId !== "string")) errors.push("Commit.entryIds must contain only strings.");
	if (!isRecord$1(commit.seal)) errors.push("Commit.seal must be an object.");
	return errors;
}
function validatePublicContainerShape(container) {
	const errors = [];
	if (container.format !== LEDGER_FORMAT) errors.push(`Ledger.format must be "${LEDGER_FORMAT}".`);
	if (container.version !== LEDGER_VERSION) errors.push(`Ledger.version must be "${LEDGER_VERSION}".`);
	if (!isRecord$1(container.commits)) errors.push("Ledger.commits must be an object.");
	if (!isRecord$1(container.entries)) errors.push("Ledger.entries must be an object.");
	if (typeof container.head !== "string" || container.head.length === 0) errors.push("Ledger.head must be a non-empty string.");
	if (errors.length > 0) return errors;
	for (const [commitId, commit] of Object.entries(container.commits)) {
		if (commit.commitId !== commitId) errors.push(`Commit key mismatch for ${commitId}.`);
		errors.push(...validateCommitShape(commit));
	}
	for (const [entryId, entry] of Object.entries(container.entries)) {
		if (entry.entryId !== entryId) errors.push(`Entry key mismatch for ${entryId}.`);
		errors.push(...validateEntryShape(entry));
	}
	if (!container.commits[container.head]) errors.push(`Ledger head ${container.head} does not exist in commits.`);
	return errors;
}
function createDefaultProtocolContract() {
	return {
		canonicalizePayload(value) {
			return canonicalStringify(normalizePayloadInput(value));
		},
		getEntrySubjectBytes(entry) {
			return buildUnsignedEntrySubject(entry);
		},
		getCommitSubjectBytes(commit) {
			return textEncoder.encode(getCommitSigningPayload(createShadowCommitCore(commit)));
		},
		async deriveEntryId(entry) {
			return deriveEntryId(createShadowEntry(entry));
		},
		async deriveCommitId(commit) {
			return deriveCommitId(createShadowCommitCore(commit));
		},
		getCommitChain(container) {
			return getCommitChain(createShadowContainer(container));
		},
		validateContainer(container) {
			const errors = validatePublicContainerShape(container);
			if (errors.length > 0) return {
				ok: false,
				errors
			};
			try {
				const shadowValidation = validateLedger(createShadowContainer(container), { strictSpec: false });
				return shadowValidation.ok ? {
					ok: true,
					errors: []
				} : {
					ok: false,
					errors: shadowValidation.errors
				};
			} catch (error) {
				return {
					ok: false,
					errors: [error instanceof Error ? error.message : "Invalid container."]
				};
			}
		}
	};
}
function createDefaultSealContract() {
	return {
		async createEntryProof(input) {
			const { createSealHash, createSealProof } = await loadSealRuntime();
			return await createSealProof({
				createdAt: input.entry.authoredAt,
				signer: input.signer,
				subject: {
					kind: "artifact",
					path: `ledger-entry:${input.entry.kind}:${input.entry.authoredAt}`,
					hash: await createSealHash(input.subjectBytes)
				}
			});
		},
		async verifyEntryProof(input) {
			const { verifySealProofAgainstBytes } = await loadSealRuntime();
			return (await verifySealProofAgainstBytes(input.proof, input.subjectBytes)).valid;
		},
		async createCommitProof(input) {
			const { createSealHash, createSealProof } = await loadSealRuntime();
			return await createSealProof({
				createdAt: input.commit.committedAt,
				signer: input.signer,
				subject: {
					kind: "artifact",
					path: `ledger-commit:${input.commitId}`,
					hash: await createSealHash(input.subjectBytes)
				}
			});
		},
		async verifyCommitProof(input) {
			const { verifySealProofAgainstBytes } = await loadSealRuntime();
			return (await verifySealProofAgainstBytes(input.proof, input.subjectBytes)).valid;
		}
	};
}
function createDefaultArmourContract() {
	return {
		async encrypt(input) {
			const { createSealHash } = await loadSealRuntime();
			const { encryptForRecipients, initArmour: initArmour$1 } = await loadArmourRuntime();
			await initArmour$1();
			const ciphertext = await encryptForRecipients({
				recipients: input.recipients,
				data: input.data,
				output: input.encoding
			});
			return {
				data: input.encoding === "armor" ? textDecoder.decode(ciphertext) : base64UrlEncode(ciphertext),
				payloadHash: await createSealHash(ciphertext)
			};
		},
		async decrypt(input) {
			const { decryptWithIdentity, initArmour: initArmour$1 } = await loadArmourRuntime();
			await initArmour$1();
			const plaintext = await decryptWithIdentity({
				identity: input.decryptor.identity,
				data: toCiphertextBytes(input.payload)
			});
			return JSON.parse(textDecoder.decode(plaintext));
		}
	};
}
function createEmptyProjection(value) {
	return cloneValue(value);
}
function createInitialState$1(initialProjection) {
	return {
		container: null,
		staged: [],
		projection: createEmptyProjection(initialProjection),
		verification: null
	};
}
function sortStrings(values) {
	return Array.from(values).sort((left, right) => left.localeCompare(right));
}
function mergeReplayOptions(defaults, options, hasDecryptor) {
	const verify = options?.verify ?? defaults?.verify ?? true;
	const decrypt = options?.decrypt ?? defaults?.decrypt ?? true;
	return {
		fromEntryId: options?.fromEntryId ?? "",
		toEntryId: options?.toEntryId ?? "",
		verify,
		decrypt: decrypt && hasDecryptor
	};
}
function assertAppendInput(input) {
	if (typeof input.kind !== "string" || input.kind.length === 0) throw new Error("append input kind is required.");
	if (input.meta !== void 0) assertRecordOrNull(input.meta, "append input meta");
	if (input.protection?.type === "recipients") {
		if (!Array.isArray(input.protection.recipients)) throw new Error("append protection recipients must be an array.");
		if (input.protection.recipients.length === 0) throw new Error("append protection recipients must not be empty.");
	}
}
function assertContainerInput(container) {
	const errors = validatePublicContainerShape(container);
	if (errors.length > 0) throw new Error(errors.join("; "));
}
function getCommittedEntriesInOrder(container, protocol) {
	const ordered = [];
	for (const commitId of protocol.getCommitChain(container)) {
		const commit = container.commits[commitId];
		if (!commit) continue;
		for (const entryId of commit.entryIds) {
			const entry = container.entries[entryId];
			if (entry) ordered.push(entry);
		}
	}
	return ordered;
}
function getProjectionSlice(entries, fromEntryId, toEntryId) {
	const startIndex = fromEntryId ? entries.findIndex((entry) => entry.entryId === fromEntryId) : 0;
	const endIndex = toEntryId ? entries.findIndex((entry) => entry.entryId === toEntryId) : entries.length - 1;
	if (startIndex < 0) throw new Error(`from entry not found: ${fromEntryId}`);
	if (toEntryId && endIndex < 0) throw new Error(`to entry not found: ${toEntryId}`);
	if (entries.length === 0) return [];
	return entries.slice(startIndex, endIndex + 1);
}
async function toReplayEntry(entry, decrypt, identity, armour) {
	if (entry.payload.type === "plain") return {
		entryId: entry.entryId,
		kind: entry.kind,
		author: entry.author,
		authoredAt: entry.authoredAt,
		meta: entry.meta,
		payload: {
			type: "plain",
			data: cloneValue(entry.payload.data)
		},
		verified: true
	};
	if (decrypt && identity.decryptor) try {
		return {
			entryId: entry.entryId,
			kind: entry.kind,
			author: entry.author,
			authoredAt: entry.authoredAt,
			meta: entry.meta,
			payload: {
				type: "decrypted",
				original: "encrypted",
				data: await armour.decrypt({
					payload: entry.payload,
					decryptor: identity.decryptor
				})
			},
			verified: true,
			decrypted: true
		};
	} catch {}
	return {
		entryId: entry.entryId,
		kind: entry.kind,
		author: entry.author,
		authoredAt: entry.authoredAt,
		meta: entry.meta,
		payload: {
			type: "encrypted",
			scheme: entry.payload.scheme,
			mode: entry.payload.mode,
			encoding: entry.payload.encoding,
			data: entry.payload.data
		},
		verified: true,
		decrypted: false
	};
}
function createGenesisCommitDraft(timestamp, metadata) {
	return {
		parentCommitId: null,
		committedAt: timestamp,
		metadata: {
			genesis: true,
			spec: LEDGER_SPEC,
			...metadata ?? {}
		},
		entryIds: []
	};
}
async function createLedger(config) {
	const now = config.now ?? (() => (/* @__PURE__ */ new Date()).toISOString());
	const protocol = config.protocol ?? createDefaultProtocolContract();
	const seal = config.seal ?? createDefaultSealContract();
	const armour = config.armour ?? createDefaultArmourContract();
	const replayPolicy = config.replayPolicy;
	const state = createInitialState$1(config.initialProjection);
	const listeners = /* @__PURE__ */ new Set();
	let committedEntriesCache = null;
	let committedVerificationCache = /* @__PURE__ */ new Map();
	function notify() {
		for (const listener of listeners) listener(state);
	}
	function invalidateCommittedCaches() {
		committedEntriesCache = null;
		committedVerificationCache.clear();
	}
	function getCommittedHeadCommitId(container = state.container) {
		return container?.head ?? null;
	}
	function getVerificationCacheKey(headCommitId, options) {
		return `${headCommitId ?? "none"}::proofs:${options?.includeProofs !== false ? "1" : "0"}::hashes:${options?.includePayloadHashes !== false ? "1" : "0"}`;
	}
	async function getCommittedEntriesInOrderCached() {
		const headCommitId = getCommittedHeadCommitId();
		if (!state.container || !headCommitId) {
			committedEntriesCache = {
				headCommitId: null,
				entries: []
			};
			return [];
		}
		if (committedEntriesCache?.headCommitId === headCommitId) return committedEntriesCache.entries;
		const entries = getCommittedEntriesInOrder(state.container, protocol);
		committedEntriesCache = {
			headCommitId,
			entries
		};
		return entries;
	}
	async function verifyCommittedSnapshotCached(options) {
		const cacheKey = getVerificationCacheKey(getCommittedHeadCommitId(), options);
		const cached = committedVerificationCache.get(cacheKey);
		if (cached) return cached;
		const verification = await verifySnapshot(state.container, [], options);
		committedVerificationCache.set(cacheKey, verification);
		return verification;
	}
	async function persist() {
		if (!config.storage) return;
		const snapshot = {
			container: state.container ? cloneValue(state.container) : null,
			staged: cloneValue(state.staged)
		};
		await config.storage.save(snapshot);
	}
	async function buildCommitRecord(unsignedCommit) {
		const subjectBytes = protocol.getCommitSubjectBytes(unsignedCommit);
		const commitId = await protocol.deriveCommitId(unsignedCommit);
		const sealProof = await seal.createCommitProof({
			commit: unsignedCommit,
			commitId,
			subjectBytes,
			signer: config.identity.signer
		});
		return {
			...unsignedCommit,
			commitId,
			seal: sealProof
		};
	}
	async function verifySnapshot(container, staged, options) {
		if (!container) return {
			valid: true,
			committedHistoryValid: true,
			commitChainValid: true,
			commitProofsValid: true,
			entriesValid: true,
			entryProofsValid: true,
			payloadHashesValid: true,
			proofsValid: true,
			invalidCommitIds: [],
			invalidEntryIds: []
		};
		const invalidCommitIds = /* @__PURE__ */ new Set();
		const invalidEntryIds = /* @__PURE__ */ new Set();
		let commitChainValid = true;
		let commitProofsValid = true;
		let entriesValid = true;
		let entryProofsValid = true;
		let payloadHashesValid = true;
		let proofsValid = true;
		let committedEntriesValid = true;
		let committedEntryProofsValid = true;
		let committedPayloadHashesValid = true;
		const containerValidation = protocol.validateContainer(container);
		if (!containerValidation.ok) commitChainValid = false;
		const reachableCommitIds = /* @__PURE__ */ new Set();
		const reachableEntryIds = /* @__PURE__ */ new Set();
		for (const [commitId, commit2] of Object.entries(container.commits)) {
			try {
				if (await protocol.deriveCommitId({
					parentCommitId: commit2.parentCommitId,
					committedAt: commit2.committedAt,
					metadata: commit2.metadata,
					entryIds: commit2.entryIds
				}) !== commitId) {
					invalidCommitIds.add(commitId);
					commitChainValid = false;
				}
			} catch {
				invalidCommitIds.add(commitId);
				commitChainValid = false;
			}
			if (commit2.parentCommitId !== null && !container.commits[commit2.parentCommitId]) {
				invalidCommitIds.add(commitId);
				commitChainValid = false;
			}
			if (options?.includeProofs !== false) try {
				if (!await seal.verifyCommitProof({
					commit: commit2,
					subjectBytes: protocol.getCommitSubjectBytes({
						parentCommitId: commit2.parentCommitId,
						committedAt: commit2.committedAt,
						metadata: commit2.metadata,
						entryIds: commit2.entryIds
					}),
					proof: commit2.seal
				})) {
					invalidCommitIds.add(commitId);
					commitProofsValid = false;
					proofsValid = false;
				}
			} catch {
				invalidCommitIds.add(commitId);
				commitProofsValid = false;
				proofsValid = false;
			}
			for (const entryId of commit2.entryIds) if (!container.entries[entryId]) {
				invalidEntryIds.add(entryId);
				entriesValid = false;
			}
		}
		try {
			const chain = protocol.getCommitChain(container);
			for (const commitId of chain) {
				reachableCommitIds.add(commitId);
				for (const entryId of container.commits[commitId]?.entryIds ?? []) reachableEntryIds.add(entryId);
			}
		} catch {
			invalidCommitIds.add(container.head);
			commitChainValid = false;
			committedEntriesValid = false;
			committedEntryProofsValid = false;
			committedPayloadHashesValid = false;
		}
		const entriesToVerify = [...Object.entries(container.entries).map(([recordKey, entry]) => ({
			recordKey,
			entry
		})), ...staged.map((entry) => ({
			recordKey: null,
			entry
		}))];
		for (const { recordKey, entry } of entriesToVerify) {
			const isReachableCommittedEntry = recordKey !== null && reachableEntryIds.has(recordKey) || reachableEntryIds.has(entry.entryId);
			try {
				if (await protocol.deriveEntryId(entry) !== entry.entryId) {
					invalidEntryIds.add(entry.entryId);
					entriesValid = false;
					if (isReachableCommittedEntry) committedEntriesValid = false;
				}
			} catch {
				invalidEntryIds.add(entry.entryId);
				entriesValid = false;
				if (isReachableCommittedEntry) committedEntriesValid = false;
			}
			const subjectBytes = buildUnsignedEntrySubject({
				kind: entry.kind,
				authoredAt: entry.authoredAt,
				author: entry.author,
				meta: entry.meta,
				payload: entry.payload
			});
			if (options?.includeProofs !== false) try {
				if (!await seal.verifyEntryProof({
					entry,
					subjectBytes,
					proof: entry.seal
				})) {
					invalidEntryIds.add(entry.entryId);
					entriesValid = false;
					entryProofsValid = false;
					proofsValid = false;
					if (isReachableCommittedEntry) {
						committedEntriesValid = false;
						committedEntryProofsValid = false;
					}
				}
			} catch {
				invalidEntryIds.add(entry.entryId);
				entriesValid = false;
				entryProofsValid = false;
				proofsValid = false;
				if (isReachableCommittedEntry) {
					committedEntriesValid = false;
					committedEntryProofsValid = false;
				}
			}
			if (entry.payload.type === "encrypted" && options?.includePayloadHashes !== false) try {
				const { createSealHash } = await loadSealRuntime();
				if (await createSealHash(toCiphertextBytes(entry.payload)) !== entry.payload.payloadHash) {
					invalidEntryIds.add(entry.entryId);
					entriesValid = false;
					payloadHashesValid = false;
					if (isReachableCommittedEntry) {
						committedEntriesValid = false;
						committedPayloadHashesValid = false;
					}
				}
			} catch {
				invalidEntryIds.add(entry.entryId);
				entriesValid = false;
				payloadHashesValid = false;
				if (isReachableCommittedEntry) {
					committedEntriesValid = false;
					committedPayloadHashesValid = false;
				}
			}
		}
		for (const entryId of reachableEntryIds) if (!container.entries[entryId]) {
			committedEntriesValid = false;
			committedEntryProofsValid = false;
			committedPayloadHashesValid = false;
		}
		const committedHistoryValid = commitChainValid && commitProofsValid && committedEntriesValid && committedEntryProofsValid && committedPayloadHashesValid && containerValidation.ok;
		return {
			valid: committedHistoryValid,
			committedHistoryValid,
			commitChainValid,
			commitProofsValid,
			entriesValid,
			entryProofsValid,
			payloadHashesValid,
			proofsValid,
			invalidCommitIds: sortStrings(invalidCommitIds),
			invalidEntryIds: sortStrings(invalidEntryIds)
		};
	}
	async function verifyCurrent(options) {
		if (state.staged.length === 0) return await verifyCommittedSnapshotCached(options);
		return verifySnapshot(state.container, state.staged, options);
	}
	async function rebuildProjection(options) {
		const merged = mergeReplayOptions(replayPolicy, options, !!config.identity.decryptor);
		if (merged.verify) {
			const verification = await verifyCurrent();
			state.verification = {
				valid: verification.valid,
				checkedAt: now()
			};
			notify();
			if (!verification.valid) throw new Error("Ledger verification failed.");
		}
		let orderedCommitted = [];
		if (state.container) try {
			orderedCommitted = await getCommittedEntriesInOrderCached();
		} catch (error) {
			if (merged.verify) throw error;
		}
		const slice = getProjectionSlice([...orderedCommitted, ...state.staged], merged.fromEntryId, merged.toEntryId);
		let projection = createEmptyProjection(config.initialProjection);
		for (let index = 0; index < slice.length; index += 1) {
			const entry = slice[index];
			projection = config.projector(projection, await toReplayEntry(entry, merged.decrypt, config.identity, armour));
			if ((index + 1) % REPLAY_YIELD_INTERVAL$1 === 0) await yieldToHost$1();
		}
		state.projection = projection;
		notify();
		return projection;
	}
	async function buildEntryRecord(input) {
		assertAppendInput(input);
		protocol.canonicalizePayload(input.payload);
		const payloadValue = normalizePayloadInput(input.payload);
		const meta = normalizeMeta(input.meta);
		const authoredAt = now();
		const author = await config.identity.authorResolver();
		const payload = input.protection?.type === "recipients" ? {
			type: "encrypted",
			scheme: "age",
			mode: "recipients",
			encoding: input.protection.encoding ?? "armor",
			...await armour.encrypt({
				recipients: config.identity.recipientResolver ? await config.identity.recipientResolver(input.protection.recipients) : input.protection.recipients,
				data: textEncoder.encode(protocol.canonicalizePayload(payloadValue)),
				encoding: input.protection.encoding ?? "armor"
			})
		} : {
			type: "plain",
			data: cloneValue(payloadValue)
		};
		const unsignedEntry = {
			kind: input.kind,
			authoredAt,
			author,
			meta,
			payload
		};
		const subjectBytes = buildUnsignedEntrySubject(unsignedEntry);
		const sealProof = await seal.createEntryProof({
			entry: unsignedEntry,
			subjectBytes,
			signer: config.identity.signer
		});
		const draft = {
			entryId: "",
			...unsignedEntry,
			seal: sealProof
		};
		return {
			...draft,
			entryId: await protocol.deriveEntryId(draft)
		};
	}
	function assertContainerExists() {
		if (!state.container) throw new Error("Ledger has not been created or loaded.");
		return state.container;
	}
	async function stageEntries(inputs) {
		const container = assertContainerExists();
		const existingIds = /* @__PURE__ */ new Set([...Object.keys(container.entries), ...state.staged.map((entry) => entry.entryId)]);
		const entries = [];
		for (const input of inputs) {
			const entry = await buildEntryRecord(input);
			if (existingIds.has(entry.entryId)) throw new Error(`Entry ${entry.entryId} already exists.`);
			existingIds.add(entry.entryId);
			entries.push(entry);
		}
		const baseCount = state.staged.length;
		state.staged = [...state.staged, ...entries];
		const results = entries.map((entry, index) => ({
			entry,
			stagedCount: baseCount + index + 1
		}));
		if (config.autoCommit && entries.length > 0) {
			await commit();
			return results;
		}
		await rebuildProjection();
		await persist();
		return results;
	}
	async function create(params) {
		const genesis = await buildCommitRecord(createGenesisCommitDraft(now(), normalizeMeta(params?.metadata)));
		state.container = {
			format: LEDGER_FORMAT,
			version: LEDGER_VERSION,
			commits: { [genesis.commitId]: genesis },
			entries: {},
			head: genesis.commitId
		};
		state.staged = [];
		state.verification = null;
		invalidateCommittedCaches();
		await rebuildProjection();
		await persist();
	}
	async function load(container) {
		assertContainerInput(container);
		state.container = cloneValue(container);
		state.staged = [];
		state.verification = null;
		invalidateCommittedCaches();
		await rebuildProjection();
		await persist();
	}
	async function loadFromStorage() {
		if (!config.storage) return false;
		const snapshot = await config.storage.load();
		if (!snapshot) return false;
		if (snapshot.container) assertContainerInput(snapshot.container);
		for (const stagedEntry of snapshot.staged) {
			const errors = validateEntryShape(stagedEntry);
			if (errors.length > 0) throw new Error(errors.join("; "));
		}
		state.container = snapshot.container ? cloneValue(snapshot.container) : null;
		state.staged = cloneValue(snapshot.staged);
		state.verification = null;
		invalidateCommittedCaches();
		await rebuildProjection();
		return true;
	}
	async function append(input) {
		const [result] = await stageEntries([input]);
		return result;
	}
	async function appendMany(inputs) {
		if (inputs.length === 0) return [];
		return stageEntries(inputs);
	}
	async function commit(input) {
		const container = assertContainerExists();
		if (state.staged.length === 0) throw new Error("No staged entries to commit.");
		const staged = cloneValue(state.staged);
		const entries = { ...container.entries };
		for (const entry of staged) entries[entry.entryId] = entry;
		const commitRecord = await buildCommitRecord({
			parentCommitId: container.head,
			committedAt: now(),
			metadata: normalizeMeta(input?.metadata),
			entryIds: staged.map((entry) => entry.entryId)
		});
		state.container = {
			format: container.format,
			version: container.version,
			commits: {
				...container.commits,
				[commitRecord.commitId]: commitRecord
			},
			entries,
			head: commitRecord.commitId
		};
		state.staged = [];
		invalidateCommittedCaches();
		await rebuildProjection();
		await persist();
		return {
			commit: cloneValue(commitRecord),
			committedEntries: staged,
			committedEntryIds: staged.map((entry) => entry.entryId)
		};
	}
	async function replay(options) {
		return rebuildProjection(options);
	}
	async function recompute() {
		return rebuildProjection();
	}
	async function verify(options) {
		return verifyCurrent(options);
	}
	async function exportContainer() {
		return cloneValue(assertContainerExists());
	}
	async function importContainer(container) {
		await load(container);
	}
	function getState() {
		return state;
	}
	function subscribe(listener) {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}
	async function clearStaged() {
		state.staged = [];
		await rebuildProjection();
		await persist();
	}
	async function destroy() {
		state.container = null;
		state.staged = [];
		state.projection = createEmptyProjection(config.initialProjection);
		state.verification = null;
		invalidateCommittedCaches();
		notify();
	}
	return {
		create,
		load,
		loadFromStorage,
		append,
		appendMany,
		commit,
		replay,
		recompute,
		verify,
		export: exportContainer,
		import: importContainer,
		getState,
		subscribe,
		clearStaged,
		destroy
	};
}
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField = (obj, key, value) => {
	__defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
	return value;
};
var ConcordBoundaryError = class extends Error {
	constructor(code, message) {
		super(message);
		__publicField(this, "code");
		this.name = "ConcordBoundaryError";
		this.code = code;
	}
};
function createDefaultNow() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function isObject(value) {
	return typeof value === "object" && value !== null;
}
function isLedgerReplayEntry(value) {
	if (!isObject(value)) return false;
	if (typeof value.entryId !== "string" || typeof value.kind !== "string" || typeof value.author !== "string" || typeof value.authoredAt !== "string") return false;
	if (!(value.meta === null || isObject(value.meta))) return false;
	if (!isObject(value.payload) || typeof value.payload.type !== "string") return false;
	return value.payload.type === "plain" || value.payload.type === "encrypted" || value.payload.type === "decrypted";
}
function assertReplayEntries(value) {
	if (Array.isArray(value) && value.every(isLedgerReplayEntry)) return value;
	throw new ConcordBoundaryError("INVALID_LEDGER_PROJECTION", "Concord requires ledger replay output to be LedgerReplayEntry[].");
}
function createInitialReplayState(plugins) {
	return Object.fromEntries(plugins.map((plugin) => [plugin.id, plugin.initialState?.()]));
}
function assertKnownPlugin(pluginsById, pluginId) {
	if (!pluginsById.has(pluginId)) throw new ConcordBoundaryError("UNKNOWN_PLUGIN", `Unknown Concord plugin: ${pluginId}`);
}
function normalizeAppendInputs(value) {
	const inputs = Array.isArray(value) ? value : [value];
	if (inputs.length === 0) throw new ConcordBoundaryError("COMMAND_PRODUCED_NO_ENTRIES", "Concord command handlers must return at least one LedgerAppendInput.");
	return inputs;
}
function hasInteractiveIdentity(identity) {
	return Boolean(identity);
}
function requireInteractiveIdentity(identity) {
	if (!hasInteractiveIdentity(identity)) throw new ConcordBoundaryError("READ_ONLY_RUNTIME", "Concord requires an identity for create, command, commit, and other signed mutations.");
	return identity;
}
function resolveAuthorFromIdentity(identity) {
	if (!identity.keyId || typeof identity.keyId !== "string") throw new ConcordBoundaryError("INVALID_IDENTITY", "Concord identity is missing a valid keyId.");
	return `did:key:${identity.keyId}`;
}
function resolveSignerFromIdentity(identity) {
	return { identity };
}
function resolveDecryptorFromIdentity(identity) {
	return { identity };
}
function resolveReadOnlyLedgerIdentity() {
	return {
		signer: { identity: { keyId: "readonly" } },
		authorResolver() {
			throw new ConcordBoundaryError("READ_ONLY_RUNTIME", "Concord cannot derive an author without an interactive identity.");
		}
	};
}
function resolveLedgerIdentity(identity) {
	if (!identity) return resolveReadOnlyLedgerIdentity();
	return {
		signer: resolveSignerFromIdentity(identity),
		authorResolver: () => resolveAuthorFromIdentity(identity),
		decryptor: resolveDecryptorFromIdentity(identity)
	};
}
function createReplayRange(options) {
	return {
		fromEntryId: options?.fromEntryId,
		toEntryId: options?.toEntryId,
		isPartial: Boolean(options?.fromEntryId || options?.toEntryId)
	};
}
function createReplayMetadata(range) {
	return {
		phase: "reset",
		entryCount: 0,
		fromEntryId: range.fromEntryId,
		toEntryId: range.toEntryId,
		isPartial: range.isPartial
	};
}
var REPLAY_YIELD_INTERVAL = 25;
async function yieldToHost() {
	if (typeof requestAnimationFrame === "function") {
		await new Promise((resolve) => {
			requestAnimationFrame(() => resolve());
		});
		return;
	}
	await new Promise((resolve) => {
		globalThis.setTimeout(resolve, 0);
	});
}
async function createConcordApp(input) {
	if (hasInteractiveIdentity(input.identity)) resolveAuthorFromIdentity(input.identity);
	const appIdentity = input.identity;
	const plugins = [...input.plugins];
	const now = input.now ?? createDefaultNow;
	const policy = { autoCommit: input.policy?.autoCommit ?? false };
	const pluginsById = /* @__PURE__ */ new Map();
	const commands = /* @__PURE__ */ new Map();
	for (const plugin of plugins) {
		if (pluginsById.has(plugin.id)) throw new ConcordBoundaryError("DUPLICATE_PLUGIN_ID", `Duplicate Concord plugin id: ${plugin.id}`);
		pluginsById.set(plugin.id, plugin);
		for (const [commandType, handler] of Object.entries(plugin.commands ?? {})) {
			if (commands.has(commandType)) throw new ConcordBoundaryError("DUPLICATE_COMMAND_TYPE", `Duplicate Concord command type: ${commandType}`);
			commands.set(commandType, {
				plugin,
				handler
			});
		}
	}
	const ledger = input.ledger ?? await createLedger({
		identity: resolveLedgerIdentity(appIdentity),
		initialProjection: [],
		projector: (entries, entry) => [...entries, entry],
		storage: input.storage,
		now,
		protocol: input.protocol,
		seal: input.seal,
		armour: input.armour,
		autoCommit: false,
		replayPolicy: {
			verify: false,
			decrypt: true
		}
	});
	let state = {
		ready: false,
		integrityValid: false,
		stagedCount: 0,
		replay: createInitialReplayState(plugins),
		verification: null
	};
	const listeners = /* @__PURE__ */ new Set();
	let committedVerificationCache = null;
	let replayEntriesCache = null;
	function getReplayState(pluginId, source = state) {
		assertKnownPlugin(pluginsById, pluginId);
		return source.replay[pluginId];
	}
	function publish(nextState) {
		state = nextState;
		for (const listener of listeners) listener(state);
	}
	function getCommittedHeadCommitId() {
		return ledger.getState().container?.head ?? null;
	}
	function getReplayFingerprint() {
		const ledgerState = ledger.getState();
		return `${ledgerState.container?.head ?? "none"}::${ledgerState.staged.map((entry) => entry.entryId).join("|")}`;
	}
	async function getReplayEntries(options) {
		if (options?.fromEntryId || options?.toEntryId) return await ledger.replay(options);
		const fingerprint = getReplayFingerprint();
		if (replayEntriesCache?.fingerprint === fingerprint) return replayEntriesCache.replayEntries;
		const replayEntries = await ledger.replay();
		replayEntriesCache = {
			fingerprint,
			replayEntries
		};
		return replayEntries;
	}
	function createReplayDraft(options, range) {
		const nextState = {
			ready: options.ready,
			integrityValid: options.integrityValid,
			stagedCount: ledger.getState().staged.length,
			replay: createInitialReplayState(plugins),
			verification: options.verification
		};
		const contexts = /* @__PURE__ */ new Map();
		for (const plugin of plugins) {
			const metadata = createReplayMetadata(range);
			const context = {
				pluginId: plugin.id,
				decryptAvailable: hasInteractiveIdentity(appIdentity),
				replay: metadata,
				getState() {
					return nextState.replay[plugin.id];
				},
				setState(next) {
					const prev = nextState.replay[plugin.id];
					nextState.replay[plugin.id] = typeof next === "function" ? next(prev) : next;
				}
			};
			contexts.set(plugin.id, context);
		}
		return {
			nextState,
			contexts
		};
	}
	async function rebuildFromReplayEntries(replayEntries, options, range = createReplayRange()) {
		const entries = assertReplayEntries(replayEntries);
		const { nextState, contexts } = createReplayDraft(options, range);
		for (const plugin of plugins) {
			const context = contexts.get(plugin.id);
			context.replay.phase = "reset";
			context.replay.entryIndex = void 0;
			context.replay.entryCount = entries.length;
			await plugin.reset?.(context);
		}
		for (const plugin of plugins) {
			const context = contexts.get(plugin.id);
			context.replay.phase = "beginReplay";
			context.replay.entryIndex = void 0;
			context.replay.entryCount = entries.length;
			await plugin.beginReplay?.(context);
		}
		for (let index = 0; index < entries.length; index += 1) {
			const entry = entries[index];
			for (const plugin of plugins) {
				const context = contexts.get(plugin.id);
				context.replay.phase = "applyEntry";
				context.replay.entryIndex = index;
				context.replay.entryCount = entries.length;
				await plugin.applyEntry?.(entry, context);
			}
			if ((index + 1) % REPLAY_YIELD_INTERVAL === 0) await yieldToHost();
		}
		for (const plugin of plugins) {
			const context = contexts.get(plugin.id);
			context.replay.phase = "endReplay";
			context.replay.entryIndex = void 0;
			context.replay.entryCount = entries.length;
			await plugin.endReplay?.(context);
		}
		publish(nextState);
	}
	function requireReady() {
		if (!state.ready) throw new ConcordBoundaryError("APP_NOT_READY", "Concord app must be loaded or created before commands can run.");
	}
	function createCommandContext() {
		return {
			now,
			identity: requireInteractiveIdentity(appIdentity),
			getReplayState(pluginId) {
				return getReplayState(pluginId);
			}
		};
	}
	function publishIntegrityFailure(verification, resetReplay) {
		publish({
			ready: false,
			integrityValid: false,
			stagedCount: ledger.getState().staged.length,
			replay: resetReplay ? createInitialReplayState(plugins) : state.replay,
			verification
		});
	}
	async function ensureCommittedHistoryUsable(options) {
		const currentHeadCommitId = getCommittedHeadCommitId();
		const verification = committedVerificationCache?.headCommitId === currentHeadCommitId ? committedVerificationCache.verification : await ledger.verify();
		if (committedVerificationCache?.headCommitId !== currentHeadCommitId) committedVerificationCache = {
			headCommitId: currentHeadCommitId,
			verification
		};
		if (verification.committedHistoryValid) return true;
		publishIntegrityFailure(verification, options?.resetReplayOnFailure ?? true);
		if (options?.allowInspectionOnly) return false;
		throw new ConcordBoundaryError("INVALID_COMMITTED_HISTORY", "Concord cannot project runtime state from invalid committed history.");
	}
	async function replay(options) {
		if (!await ensureCommittedHistoryUsable()) return;
		await rebuildFromReplayEntries(await getReplayEntries(options), {
			ready: state.ready,
			integrityValid: true,
			verification: state.verification
		}, createReplayRange(options));
	}
	async function create(params) {
		requireInteractiveIdentity(appIdentity);
		await ledger.create(params);
		if (!await ensureCommittedHistoryUsable()) return;
		await rebuildFromReplayEntries(await getReplayEntries(), {
			ready: true,
			integrityValid: true,
			verification: null
		});
	}
	async function load() {
		if (!await ledger.loadFromStorage()) {
			requireInteractiveIdentity(appIdentity);
			await ledger.create();
		}
		if (!await ensureCommittedHistoryUsable({
			allowInspectionOnly: true,
			resetReplayOnFailure: true
		})) return;
		await rebuildFromReplayEntries(await getReplayEntries(), {
			ready: true,
			integrityValid: true,
			verification: null
		});
	}
	async function command(type, inputValue) {
		requireReady();
		requireInteractiveIdentity(appIdentity);
		const registration = commands.get(type);
		if (!registration) throw new ConcordBoundaryError("UNKNOWN_COMMAND", `Unknown Concord command type: ${type}`);
		const appendInputs = normalizeAppendInputs(await registration.handler(createCommandContext(), inputValue));
		const appendResults = await ledger.appendMany(appendInputs);
		let commitResult;
		if (policy.autoCommit) commitResult = await ledger.commit();
		if (!await ensureCommittedHistoryUsable()) return {
			commitId: commitResult?.commit.commitId,
			entryIds: appendResults.map((result) => result.entry.entryId),
			stagedCount: ledger.getState().staged.length
		};
		await rebuildFromReplayEntries(await getReplayEntries(), {
			ready: true,
			integrityValid: true,
			verification: null
		});
		return {
			commitId: commitResult?.commit.commitId,
			entryIds: appendResults.map((result) => result.entry.entryId),
			stagedCount: state.stagedCount
		};
	}
	async function commit(input2) {
		requireReady();
		requireInteractiveIdentity(appIdentity);
		const result = await ledger.commit(input2);
		if (!await ensureCommittedHistoryUsable()) return {
			commitId: result.commit.commitId,
			entryIds: result.committedEntryIds
		};
		await rebuildFromReplayEntries(await getReplayEntries(), {
			ready: true,
			integrityValid: true,
			verification: null
		});
		return {
			commitId: result.commit.commitId,
			entryIds: result.committedEntryIds
		};
	}
	async function clearStaged() {
		requireReady();
		requireInteractiveIdentity(appIdentity);
		await ledger.clearStaged();
		if (!await ensureCommittedHistoryUsable()) return;
		await rebuildFromReplayEntries(await getReplayEntries(), {
			ready: true,
			integrityValid: true,
			verification: null
		});
	}
	async function recompute() {
		if (!await ensureCommittedHistoryUsable()) return;
		await rebuildFromReplayEntries(await ledger.recompute(), {
			ready: state.ready,
			integrityValid: true,
			verification: state.verification
		});
	}
	async function verify() {
		const verification = await ledger.verify();
		committedVerificationCache = {
			headCommitId: getCommittedHeadCommitId(),
			verification
		};
		publish({
			ready: state.ready && verification.committedHistoryValid,
			integrityValid: verification.committedHistoryValid,
			stagedCount: state.stagedCount,
			replay: state.replay,
			verification
		});
		return verification;
	}
	async function exportLedger() {
		return ledger.export();
	}
	async function importLedger(container) {
		await ledger.import(container);
		if (!await ensureCommittedHistoryUsable({
			allowInspectionOnly: true,
			resetReplayOnFailure: true
		})) return;
		await rebuildFromReplayEntries(await getReplayEntries(), {
			ready: true,
			integrityValid: true,
			verification: null
		});
	}
	function subscribe(listener) {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}
	async function destroy() {
		for (const plugin of plugins) await plugin.destroy?.();
		await ledger.destroy();
		committedVerificationCache = null;
		replayEntriesCache = null;
		publish({
			ready: false,
			integrityValid: false,
			stagedCount: 0,
			replay: createInitialReplayState(plugins),
			verification: null
		});
		listeners.clear();
	}
	return {
		create,
		load,
		command,
		commit,
		clearStaged,
		replay,
		recompute,
		verify,
		exportLedger,
		importLedger,
		getState() {
			return state;
		},
		getReplayState(pluginId) {
			return getReplayState(pluginId);
		},
		subscribe,
		destroy
	};
}
function createSelectorRegistry(plugins) {
	const registry = /* @__PURE__ */ new Map();
	for (const plugin of plugins) {
		const pluginRegistry = /* @__PURE__ */ new Map();
		for (const [selectorId, selector] of Object.entries(plugin.selectors ?? {})) pluginRegistry.set(selectorId, selector);
		registry.set(plugin.plugin.id, pluginRegistry);
	}
	return registry;
}
function requireSelector$1(selectors, pluginId, selectorId) {
	const pluginSelectors = selectors.get(pluginId);
	if (!pluginSelectors) throw new Error(`Unknown plugin id '${pluginId}'.`);
	const selector = pluginSelectors.get(selectorId);
	if (!selector) throw new Error(`Unknown selector '${selectorId}' for plugin '${pluginId}'.`);
	return selector;
}
async function createApp(input) {
	const selectors = createSelectorRegistry(input.plugins);
	const concord = await createConcordApp({
		identity: input.identity,
		storage: input.storage,
		plugins: input.plugins.map((plugin) => plugin.plugin)
	});
	return {
		concord,
		load() {
			return concord.load();
		},
		command(type, payload) {
			return concord.command(type, payload);
		},
		commit(inputValue) {
			return concord.commit(inputValue);
		},
		discard() {
			return concord.clearStaged();
		},
		replay(options) {
			return concord.replay(options);
		},
		getState() {
			return concord.getState();
		},
		getPluginState(pluginId) {
			return concord.getReplayState(pluginId);
		},
		select(pluginId, selectorId, ...args) {
			return requireSelector$1(selectors, pluginId, selectorId)(concord.getReplayState(pluginId), ...args);
		},
		subscribe(listener) {
			return concord.subscribe(listener);
		},
		destroy() {
			return concord.destroy();
		}
	};
}
function createMemoryStorage$1() {
	const map = /* @__PURE__ */ new Map();
	return {
		getItem(key) {
			return map.get(key) ?? null;
		},
		setItem(key, value) {
			map.set(key, value);
		},
		removeItem(key) {
			map.delete(key);
		}
	};
}
function resolveStorage(storage) {
	if (storage) return storage;
	if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
	return createMemoryStorage$1();
}
function isLedgerContainer(value) {
	if (!value || typeof value !== "object") return false;
	const candidate = value;
	return candidate.format === "concord-ledger" && candidate.version === "1" && typeof candidate.commits === "object" && candidate.commits !== null && typeof candidate.entries === "object" && candidate.entries !== null && typeof candidate.head === "string";
}
function isEntryRecord(value) {
	if (!value || typeof value !== "object") return false;
	const candidate = value;
	return typeof candidate.entryId === "string" && typeof candidate.kind === "string" && typeof candidate.authoredAt === "string" && typeof candidate.author === "string" && typeof candidate.payload === "object" && candidate.payload !== null && typeof candidate.seal === "object" && candidate.seal !== null;
}
function createConcordLocalStorageAdapter(options) {
	const storage = resolveStorage(options?.storage);
	const storageKey = options?.storageKey ?? "solid/v2/concord/storage/v1";
	return {
		name: "solid-v2-local",
		async load() {
			const raw = storage.getItem(storageKey);
			if (!raw) return null;
			try {
				const parsed = JSON.parse(raw);
				if (!isLedgerContainer(parsed.container)) return null;
				const staged = Array.isArray(parsed.staged) ? parsed.staged.filter(isEntryRecord) : [];
				return {
					container: parsed.container,
					staged
				};
			} catch {
				return null;
			}
		},
		async save(snapshot) {
			storage.setItem(storageKey, JSON.stringify(snapshot));
		},
		async clear() {
			storage.removeItem(storageKey);
		}
	};
}
var BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function assertCryptoSubtle() {
	if (typeof globalThis.crypto?.subtle !== "object") throw new Error("Web Crypto API is required for authenticator verification.");
	return globalThis.crypto.subtle;
}
function normalizeBase32(input) {
	return String(input || "").toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");
}
function base32Encode(bytes) {
	let value = 0;
	let bits = 0;
	let output = "";
	for (let index = 0; index < bytes.length; index += 1) {
		value = value << 8 | bytes[index];
		bits += 8;
		while (bits >= 5) {
			output += BASE32_ALPHABET[value >>> bits - 5 & 31];
			bits -= 5;
		}
	}
	if (bits > 0) output += BASE32_ALPHABET[value << 5 - bits & 31];
	return output;
}
function base32Decode(input) {
	const normalized = normalizeBase32(input);
	if (!normalized) throw new Error("Authenticator secret is required.");
	let value = 0;
	let bits = 0;
	const bytes = [];
	for (let index = 0; index < normalized.length; index += 1) {
		const character = normalized[index];
		const mapped = BASE32_ALPHABET.indexOf(character);
		if (mapped === -1) throw new Error("Authenticator secret is not valid Base32.");
		value = value << 5 | mapped;
		bits += 5;
		if (bits >= 8) {
			bytes.push(value >>> bits - 8 & 255);
			bits -= 8;
		}
	}
	return new Uint8Array(bytes);
}
function toCounterBytes(counter) {
	const output = new Uint8Array(8);
	let value = Math.max(0, Math.floor(counter));
	for (let index = 7; index >= 0; index -= 1) {
		output[index] = value & 255;
		value = Math.floor(value / 256);
	}
	return output;
}
async function hmacSha1(secret, message) {
	const key = await assertCryptoSubtle().importKey("raw", secret, {
		name: "HMAC",
		hash: "SHA-1"
	}, false, ["sign"]);
	const digest = await assertCryptoSubtle().sign("HMAC", key, message);
	return new Uint8Array(digest);
}
async function totpAtCounter(input) {
	const digest = await hmacSha1(base32Decode(input.secretBase32), toCounterBytes(input.counter));
	const offset = digest[digest.length - 1] & 15;
	const code = ((digest[offset] & 127) << 24 | (digest[offset + 1] & 255) << 16 | (digest[offset + 2] & 255) << 8 | digest[offset + 3] & 255) % 10 ** input.digits;
	return String(code).padStart(input.digits, "0");
}
function generateTotpSecret(length = 20) {
	if (typeof globalThis.crypto?.getRandomValues !== "function") throw new Error("Web Crypto API is required for authenticator enrollment.");
	const bytes = new Uint8Array(length);
	globalThis.crypto.getRandomValues(bytes);
	return base32Encode(bytes);
}
function createOtpAuthUri(input) {
	const issuer = encodeURIComponent(input.policy.issuer);
	return `otpauth://totp/${issuer}:${encodeURIComponent(input.policy.accountName)}?secret=${normalizeBase32(input.secretBase32)}&issuer=${issuer}&algorithm=SHA1&digits=${input.policy.digits}&period=${input.policy.period}`;
}
async function verifyTotpCode(input) {
	const normalizedCode = String(input.code || "").replace(/\s+/g, "");
	if (!/^\d{6}$/.test(normalizedCode)) return false;
	const period = input.policy.period;
	const nowMs = input.timeMs ?? Date.now();
	const baseCounter = Math.floor(nowMs / 1e3 / period);
	const window$1 = Math.max(0, input.window ?? 1);
	for (let offset = -window$1; offset <= window$1; offset += 1) if (await totpAtCounter({
		secretBase32: input.secretBase32,
		counter: baseCounter + offset,
		digits: input.policy.digits
	}) === normalizedCode) return true;
	return false;
}
const LEGACY_PLAINTEXT_IDENTITY_STORAGE_KEY = "solid/v2/concord/identity/v1";
var LOCAL_IDENTITY_ENVELOPE_FORMAT = "ternent-solid-local-identity";
var LOCAL_IDENTITY_ENVELOPE_VERSION = "1";
var LOCAL_IDENTITY_PAYLOAD_VERSION = 1;
var DEFAULT_TOTP_ISSUER = "Concord";
function createMemoryStorage() {
	const records = /* @__PURE__ */ new Map();
	return {
		getItem(key) {
			return records.get(key) ?? null;
		},
		setItem(key, value) {
			records.set(key, value);
		},
		removeItem(key) {
			records.delete(key);
		}
	};
}
function resolveIdentityStorage(storage) {
	if (storage) return storage;
	if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
	return createMemoryStorage();
}
function resolveSessionStorage(storage) {
	if (storage) return storage;
	if (typeof window !== "undefined" && window.sessionStorage) return window.sessionStorage;
	return createMemoryStorage();
}
function formatIdentityLabel(identity) {
	return `User ${identity.keyId.slice(-8)}`;
}
function toActiveIdentity(identity) {
	return {
		identityId: identity.keyId,
		label: formatIdentityLabel(identity),
		identity
	};
}
function normalizeBootstrapMode(mode) {
	if (!mode) return "auto";
	if (mode === "auto" || mode === "unlock-only" || mode === "onboard-only") return mode;
	throw new Error(`Unsupported identity bootstrap mode: ${String(mode)}`);
}
function removeLegacyPlaintextIdentity(storage) {
	storage.removeItem(LEGACY_PLAINTEXT_IDENTITY_STORAGE_KEY);
}
function normalizePassword(input) {
	const password = String(input || "");
	if (password.trim().length < 8) throw new Error("Password must be at least 8 characters.");
	return password;
}
function normalizeTotpCode(input) {
	return String(input || "").replace(/\s+/g, "");
}
function normalizeMnemonic(input) {
	const normalized = String(input || "").trim().split(/\s+/g).join(" ");
	if (!normalized) throw new Error("Recovery mnemonic is required.");
	return normalized;
}
function isRecord(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function isEncryptedIdentityBlobV2(value) {
	return isRecord(value) && value.format === LOCAL_IDENTITY_ENVELOPE_FORMAT && value.version === LOCAL_IDENTITY_ENVELOPE_VERSION && typeof value.createdAt === "string" && typeof value.keyId === "string" && typeof value.publicKey === "string" && typeof value.ciphertext === "string" && isRecord(value.encryption) && value.encryption.scheme === "armour-passphrase" && value.encryption.encoding === "armor" && value.encryption.algorithm === "rage" && isRecord(value.unlockPolicy) && value.unlockPolicy.password === true && typeof value.unlockPolicy.totp === "boolean";
}
function parseEncryptedBlob(input) {
	const parsed = typeof input === "string" ? JSON.parse(input) : input;
	if (!isEncryptedIdentityBlobV2(parsed)) throw new Error("Encrypted identity payload must be a ternent-solid-local-identity v1 blob.");
	return parsed;
}
function isEncryptedIdentityPayload(value) {
	return isRecord(value) && value.version === LOCAL_IDENTITY_PAYLOAD_VERSION && isRecord(value.identity) && typeof value.mnemonic === "string" && isRecord(value.mfa) && typeof value.mfa.totpEnabled === "boolean" && (value.mfa.totpSecretBase32 === null || typeof value.mfa.totpSecretBase32 === "string") && isRecord(value.mfa.totpPolicy) && typeof value.mfa.totpPolicy.issuer === "string" && typeof value.mfa.totpPolicy.accountName === "string" && value.mfa.totpPolicy.digits === 6 && value.mfa.totpPolicy.period === 30;
}
async function encryptPayload(input) {
	const serialized = JSON.stringify(input.payload);
	if (typeof serialized !== "string" || serialized.length === 0) throw new Error(`Encrypted identity payload serialization failed (type=${typeof serialized}).`);
	await initArmour();
	return await encryptTextWithPassphrase({
		passphrase: input.password,
		text: serialized
	});
}
async function decryptPayload(input) {
	await initArmour();
	const plaintext = await decryptTextWithPassphrase({
		passphrase: input.password,
		data: input.blob.ciphertext
	});
	const payload = JSON.parse(plaintext);
	if (!isEncryptedIdentityPayload(payload)) throw new Error("Encrypted identity payload is malformed.");
	return payload;
}
function createEnvelope(input) {
	return {
		format: LOCAL_IDENTITY_ENVELOPE_FORMAT,
		version: LOCAL_IDENTITY_ENVELOPE_VERSION,
		createdAt: input.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
		keyId: input.identity.keyId,
		publicKey: input.identity.publicKey,
		ciphertext: input.ciphertext,
		encryption: {
			scheme: "armour-passphrase",
			encoding: "armor",
			algorithm: "rage"
		},
		unlockPolicy: {
			password: true,
			totp: input.totpEnabled
		}
	};
}
function toSummary(blob) {
	const suffix = blob.keyId.slice(-8);
	return {
		identityId: blob.keyId,
		label: `User ${suffix}`,
		createdAt: blob.createdAt,
		mfaEnabled: blob.unlockPolicy.totp
	};
}
function readStoredBlob(storage, key) {
	const raw = storage.getItem(key);
	if (!raw) return null;
	try {
		return parseEncryptedBlob(raw);
	} catch {
		return null;
	}
}
function readSessionIdentity(storage, key) {
	const raw = storage.getItem(key);
	if (!raw) return null;
	try {
		return parseIdentity(raw);
	} catch {
		storage.removeItem(key);
		return null;
	}
}
function persistSessionIdentity(storage, key, identity) {
	if (!storage) return;
	storage.setItem(key, JSON.stringify(identity));
}
function clearSessionIdentity(storage, key) {
	if (!storage) return;
	storage.removeItem(key);
}
function createIdentityService(options = {}) {
	const storage = resolveIdentityStorage(options.storage);
	const storageKey = options.storageKey ?? "solid/v2/concord/identity/encrypted/v2";
	const sessionStorage = Boolean(options.devSessionUnlockBypass) ? resolveSessionStorage(options.sessionStorage) : null;
	const sessionStorageKey = options.sessionStorageKey ?? "solid/v2/concord/identity/unlocked/session/v1";
	const initialIdentity = options.identity ?? (sessionStorage ? readSessionIdentity(sessionStorage, sessionStorageKey) : void 0);
	let explicitEncryptedBlob = null;
	if (options.encryptedIdentity) explicitEncryptedBlob = parseEncryptedBlob(options.encryptedIdentity);
	let activeIdentity = initialIdentity ? toActiveIdentity(initialIdentity) : null;
	removeLegacyPlaintextIdentity(storage);
	const resolveEncryptedBlob = () => {
		if (explicitEncryptedBlob) return explicitEncryptedBlob;
		return readStoredBlob(storage, storageKey);
	};
	return {
		async ensureUnlocked(mode) {
			const resolvedMode = normalizeBootstrapMode(mode ?? options.identityBootstrapMode);
			if (activeIdentity) return activeIdentity;
			if (initialIdentity) {
				activeIdentity = toActiveIdentity(await validateIdentity(parseIdentity(initialIdentity)));
				return activeIdentity;
			}
			if (resolvedMode === "unlock-only" || resolvedMode === "auto") throw new Error("Identity is locked. Unlock with password first.");
			throw new Error("Identity is locked.");
		},
		async createOnboardingDraft(input = {}) {
			const createdAt = (/* @__PURE__ */ new Date()).toISOString();
			const { identity, mnemonic } = await createMnemonicIdentity({
				words: input.words ?? 12,
				createdAt
			});
			const policy = {
				issuer: String(input.totpIssuer || options.rpName || DEFAULT_TOTP_ISSUER),
				accountName: String(input.totpAccountName || `${formatIdentityLabel(identity)}@local`),
				digits: 6,
				period: 30
			};
			const totpSecretBase32 = generateTotpSecret();
			return {
				createdAt,
				identity,
				mnemonic,
				label: formatIdentityLabel(identity),
				mfa: {
					totpSecretBase32,
					totpAuthUri: createOtpAuthUri({
						secretBase32: totpSecretBase32,
						policy
					}),
					policy
				}
			};
		},
		async completeOnboarding(input) {
			if (!input.mnemonicConfirmed) throw new Error("Confirm that you saved the mnemonic before creating the encrypted identity.");
			const password = normalizePassword(input.password);
			if (password !== input.confirmPassword) throw new Error("Password confirmation does not match.");
			const restored = await createIdentityFromMnemonic({
				mnemonic: input.draft.mnemonic,
				createdAt: input.draft.identity.createdAt
			});
			if (restored.keyId !== input.draft.identity.keyId || restored.publicKey !== input.draft.identity.publicKey) throw new Error("Onboarding draft mnemonic does not match its identity.");
			const validatedIdentity = await validateIdentity(parseIdentity(input.draft.identity));
			const totpEnabled = Boolean(input.mfaEnabled);
			const totpSecretBase32 = totpEnabled ? input.draft.mfa.totpSecretBase32 : null;
			if (totpEnabled) {
				const code = normalizeTotpCode(input.totpCode);
				if (!await verifyTotpCode({
					secretBase32: input.draft.mfa.totpSecretBase32,
					code,
					policy: input.draft.mfa.policy
				})) throw new Error("Authenticator code is invalid. Check your app time and retry.");
			}
			const envelope = createEnvelope({
				identity: validatedIdentity,
				ciphertext: await encryptPayload({
					payload: {
						version: LOCAL_IDENTITY_PAYLOAD_VERSION,
						identity: validatedIdentity,
						mnemonic: input.draft.mnemonic,
						mfa: {
							totpEnabled,
							totpSecretBase32,
							totpPolicy: input.draft.mfa.policy
						}
					},
					password
				}),
				createdAt: input.draft.createdAt,
				totpEnabled
			});
			storage.setItem(storageKey, JSON.stringify(envelope));
			explicitEncryptedBlob = envelope;
			persistSessionIdentity(sessionStorage, sessionStorageKey, validatedIdentity);
			activeIdentity = toActiveIdentity(validatedIdentity);
			return activeIdentity;
		},
		async recoverFromMnemonic(input) {
			const password = normalizePassword(input.password);
			if (password !== input.confirmPassword) throw new Error("Password confirmation does not match.");
			const mnemonic = normalizeMnemonic(input.mnemonic);
			const validatedIdentity = await validateIdentity(parseIdentity(await createIdentityFromMnemonic({
				mnemonic,
				createdAt: input.createdAt
			})));
			const totpEnabled = Boolean(input.mfaEnabled);
			const policy = {
				issuer: String(input.totpIssuer || options.rpName || DEFAULT_TOTP_ISSUER),
				accountName: String(input.totpAccountName || `${formatIdentityLabel(validatedIdentity)}@local`),
				digits: 6,
				period: 30
			};
			let totpSecretBase32 = null;
			if (totpEnabled) {
				const providedSecret = String(input.totpSecretBase32 || "").trim();
				if (!providedSecret) throw new Error("Authenticator secret is required when MFA is enabled.");
				if (!await verifyTotpCode({
					secretBase32: providedSecret,
					code: normalizeTotpCode(input.totpCode),
					policy
				})) throw new Error("Authenticator code is invalid. Check your app time and retry.");
				totpSecretBase32 = providedSecret;
			}
			const envelope = createEnvelope({
				identity: validatedIdentity,
				ciphertext: await encryptPayload({
					payload: {
						version: LOCAL_IDENTITY_PAYLOAD_VERSION,
						identity: validatedIdentity,
						mnemonic,
						mfa: {
							totpEnabled,
							totpSecretBase32,
							totpPolicy: policy
						}
					},
					password
				}),
				totpEnabled
			});
			storage.setItem(storageKey, JSON.stringify(envelope));
			explicitEncryptedBlob = envelope;
			persistSessionIdentity(sessionStorage, sessionStorageKey, validatedIdentity);
			activeIdentity = toActiveIdentity(validatedIdentity);
			return activeIdentity;
		},
		async unlockWithPassword(input) {
			const blob = resolveEncryptedBlob();
			if (!blob) throw new Error("No encrypted identity found. Create a new identity first.");
			const payload = await decryptPayload({
				blob,
				password: normalizePassword(input.password)
			});
			const identity = await validateIdentity(parseIdentity(payload.identity));
			if (identity.keyId !== blob.keyId || identity.publicKey !== blob.publicKey) throw new Error("Encrypted identity metadata does not match decrypted identity.");
			if (payload.mfa.totpEnabled) {
				const code = normalizeTotpCode(input.totpCode);
				const secret = payload.mfa.totpSecretBase32;
				if (!secret) throw new Error("MFA is enabled but authenticator secret is missing.");
				if (!await verifyTotpCode({
					secretBase32: secret,
					code,
					policy: payload.mfa.totpPolicy
				})) throw new Error("Authenticator code is invalid.");
			}
			activeIdentity = toActiveIdentity(identity);
			persistSessionIdentity(sessionStorage, sessionStorageKey, identity);
			return activeIdentity;
		},
		getStoredIdentitySummary() {
			const blob = resolveEncryptedBlob();
			if (!blob) return null;
			return toSummary(blob);
		},
		async lock() {
			activeIdentity = null;
			clearSessionIdentity(sessionStorage, sessionStorageKey);
		}
	};
}
function initialUsersState() {
	return {
		byId: {},
		order: []
	};
}
function normalizeRequiredText$1(value, label) {
	if (typeof value !== "string") throw new Error(`${label} is required.`);
	const normalized = value.trim();
	if (!normalized) throw new Error(`${label} is required.`);
	return normalized;
}
function normalizeOptionalText$1(value, label) {
	if (value === void 0) return;
	if (value === null) return null;
	if (typeof value !== "string") throw new Error(`${label} must be a string.`);
	return value.trim() || null;
}
function normalizeAttributes(value) {
	if (value === void 0) return;
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Attributes must be an object.");
	const next = {};
	for (const [rawKey, rawValue] of Object.entries(value)) {
		const key = rawKey.trim();
		if (!key) throw new Error("Attribute keys cannot be empty.");
		if (rawValue === null) {
			next[key] = null;
			continue;
		}
		if (typeof rawValue !== "string") throw new Error(`Attribute '${key}' must be a string or null.`);
		const normalizedValue = rawValue.trim();
		if (!normalizedValue) throw new Error(`Attribute '${key}' cannot be empty.`);
		next[key] = normalizedValue;
	}
	return next;
}
function normalizeGroupIds(value) {
	if (value === void 0) return;
	if (!Array.isArray(value)) throw new Error("Encryption group ids must be an array.");
	const seen = /* @__PURE__ */ new Set();
	const groupIds = [];
	for (const item of value) {
		if (typeof item !== "string") throw new Error("Encryption group ids must be strings.");
		const normalized = item.trim();
		if (!normalized || seen.has(normalized)) continue;
		seen.add(normalized);
		groupIds.push(normalized);
	}
	return groupIds;
}
function parseUserCreateInput(inputValue) {
	if (!inputValue || typeof inputValue !== "object") throw new Error("User create input is required.");
	const input = inputValue;
	return {
		identityId: normalizeRequiredText$1(input.identityId, "Identity id"),
		label: normalizeOptionalText$1(input.label, "Label"),
		displayName: normalizeOptionalText$1(input.displayName, "Display name"),
		email: normalizeOptionalText$1(input.email, "Email"),
		avatarUrl: normalizeOptionalText$1(input.avatarUrl, "Avatar URL"),
		attributes: normalizeAttributes(input.attributes),
		encryptionGroupIds: normalizeGroupIds(input.encryptionGroupIds)
	};
}
function parseUserUpdateProfileInput(inputValue) {
	if (!inputValue || typeof inputValue !== "object") throw new Error("User profile input is required.");
	const input = inputValue;
	return {
		identityId: normalizeRequiredText$1(input.identityId, "Identity id"),
		label: normalizeOptionalText$1(input.label, "Label"),
		displayName: normalizeOptionalText$1(input.displayName, "Display name"),
		email: normalizeOptionalText$1(input.email, "Email"),
		avatarUrl: normalizeOptionalText$1(input.avatarUrl, "Avatar URL"),
		attributes: normalizeAttributes(input.attributes)
	};
}
function parseUserEncryptionGroupInput(inputValue) {
	if (!inputValue || typeof inputValue !== "object") throw new Error("Encryption group input is required.");
	const input = inputValue;
	return {
		identityId: normalizeRequiredText$1(input.identityId, "Identity id"),
		groupId: normalizeRequiredText$1(input.groupId, "Group id")
	};
}
function getEntryPayload$1(entry) {
	if (entry.payload.type === "plain") return entry.payload.data;
	if (entry.payload.type === "decrypted") return entry.payload.data;
	return null;
}
function cloneUserRecord(record) {
	return {
		...record,
		profile: {
			...record.profile,
			attributes: { ...record.profile.attributes }
		},
		encryptionGroupIds: [...record.encryptionGroupIds]
	};
}
function cloneUsersState(state) {
	return {
		byId: Object.fromEntries(Object.entries(state.byId).map(([identityId, record]) => [identityId, cloneUserRecord(record)])),
		order: [...state.order]
	};
}
function removeUndefinedFields(input) {
	return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== void 0));
}
function mergeAttributes(previous, patch) {
	if (!patch) return { ...previous };
	const next = { ...previous };
	for (const [key, value] of Object.entries(patch)) {
		if (value === null) {
			delete next[key];
			continue;
		}
		next[key] = value;
	}
	return next;
}
function applyUserCreate(state, payloadValue) {
	if (!payloadValue || typeof payloadValue !== "object") return state;
	const payload = payloadValue;
	if (state.byId[payload.identityId]) return state;
	const nextRecord = {
		identityId: payload.identityId,
		label: payload.label ?? payload.identityId,
		profile: {
			displayName: payload.displayName ?? null,
			email: payload.email ?? null,
			avatarUrl: payload.avatarUrl ?? null,
			attributes: mergeAttributes({}, payload.attributes)
		},
		encryptionGroupIds: payload.encryptionGroupIds ?? [],
		createdAt: payload.createdAt,
		updatedAt: payload.updatedAt
	};
	return {
		byId: {
			...state.byId,
			[payload.identityId]: nextRecord
		},
		order: [...state.order, payload.identityId]
	};
}
function applyUserUpdateProfile(state, payloadValue) {
	if (!payloadValue || typeof payloadValue !== "object") return state;
	const payload = payloadValue;
	const existing = state.byId[payload.identityId];
	const fallbackRecord = {
		identityId: payload.identityId,
		label: payload.identityId,
		profile: {
			displayName: null,
			email: null,
			avatarUrl: null,
			attributes: {}
		},
		encryptionGroupIds: [],
		createdAt: payload.updatedAt,
		updatedAt: payload.updatedAt
	};
	const baseRecord = existing ?? fallbackRecord;
	const nextRecord = {
		...baseRecord,
		label: payload.label ?? baseRecord.label,
		profile: {
			displayName: payload.displayName === void 0 ? baseRecord.profile.displayName : payload.displayName,
			email: payload.email === void 0 ? baseRecord.profile.email : payload.email,
			avatarUrl: payload.avatarUrl === void 0 ? baseRecord.profile.avatarUrl : payload.avatarUrl,
			attributes: mergeAttributes(baseRecord.profile.attributes, payload.attributes)
		},
		updatedAt: payload.updatedAt
	};
	return {
		byId: {
			...state.byId,
			[payload.identityId]: nextRecord
		},
		order: existing ? state.order : [...state.order, payload.identityId]
	};
}
function applyGroupAdded(state, payloadValue) {
	if (!payloadValue || typeof payloadValue !== "object") return state;
	const payload = payloadValue;
	const existing = state.byId[payload.identityId];
	if (!existing) return state;
	if (existing.encryptionGroupIds.includes(payload.groupId)) return state;
	return {
		...state,
		byId: {
			...state.byId,
			[payload.identityId]: {
				...existing,
				encryptionGroupIds: [...existing.encryptionGroupIds, payload.groupId],
				updatedAt: payload.updatedAt
			}
		}
	};
}
function applyGroupRemoved(state, payloadValue) {
	if (!payloadValue || typeof payloadValue !== "object") return state;
	const payload = payloadValue;
	const existing = state.byId[payload.identityId];
	if (!existing) return state;
	if (!existing.encryptionGroupIds.includes(payload.groupId)) return state;
	return {
		...state,
		byId: {
			...state.byId,
			[payload.identityId]: {
				...existing,
				encryptionGroupIds: existing.encryptionGroupIds.filter((groupId) => groupId !== payload.groupId),
				updatedAt: payload.updatedAt
			}
		}
	};
}
function createUsersPlugin() {
	return {
		plugin: {
			id: "users",
			initialState: initialUsersState,
			commands: {
				"user.create": async (ctx, inputValue) => {
					const input = parseUserCreateInput(inputValue);
					const now = ctx.now();
					return {
						kind: "user.create",
						payload: removeUndefinedFields({
							...input,
							createdAt: now,
							updatedAt: now
						})
					};
				},
				"user.updateProfile": async (ctx, inputValue) => {
					return {
						kind: "user.updateProfile",
						payload: removeUndefinedFields({
							...parseUserUpdateProfileInput(inputValue),
							updatedAt: ctx.now()
						})
					};
				},
				"user.group.add": async (ctx, inputValue) => {
					return {
						kind: "user.group.add",
						payload: {
							...parseUserEncryptionGroupInput(inputValue),
							updatedAt: ctx.now()
						}
					};
				},
				"user.group.remove": async (ctx, inputValue) => {
					return {
						kind: "user.group.remove",
						payload: {
							...parseUserEncryptionGroupInput(inputValue),
							updatedAt: ctx.now()
						}
					};
				}
			},
			applyEntry(entry, ctx) {
				const state = cloneUsersState(ctx.getState());
				const payload = getEntryPayload$1(entry);
				if (entry.kind === "user.create") {
					ctx.setState(applyUserCreate(state, payload));
					return;
				}
				if (entry.kind === "user.updateProfile") {
					ctx.setState(applyUserUpdateProfile(state, payload));
					return;
				}
				if (entry.kind === "user.group.add") {
					ctx.setState(applyGroupAdded(state, payload));
					return;
				}
				if (entry.kind === "user.group.remove") ctx.setState(applyGroupRemoved(state, payload));
			}
		},
		selectors: {
			all(state) {
				return state.order.map((identityId) => state.byId[identityId]).filter((record) => Boolean(record)).map(cloneUserRecord);
			},
			byId(state, identityId) {
				if (typeof identityId !== "string") return null;
				const record = state.byId[identityId] ?? null;
				return record ? cloneUserRecord(record) : null;
			}
		}
	};
}
function initialPermissionsState() {
	return {
		byId: {},
		order: []
	};
}
function normalizeRequiredText(value, label) {
	if (typeof value !== "string") throw new Error(`${label} is required.`);
	const normalized = value.trim();
	if (!normalized) throw new Error(`${label} is required.`);
	return normalized;
}
function normalizeOptionalText(value, label) {
	if (value === null || value === void 0) return null;
	if (typeof value !== "string") throw new Error(`${label} must be a string.`);
	return value.trim() || null;
}
function normalizeActor(value) {
	if (!value || typeof value !== "object") throw new Error("Actor is required.");
	const actor = value;
	return {
		memberId: normalizeRequiredText(actor.memberId, "Actor member id"),
		memberLabel: normalizeOptionalText(actor.memberLabel, "Actor member label")
	};
}
function parsePermissionCreateInput(inputValue) {
	if (!inputValue || typeof inputValue !== "object") throw new Error("Permission create input is required.");
	const input = inputValue;
	return {
		title: normalizeRequiredText(input.title, "Permission title"),
		scope: normalizeOptionalText(input.scope, "Permission scope"),
		actor: normalizeActor(input.actor)
	};
}
function parsePermissionGrantInput(inputValue) {
	if (!inputValue || typeof inputValue !== "object") throw new Error("Permission grant input is required.");
	const input = inputValue;
	return {
		permissionId: normalizeRequiredText(input.permissionId, "Permission id"),
		memberId: normalizeRequiredText(input.memberId, "Member id"),
		memberLabel: normalizeOptionalText(input.memberLabel, "Member label"),
		actor: normalizeActor(input.actor)
	};
}
function parsePermissionRevokeInput(inputValue) {
	if (!inputValue || typeof inputValue !== "object") throw new Error("Permission revoke input is required.");
	const input = inputValue;
	return {
		permissionId: normalizeRequiredText(input.permissionId, "Permission id"),
		memberId: normalizeRequiredText(input.memberId, "Member id"),
		actor: normalizeActor(input.actor)
	};
}
function getEntryPayload(entry) {
	if (entry.payload.type === "plain") return entry.payload.data;
	if (entry.payload.type === "decrypted") return entry.payload.data;
	return null;
}
function clonePermissionRecord(record) {
	return {
		...record,
		members: record.members.map((member) => ({ ...member }))
	};
}
function clonePermissionsState(state) {
	return {
		byId: Object.fromEntries(Object.entries(state.byId).map(([permissionId, record]) => [permissionId, clonePermissionRecord(record)])),
		order: [...state.order]
	};
}
function ensureActorMember(members, actor) {
	return [...members.filter((member) => member.memberId !== actor.memberId), {
		memberId: actor.memberId,
		memberLabel: actor.memberLabel
	}];
}
function applyPermissionCreate(state, payloadValue) {
	if (!payloadValue || typeof payloadValue !== "object") return state;
	const payload = payloadValue;
	if (state.byId[payload.permissionId]) return state;
	const nextRecord = {
		id: payload.permissionId,
		title: payload.title,
		scope: payload.scope,
		members: ensureActorMember([], payload.actor),
		createdAt: payload.createdAt,
		updatedAt: payload.updatedAt
	};
	return {
		byId: {
			...state.byId,
			[payload.permissionId]: nextRecord
		},
		order: [...state.order, payload.permissionId]
	};
}
function applyPermissionGrant(state, payloadValue) {
	if (!payloadValue || typeof payloadValue !== "object") return state;
	const payload = payloadValue;
	const existing = state.byId[payload.permissionId];
	if (!existing) return state;
	const withTarget = [...existing.members.filter((member) => member.memberId !== payload.memberId), {
		memberId: payload.memberId,
		memberLabel: payload.memberLabel
	}];
	return {
		...state,
		byId: {
			...state.byId,
			[payload.permissionId]: {
				...existing,
				members: ensureActorMember(withTarget, payload.actor),
				updatedAt: payload.updatedAt
			}
		}
	};
}
function applyPermissionRevoke(state, payloadValue) {
	if (!payloadValue || typeof payloadValue !== "object") return state;
	const payload = payloadValue;
	const existing = state.byId[payload.permissionId];
	if (!existing) return state;
	const withoutMember = existing.members.filter((member) => member.memberId !== payload.memberId);
	return {
		...state,
		byId: {
			...state.byId,
			[payload.permissionId]: {
				...existing,
				members: ensureActorMember(withoutMember, payload.actor),
				updatedAt: payload.updatedAt
			}
		}
	};
}
function createStableHash(input) {
	let hash = 0;
	for (let index = 0; index < input.length; index += 1) hash = hash * 31 + input.charCodeAt(index) >>> 0;
	return hash.toString(36);
}
function createPermissionId(nowIso, title, actorId, scope) {
	const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "permission";
	return `permission:${slug}:${nowIso.replace(/[^0-9]/g, "").slice(0, 14) || "0"}:${createStableHash([
		slug,
		actorId,
		scope ?? "",
		nowIso
	].join("|"))}`;
}
function createPermissionsPlugin() {
	return {
		plugin: {
			id: "permissions",
			initialState: initialPermissionsState,
			commands: {
				"permission.create": async (ctx, inputValue) => {
					const input = parsePermissionCreateInput(inputValue);
					const now = ctx.now();
					return {
						kind: "permission.create",
						payload: {
							permissionId: createPermissionId(now, input.title, input.actor.memberId, input.scope ?? null),
							title: input.title,
							scope: input.scope ?? null,
							actor: input.actor,
							createdAt: now,
							updatedAt: now
						}
					};
				},
				"permission.grant": async (ctx, inputValue) => {
					const input = parsePermissionGrantInput(inputValue);
					return {
						kind: "permission.grant",
						payload: {
							permissionId: input.permissionId,
							memberId: input.memberId,
							memberLabel: input.memberLabel ?? null,
							actor: input.actor,
							updatedAt: ctx.now()
						}
					};
				},
				"permission.revoke": async (ctx, inputValue) => {
					const input = parsePermissionRevokeInput(inputValue);
					if (input.memberId === input.actor.memberId) throw new Error("Active identity cannot be removed from a permission.");
					return {
						kind: "permission.revoke",
						payload: {
							permissionId: input.permissionId,
							memberId: input.memberId,
							actor: input.actor,
							updatedAt: ctx.now()
						}
					};
				}
			},
			applyEntry(entry, ctx) {
				const state = clonePermissionsState(ctx.getState());
				const payload = getEntryPayload(entry);
				if (entry.kind === "permission.create") {
					ctx.setState(applyPermissionCreate(state, payload));
					return;
				}
				if (entry.kind === "permission.grant") {
					ctx.setState(applyPermissionGrant(state, payload));
					return;
				}
				if (entry.kind === "permission.revoke") ctx.setState(applyPermissionRevoke(state, payload));
			}
		},
		selectors: {
			all(state) {
				return state.order.map((permissionId) => state.byId[permissionId]).filter((record) => Boolean(record)).map(clonePermissionRecord);
			},
			byId(state, permissionId) {
				if (typeof permissionId !== "string") return null;
				const record = state.byId[permissionId] ?? null;
				return record ? clonePermissionRecord(record) : null;
			}
		}
	};
}
var singleton = null;
var singletonOptionsForTests = null;
function toErrorMessage(error) {
	return error instanceof Error ? error.message : String(error);
}
function createDefaultPlugins() {
	return [createUsersPlugin(), createPermissionsPlugin()];
}
function createInitialState(plugins) {
	return {
		ready: false,
		integrityValid: false,
		stagedCount: 0,
		replay: Object.fromEntries(plugins.map((plugin) => [plugin.plugin.id, plugin.plugin.initialState?.()])),
		verification: null
	};
}
function requireSelector(plugins, pluginId, selectorId) {
	const plugin = plugins.find((candidate) => candidate.plugin.id === pluginId);
	if (!plugin) throw new Error(`Unknown plugin id '${pluginId}'.`);
	const selector = plugin.selectors?.[selectorId];
	if (!selector) throw new Error(`Unknown selector '${selectorId}' for plugin '${pluginId}'.`);
	return selector;
}
function buildPermissionActor(activeIdentity) {
	if (!activeIdentity) throw new Error("Active identity is required.");
	return {
		memberId: activeIdentity.identityId,
		memberLabel: activeIdentity.label
	};
}
function createAppApi(options) {
	const plugins = options?.plugins ?? createDefaultPlugins();
	const status = ref("restoring");
	const state = shallowRef(createInitialState(plugins));
	const lastError = ref(null);
	const activeIdentity = ref(null);
	let runtime = null;
	let identityService = null;
	let bootstrapPromise = null;
	let runtimeSubscription = null;
	function ensureIdentityService() {
		if (identityService) return identityService;
		identityService = createIdentityService({
			identity: options?.identity,
			encryptedIdentity: options?.encryptedIdentity,
			identityBootstrapMode: options?.identityBootstrapMode,
			storage: options?.identityStorage,
			storageKey: options?.identityStorageKey,
			devSessionUnlockBypass: options?.devSessionUnlockBypass ?? false,
			rpName: options?.rpName
		});
		return identityService;
	}
	async function teardownRuntime() {
		if (runtimeSubscription) {
			runtimeSubscription();
			runtimeSubscription = null;
		}
		if (runtime) {
			await runtime.destroy();
			runtime = null;
		}
		bootstrapPromise = null;
		state.value = createInitialState(plugins);
		status.value = "restoring";
		lastError.value = null;
		activeIdentity.value = null;
	}
	async function bootstrap(mode) {
		if (runtime) return;
		try {
			const resolvedIdentity = await ensureIdentityService().ensureUnlocked(mode);
			activeIdentity.value = {
				identityId: resolvedIdentity.identityId,
				label: resolvedIdentity.label
			};
			const storage = options?.storage ?? createConcordLocalStorageAdapter({
				storage: options?.concordStorage,
				storageKey: options?.concordStorageKey
			});
			runtime = await createApp({
				identity: resolvedIdentity.identity,
				storage,
				plugins
			});
			runtimeSubscription = runtime.subscribe((nextState) => {
				state.value = nextState;
			});
			await runtime.load();
			state.value = runtime.getState();
			status.value = "ready";
			lastError.value = null;
		} catch (error) {
			status.value = "error";
			lastError.value = toErrorMessage(error);
			throw error;
		}
	}
	async function ensureRuntime() {
		if (!bootstrapPromise) bootstrapPromise = bootstrap();
		await bootstrapPromise;
		if (!runtime) throw new Error("App runtime is unavailable.");
		return runtime;
	}
	async function executeMutation(task) {
		try {
			const result = await task();
			lastError.value = null;
			return result;
		} catch (error) {
			lastError.value = toErrorMessage(error);
			throw error;
		}
	}
	const api = {
		status: readonly(status),
		state: readonly(state),
		lastError: readonly(lastError),
		identity: {
			status: readonly(status),
			activeIdentity: readonly(activeIdentity),
			getActiveIdentity() {
				return activeIdentity.value;
			},
			async ensureActiveIdentity() {
				await ensureRuntime();
				const current = activeIdentity.value;
				if (!current) throw new Error("Active identity is unavailable.");
				return current;
			},
			async ensureUnlocked(mode) {
				if (activeIdentity.value && status.value === "ready") return activeIdentity.value;
				await bootstrap(mode);
				const current = activeIdentity.value;
				if (!current) throw new Error("Active identity is unavailable.");
				return current;
			},
			async lock() {
				await ensureIdentityService().lock();
				await teardownRuntime();
			},
			async createOnboardingDraft(input) {
				return await ensureIdentityService().createOnboardingDraft(input);
			},
			async completeOnboarding(input) {
				await ensureIdentityService().completeOnboarding(input);
				await teardownRuntime();
				await bootstrap("auto");
				const current = activeIdentity.value;
				if (!current) throw new Error("Active identity is unavailable after onboarding.");
				return current;
			},
			async recoverFromMnemonic(input) {
				await ensureIdentityService().recoverFromMnemonic(input);
				await teardownRuntime();
				await bootstrap("auto");
				const current = activeIdentity.value;
				if (!current) throw new Error("Active identity is unavailable after recovery.");
				return current;
			},
			async unlockWithPassword(input) {
				await ensureIdentityService().unlockWithPassword(input);
				await teardownRuntime();
				await bootstrap("unlock-only");
				const current = activeIdentity.value;
				if (!current) throw new Error("Active identity is unavailable after unlock.");
				return current;
			},
			getStoredIdentitySummary() {
				return ensureIdentityService().getStoredIdentitySummary();
			}
		},
		users: {
			create(input) {
				return api.command("user.create", input);
			},
			updateProfile(input) {
				return api.command("user.updateProfile", input);
			},
			addToEncryptionGroup(input) {
				return api.command("user.group.add", input);
			},
			removeFromEncryptionGroup(input) {
				return api.command("user.group.remove", input);
			},
			all() {
				return api.select("users", "all");
			},
			byId(identityId) {
				return api.select("users", "byId", identityId);
			}
		},
		permissions: {
			create(input) {
				const actor = buildPermissionActor(activeIdentity.value);
				return api.command("permission.create", {
					...input,
					actor
				});
			},
			grant(input) {
				const actor = buildPermissionActor(activeIdentity.value);
				return api.command("permission.grant", {
					...input,
					actor
				});
			},
			revoke(input) {
				const actor = buildPermissionActor(activeIdentity.value);
				return api.command("permission.revoke", {
					...input,
					actor
				});
			},
			all() {
				return api.select("permissions", "all");
			},
			byId(permissionId) {
				return api.select("permissions", "byId", permissionId);
			}
		},
		load() {
			return ensureRuntime().then(() => void 0);
		},
		command(type, input) {
			return executeMutation(async () => {
				return await (await ensureRuntime()).command(type, input);
			});
		},
		commit(input) {
			return executeMutation(async () => {
				return await (await ensureRuntime()).commit(input);
			});
		},
		discard() {
			return executeMutation(async () => {
				await (await ensureRuntime()).discard();
			});
		},
		replay(optionsValue) {
			return executeMutation(async () => {
				await (await ensureRuntime()).replay(optionsValue);
			});
		},
		getState() {
			return state.value;
		},
		getPluginState(pluginId) {
			return state.value.replay[pluginId] ?? {};
		},
		select(pluginId, selectorId, ...args) {
			const selector = requireSelector(plugins, pluginId, selectorId);
			const pluginState = state.value.replay[pluginId];
			return selector(pluginState, ...args);
		},
		subscribe(listener) {
			const resolved = (nextState) => listener(nextState);
			let closed = false;
			let unsubscribeRuntime = null;
			ensureRuntime().then((resolvedRuntime) => {
				if (closed) return;
				unsubscribeRuntime = resolvedRuntime.subscribe(resolved);
			}).catch(() => void 0);
			return () => {
				closed = true;
				if (unsubscribeRuntime) {
					unsubscribeRuntime();
					unsubscribeRuntime = null;
				}
			};
		},
		async destroy() {
			await teardownRuntime();
		}
	};
	return api;
}
function useAppApi() {
	if (!singleton) singleton = createAppApi(singletonOptionsForTests ?? void 0);
	return singleton;
}
export { createOtpAuthUri as n, useAppApi as t };
