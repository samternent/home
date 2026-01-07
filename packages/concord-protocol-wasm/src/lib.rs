use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize, Clone)]
pub struct EncryptedPayload {
    pub enc: String,
    pub ct: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Entry {
    pub kind: String,
    pub timestamp: String,
    pub author: String,
    pub payload: Option<Value>,
    pub signature: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Commit {
    pub parent: Option<String>,
    pub timestamp: String,
    pub metadata: Option<Value>,
    pub entries: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct LedgerContainer {
    pub format: String,
    pub version: String,
    pub commits: BTreeMap<String, Commit>,
    pub entries: BTreeMap<String, Entry>,
    pub head: String,
}

fn canonicalize_value(value: &Value) -> Value {
    match value {
        Value::Object(map) => {
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort();
            let mut canonical = Map::new();
            for key in keys {
                if let Some(child) = map.get(key) {
                    canonical.insert(key.clone(), canonicalize_value(child));
                }
            }
            Value::Object(canonical)
        }
        Value::Array(items) => {
            Value::Array(items.iter().map(canonicalize_value).collect())
        }
        Value::Null => Value::Null,
        Value::Bool(value) => Value::Bool(*value),
        Value::Number(value) => Value::Number(value.clone()),
        Value::String(value) => Value::String(value.clone()),
    }
}

fn canonical_stringify(value: &Value) -> String {
    let canonical = canonicalize_value(value);
    serde_json::to_string(&canonical).unwrap_or_else(|_| "null".to_string())
}

fn hash_canonical(value: &Value) -> String {
    let canonical = canonical_stringify(value);
    let mut hasher = Sha256::new();
    hasher.update(canonical.as_bytes());
    format!("{:x}", hasher.finalize())
}

fn entry_core_value(entry: &Entry) -> Value {
    let payload = entry.payload.clone().unwrap_or(Value::Null);
    serde_json::json!({
        "kind": entry.kind.clone(),
        "timestamp": entry.timestamp.clone(),
        "author": entry.author.clone(),
        "payload": payload
    })
}

fn now_iso() -> String {
    js_sys::Date::new_0().to_iso_string().into()
}

fn build_genesis_metadata(metadata: Option<Value>) -> Result<Value, JsValue> {
    let mut merged = Map::new();
    merged.insert("genesis".to_string(), Value::Bool(true));
    merged.insert(
        "spec".to_string(),
        Value::String("concord-protocol@1.0".to_string()),
    );
    match metadata {
        Some(Value::Object(map)) => {
            for (key, value) in map {
                merged.insert(key, value);
            }
        }
        Some(Value::Null) | None => {}
        Some(_) => {
            return Err(JsValue::from_str("metadata must be an object or null"));
        }
    }
    Ok(Value::Object(merged))
}

fn create_genesis_commit_internal(
    metadata: Option<Value>,
    timestamp: Option<String>,
) -> Result<(String, Commit), JsValue> {
    let commit = Commit {
        parent: None,
        timestamp: timestamp.unwrap_or_else(now_iso),
        metadata: Some(build_genesis_metadata(metadata)?),
        entries: vec![],
    };
    let commit_value =
        serde_json::to_value(commit.clone()).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let commit_id = hash_canonical(&commit_value);
    Ok((commit_id, commit))
}

fn parse_optional_metadata(value: JsValue) -> Result<Option<Value>, JsValue> {
    if value.is_null() || value.is_undefined() {
        return Ok(None);
    }
    Ok(Some(serde_wasm_bindgen::from_value(value)?))
}

/// Canonical JSON serialization with lexicographically sorted keys.
#[wasm_bindgen]
pub fn canonicalStringify(value: JsValue) -> Result<JsValue, JsValue> {
    let value: Value = serde_wasm_bindgen::from_value(value)?;
    Ok(JsValue::from_str(&canonical_stringify(&value)))
}

/// SHA-256 hash of the canonical JSON serialization.
#[wasm_bindgen]
pub fn hashData(value: JsValue) -> Result<JsValue, JsValue> {
    let value: Value = serde_wasm_bindgen::from_value(value)?;
    Ok(JsValue::from_str(&hash_canonical(&value)))
}

/// Canonical signing payload for an entry (excludes signature).
#[wasm_bindgen]
pub fn getEntrySigningPayload(entry: JsValue) -> Result<JsValue, JsValue> {
    let entry: Entry = serde_wasm_bindgen::from_value(entry)?;
    let core = entry_core_value(&entry);
    Ok(JsValue::from_str(&canonical_stringify(&core)))
}

/// Deterministically derives an EntryID from entry content.
#[wasm_bindgen]
pub fn deriveEntryId(entry: JsValue) -> Result<JsValue, JsValue> {
    let entry: Entry = serde_wasm_bindgen::from_value(entry)?;
    let core = entry_core_value(&entry);
    Ok(JsValue::from_str(&hash_canonical(&core)))
}

/// Deterministically derives a CommitID from commit content.
#[wasm_bindgen]
pub fn deriveCommitId(commit: JsValue) -> Result<JsValue, JsValue> {
    let commit: Commit = serde_wasm_bindgen::from_value(commit)?;
    let commit_value = serde_json::to_value(commit).map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(JsValue::from_str(&hash_canonical(&commit_value)))
}

/// Creates the genesis commit for a new ledger.
#[wasm_bindgen]
pub fn createGenesisCommit(
    metadata: JsValue,
    timestamp: Option<String>,
) -> Result<JsValue, JsValue> {
    let metadata_value = parse_optional_metadata(metadata)?;
    let (commit_id, commit) = create_genesis_commit_internal(metadata_value, timestamp)?;
    Ok(serde_wasm_bindgen::to_value(&serde_json::json!({
        "commitId": commit_id,
        "commit": commit
    }))?)
}

/// Creates a new ledger container with a genesis commit.
#[wasm_bindgen]
pub fn createLedger(
    metadata: JsValue,
    timestamp: Option<String>,
) -> Result<JsValue, JsValue> {
    let metadata_value = parse_optional_metadata(metadata)?;
    let (commit_id, commit) = create_genesis_commit_internal(metadata_value, timestamp)?;
    let mut commits = BTreeMap::new();
    commits.insert(commit_id.clone(), commit);
    let ledger = LedgerContainer {
        format: "concord-ledger".to_string(),
        version: "1.0".to_string(),
        commits,
        entries: BTreeMap::new(),
        head: commit_id,
    };
    Ok(serde_wasm_bindgen::to_value(&ledger)?)
}

/// Returns commit IDs from genesis to head in replay order.
#[wasm_bindgen]
pub fn getCommitChain(ledger: JsValue) -> Result<JsValue, JsValue> {
    let ledger: LedgerContainer = serde_wasm_bindgen::from_value(ledger)?;
    let mut chain: Vec<String> = Vec::new();
    let mut current = ledger.head.clone();
    while !current.is_empty() {
        chain.push(current.clone());
        let commit = ledger.commits.get(&current);
        if commit.is_none() {
            break;
        }
        current = commit.and_then(|c| c.parent.clone()).unwrap_or_default();
    }
    chain.reverse();
    Ok(serde_wasm_bindgen::to_value(&chain)?)
}

/// True when the commit is the Concord genesis commit.
#[wasm_bindgen]
pub fn isGenesisCommit(commit: JsValue) -> Result<bool, JsValue> {
    let commit: Commit = serde_wasm_bindgen::from_value(commit)?;
    if let Some(Value::Object(meta)) = commit.metadata {
        if let Some(Value::Bool(genesis)) = meta.get("genesis") {
            return Ok(*genesis);
        }
    }
    Ok(false)
}
