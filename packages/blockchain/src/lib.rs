use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use age::{
    armor::{ArmoredReader, ArmoredWriter, Format},
    x25519, Decryptor, Encryptor,
};
use wasm_bindgen::prelude::*;
use web_sys::console;
use secrecy::{ExposeSecret, Secret};

#[derive(Serialize, Deserialize)]
struct Record {
    pub id: String,
    pub timestamp: String,
    pub signature: String,
    pub identity: String,
    pub data: String,
    pub encrypted: String,
    pub collection: String,
}

#[derive(Serialize, Deserialize)]
struct Block {
    pub records: Vec<Record>,
    pub timestamp: String,
    pub last_hash: String,
    pub hash: String,
    pub nonce: i32,
}

#[derive(Serialize, Deserialize)]
struct Blockchain {
    pub chain: Vec<Block>,
    pub pending_records: Vec<Record>,
    pub id: String,
    pub difficulty: i32,
    pub timestamp: String,
}


// fn encrypt_error<T>(_: T) -> JsValue {
//     js_sys::Error::new("encryption error").into()
// }

// fn decrypt_error<T>(_: T) -> JsValue {
//     js_sys::Error::new("decryption error").into()
// }

// UTILS
fn hash_data(data: String) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    let string = format!("{:x}", hasher.finalize());
    string
}

fn proof_of_work(mut block: Block, difficulty: i32) -> Block {
    let difficulty_us: usize = difficulty as usize;
    loop {
        let hash = hash_data(serde_json::to_string(&block).unwrap());
        let hash_prefix: String = hash.chars().take(difficulty_us).collect();
        if hash_prefix == "0".repeat(difficulty_us) {
            block.hash = hash;
            return block;
        }

        block.nonce += 1;
    }
}
// async function proofOfWork(block: IBlock, difficulty: number): Promise<IProof> {
//     let nonce = 0;
//     const findHash = async (block: IBlock) => {
//       let hash: string = await hashData(block);
//       if (hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
//         nonce = nonce + 1;
//         hash = await findHash({
//           ...block,
//           nonce,
//         });
//       }
//       return hash;
//     };
//     const hash = await findHash(block);

//     return { proof: hash, nonce };
//   }

// When the `wee_alloc` feature is enabled, this uses `wee_alloc` as the global
// allocator.
//
// If you don't want to use `wee_alloc`, you can safely delete this.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// This is like the `main` function, except for JavaScript.
#[wasm_bindgen(start)]
pub fn main_js() -> Result<(), JsValue> {
    // This provides better error messages in debug mode.
    // It's disabled in release mode so it doesn't bloat up the file size.
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();

    // Your code goes here!
    console::log_1(&JsValue::from_str("Program started"));

    Ok(())
}

// fn create_block() -> Block {}
fn create_genesis_block(record: Record) -> Block {
    let block = Block {
        records: vec![record],
        timestamp: chrono::Local::now().timestamp().to_string(),
        last_hash: "0".to_string(),
        hash: "0".to_string(),
        nonce: 0,
    };
    block
}

fn create_block(record: Record, last_hash: String) -> Block {
    let block = Block {
        records: vec![record],
        timestamp: chrono::Local::now().timestamp().to_string(),
        last_hash: last_hash,
        hash: "00000".to_string(),
        nonce: 0,
    };

    block
}

fn create_record(record: JsValue) -> Record {
    let record: Record = serde_wasm_bindgen::from_value(record).unwrap();

    let public_key = age::x25519::Identity::generate().to_public();

    let record = Record {
        id: record.id,
        timestamp: chrono::Local::now().timestamp().to_string(),
        signature: record.signature,
        identity: record.identity,
        encrypted: public_key.to_string(),
        collection: record.collection,
        data: record.data.to_string(),
    };
    record
}

#[wasm_bindgen]
pub fn keygen() -> Vec<JsValue> {
    let secret = x25519::Identity::generate();
    let public = secret.to_public();
    vec![
        JsValue::from(secret.to_string().expose_secret()),
        JsValue::from(public.to_string()),
    ]
}

// Expose a function to JavaScript that creates a blockchain
#[wasm_bindgen]
pub fn createBlockchain(_record: JsValue) -> Result<JsValue, JsValue> {
    // This provides better error messages in debug mode.
    // It's disabled in release mode so it doesn't bloat up the file size.
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();

    let mut blockchain = Blockchain {
        chain: Vec::new(),
        pending_records: Vec::new(),
        difficulty: 1,
        timestamp: chrono::Local::now().timestamp().to_string(),
        id: "testchain".to_string(),
    };

    let record: Record = create_record(_record);
    let genesis_block: Block = create_genesis_block(record);
    blockchain.chain.push(genesis_block);

    Ok(serde_wasm_bindgen::to_value(&blockchain)?)
}

// Expose a function to hash data
#[wasm_bindgen]
pub fn hashData(_record: JsValue) -> Result<JsValue, JsValue> {
    // This provides better error messages in debug mode.
    // It's disabled in release mode so it doesn't bloat up the file size.
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();

    let result = hash_data(serde_wasm_bindgen::from_value(_record).unwrap());

    Ok(serde_wasm_bindgen::to_value(&result)?)
}

// Expose a function to hash data
#[wasm_bindgen]
pub fn proofOfWork(_record: JsValue, difficulty: i32) -> Result<JsValue, JsValue> {
    // This provides better error messages in debug mode.
    // It's disabled in release mode so it doesn't bloat up the file size.
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();

    // let result = hash_data(serde_wasm_bindgen::from_value(_record).unwrap());
    let record: Record = create_record(_record);
    let block: Block = create_block(record, "last_hash".to_string());

    let result: Block = proof_of_work(block, difficulty);
    // let result: String = String::from("test me");

    Ok(serde_wasm_bindgen::to_value(&result)?)
}




// #[wasm_bindgen]
// pub fn encrypt_with_x25519(
//     public_key: &str,
//     data: &[u8],
//     armor: bool,
// ) -> Result<Box<[u8]>, JsValue> {
//     let key: x25519::Recipient = public_key.parse().map_err(encrypt_error)?;
//     let recipients = vec![Box::new(key) as Box<dyn age::Recipient + Send + 'static>];
//     let encryptor = Encryptor::with_recipients(recipients).unwrap();
//     let mut output = vec![];
//     let format = if armor {
//         Format::AsciiArmor
//     } else {
//         Format::Binary
//     };
//     let armor = ArmoredWriter::wrap_output(&mut output, format).map_err(encrypt_error)?;
//     let mut writer = encryptor.wrap_output(armor).map_err(encrypt_error)?;
//     writer.write_all(data).map_err(encrypt_error)?;
//     writer
//         .finish()
//         .and_then(|armor| armor.finish())
//         .map_err(encrypt_error)?;
//     Ok(output.into_boxed_slice())
// }