"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
let CryptoService = class CryptoService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        const keyHex = process.env.SERVER_ENCRYPTION_KEY;
        if (!keyHex || keyHex.length !== 64) {
            throw new Error('SERVER_ENCRYPTION_KEY must be exactly 32 bytes (64 hex chars). Generate with: openssl rand -hex 32');
        }
        this.masterKey = Buffer.from(keyHex, 'hex');
    }
    deriveKey(salt) {
        return Buffer.from(crypto.hkdfSync('sha256', this.masterKey, Buffer.from(salt, 'hex'), Buffer.from('smartspend-v1'), 32));
    }
    encrypt(plaintext, salt) {
        if (!plaintext)
            return plaintext;
        const key = this.deriveKey(salt);
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(this.algorithm, key, iv);
        const encrypted = Buffer.concat([
            cipher.update(plaintext, 'utf8'),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();
        return [
            iv.toString('base64'),
            authTag.toString('base64'),
            encrypted.toString('base64'),
        ].join(':');
    }
    decrypt(ciphertext, salt) {
        if (!ciphertext || !ciphertext.includes(':'))
            return ciphertext;
        try {
            const [ivB64, tagB64, dataB64] = ciphertext.split(':');
            const key = this.deriveKey(salt);
            const iv = Buffer.from(ivB64, 'base64');
            const authTag = Buffer.from(tagB64, 'base64');
            const data = Buffer.from(dataB64, 'base64');
            const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
            decipher.setAuthTag(authTag);
            return decipher.update(data).toString('utf8') + decipher.final('utf8');
        }
        catch {
            return '';
        }
    }
    generateSalt() {
        return crypto.randomBytes(32).toString('hex');
    }
    generateOtp(digits = 6) {
        const max = Math.pow(10, digits);
        const min = Math.pow(10, digits - 1);
        return (crypto.randomInt(min, max)).toString();
    }
    generateToken(bytes = 32) {
        return crypto.randomBytes(bytes).toString('hex');
    }
};
exports.CryptoService = CryptoService;
exports.CryptoService = CryptoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CryptoService);
//# sourceMappingURL=crypto.service.js.map