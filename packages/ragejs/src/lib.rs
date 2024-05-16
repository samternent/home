use age::{
    armor::{ArmoredReader, ArmoredWriter, Format},
    x25519, Decryptor, Encryptor,
};
use secrecy::{ExposeSecret, Secret};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use wasm_bindgen::prelude::*;
use web_sys::console;

// fn encrypt_error<T>(_: T) -> JsValue {
//     js_sys::Error::new("encryption error").into()
// }

// fn decrypt_error<T>(_: T) -> JsValue {
//     js_sys::Error::new("decryption error").into()
// }

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

#[wasm_bindgen]
pub fn keygen() -> Vec<JsValue> {
    let secret = x25519::Identity::generate();
    let public = secret.to_public();
    vec![
        JsValue::from(secret.to_string().expose_secret()),
        JsValue::from(public.to_string()),
    ]
}

#[wasm_bindgen]
pub fn encrypt_with_x25519(
    public_key: &str,
    data: &[u8],
    armor: bool,
) -> Result<Box<[u8]>, JsValue> {
    let key: x25519::Recipient = public_key.parse().map_err(encrypt_error)?;
    let recipients = vec![Box::new(key) as Box<dyn age::Recipient + Send + 'static>];
    let encryptor = Encryptor::with_recipients(recipients).unwrap();
    let mut output = vec![];
    let format = if armor {
        Format::AsciiArmor
    } else {
        Format::Binary
    };
    let armor = ArmoredWriter::wrap_output(&mut output, format).map_err(encrypt_error)?;
    let mut writer = encryptor.wrap_output(armor).map_err(encrypt_error)?;
    writer.write_all(data).map_err(encrypt_error)?;
    writer
        .finish()
        .and_then(|armor| armor.finish())
        .map_err(encrypt_error)?;
    Ok(output.into_boxed_slice())
}
