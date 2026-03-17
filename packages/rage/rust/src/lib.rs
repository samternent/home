use age::{
    armor::{ArmoredReader, ArmoredWriter, Format},
    x25519, Decryptor, Encryptor,
};
use js_sys::{Array, Promise, Uint8Array};
use secrecy::{ExposeSecret, Secret};
use std::io::{Cursor, Read, Write};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::future_to_promise;

const MAX_MESSAGE_SIZE: usize = 64 * 1024 * 1024;
const MESSAGE_EMPTY_DATA: &str = "data must not be empty";
const MESSAGE_EMPTY_RECIPIENTS: &str = "at least one recipient is required";
const MESSAGE_INVALID_RECIPIENT: &str = "invalid recipient";
const MESSAGE_INVALID_IDENTITY: &str = "invalid identity";
const MESSAGE_EMPTY_PASSPHRASE: &str = "passphrase must not be empty";
const MESSAGE_DATA_TOO_LARGE: &str = "data too large (max 64MB)";
const MESSAGE_ENCRYPT_FAILED: &str = "encrypt failed";
const MESSAGE_DECRYPT_FAILED: &str = "decrypt failed";

fn js_error(message: &'static str) -> JsValue {
    js_sys::Error::new(message).into()
}

fn ensure_non_empty_data(data: &[u8]) -> Result<(), &'static str> {
    if data.is_empty() {
        return Err(MESSAGE_EMPTY_DATA);
    }
    Ok(())
}

fn ensure_within_limit(data: &[u8]) -> Result<(), &'static str> {
    if data.len() > MAX_MESSAGE_SIZE {
        return Err(MESSAGE_DATA_TOO_LARGE);
    }
    Ok(())
}

fn ensure_non_empty_passphrase(passphrase: &str) -> Result<(), &'static str> {
    if passphrase.is_empty() {
        return Err(MESSAGE_EMPTY_PASSPHRASE);
    }
    Ok(())
}

fn collect_recipients(values: Vec<String>) -> Result<Vec<Box<dyn age::Recipient + Send>>, &'static str> {
    if values.is_empty() {
        return Err(MESSAGE_EMPTY_RECIPIENTS);
    }

    let mut recipients: Vec<Box<dyn age::Recipient + Send>> = Vec::with_capacity(values.len());
    for value in values {
        if value.trim().is_empty() {
            return Err(MESSAGE_INVALID_RECIPIENT);
        }

        let recipient: x25519::Recipient = value.parse().map_err(|_| MESSAGE_INVALID_RECIPIENT)?;
        recipients.push(Box::new(recipient));
    }

    Ok(recipients)
}

fn array_to_strings(values: &Array) -> Result<Vec<String>, &'static str> {
    let mut recipients = Vec::with_capacity(values.length() as usize);
    for index in 0..values.length() {
        let value = values.get(index);
        let Some(text) = value.as_string() else {
            return Err(MESSAGE_INVALID_RECIPIENT);
        };
        recipients.push(text);
    }
    Ok(recipients)
}

fn encrypt_output(encryptor: Encryptor, data: &[u8], armor: bool) -> Result<Vec<u8>, &'static str> {
    let mut output = Vec::new();

    if armor {
        let armored = ArmoredWriter::wrap_output(&mut output, Format::AsciiArmor)
            .map_err(|_| MESSAGE_ENCRYPT_FAILED)?;
        let mut writer = encryptor
            .wrap_output(armored)
            .map_err(|_| MESSAGE_ENCRYPT_FAILED)?;
        writer
            .write_all(data)
            .map_err(|_| MESSAGE_ENCRYPT_FAILED)?;
        let armored = writer.finish().map_err(|_| MESSAGE_ENCRYPT_FAILED)?;
        armored.finish().map_err(|_| MESSAGE_ENCRYPT_FAILED)?;
    } else {
        let mut writer = encryptor
            .wrap_output(&mut output)
            .map_err(|_| MESSAGE_ENCRYPT_FAILED)?;
        writer
            .write_all(data)
            .map_err(|_| MESSAGE_ENCRYPT_FAILED)?;
        writer.finish().map_err(|_| MESSAGE_ENCRYPT_FAILED)?;
    }

    Ok(output)
}

fn generate_keypair_inner() -> (String, String) {
    let identity = x25519::Identity::generate();
    let recipient = identity.to_public();

    (
        identity.to_string().expose_secret().to_owned(),
        recipient.to_string(),
    )
}

fn encrypt_with_recipients_inner(
    recipients: Vec<String>,
    data: &[u8],
    armor: bool,
) -> Result<Vec<u8>, &'static str> {
    ensure_non_empty_data(data)?;
    ensure_within_limit(data)?;

    let recipients = collect_recipients(recipients)?;
    let encryptor =
        Encryptor::with_recipients(recipients).ok_or(MESSAGE_ENCRYPT_FAILED)?;

    encrypt_output(encryptor, data, armor)
}

fn decrypt_with_identity_inner(identity: &str, data: &[u8]) -> Result<Vec<u8>, &'static str> {
    ensure_non_empty_data(data)?;

    if identity.trim().is_empty() {
        return Err(MESSAGE_INVALID_IDENTITY);
    }

    let identity: x25519::Identity = identity.parse().map_err(|_| MESSAGE_INVALID_IDENTITY)?;
    let identities = vec![&identity as &dyn age::Identity];
    let mut cursor = Cursor::new(data);
    let reader = ArmoredReader::new(&mut cursor);
    let decryptor = Decryptor::new(reader).map_err(|_| MESSAGE_DECRYPT_FAILED)?;

    match decryptor {
        Decryptor::Recipients(recipients) => {
            let mut reader = recipients
                .decrypt(identities.into_iter())
                .map_err(|_| MESSAGE_DECRYPT_FAILED)?;
            let mut output = Vec::new();
            reader
                .read_to_end(&mut output)
                .map_err(|_| MESSAGE_DECRYPT_FAILED)?;
            Ok(output)
        }
        Decryptor::Passphrase(_) => Err(MESSAGE_DECRYPT_FAILED),
    }
}

fn encrypt_with_passphrase_inner(
    passphrase: &str,
    data: &[u8],
    armor: bool,
) -> Result<Vec<u8>, &'static str> {
    ensure_non_empty_data(data)?;
    ensure_within_limit(data)?;
    ensure_non_empty_passphrase(passphrase)?;

    let encryptor = Encryptor::with_user_passphrase(Secret::new(passphrase.to_owned()));
    encrypt_output(encryptor, data, armor)
}

fn decrypt_with_passphrase_inner(passphrase: &str, data: &[u8]) -> Result<Vec<u8>, &'static str> {
    ensure_non_empty_data(data)?;
    ensure_non_empty_passphrase(passphrase)?;

    let mut cursor = Cursor::new(data);
    let reader = ArmoredReader::new(&mut cursor);
    let decryptor = Decryptor::new(reader).map_err(|_| MESSAGE_DECRYPT_FAILED)?;

    match decryptor {
        Decryptor::Passphrase(passphrase_decryptor) => {
            let mut reader = passphrase_decryptor
                .decrypt(&Secret::new(passphrase.to_owned()), None)
                .map_err(|_| MESSAGE_DECRYPT_FAILED)?;
            let mut output = Vec::new();
            reader
                .read_to_end(&mut output)
                .map_err(|_| MESSAGE_DECRYPT_FAILED)?;
            Ok(output)
        }
        Decryptor::Recipients(_) => Err(MESSAGE_DECRYPT_FAILED),
    }
}

#[wasm_bindgen]
pub fn generate_keypair() -> Promise {
    future_to_promise(async move {
        let (private_key, public_key) = generate_keypair_inner();
        let result = Array::new();
        result.push(&JsValue::from(private_key));
        result.push(&JsValue::from(public_key));
        Ok(result.into())
    })
}

#[wasm_bindgen]
pub fn encrypt_with_recipients(recipients: Array, data: Vec<u8>, armor: bool) -> Promise {
    future_to_promise(async move {
        let recipients = array_to_strings(&recipients).map_err(js_error)?;
        let output = encrypt_with_recipients_inner(recipients, &data, armor)
            .map_err(js_error)?;
        Ok(Uint8Array::from(output.as_slice()).into())
    })
}

#[wasm_bindgen]
pub fn decrypt_with_identity(identity: String, data: Vec<u8>) -> Promise {
    future_to_promise(async move {
        let output = decrypt_with_identity_inner(&identity, &data).map_err(js_error)?;
        Ok(Uint8Array::from(output.as_slice()).into())
    })
}

#[wasm_bindgen]
pub fn encrypt_with_passphrase(passphrase: String, data: Vec<u8>, armor: bool) -> Promise {
    future_to_promise(async move {
        let output = encrypt_with_passphrase_inner(&passphrase, &data, armor)
            .map_err(js_error)?;
        Ok(Uint8Array::from(output.as_slice()).into())
    })
}

#[wasm_bindgen]
pub fn decrypt_with_passphrase(passphrase: String, data: Vec<u8>) -> Promise {
    future_to_promise(async move {
        let output = decrypt_with_passphrase_inner(&passphrase, &data).map_err(js_error)?;
        Ok(Uint8Array::from(output.as_slice()).into())
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn generates_age_compatible_keypair() {
        let (private_key, public_key) = generate_keypair_inner();

        assert!(private_key.starts_with("AGE-SECRET-KEY-"));
        assert!(public_key.starts_with("age1"));
    }

    #[test]
    fn encrypts_and_decrypts_for_single_recipient() {
        let (private_key, public_key) = generate_keypair_inner();
        let ciphertext = encrypt_with_recipients_inner(vec![public_key], b"hello", true).unwrap();
        let plaintext = decrypt_with_identity_inner(&private_key, &ciphertext).unwrap();

        assert_eq!(plaintext, b"hello");
    }

    #[test]
    fn encrypts_for_multiple_recipients_in_one_pass() {
        let (_, public_key_one) = generate_keypair_inner();
        let (private_key_two, public_key_two) = generate_keypair_inner();
        let ciphertext = encrypt_with_recipients_inner(
            vec![public_key_one, public_key_two],
            b"shared secret",
            true,
        )
        .unwrap();
        let plaintext = decrypt_with_identity_inner(&private_key_two, &ciphertext).unwrap();

        assert_eq!(plaintext, b"shared secret");
    }

    #[test]
    fn encrypts_and_decrypts_with_passphrase() {
        let ciphertext =
            encrypt_with_passphrase_inner("correct horse", b"hello", true).unwrap();
        let plaintext = decrypt_with_passphrase_inner("correct horse", &ciphertext).unwrap();

        assert_eq!(plaintext, b"hello");
    }

    #[test]
    fn rejects_oversized_payloads() {
        let (_, public_key) = generate_keypair_inner();
        let payload = vec![0_u8; MAX_MESSAGE_SIZE + 1];
        let error = encrypt_with_recipients_inner(vec![public_key], &payload, true).unwrap_err();

        assert_eq!(error, MESSAGE_DATA_TOO_LARGE);
    }

    #[test]
    fn rejects_invalid_recipients() {
        let error =
            encrypt_with_recipients_inner(vec!["not-a-recipient".to_owned()], b"hello", true)
                .unwrap_err();

        assert_eq!(error, MESSAGE_INVALID_RECIPIENT);
    }

    #[test]
    fn rejects_invalid_identity() {
        let error = decrypt_with_identity_inner("not-an-identity", b"ciphertext").unwrap_err();

        assert_eq!(error, MESSAGE_INVALID_IDENTITY);
    }
}
