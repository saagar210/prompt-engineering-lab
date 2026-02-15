import { encrypt, decrypt } from '@/lib/encryption';

describe('encryption', () => {
  const secret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 64 hex chars (32 bytes)

  beforeAll(() => {
    process.env.ENCRYPTION_SECRET = secret;
  });

  afterAll(() => {
    delete process.env.ENCRYPTION_SECRET;
  });

  it('should encrypt and decrypt data', () => {
    const plaintext = 'sk-proj-1234567890abcdef';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should throw on invalid secret', () => {
    const plaintext = 'test-data';
    const encrypted = encrypt(plaintext);
    process.env.ENCRYPTION_SECRET = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
    expect(() => decrypt(encrypted)).toThrow();
    process.env.ENCRYPTION_SECRET = secret; // restore
  });

  it('should produce different ciphertext each time (IV randomization)', () => {
    const plaintext = 'same-data';
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);
    expect(encrypted1).not.toBe(encrypted2);
    expect(decrypt(encrypted1)).toBe(plaintext);
    expect(decrypt(encrypted2)).toBe(plaintext);
  });

  it('should handle empty strings', () => {
    const plaintext = '';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should handle special characters', () => {
    const plaintext = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });
});
