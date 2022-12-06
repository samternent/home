import init, {
	encrypt_with_user_passphrase,
	decrypt_with_user_passphrase,
	encrypt_with_x25519,
	decrypt_with_x25519,
	keygen,
} from '@kanru/rage-wasm';

// export const ready = init();

export async function generate() {
	// await ready;
	return keygen();
}

export async function encrypt(secret: string, data: string): Promise<string> {
	// await ready;

	let encrypted;
	if (secret.startsWith('age1')) {
		encrypted = await encrypt_with_x25519(
			secret,
			new TextEncoder().encode(data),
			true
		);
	} else {
		encrypted = await encrypt_with_user_passphrase(
			secret,
			new TextEncoder().encode(data),
			true
		);
	}

	return new TextDecoder('utf-8').decode(encrypted);
}

export async function decrypt(secret: string, data: string): Promise<string> {
	// await ready;

	let decrypted;
	if (secret.startsWith('AGE-SECRET-KEY-')) {
		decrypted = await decrypt_with_x25519(
			secret,
			new TextEncoder().encode(data)
		);
	} else {
		decrypted = await decrypt_with_user_passphrase(
			secret,
			new TextEncoder().encode(data)
		);
	}

	return new TextDecoder('utf-8').decode(decrypted);
}
