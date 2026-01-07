use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};
use wasm_bindgen::prelude::*;

const PROTOCOL_SPEC: &str = "concord-protocol@1.0";
const LEDGER_FORMAT: &str = "concord-ledger";
const LEDGER_VERSION: &str = "1.0";

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

#[derive(Deserialize)]
struct CreateCommitParams {
    pub ledger: LedgerContainer,
    pub entries: Vec<String>,
    pub metadata: Option<Value>,
    pub timestamp: Option<String>,
    pub parent: Option<String>,
}

#[derive(Deserialize)]
struct ValidationOptions {
    #[serde(rename = "strictSpec")]
    pub strict_spec: Option<bool>,
}

fn error_value(code: &str, message: &str) -> JsValue {
    serde_wasm_bindgen::to_value(&serde_json::json!({
        "code": code,
        "message": message
    }))
    .unwrap_or_else(|_| JsValue::from_str(message))
}

fn error_message(value: JsValue) -> String {
    if let Some(message) = value.as_string() {
        return message;
    }
    if value.is_object() {
        if let Ok(message) = js_sys::Reflect::get(&value, &JsValue::from_str("message")) {
            if let Some(message) = message.as_string() {
                return message;
            }
        }
    }
    "Ledger commit chain is invalid".to_string()
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

fn canonical_stringify_value(value: &Value) -> Result<String, JsValue> {
    let canonical = canonicalize_value(value);
    serde_json::to_string(&canonical).map_err(|e| JsValue::from_str(&e.to_string()))
}

fn hash_canonical_string(canonical: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(canonical.as_bytes());
    format!("{:x}", hasher.finalize())
}

fn hash_canonical(value: &Value) -> Result<String, JsValue> {
    let canonical = canonical_stringify_value(value)?;
    Ok(hash_canonical_string(&canonical))
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
        Value::String(PROTOCOL_SPEC.to_string()),
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

fn is_genesis_commit_internal(commit: &Commit) -> bool {
    if let Some(Value::Object(meta)) = &commit.metadata {
        if let Some(Value::Bool(genesis)) = meta.get("genesis") {
            return *genesis;
        }
    }
    false
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
    let commit_id = hash_canonical(&commit_value)?;
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
pub fn canonical_stringify(value: JsValue) -> Result<JsValue, JsValue> {
    let value: Value = serde_wasm_bindgen::from_value(value)?;
    let canonical = canonical_stringify_value(&value)?;
    Ok(JsValue::from_str(&canonical))
}

/// SHA-256 hash of the canonical JSON serialization.
#[wasm_bindgen]
pub fn hash_data(value: JsValue) -> Result<JsValue, JsValue> {
    let value: Value = serde_wasm_bindgen::from_value(value)?;
    Ok(JsValue::from_str(&hash_canonical(&value)?))
}

/// Canonical signing payload bytes for an entry (excludes signature).
#[wasm_bindgen]
pub fn get_entry_signing_bytes(entry: JsValue) -> Result<JsValue, JsValue> {
    let entry: Entry = serde_wasm_bindgen::from_value(entry)?;
    let core = entry_core_value(&entry);
    let payload = canonical_stringify_value(&core)?;
    let bytes = js_sys::Uint8Array::from(payload.as_bytes());
    Ok(bytes.into())
}

/// Canonical signing payload for an entry (excludes signature).
#[wasm_bindgen]
pub fn get_entry_signing_payload(entry: JsValue) -> Result<JsValue, JsValue> {
    let entry: Entry = serde_wasm_bindgen::from_value(entry)?;
    let core = entry_core_value(&entry);
    Ok(JsValue::from_str(&canonical_stringify_value(&core)?))
}

/// Deterministically derives an EntryID from entry content.
#[wasm_bindgen]
pub fn derive_entry_id(entry: JsValue) -> Result<JsValue, JsValue> {
    let entry: Entry = serde_wasm_bindgen::from_value(entry)?;
    let core = entry_core_value(&entry);
    Ok(JsValue::from_str(&hash_canonical(&core)?))
}

/// Deterministically derives a CommitID from commit content.
#[wasm_bindgen]
pub fn derive_commit_id(commit: JsValue) -> Result<JsValue, JsValue> {
    let commit: Commit = serde_wasm_bindgen::from_value(commit)?;
    let commit_value = serde_json::to_value(commit).map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(JsValue::from_str(&hash_canonical(&commit_value)?))
}

/// Creates the genesis commit for a new ledger.
#[wasm_bindgen]
pub fn create_genesis_commit(
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
pub fn create_ledger(
    metadata: JsValue,
    timestamp: Option<String>,
) -> Result<JsValue, JsValue> {
    let metadata_value = parse_optional_metadata(metadata)?;
    let (commit_id, commit) = create_genesis_commit_internal(metadata_value, timestamp)?;
    let mut commits = BTreeMap::new();
    commits.insert(commit_id.clone(), commit);
    let ledger = LedgerContainer {
        format: LEDGER_FORMAT.to_string(),
        version: LEDGER_VERSION.to_string(),
        commits,
        entries: BTreeMap::new(),
        head: commit_id,
    };
    Ok(serde_wasm_bindgen::to_value(&ledger)?)
}

/// Returns commit IDs from genesis to head in replay order.
#[wasm_bindgen]
pub fn get_commit_chain(ledger: JsValue) -> Result<JsValue, JsValue> {
    let ledger: LedgerContainer = serde_wasm_bindgen::from_value(ledger)?;
    let mut chain: Vec<String> = Vec::new();
    if !ledger.commits.contains_key(&ledger.head) {
        return Err(error_value(
            "MISSING_HEAD",
            &format!("Missing head commit {}", ledger.head),
        ));
    }
    let mut visited: BTreeSet<String> = BTreeSet::new();
    let mut current = Some(ledger.head.clone());
    while let Some(commit_id) = current {
        if visited.contains(&commit_id) {
            return Err(error_value(
                "COMMIT_CHAIN_CYCLE",
                &format!("Commit chain cycle detected at {}", commit_id),
            ));
        }
        visited.insert(commit_id.clone());
        chain.push(commit_id.clone());
        let commit = ledger.commits.get(&commit_id);
        if commit.is_none() {
            return Err(error_value(
                "MISSING_COMMIT",
                &format!("Missing commit {}", commit_id),
            ));
        }
        let parent = commit.and_then(|c| c.parent.clone());
        if let Some(parent_id) = &parent {
            if parent_id.is_empty() {
                return Err(error_value(
                    "INVALID_PARENT",
                    "Commit parent must be null or a CommitID",
                ));
            }
        }
        current = parent;
    }
    chain.reverse();
    Ok(serde_wasm_bindgen::to_value(&chain)?)
}

/// True when the commit is the Concord genesis commit.
#[wasm_bindgen]
pub fn is_genesis_commit(commit: JsValue) -> Result<bool, JsValue> {
    let commit: Commit = serde_wasm_bindgen::from_value(commit)?;
    Ok(is_genesis_commit_internal(&commit))
}

/// Creates a non-genesis commit with validated parent and entry references.
#[wasm_bindgen]
pub fn create_commit(params: JsValue) -> Result<JsValue, JsValue> {
    let params: CreateCommitParams = serde_wasm_bindgen::from_value(params)?;
    for entry_id in &params.entries {
        if !params.ledger.entries.contains_key(entry_id) {
            return Err(error_value(
                "MISSING_ENTRY",
                &format!("Missing entry {}", entry_id),
            ));
        }
    }

    let parent = params.parent.unwrap_or(params.ledger.head.clone());
    if parent.is_empty() {
        return Err(error_value(
            "INVALID_PARENT",
            "Non-genesis commits must reference a parent",
        ));
    }
    if !params.ledger.commits.contains_key(&parent) {
        return Err(error_value(
            "MISSING_COMMIT",
            &format!("Missing commit {}", parent),
        ));
    }

    let commit = Commit {
        parent: Some(parent),
        timestamp: params.timestamp.unwrap_or_else(now_iso),
        metadata: params.metadata.or(Some(Value::Null)),
        entries: params.entries,
    };
    let commit_value =
        serde_json::to_value(commit.clone()).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let commit_id = hash_canonical(&commit_value)?;
    Ok(serde_wasm_bindgen::to_value(&serde_json::json!({
        "commitId": commit_id,
        "commit": commit
    }))?)
}

/// Appends a commit to a ledger with validation.
#[wasm_bindgen]
pub fn append_commit(
    ledger: JsValue,
    commit_id: String,
    commit: JsValue,
) -> Result<JsValue, JsValue> {
    let mut ledger: LedgerContainer = serde_wasm_bindgen::from_value(ledger)?;
    let commit: Commit = serde_wasm_bindgen::from_value(commit)?;
    if is_genesis_commit_internal(&commit) {
        return Err(error_value(
            "INVALID_COMMIT",
            "Genesis commits must be created via create_ledger",
        ));
    }
    match &commit.parent {
        Some(parent) if !parent.is_empty() => {
            if !ledger.commits.contains_key(parent) {
                return Err(error_value(
                    "MISSING_COMMIT",
                    &format!("Missing commit {}", parent),
                ));
            }
        }
        _ => {
            return Err(error_value(
                "INVALID_PARENT",
                "Commit parent must be a non-empty CommitID",
            ));
        }
    }

    let commit_errors = validate_commit_internal(&commit);
    if !commit_errors.is_empty() {
        return Err(error_value(
            "INVALID_COMMIT",
            &commit_errors.join("; "),
        ));
    }
    for entry_id in &commit.entries {
        if !ledger.entries.contains_key(entry_id) {
            return Err(error_value(
                "MISSING_ENTRY",
                &format!("Missing entry {}", entry_id),
            ));
        }
    }
    if ledger.commits.contains_key(&commit_id) {
        return Err(error_value(
            "DUPLICATE_COMMIT",
            &format!("Commit {} already exists", commit_id),
        ));
    }

    ledger.commits.insert(commit_id.clone(), commit);
    ledger.head = commit_id;
    Ok(serde_wasm_bindgen::to_value(&ledger)?)
}

/// Append a commit and verify its CommitID matches the commit content.
#[wasm_bindgen]
pub fn append_commit_strict(
    ledger: JsValue,
    commit_id: String,
    commit: JsValue,
) -> Result<JsValue, JsValue> {
    let commit: Commit = serde_wasm_bindgen::from_value(commit.clone())?;
    let commit_value =
        serde_json::to_value(commit.clone()).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let derived_id = hash_canonical(&commit_value)?;
    if derived_id != commit_id {
        return Err(error_value(
            "COMMIT_ID_MISMATCH",
            "CommitID does not match commit content",
        ));
    }
    let commit_js = serde_wasm_bindgen::to_value(&commit)?;
    append_commit(ledger, commit_id, commit_js)
}

/// Append an entry after validating shape and canonicalizability.
#[wasm_bindgen]
pub fn append_entry(ledger: JsValue, entry: JsValue) -> Result<JsValue, JsValue> {
    let mut ledger: LedgerContainer = serde_wasm_bindgen::from_value(ledger)?;
    let entry: Entry = serde_wasm_bindgen::from_value(entry)?;
    let entry_errors = validate_entry_internal(&entry);
    if !entry_errors.is_empty() {
        return Err(error_value(
            "INVALID_ENTRY",
            &entry_errors.join("; "),
        ));
    }
    let core = entry_core_value(&entry);
    let canonical = canonical_stringify_value(&core)
        .map_err(|error| error_value("INVALID_ENTRY_PAYLOAD", &error_message(error)))?;
    let entry_id = hash_canonical_string(&canonical);
    if ledger.entries.contains_key(&entry_id) {
        return Err(error_value(
            "DUPLICATE_ENTRY",
            &format!("Entry {} already exists", entry_id),
        ));
    }
    ledger.entries.insert(entry_id.clone(), entry);
    Ok(serde_wasm_bindgen::to_value(&serde_json::json!({
        "entryId": entry_id,
        "ledger": ledger
    }))?)
}

/// Returns entry IDs in deterministic replay order (skipping genesis).
#[wasm_bindgen]
pub fn get_replay_entry_ids(ledger: JsValue) -> Result<JsValue, JsValue> {
    let ledger_value = ledger.clone();
    let ledger: LedgerContainer = serde_wasm_bindgen::from_value(ledger)?;
    let chain_value = get_commit_chain(ledger_value)?;
    let chain: Vec<String> = serde_wasm_bindgen::from_value(chain_value)?;
    let mut entry_ids: Vec<String> = Vec::new();
    for commit_id in chain {
        if let Some(commit) = ledger.commits.get(&commit_id) {
            if is_genesis_commit_internal(commit) {
                continue;
            }
            entry_ids.extend(commit.entries.iter().cloned());
        }
    }
    Ok(serde_wasm_bindgen::to_value(&entry_ids)?)
}

/// Resolve entries in deterministic replay order.
#[wasm_bindgen]
pub fn get_replay_entries(ledger: JsValue) -> Result<JsValue, JsValue> {
    let ledger_value = ledger.clone();
    let ledger: LedgerContainer = serde_wasm_bindgen::from_value(ledger)?;
    let entry_ids_value = get_replay_entry_ids(ledger_value)?;
    let entry_ids: Vec<String> = serde_wasm_bindgen::from_value(entry_ids_value)?;
    let mut entries: Vec<Entry> = Vec::new();
    for entry_id in entry_ids {
        let entry = ledger.entries.get(&entry_id);
        if entry.is_none() {
            return Err(error_value(
                "MISSING_ENTRY",
                &format!("Missing entry {}", entry_id),
            ));
        }
        entries.push(entry.cloned().unwrap());
    }
    Ok(serde_wasm_bindgen::to_value(&entries)?)
}

fn validate_entry_internal(entry: &Entry) -> Vec<String> {
    let mut errors: Vec<String> = Vec::new();
    if entry.kind.is_empty() {
        errors.push("Entry.kind must be a non-empty string".to_string());
    }
    if entry.timestamp.is_empty() {
        errors.push("Entry.timestamp must be a non-empty string".to_string());
    }
    if entry.author.is_empty() {
        errors.push("Entry.author must be a non-empty string".to_string());
    }
    if let Err(error) = canonical_stringify_value(&entry_core_value(entry)) {
        errors.push(error_message(error));
    }
    errors
}

fn validate_commit_internal(commit: &Commit) -> Vec<String> {
    let mut errors: Vec<String> = Vec::new();
    if commit.timestamp.is_empty() {
        errors.push("Commit.timestamp must be a non-empty string".to_string());
    }
    if let Some(parent) = &commit.parent {
        if parent.is_empty() {
            errors.push("Commit.parent must be a non-empty string or null".to_string());
        }
    }
    if let Some(metadata) = &commit.metadata {
        if !metadata.is_null() && !metadata.is_object() {
            errors.push("Commit.metadata must be an object or null".to_string());
        }
    }
    errors
}

/// Validate entry shape and canonicalizability.
#[wasm_bindgen]
pub fn validate_entry(entry: JsValue) -> Result<JsValue, JsValue> {
    let entry: Entry = serde_wasm_bindgen::from_value(entry)?;
    let errors = validate_entry_internal(&entry);
    Ok(serde_wasm_bindgen::to_value(&serde_json::json!({
        "ok": errors.is_empty(),
        "errors": errors
    }))?)
}

/// Validate commit shape without dereferencing external state.
#[wasm_bindgen]
pub fn validate_commit(commit: JsValue) -> Result<JsValue, JsValue> {
    let commit: Commit = serde_wasm_bindgen::from_value(commit)?;
    let errors = validate_commit_internal(&commit);
    Ok(serde_wasm_bindgen::to_value(&serde_json::json!({
        "ok": errors.is_empty(),
        "errors": errors
    }))?)
}

/// Validate ledger structure, commit chain, and genesis invariants.
#[wasm_bindgen]
pub fn validate_ledger(ledger: JsValue, options: JsValue) -> Result<JsValue, JsValue> {
    let ledger: LedgerContainer = serde_wasm_bindgen::from_value(ledger)?;
    let strict_spec = if !options.is_null() && !options.is_undefined() {
        let opts: ValidationOptions = serde_wasm_bindgen::from_value(options)?;
        opts.strict_spec.unwrap_or(true)
    } else {
        true
    };

    let mut errors: Vec<String> = Vec::new();
    if ledger.format != LEDGER_FORMAT {
        errors.push(format!("Ledger.format must be \"{}\"", LEDGER_FORMAT));
    }
    if ledger.version != LEDGER_VERSION {
        errors.push(format!("Ledger.version must be \"{}\"", LEDGER_VERSION));
    }
    if ledger.head.is_empty() {
        errors.push("Ledger.head must be a string".to_string());
    }

    if errors.is_empty() {
        if !ledger.commits.contains_key(&ledger.head) {
            errors.push(format!(
                "Ledger head {} does not exist in commits",
                ledger.head
            ));
        }
        let chain = match get_commit_chain(serde_wasm_bindgen::to_value(&ledger)?) {
            Ok(value) => serde_wasm_bindgen::from_value::<Vec<String>>(value)?,
            Err(err) => {
                errors.push(error_message(err));
                Vec::new()
            }
        };

        if !chain.is_empty() {
            let genesis_id = &chain[0];
            let genesis = ledger.commits.get(genesis_id);
            if genesis.is_none() {
                errors.push("Genesis commit is missing".to_string());
            } else {
                let genesis = genesis.unwrap();
                if genesis.parent.is_some() {
                    errors.push("Genesis commit parent must be null".to_string());
                }
                if !genesis.entries.is_empty() {
                    errors.push("Genesis commit entries must be an empty array".to_string());
                }
                match &genesis.metadata {
                    Some(Value::Object(meta)) => {
                        if meta.get("genesis") != Some(&Value::Bool(true)) {
                            errors.push("Genesis commit metadata.genesis must be true".to_string());
                        }
                        match meta.get("spec") {
                            Some(Value::String(spec)) => {
                                if strict_spec && spec != PROTOCOL_SPEC {
                                    errors.push(format!(
                                        "Genesis commit metadata.spec must be \"{}\"",
                                        PROTOCOL_SPEC
                                    ));
                                }
                            }
                            Some(_) => errors.push(
                                "Genesis commit metadata.spec must be a string".to_string(),
                            ),
                            None => errors.push(
                                "Genesis commit metadata.spec is required".to_string(),
                            ),
                        }
                    }
                    Some(_) => errors.push("Genesis commit metadata must be an object".to_string()),
                    None => errors.push("Genesis commit metadata must be an object".to_string()),
                }
            }
        }

        for (commit_id, commit) in &ledger.commits {
            let commit_errors = validate_commit_internal(commit);
            if !commit_errors.is_empty() {
                errors.extend(
                    commit_errors
                        .into_iter()
                        .map(|err| format!("Commit {}: {}", commit_id, err)),
                );
            }
            for entry_id in &commit.entries {
                if !ledger.entries.contains_key(entry_id) {
                    errors.push(format!(
                        "Commit {} references missing entry {}",
                        commit_id, entry_id
                    ));
                }
            }
        }

        for (entry_id, entry) in &ledger.entries {
            let entry_errors = validate_entry_internal(entry);
            if !entry_errors.is_empty() {
                errors.extend(
                    entry_errors
                        .into_iter()
                        .map(|err| format!("Entry {}: {}", entry_id, err)),
                );
            }
        }
    }

    Ok(serde_wasm_bindgen::to_value(&serde_json::json!({
        "ok": errors.is_empty(),
        "errors": errors
    }))?)
}
