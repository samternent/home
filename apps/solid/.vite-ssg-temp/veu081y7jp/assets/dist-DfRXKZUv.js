import { S as verifyUtf8, b as signUtf8, v as deriveKeyId, y as parseIdentity } from "./src-De70Jo1T.js";
function getHashArray(hash) {
	return Array.from(new Uint8Array(hash));
}
function getHashHex(hash) {
	return hash.map((buf) => buf.toString(16).padStart(2, "0")).join("");
}
function canonicalize(value, seen) {
	if (value === void 0) throw new TypeError("Cannot hash undefined");
	const valueType = typeof value;
	if (valueType === "function" || valueType === "symbol") throw new TypeError(`Cannot hash ${valueType} values`);
	if (value === null || valueType === "string" || valueType === "number" || valueType === "boolean") return value;
	if (valueType === "bigint") throw new TypeError("Cannot hash bigint values");
	if (typeof value.toJSON === "function") return canonicalize(value.toJSON(), seen);
	if (Array.isArray(value)) return value.map((item) => canonicalize(item, seen));
	if (typeof value === "object") {
		if (seen.has(value)) throw new TypeError("Cannot hash circular references");
		seen.add(value);
		const entries = Object.keys(value).sort();
		const result = {};
		for (const key of entries) result[key] = canonicalize(value[key], seen);
		seen.delete(value);
		return result;
	}
	throw new TypeError(`Cannot hash unsupported value type: ${valueType}`);
}
function canonicalStringify(data) {
	return JSON.stringify(canonicalize(data, /* @__PURE__ */ new WeakSet()));
}
async function hashBytes(input) {
	const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
	return getHashHex(getHashArray(await crypto.subtle.digest("SHA-256", bytes)));
}
var SEAL_SIGNATURE_CONTEXT = "ternent-seal/v2";
async function resolveSealSigner(input) {
	const identity = parseIdentity(input.identity);
	const keyId = await deriveKeyId(identity.publicKey);
	if (keyId !== identity.keyId) throw new Error("Identity keyId does not match the signer public key.");
	return {
		identity,
		publicKey: identity.publicKey,
		keyId
	};
}
async function signSealUtf8(identity, value) {
	return signUtf8(identity, value, { context: SEAL_SIGNATURE_CONTEXT });
}
async function verifySealUtf8(signature, value, publicKey) {
	return verifyUtf8(publicKey, value, signature, { context: SEAL_SIGNATURE_CONTEXT });
}
async function verifyPublicKeyKeyId(publicKey, keyId) {
	return await deriveKeyId(publicKey) === keyId;
}
var SEAL_PROOF_TYPE = "seal-proof";
var SEAL_SIGNATURE_ALGORITHM = "Ed25519";
function isRecord(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function hasOnlyKeys(value, allowed) {
	return Object.keys(value).every((key) => allowed.includes(key));
}
function isSealHash(value) {
	return typeof value === "string" && /^sha256:[0-9a-f]{64}$/.test(value);
}
function isIsoDate(value) {
	return !Number.isNaN(Date.parse(value));
}
function getSealProofSignableFields(proof) {
	return {
		version: proof.version,
		type: proof.type,
		algorithm: proof.algorithm,
		createdAt: proof.createdAt,
		subject: proof.subject,
		signer: proof.signer
	};
}
function getSealProofSigningPayload(proof) {
	return canonicalStringify(getSealProofSignableFields(proof));
}
async function createSealHash(bytes) {
	return `sha256:${await hashBytes(bytes)}`;
}
async function createSealProof(input) {
	const signer = await resolveSealSigner(input.signer);
	const fields = {
		version: "2",
		type: SEAL_PROOF_TYPE,
		algorithm: SEAL_SIGNATURE_ALGORITHM,
		createdAt: input.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
		subject: input.subject,
		signer: {
			publicKey: signer.publicKey,
			keyId: signer.keyId
		}
	};
	const signature = await signSealUtf8(signer.identity, getSealProofSigningPayload(fields));
	return {
		...fields,
		signature
	};
}
function validateSealProofShape(value) {
	if (!isRecord(value)) return {
		ok: false,
		errors: ["Proof must be a JSON object."],
		proof: null
	};
	const errors = [];
	if (!hasOnlyKeys(value, [
		"version",
		"type",
		"algorithm",
		"createdAt",
		"subject",
		"signer",
		"signature"
	])) errors.push("Proof contains unsupported fields.");
	if (value.version !== "2") errors.push(`Proof version must be 2.`);
	if (value.type !== "seal-proof") errors.push(`Proof type must be ${SEAL_PROOF_TYPE}.`);
	if (value.algorithm !== "Ed25519") errors.push(`Proof algorithm must be ${SEAL_SIGNATURE_ALGORITHM}.`);
	if (typeof value.createdAt !== "string" || !isIsoDate(value.createdAt)) errors.push("Proof createdAt must be an ISO timestamp.");
	if (typeof value.signature !== "string" || value.signature.length === 0) errors.push("Proof signature must be a non-empty base64url string.");
	if (!isRecord(value.subject)) errors.push("Proof subject must be an object.");
	if (!isRecord(value.signer)) errors.push("Proof signer must be an object.");
	if (errors.length > 0 || !isRecord(value.subject) || !isRecord(value.signer)) return {
		ok: false,
		errors,
		proof: null
	};
	if (!hasOnlyKeys(value.subject, [
		"kind",
		"path",
		"hash"
	])) errors.push("Proof subject contains unsupported fields.");
	if (!hasOnlyKeys(value.signer, ["publicKey", "keyId"])) errors.push("Proof signer contains unsupported fields.");
	if (value.subject.kind !== "file" && value.subject.kind !== "manifest" && value.subject.kind !== "artifact") errors.push("Proof subject kind must be file, manifest, or artifact.");
	if (typeof value.subject.path !== "string" || value.subject.path.length === 0) errors.push("Proof subject path must be a non-empty string.");
	if (!isSealHash(value.subject.hash)) errors.push("Proof subject hash must be a sha256 hash.");
	if (typeof value.signer.publicKey !== "string" || value.signer.publicKey.length === 0) errors.push("Proof signer publicKey must be a non-empty base64url string.");
	if (typeof value.signer.keyId !== "string" || value.signer.keyId.length === 0) errors.push("Proof signer keyId must be a non-empty string.");
	if (errors.length > 0) return {
		ok: false,
		errors,
		proof: null
	};
	return {
		ok: true,
		errors: [],
		proof: value
	};
}
async function verifySealProofSignature(proof) {
	const validation = validateSealProofShape(proof);
	if (!validation.ok || !validation.proof) return {
		ok: false,
		errors: validation.errors
	};
	if (!await verifyPublicKeyKeyId(proof.signer.publicKey, proof.signer.keyId)) return {
		ok: false,
		errors: ["Proof signer keyId does not match signer public key."]
	};
	try {
		if (!await verifySealUtf8(proof.signature, getSealProofSigningPayload(proof), proof.signer.publicKey)) return {
			ok: false,
			errors: ["Invalid signature."]
		};
		return {
			ok: true,
			errors: []
		};
	} catch (caught) {
		return {
			ok: false,
			errors: ["Invalid signature."]
		};
	}
}
async function verifySealProofAgainstBytes(proof, bytes) {
	const subjectHash = await createSealHash(bytes);
	const signatureCheck = await verifySealProofSignature(proof);
	const hashMatch = subjectHash === proof.subject.hash;
	const signatureValid = signatureCheck.ok;
	return {
		valid: hashMatch && signatureValid,
		hashMatch,
		signatureValid,
		keyId: proof.signer.keyId,
		algorithm: proof.algorithm,
		subjectHash
	};
}
export { createSealHash, createSealProof, verifySealProofAgainstBytes };
