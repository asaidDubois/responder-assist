const SALT_KEY = "responder_assist_salt";
const PASSPHRASE_KEY = "responder_assist_passphrase_hash";

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function getOrCreateSalt(): Uint8Array {
  const stored = localStorage.getItem(SALT_KEY);
  if (stored) {
    return new Uint8Array(JSON.parse(stored));
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(SALT_KEY, JSON.stringify(Array.from(salt)));
  return salt;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encrypt(plaintext: string, passphrase: string): Promise<string> {
  if (!passphrase) throw new Error("Passphrase requise pour chiffrer");
  const salt = getOrCreateSalt();
  const key = await deriveKey(passphrase, salt);
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    encoder.encode(plaintext)
  );
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  return arrayBufferToBase64(combined.buffer);
}

export async function decrypt(ciphertext: string, passphrase: string): Promise<string> {
  if (!passphrase) throw new Error("Passphrase requise pour déchiffrer");
  const salt = getOrCreateSalt();
  const key = await deriveKey(passphrase, salt);
  const combined = new Uint8Array(base64ToArrayBuffer(ciphertext));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    encrypted as BufferSource
  );
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

export function hasPassphrase(): boolean {
  return localStorage.getItem(PASSPHRASE_KEY) !== null;
}

export async function setPassphrase(passphrase: string): Promise<void> {
  if (!passphrase || passphrase.length < 4) {
    throw new Error("La phrase de passe doit contenir au moins 4 caractères");
  }
  const hash = await hashPassphrase(passphrase);
  localStorage.setItem(PASSPHRASE_KEY, hash);
}

export function clearPassphrase(): void {
  localStorage.removeItem(PASSPHRASE_KEY);
  localStorage.removeItem(SALT_KEY);
}

async function hashPassphrase(passphrase: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passphrase);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return arrayBufferToBase64(hash);
}

export async function verifyPassphrase(passphrase: string): Promise<boolean> {
  const stored = localStorage.getItem(PASSPHRASE_KEY);
  if (!stored) return false;
  const hash = await hashPassphrase(passphrase);
  return hash === stored;
}

export function getStoredPassphrase(): string | null {
  return sessionStorage.getItem("responder_assist_session_pass");
}

export function storeSessionPassphrase(passphrase: string): void {
  sessionStorage.setItem("responder_assist_session_pass", passphrase);
}

export function clearSessionPassphrase(): void {
  sessionStorage.removeItem("responder_assist_session_pass");
}
