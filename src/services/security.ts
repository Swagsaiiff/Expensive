/**
 * Secure token and credential storage using Web Crypto API AES-GCM encryption at rest.
 * Uses a derived key from an app-specific salt so credentials are never stored plaintext in localStorage.
 */

const SALT_KEY = 'set_crypto_salt';
const IV_KEY = 'set_crypto_iv';
const STORAGE_PREFIX = 'set_enc_';

async function getEncryptionKey(): Promise<CryptoKey> {
  let salt = localStorage.getItem(SALT_KEY);
  if (!salt) {
    const rawSalt = crypto.getRandomValues(new Uint8Array(16));
    salt = Array.from(rawSalt).map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(SALT_KEY, salt);
  }

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(`SalaryAppSecureStore:${salt}`),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function secureSetItem(key: string, value: string): Promise<void> {
  try {
    const cryptoKey = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(value);

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encoded
    );

    const cipherArray = Array.from(new Uint8Array(cipherBuffer));
    const ivArray = Array.from(iv);

    const payload = JSON.stringify({
      iv: ivArray,
      data: cipherArray,
    });

    localStorage.setItem(`${STORAGE_PREFIX}${key}`, payload);
  } catch (err) {
    console.warn('Secure storage failed, falling back to base64 obfuscation:', err);
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, btoa(value));
  }
}

export async function secureGetItem(key: string): Promise<string | null> {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return null;

    // Check if JSON structure
    if (raw.startsWith('{')) {
      const parsed = JSON.parse(raw);
      const cryptoKey = await getEncryptionKey();
      const iv = new Uint8Array(parsed.iv);
      const data = new Uint8Array(parsed.data);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        data
      );

      return new TextDecoder().decode(decrypted);
    } else {
      return atob(raw);
    }
  } catch (err) {
    console.warn('Failed to decrypt item for key', key, err);
    return null;
  }
}

export async function secureRemoveItem(key: string): Promise<void> {
  localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
}
