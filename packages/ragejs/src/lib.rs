use age::{
    armor::{ArmoredReader, ArmoredWriter, Format},
    x25519, Decryptor, Encryptor,
};
use secrecy::{ExposeSecret, Secret};
use std::io::{Read, Write};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::future_to_promise;
use web_sys::console;

// Maximum message size (64MB)
const MAX_MESSAGE_SIZE: usize = 64 * 1024 * 1024;

fn encrypt_error<T: std::fmt::Display>(error: T) -> JsValue {
    js_sys::Error::new(&format!("Encryption failed: {}", error)).into()
}

fn decrypt_error<T: std::fmt::Display>(error: T) -> JsValue {
    js_sys::Error::new(&format!("Decryption failed: {}", error)).into()
}

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
    #[cfg(feature = "console_error_panic_hook")]
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
    // Input validation
    if data.is_empty() {
        return Err(JsValue::from_str("Data cannot be empty"));
    }
    if data.len() > MAX_MESSAGE_SIZE {
        return Err(JsValue::from_str("Data too large (max 64MB)"));
    }
    if public_key.trim().is_empty() {
        return Err(JsValue::from_str("Public key cannot be empty"));
    }

    let key: x25519::Recipient = public_key.parse().map_err(encrypt_error)?;
    let recipients = vec![Box::new(key) as Box<dyn age::Recipient + Send + 'static>];
    let encryptor = Encryptor::with_recipients(recipients)
        .ok_or_else(|| JsValue::from_str("Failed to create encryptor"))?;
    let mut output = vec![];
    let format = if armor {
        Format::AsciiArmor
    } else {
        Format::Binary
    };
    let armor = ArmoredWriter::wrap_output(&mut output, format).map_err(encrypt_error)?;
    let mut writer = encryptor.wrap_output(armor).map_err(encrypt_error)?;
    writer.write_all(data).map_err(encrypt_error)?;
    let armor = writer.finish().map_err(encrypt_error)?;
    armor.finish().map_err(encrypt_error)?;
    Ok(output.into_boxed_slice())
}

#[wasm_bindgen]
pub fn decrypt_with_x25519(
    private_key: &str,
    data: &[u8],
) -> Result<Box<[u8]>, JsValue> {
    // Input validation
    if data.is_empty() {
        return Err(JsValue::from_str("Encrypted data cannot be empty"));
    }
    if private_key.trim().is_empty() {
        return Err(JsValue::from_str("Private key cannot be empty"));
    }

    let identity: x25519::Identity = private_key.parse().map_err(decrypt_error)?;
    let identities = vec![&identity as &dyn age::Identity];
    
    let mut reader = std::io::Cursor::new(data);
    let reader = ArmoredReader::new(&mut reader);
    
    let decryptor = match Decryptor::new(reader).map_err(decrypt_error)? {
        Decryptor::Recipients(d) => d,
        Decryptor::Passphrase(_) => return Err(decrypt_error("Expected recipients, got passphrase")),
    };
    
    let mut decrypted = vec![];
    let mut reader = decryptor.decrypt(identities.iter().copied()).map_err(decrypt_error)?;
    reader.read_to_end(&mut decrypted).map_err(decrypt_error)?;
    
    Ok(decrypted.into_boxed_slice())
}

#[wasm_bindgen]
pub fn encrypt_with_user_passphrase(
    passphrase: &str,
    data: &[u8],
    armor: bool,
) -> Result<Box<[u8]>, JsValue> {
    // Input validation
    if data.is_empty() {
        return Err(JsValue::from_str("Data cannot be empty"));
    }
    if data.len() > MAX_MESSAGE_SIZE {
        return Err(JsValue::from_str("Data too large (max 64MB)"));
    }
    if passphrase.is_empty() {
        return Err(JsValue::from_str("Passphrase cannot be empty"));
    }

    let encryptor = Encryptor::with_user_passphrase(Secret::new(passphrase.to_owned()));
    let mut output = vec![];
    let format = if armor {
        Format::AsciiArmor
    } else {
        Format::Binary
    };
    let armor = ArmoredWriter::wrap_output(&mut output, format).map_err(encrypt_error)?;
    let mut writer = encryptor.wrap_output(armor).map_err(encrypt_error)?;
    writer.write_all(data).map_err(encrypt_error)?;
    let armor = writer.finish().map_err(encrypt_error)?;
    armor.finish().map_err(encrypt_error)?;
    Ok(output.into_boxed_slice())
}

#[wasm_bindgen]
pub fn decrypt_with_user_passphrase(
    passphrase: &str,
    data: &[u8],
) -> Result<Box<[u8]>, JsValue> {
    // Input validation
    if data.is_empty() {
        return Err(JsValue::from_str("Encrypted data cannot be empty"));
    }
    if passphrase.is_empty() {
        return Err(JsValue::from_str("Passphrase cannot be empty"));
    }

    let mut reader = std::io::Cursor::new(data);
    let reader = ArmoredReader::new(&mut reader);
    
    let decryptor = match Decryptor::new(reader).map_err(decrypt_error)? {
        Decryptor::Passphrase(d) => d,
        Decryptor::Recipients(_) => return Err(decrypt_error("Expected passphrase, got recipients")),
    };
    
    let mut decrypted = vec![];
    let mut reader = decryptor.decrypt(&Secret::new(passphrase.to_owned()), None).map_err(decrypt_error)?;
    reader.read_to_end(&mut decrypted).map_err(decrypt_error)?;
    
    Ok(decrypted.into_boxed_slice())
}

// Simplified async functions that return js_sys::Promise directly
#[wasm_bindgen]
pub fn keygen_async() -> js_sys::Promise {
    future_to_promise(async move {
        let secret = x25519::Identity::generate();
        let public = secret.to_public();
        let result = js_sys::Array::new();
        result.push(&JsValue::from(secret.to_string().expose_secret()));
        result.push(&JsValue::from(public.to_string()));
        Ok(result.into())
    })
}

#[wasm_bindgen]
pub fn encrypt_async(public_key: &str, data: &[u8], armor: bool) -> js_sys::Promise {
    let public_key = public_key.to_string();
    let data = data.to_vec();
    
    future_to_promise(async move {
        // Input validation
        if data.is_empty() {
            return Err(JsValue::from_str("Data cannot be empty"));
        }
        if data.len() > MAX_MESSAGE_SIZE {
            return Err(JsValue::from_str("Data too large (max 64MB)"));
        }
        if public_key.trim().is_empty() {
            return Err(JsValue::from_str("Public key cannot be empty"));
        }

        let key: x25519::Recipient = public_key.parse().map_err(encrypt_error)?;
        let recipients = vec![Box::new(key) as Box<dyn age::Recipient + Send + 'static>];
        let encryptor = Encryptor::with_recipients(recipients)
            .ok_or_else(|| JsValue::from_str("Failed to create encryptor"))?;
        let mut output = vec![];
        let format = if armor {
            Format::AsciiArmor
        } else {
            Format::Binary
        };
        let armor_writer = ArmoredWriter::wrap_output(&mut output, format).map_err(encrypt_error)?;
        let mut writer = encryptor.wrap_output(armor_writer).map_err(encrypt_error)?;
        writer.write_all(&data).map_err(encrypt_error)?;
        let armor = writer.finish().map_err(encrypt_error)?;
        armor.finish().map_err(encrypt_error)?;
        Ok(js_sys::Uint8Array::from(&output[..]).into())
    })
}

#[wasm_bindgen]
pub fn encrypt_passphrase_async(passphrase: &str, data: &[u8], armor: bool) -> js_sys::Promise {
    let passphrase = passphrase.to_string();
    let data = data.to_vec();
    
    future_to_promise(async move {
        // Input validation
        if data.is_empty() {
            return Err(JsValue::from_str("Data cannot be empty"));
        }
        if data.len() > MAX_MESSAGE_SIZE {
            return Err(JsValue::from_str("Data too large (max 64MB)"));
        }
        if passphrase.is_empty() {
            return Err(JsValue::from_str("Passphrase cannot be empty"));
        }

        let encryptor = Encryptor::with_user_passphrase(Secret::new(passphrase));
        let mut output = vec![];
        let format = if armor {
            Format::AsciiArmor
        } else {
            Format::Binary
        };
        let armor_writer = ArmoredWriter::wrap_output(&mut output, format).map_err(encrypt_error)?;
        let mut writer = encryptor.wrap_output(armor_writer).map_err(encrypt_error)?;
        writer.write_all(&data).map_err(encrypt_error)?;
        let armor = writer.finish().map_err(encrypt_error)?;
        armor.finish().map_err(encrypt_error)?;
        Ok(js_sys::Uint8Array::from(&output[..]).into())
    })
}

#[wasm_bindgen]
pub fn decrypt_async(private_key: &str, data: &[u8]) -> js_sys::Promise {
    let private_key = private_key.to_string();
    let data = data.to_vec();
    
    future_to_promise(async move {
        // Input validation
        if data.is_empty() {
            return Err(JsValue::from_str("Encrypted data cannot be empty"));
        }
        if private_key.trim().is_empty() {
            return Err(JsValue::from_str("Private key cannot be empty"));
        }

        let identity: x25519::Identity = private_key.parse().map_err(decrypt_error)?;
        let identities = vec![&identity as &dyn age::Identity];
        
        let mut reader = std::io::Cursor::new(&data);
        let reader = ArmoredReader::new(&mut reader);
        
        let decryptor = match Decryptor::new(reader).map_err(decrypt_error)? {
            Decryptor::Recipients(d) => d,
            Decryptor::Passphrase(_) => return Err(decrypt_error("Expected recipients, got passphrase")),
        };
        
        let mut decrypted = vec![];
        let mut reader = decryptor.decrypt(identities.iter().copied()).map_err(decrypt_error)?;
        reader.read_to_end(&mut decrypted).map_err(decrypt_error)?;
        
        Ok(js_sys::Uint8Array::from(&decrypted[..]).into())
    })
}

#[wasm_bindgen]
pub fn decrypt_passphrase_async(passphrase: &str, data: &[u8]) -> js_sys::Promise {
    let passphrase = passphrase.to_string();
    let data = data.to_vec();
    
    future_to_promise(async move {
        // Input validation
        if data.is_empty() {
            return Err(JsValue::from_str("Encrypted data cannot be empty"));
        }
        if passphrase.is_empty() {
            return Err(JsValue::from_str("Passphrase cannot be empty"));
        }

        let mut reader = std::io::Cursor::new(&data);
        let reader = ArmoredReader::new(&mut reader);
        
        let decryptor = match Decryptor::new(reader).map_err(decrypt_error)? {
            Decryptor::Passphrase(d) => d,
            Decryptor::Recipients(_) => return Err(decrypt_error("Expected passphrase, got recipients")),
        };
        
        let mut decrypted = vec![];
        let mut reader = decryptor.decrypt(&Secret::new(passphrase), None).map_err(decrypt_error)?;
        reader.read_to_end(&mut decrypted).map_err(decrypt_error)?;
        
        Ok(js_sys::Uint8Array::from(&decrypted[..]).into())
    })
}

#[cfg(test)]
mod tests;
