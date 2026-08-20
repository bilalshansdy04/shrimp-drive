import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-ctr';

/**
 * Generates a 32-byte (256-bit) random key as a 64-character hex string.
 */
export function generateRandomKey(): string {
	return crypto.randomBytes(32).toString('hex');
}

/**
 * Derives a deterministic 16-byte IV from a given fileId (UUID).
 */
function deriveIV(fileId: string): Buffer {
	return crypto.createHash('md5').update(fileId).digest();
}

/**
 * Encrypts an entire buffer in memory before uploading to Telegram.
 * 
 * @param buffer - The raw file buffer.
 * @param keyHex - The 64-character hex encryption key of the user.
 * @param fileId - The unique file ID (used to derive a deterministic IV).
 * @returns The encrypted buffer.
 */
export function encryptBuffer(buffer: Buffer, keyHex: string, fileId: string): Buffer {
	const key = Buffer.from(keyHex, 'hex');
	const iv = deriveIV(fileId);
	const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
	
	const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
	return encrypted;
}

/**
 * Creates a Transform stream that decrypts incoming data starting from a specific byte offset.
 * Because AES-CTR is a stream cipher, we can fast-forward the stream state to the exact offset
 * without needing the preceding bytes.
 * 
 * @param keyHex - The 64-character hex encryption key of the user.
 * @param fileId - The unique file ID.
 * @param offset - The byte offset from the start of the file.
 * @returns A decipher stream.
 */
export function createDecryptionStream(keyHex: string, fileId: string, offset: number = 0) {
	const key = Buffer.from(keyHex, 'hex');
	const iv = deriveIV(fileId);

	// Fast-forward the counter for the offset
	// AES block size is 16 bytes
	const blockOffset = Math.floor(offset / 16);
	const byteOffsetWithinBlock = offset % 16;

	// In AES-CTR, the 16-byte IV acts as a 128-bit big-endian integer counter.
	// We advance this counter by the number of full blocks skipped.
	const counter = BigInt('0x' + iv.toString('hex')) + BigInt(blockOffset);
	let newIvHex = counter.toString(16).padStart(32, '0').slice(-32);
	
	const currentIv = Buffer.from(newIvHex, 'hex');
	const decipher = crypto.createDecipheriv(ALGORITHM, key, currentIv);

	// If the offset is not aligned to a 16-byte boundary, process dummy bytes 
	// to advance the keystream exactly `byteOffsetWithinBlock` bytes.
	if (byteOffsetWithinBlock > 0) {
		const dummy = Buffer.alloc(byteOffsetWithinBlock);
		decipher.update(dummy);
	}

	return decipher;
}
