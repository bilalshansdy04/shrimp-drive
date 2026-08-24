import { generateMnemonic, mnemonicToEntropy, entropyToMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';

// 1. Generate a new 256-bit Master Vault Key (DEK)
export function generateMasterVaultKey(): Uint8Array {
	const key = new Uint8Array(32); // 256 bits
	window.crypto.getRandomValues(key);
	return key;
}

// 2. Generate BIP-39 Recovery Phrase from Master Vault Key
export function generateRecoveryPhrase(masterKey: Uint8Array): string {
	// The entropy must be 128-256 bits. Our master key is 256 bits.
	return entropyToMnemonic(masterKey, wordlist);
}

// 3. Reconstruct Master Vault Key from Recovery Phrase
export function recoverMasterKeyFromPhrase(phrase: string): Uint8Array {
	return mnemonicToEntropy(phrase, wordlist);
}

// 4. Derive KEK (Key-Wrapping Key) & Auth Hash from Password
// We use a predefined static salt for the auth hash and a username-based salt for KEK
export async function deriveKeysFromPassword(password: string, username: string) {
	const encoder = new TextEncoder();
	const passBytes = encoder.encode(password);

	// Derive KEK (Key-Wrapping Key)
	const kekSalt = encoder.encode(`shrimp_drive_kek_${username}`);
	const kekBytes = await pbkdf2Async(sha256, passBytes, kekSalt, { c: 100000, dkLen: 32 });

	// Derive Auth Hash (To send to server instead of raw password)
	const authSalt = encoder.encode(`shrimp_drive_auth_salt`);
	const authHashBytes = await pbkdf2Async(sha256, passBytes, authSalt, { c: 100000, dkLen: 32 });

	// Convert authHash to hex
	const authHash = Array.from(authHashBytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	// Import KEK for AES-GCM Key Wrapping
	const kek = await window.crypto.subtle.importKey('raw', kekBytes, { name: 'AES-GCM' }, false, [
		'encrypt',
		'decrypt'
	]);

	return { kek, authHash };
}

// 5. Wrap (Encrypt) Master Vault Key with KEK
export async function wrapMasterKey(masterKey: Uint8Array, kek: CryptoKey): Promise<string> {
	const iv = new Uint8Array(12);
	window.crypto.getRandomValues(iv);

	const encryptedBuffer = await window.crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		kek,
		masterKey as BufferSource
	);

	const encryptedArray = new Uint8Array(encryptedBuffer);

	// Concatenate IV and Ciphertext
	const combined = new Uint8Array(iv.length + encryptedArray.length);
	combined.set(iv, 0);
	combined.set(encryptedArray, iv.length);

	// Return as Base64
	return btoa(String.fromCharCode.apply(null, combined as unknown as number[]));
}

// 6. Unwrap (Decrypt) Master Vault Key with KEK
export async function unwrapMasterKey(
	encryptedVaultKeyBase64: string,
	kek: CryptoKey
): Promise<Uint8Array> {
	const binaryString = atob(encryptedVaultKeyBase64);
	const combined = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		combined[i] = binaryString.charCodeAt(i);
	}

	const iv = combined.slice(0, 12);
	const ciphertext = combined.slice(12);

	const decryptedBuffer = await window.crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv },
		kek,
		ciphertext
	);

	return new Uint8Array(decryptedBuffer);
}

// 7. Encrypt File Blob
export async function encryptFileBlob(file: Blob, dek: Uint8Array): Promise<Blob> {
	const key = await window.crypto.subtle.importKey('raw', dek as BufferSource, { name: 'AES-GCM' }, false, [
		'encrypt'
	]);

	const iv = new Uint8Array(12);
	window.crypto.getRandomValues(iv);

	const arrayBuffer = await file.arrayBuffer();
	const ciphertext = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, arrayBuffer);

	// Prepend IV to ciphertext
	const combined = new Uint8Array(iv.length + ciphertext.byteLength);
	combined.set(iv, 0);
	combined.set(new Uint8Array(ciphertext), iv.length);

	return new Blob([combined], { type: 'application/octet-stream' });
}

// 8. Decrypt File Blob
export async function decryptFileBlob(
	encryptedBlob: Blob,
	dek: Uint8Array,
	originalType: string
): Promise<Blob> {
	const key = await window.crypto.subtle.importKey('raw', dek as BufferSource, { name: 'AES-GCM' }, false, [
		'decrypt'
	]);

	const arrayBuffer = await encryptedBlob.arrayBuffer();
	const iv = arrayBuffer.slice(0, 12);
	const ciphertext = arrayBuffer.slice(12);

	const decrypted = await window.crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: new Uint8Array(iv) },
		key,
		ciphertext
	);

	return new Blob([decrypted], { type: originalType });
}
