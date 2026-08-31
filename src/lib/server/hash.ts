import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

export async function comparePassword(password: string, storedHash: string): Promise<boolean> {
    if (!storedHash || !storedHash.includes(':')) {
        return false; // Invalid format or old bcrypt hash
    }
    try {
        const [salt, key] = storedHash.split(':');
        const hashBuffer = scryptSync(password, salt, 64);
        const keyBuffer = Buffer.from(key, 'hex');
        return timingSafeEqual(hashBuffer, keyBuffer);
    } catch {
        return false;
    }
}
