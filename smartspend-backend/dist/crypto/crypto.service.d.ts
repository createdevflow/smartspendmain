export declare class CryptoService {
    private readonly masterKey;
    private readonly algorithm;
    constructor();
    private deriveKey;
    encrypt(plaintext: string, salt: string): string;
    decrypt(ciphertext: string, salt: string): string;
    generateSalt(): string;
    generateOtp(digits?: number): string;
    generateToken(bytes?: number): string;
}
