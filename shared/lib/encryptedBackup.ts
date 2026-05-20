const MAGIC = 'HDENC1';
const SALT_BYTES = 16;
const IV_BYTES = 12;
const KEY_BITS = 256;
const ITERATIONS = 200_000;

interface EncryptedPayload {
  magic: typeof MAGIC;
  salt: string;
  iv: string;
  data: string;
}

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary);
};

const fromBase64 = (b64: string): Uint8Array => {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

const deriveKey = async (passphrase: string, salt: Uint8Array): Promise<CryptoKey> => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_BITS },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encryptSnapshotJson = async (json: string, passphrase: string): Promise<string> => {
  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const key = await deriveKey(passphrase, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    new TextEncoder().encode(json)
  );
  const payload: EncryptedPayload = {
    magic: MAGIC,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(encrypted))
  };
  return JSON.stringify(payload, null, 2);
};

export const isEncryptedSnapshotJson = (text: string): boolean => {
  try {
    const payload = JSON.parse(text) as Partial<EncryptedPayload>;
    return payload.magic === MAGIC && typeof payload.salt === 'string' && typeof payload.iv === 'string' && typeof payload.data === 'string';
  } catch {
    return false;
  }
};

export const decryptSnapshotJson = async (text: string, passphrase: string): Promise<string> => {
  const payload = JSON.parse(text) as EncryptedPayload;
  if (payload.magic !== MAGIC) throw new Error('不是加密备份文件');
  const salt = fromBase64(payload.salt);
  const iv = fromBase64(payload.iv);
  const key = await deriveKey(passphrase, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    fromBase64(payload.data) as BufferSource
  );
  return new TextDecoder().decode(decrypted);
};
