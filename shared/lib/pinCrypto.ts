const SALT_BYTES = 16;
const PBKDF2_ITERATIONS = 100_000;
const KEY_BITS = 256;

const toHex = (buf: ArrayBuffer): string =>
  Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

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

export const randomSalt = (): string => {
  const salt = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(salt);
  return toBase64(salt);
};

export const hashPin = async (pin: string, saltB64: string): Promise<string> => {
  const enc = new TextEncoder();
  const salt = fromBase64(saltB64);
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    key,
    KEY_BITS
  );
  return toHex(bits);
};

export const verifyPin = async (pin: string, saltB64: string, expectedHash: string): Promise<boolean> => {
  const actual = await hashPin(pin, saltB64);
  if (actual.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
};
