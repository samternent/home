#[cfg(test)]
mod tests {
    use age::{x25519, Encryptor, Decryptor, armor::{ArmoredWriter, ArmoredReader, Format}};
    use secrecy::Secret;
    use std::io::{Write, Read};

    #[test]
    fn test_keygen_logic() {
        // Test key generation logic without wasm_bindgen
        let secret = x25519::Identity::generate();
        let public = secret.to_public();
        
        // Verify the keys are valid strings
        use secrecy::ExposeSecret;
        let secret_string = secret.to_string();
        let secret_str = secret_string.expose_secret();
        let public_str = public.to_string();
        
        assert!(secret_str.starts_with("AGE-SECRET-KEY-"));
        assert!(public_str.starts_with("age1"));
    }

    #[test]
    fn test_round_trip_x25519_logic() {
        // Test encryption/decryption logic without wasm_bindgen
        let secret = x25519::Identity::generate();
        let public = secret.to_public();
        let message = b"Hello, world!";
        
        // Encrypt
        let key: x25519::Recipient = public.to_string().parse().unwrap();
        let recipients = vec![Box::new(key) as Box<dyn age::Recipient + Send + 'static>];
        let encryptor = Encryptor::with_recipients(recipients).unwrap();
        
        let mut output = vec![];
        let armor = ArmoredWriter::wrap_output(&mut output, Format::AsciiArmor).unwrap();
        let mut writer = encryptor.wrap_output(armor).unwrap();
        writer.write_all(message).unwrap();
        let armor = writer.finish().unwrap();
        armor.finish().unwrap();
        
        // Decrypt
        let identities = vec![&secret as &dyn age::Identity];
        let mut reader = std::io::Cursor::new(&output);
        let reader = ArmoredReader::new(&mut reader);
        
        let decryptor = match Decryptor::new(reader).unwrap() {
            Decryptor::Recipients(d) => d,
            Decryptor::Passphrase(_) => panic!("Expected recipients"),
        };
        
        let mut decrypted = vec![];
        let mut reader = decryptor.decrypt(identities.iter().copied()).unwrap();
        reader.read_to_end(&mut decrypted).unwrap();
        
        assert_eq!(decrypted, message);
    }

    #[test]
    fn test_round_trip_passphrase_logic() {
        // Test passphrase encryption/decryption logic
        let passphrase = "test-password";
        let message = b"Hello, world!";
        
        // Encrypt
        let encryptor = Encryptor::with_user_passphrase(Secret::new(passphrase.to_owned()));
        let mut output = vec![];
        let armor = ArmoredWriter::wrap_output(&mut output, Format::AsciiArmor).unwrap();
        let mut writer = encryptor.wrap_output(armor).unwrap();
        writer.write_all(message).unwrap();
        let armor = writer.finish().unwrap();
        armor.finish().unwrap();
        
        // Decrypt
        let mut reader = std::io::Cursor::new(&output);
        let reader = ArmoredReader::new(&mut reader);
        
        let decryptor = match Decryptor::new(reader).unwrap() {
            Decryptor::Passphrase(d) => d,
            Decryptor::Recipients(_) => panic!("Expected passphrase"),
        };
        
        let mut decrypted = vec![];
        let mut reader = decryptor.decrypt(&Secret::new(passphrase.to_owned()), None).unwrap();
        reader.read_to_end(&mut decrypted).unwrap();
        
        assert_eq!(decrypted, message);
    }

    #[test]
    fn test_input_validation_logic() {
        // Test that empty public key fails to parse
        let result = "".parse::<x25519::Recipient>();
        assert!(result.is_err());
        
        // Test that empty private key fails to parse
        let result = "".parse::<x25519::Identity>();
        assert!(result.is_err());
        
        // Test that invalid key fails to parse
        let result = "invalid-key".parse::<x25519::Recipient>();
        assert!(result.is_err());
    }
}
