import { hmac } from '@noble/hashes/hmac';
import { sha512 } from '@noble/hashes/sha512';
import { getPublicKey } from '@noble/ed25519';
import { mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { english } from '@scure/bip39/wordlists/english';

const PUBLIC_KEY_REGEX = /^G[A-Z2-7]{55}$/;
const SECRET_KEY_REGEX = /^S[A-Z2-7]{55}$/;
const RECOVERY_WORD_COUNTS = [12, 15, 18, 21, 24];
const STELLAR_PUBLIC_KEY_VERSION_BYTE = 0x30;
const STELLAR_SECRET_KEY_VERSION_BYTE = 0x90;
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const ED25519_SEED_KEY = new TextEncoder().encode('ed25519 seed');

export type RecoverySource = 'publicKey' | 'secretKey' | 'recoveryPhrase';

export interface RecoveryResult {
  publicKey: string;
  source: RecoverySource;
}

export async function recoverPublicKeyFromInput(input: string): Promise<RecoveryResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Enter a recovery phrase, secret key, or Stellar public key.');
  }

  const normalized = trimmed.replace(/\s+/g, ' ').trim();

  if (PUBLIC_KEY_REGEX.test(normalized.toUpperCase())) {
    return { publicKey: normalized.toUpperCase(), source: 'publicKey' };
  }

  if (SECRET_KEY_REGEX.test(normalized.toUpperCase())) {
    const publicKey = await derivePublicKeyFromSecretKey(normalized.toUpperCase());
    return { publicKey, source: 'secretKey' };
  }

  const words = normalized.toLowerCase().split(' ');
  if (RECOVERY_WORD_COUNTS.includes(words.length)) {
    const phrase = words.join(' ');
    if (!validateMnemonic(phrase, english)) {
      throw new Error('That recovery phrase does not appear to be valid.');
    }

    const publicKey = await derivePublicKeyFromRecoveryPhrase(phrase);
    return { publicKey, source: 'recoveryPhrase' };
  }

  throw new Error(
    'Enter a valid Stellar public key, a valid secret seed, or a 12/15/18/21/24-word recovery phrase.',
  );
}

async function derivePublicKeyFromSecretKey(secretKey: string): Promise<string> {
  const seed = decodeStrKey(secretKey, STELLAR_SECRET_KEY_VERSION_BYTE);
  const rawPublicKey = await getPublicKey(seed);
  return encodeStrKey(rawPublicKey, STELLAR_PUBLIC_KEY_VERSION_BYTE);
}

async function derivePublicKeyFromRecoveryPhrase(phrase: string): Promise<string> {
  const seed = mnemonicToSeedSync(phrase);
  const key = deriveStellarSeed(seed);
  const rawPublicKey = await getPublicKey(key);
  return encodeStrKey(rawPublicKey, STELLAR_PUBLIC_KEY_VERSION_BYTE);
}

function deriveStellarSeed(seed: Uint8Array): Uint8Array {
  const master = getMasterKeyFromSeed(seed);
  return derivePath("m/44'/148'/0'", master).key;
}

function getMasterKeyFromSeed(seed: Uint8Array) {
  const I = hmacSha512(ED25519_SEED_KEY, seed);
  return { key: I.subarray(0, 32), chainCode: I.subarray(32) };
}

function derivePath(path: string, node: { key: Uint8Array; chainCode: Uint8Array }) {
  const segments = path.split('/').filter(Boolean);
  let current = node;

  for (const segment of segments) {
    if (segment === 'm') continue;
    const hardened = segment.endsWith("'");
    if (!hardened) {
      throw new Error('Only hardened derivation is supported for Stellar.');
    }

    const index = parseInt(segment.slice(0, -1), 10);
    if (Number.isNaN(index)) {
      throw new Error(`Invalid derivation path segment: ${segment}`);
    }

    current = deriveHardened(current, 0x80000000 + index);
  }

  return current;
}

function deriveHardened(node: { key: Uint8Array; chainCode: Uint8Array }, index: number) {
  const data = new Uint8Array(1 + node.key.length + 4);
  data[0] = 0;
  data.set(node.key, 1);
  const view = new DataView(data.buffer, data.byteOffset + 1 + node.key.length, 4);
  view.setUint32(0, index, false);
  const I = hmacSha512(node.chainCode, data);
  return { key: I.subarray(0, 32), chainCode: I.subarray(32) };
}

function hmacSha512(key: Uint8Array, data: Uint8Array): Uint8Array {
  return hmac(sha512, data, key);
}

function encodeStrKey(data: Uint8Array, version: number): string {
  const payload = new Uint8Array(1 + data.length + 2);
  payload[0] = version;
  payload.set(data, 1);

  const checksum = crc16Xmodem(payload.subarray(0, 1 + data.length));
  payload[1 + data.length] = checksum & 0xff;
  payload[1 + data.length + 1] = (checksum >> 8) & 0xff;

  return base32Encode(payload);
}

function decodeStrKey(value: string, expectedVersion: number): Uint8Array {
  const raw = base32Decode(value);
  if (raw.length !== 35) {
    throw new Error('Invalid Stellar key format.');
  }

  if (raw[0] !== expectedVersion) {
    throw new Error('Unexpected Stellar key type.');
  }

  const payload = raw.subarray(0, 33);
  const checksum = raw.subarray(33);
  if (crc16Xmodem(payload) !== (checksum[0] | (checksum[1] << 8))) {
    throw new Error('Invalid Stellar key checksum.');
  }

  return raw.subarray(1, 33);
}

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      const index = (value >> (bits - 5)) & 0x1f;
      output += BASE32_ALPHABET[index];
      bits -= 5;
    }
  }

  if (bits > 0) {
    const index = (value << (5 - bits)) & 0x1f;
    output += BASE32_ALPHABET[index];
  }

  return output;
}

function base32Decode(value: string): Uint8Array {
  const cleaned = value.replace(/=+$/, '').toUpperCase();
  const bytes = new Uint8Array(Math.floor((cleaned.length * 5) / 8));
  let buffer = 0;
  let bits = 0;
  let index = 0;

  for (const char of cleaned) {
    const charIndex = BASE32_ALPHABET.indexOf(char);
    if (charIndex === -1) {
      throw new Error('Invalid base32 character in Stellar key.');
    }

    buffer = (buffer << 5) | charIndex;
    bits += 5;

    if (bits >= 8) {
      bits -= 8;
      bytes[index++] = (buffer >> bits) & 0xff;
    }
  }

  return bytes.slice(0, index);
}

function crc16Xmodem(data: Uint8Array): number {
  let crc = 0x0000;

  for (const byte of data) {
    crc ^= byte << 8;
    for (let j = 0; j < 8; j += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }

  return crc & 0xffff;
}

export function isRecoveryPhraseCandidate(value: string): boolean {
  const words = value.trim().toLowerCase().split(/\s+/);
  return RECOVERY_WORD_COUNTS.includes(words.length);
}

export function isSecretOrPublicKeyCandidate(value: string): boolean {
  const normalized = value.trim().toUpperCase();
  return PUBLIC_KEY_REGEX.test(normalized) || SECRET_KEY_REGEX.test(normalized);
}
