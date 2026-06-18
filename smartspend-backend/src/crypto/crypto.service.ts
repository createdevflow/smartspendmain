import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly masterKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  constructor() {
    const keyHex = process.env.SERVER_ENCRYPTION_KEY;
    if (!keyHex || keyHex.length !== 64) {
      throw new Error('SERVER_ENCRYPTION_KEY must be exactly 32 bytes (64 hex chars). Generate with: openssl rand -hex 32');
    }
    this.masterKey = Buffer.from(keyHex, 'hex');
  }

  /**
   * Derive a unique per-user key using HKDF
   * @param salt - User's encryptionKeySalt (hex string)
   */
  private deriveKey(salt: string): Buffer {
    return Buffer.from(crypto.hkdfSync(
      'sha256',
      this.masterKey,
      Buffer.from(salt, 'hex'),
      Buffer.from('smartspend-v1'),
      32,
    ));
  }

  /**
   * Encrypt plaintext with AES-256-GCM
   * Returns format: iv:authTag:ciphertext (all base64, colon-separated)
   */
  encrypt(plaintext: string, salt: string): string {
    if (!plaintext) return plaintext;
    const key = this.deriveKey(salt);
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag(); // 128-bit authentication tag

    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  /**
   * Decrypt ciphertext produced by encrypt()
   */
  decrypt(ciphertext: string, salt: string): string {
    if (!ciphertext || !ciphertext.includes(':')) return ciphertext;
    try {
      const [ivB64, tagB64, dataB64] = ciphertext.split(':');
      const key = this.deriveKey(salt);
      const iv = Buffer.from(ivB64, 'base64');
      const authTag = Buffer.from(tagB64, 'base64');
      const data = Buffer.from(dataB64, 'base64');
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);
      return decipher.update(data).toString('utf8') + decipher.final('utf8');
    } catch {
      // Return empty string if decryption fails (corrupted data)
      return '';
    }
  }

  /**
   * Generate a random salt for a new user
   */
  generateSalt(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate a cryptographically secure N-digit OTP
   */
  generateOtp(digits = 6): string {
    const max = Math.pow(10, digits);
    const min = Math.pow(10, digits - 1);
    return (crypto.randomInt(min, max)).toString();
  }

  /**
   * Generate a secure random token (for API keys, etc.)
   */
  generateToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }
}
