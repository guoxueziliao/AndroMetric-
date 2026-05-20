const RP_NAME = 'Hardness Diary';
const CHALLENGE_BYTES = 32;
const USER_ID_BYTES = 16;

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const fromBase64Url = (value: string): Uint8Array => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

const asBufferSource = (bytes: Uint8Array): BufferSource => bytes as BufferSource;

export const canUseWebAuthn = (): boolean => (
  typeof window !== 'undefined'
  && window.isSecureContext
  && typeof navigator !== 'undefined'
  && !!navigator.credentials
  && typeof PublicKeyCredential !== 'undefined'
);

export const createWebAuthnCredential = async (): Promise<string> => {
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: asBufferSource(randomBytes(CHALLENGE_BYTES)),
      rp: { name: RP_NAME },
      user: {
        id: asBufferSource(randomBytes(USER_ID_BYTES)),
        name: 'local-user',
        displayName: 'Hardness Diary'
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 }
      ],
      authenticatorSelection: {
        userVerification: 'required',
        residentKey: 'preferred'
      },
      timeout: 60_000,
      attestation: 'none'
    }
  });

  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error('未能创建生物识别凭据');
  }

  return toBase64Url(new Uint8Array(credential.rawId));
};

export const verifyWebAuthnCredential = async (credentialId: string): Promise<boolean> => {
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: asBufferSource(randomBytes(CHALLENGE_BYTES)),
      allowCredentials: [{
        id: asBufferSource(fromBase64Url(credentialId)),
        type: 'public-key'
      }],
      userVerification: 'required',
      timeout: 60_000
    }
  });

  return credential instanceof PublicKeyCredential;
};
