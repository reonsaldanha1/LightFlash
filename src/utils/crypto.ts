/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EncryptedContainer, EncryptedVaultPayload } from '../types/flashlight';

const STORAGE_KEY = 'lightflash_encrypted_vault_v1';
const PBKDF2_ITERATIONS = 100000;

// Convert Uint8Array to Base64
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive AES-GCM 256-bit CryptoKey using PBKDF2 from user PIN or passphrase
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt vault payload using AES-256-GCM
 */
export async function encryptVault(
  payload: EncryptedVaultPayload,
  passphrase: string
): Promise<EncryptedContainer> {
  if (!window.crypto?.subtle) {
    throw new Error('Web Crypto API is not available on this browser.');
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const enc = new TextEncoder();
  const serialized = JSON.stringify(payload);
  const encodedData = enc.encode(serialized);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedData
  );

  const container: EncryptedContainer = {
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertextBuffer),
    version: payload.version || 1,
    lastUpdated: new Date().toISOString(),
  };

  return container;
}

/**
 * Decrypt vault payload using AES-256-GCM
 */
export async function decryptVault(
  container: EncryptedContainer,
  passphrase: string
): Promise<EncryptedVaultPayload> {
  if (!window.crypto?.subtle) {
    throw new Error('Web Crypto API is not available on this browser.');
  }

  try {
    const salt = base64ToBuffer(container.salt);
    const iv = base64ToBuffer(container.iv);
    const ciphertext = base64ToBuffer(container.ciphertext);

    const key = await deriveKey(passphrase, salt);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
      },
      key,
      ciphertext as unknown as BufferSource
    );

    const dec = new TextDecoder();
    const jsonStr = dec.decode(decryptedBuffer);
    return JSON.parse(jsonStr) as EncryptedVaultPayload;
  } catch (err) {
    throw new Error('Decryption failed. Incorrect PIN/passphrase or corrupted data.');
  }
}

/**
 * Persist encrypted container in local offline storage
 */
export function saveEncryptedContainer(container: EncryptedContainer): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(container));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

/**
 * Retrieve encrypted container from local offline storage
 */
export function getSavedEncryptedContainer(): EncryptedContainer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EncryptedContainer;
  } catch {
    return null;
  }
}

/**
 * Check if an encrypted vault exists on this device
 */
export function hasSavedVault(): boolean {
  return !!localStorage.getItem(STORAGE_KEY);
}

/**
 * Default sample template for new encrypted vault setup
 */
export function getDefaultVaultPayload(): EncryptedVaultPayload {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    medicalProfile: {
      bloodType: 'O+',
      allergies: 'Penicillin, Bee stings',
      medicalConditions: 'Asthma (Carries Albuterol inhaler)',
      medications: 'Ventolin HFA 90mcg PRN',
      organDonor: true,
      notes: 'Emergency contact is next of kin. Wearer has basic wilderness first-aid training.',
    },
    iceContacts: [
      {
        id: 'ice-1',
        name: 'Sarah Connor',
        relationship: 'Spouse / Primary ICE',
        phone: '+1 (555) 019-2834',
        notes: 'Call first in all situations',
      },
      {
        id: 'ice-2',
        name: 'John Connor',
        relationship: 'Brother',
        phone: '+1 (555) 014-9982',
        notes: 'Backup contact',
      },
    ],
    waypoints: [
      {
        id: 'wp-base',
        name: 'Highland Trailhead Parking (Rendezvous)',
        lat: 37.7749,
        lng: -122.4194,
        altitude: 184,
        accuracy: 5,
        timestamp: Date.now() - 3600000,
        notes: 'Vehicle: Silver 4Runner. Keylock box on rear tow hitch.',
      },
    ],
    fieldNotes: 'Emergency Radio: VHF Channel 16 (156.8 MHz) Maritime Distress. Wilderness Repeater: 146.520 MHz FM Calling Frequency.\nGround-to-air code: V = Require Assistance, X = Require Medical Assistance.',
  };
}
