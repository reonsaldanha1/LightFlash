/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FlashlightMode = 'steady' | 'strobe' | 'sos';

export type LightSource = 'dual' | 'torch' | 'screen';

export interface ColorFilter {
  id: string;
  name: string;
  hex: string;
  wavelengthDescription: string;
  isRedNightVision?: boolean;
}

export const COLOR_FILTERS: ColorFilter[] = [
  {
    id: 'red',
    name: 'Tactical Red',
    hex: '#ff1744',
    wavelengthDescription: '630nm • Preserves Rhodopsin & Night Vision',
    isRedNightVision: true,
  },
  {
    id: 'white',
    name: 'Daylight White',
    hex: '#ffffff',
    wavelengthDescription: '6500K • Maximum High-Lumen Visibility',
  },
  {
    id: 'warm',
    name: 'Camp Amber',
    hex: '#ffb74d',
    wavelengthDescription: '2700K • Soft Incandescent / Tent Lantern',
  },
  {
    id: 'green',
    name: 'NVG Green',
    hex: '#00e676',
    wavelengthDescription: '530nm • High-Contrast Tactical Map Reading',
  },
  {
    id: 'cyan',
    name: 'Search Blue',
    hex: '#00e5ff',
    wavelengthDescription: '470nm • Fluid & Trail Inspection',
  },
  {
    id: 'hazard',
    name: 'Hazard Orange',
    hex: '#ff6d00',
    wavelengthDescription: '600nm • Roadside & Signal Caution',
  },
];

export interface BatteryState {
  level: number; // 0 to 1
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  isSupported: boolean;
  burnRateMa: number;
  estimatedRemainingHours: number;
  isEcoMode: boolean;
}

export interface IceContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  notes?: string;
}

export interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  altitude?: number | null;
  accuracy?: number | null;
  timestamp: number;
  notes?: string;
}

export interface MedicalProfile {
  bloodType: string;
  allergies: string;
  medicalConditions: string;
  medications: string;
  organDonor: boolean;
  notes: string;
}

export interface EncryptedVaultPayload {
  version: number;
  updatedAt: string;
  medicalProfile: MedicalProfile;
  iceContacts: IceContact[];
  waypoints: Waypoint[];
  fieldNotes: string;
}

export interface EncryptedContainer {
  salt: string; // base64
  iv: string;   // base64
  ciphertext: string; // base64
  version: number;
  lastUpdated: string;
}

export interface GPSCoordinates {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
}
