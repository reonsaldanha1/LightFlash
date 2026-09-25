/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FlashlightMode, LightSource, COLOR_FILTERS, ColorFilter } from '../types/flashlight';

export interface UserPreferences {
  lightSource: LightSource;
  isNightVision: boolean;
  brightness: number;
  mode: FlashlightMode;
  activeColorId: string;
  strobeHz: number;
  strobeAudioClick: boolean;
  sosAudioTone: boolean;
  lastSavedAt?: number;
}

export const RECOMMENDED_DEFAULTS: UserPreferences = {
  lightSource: 'torch', // Default: Rear Flash
  isNightVision: false, // Default: Night vision red light filter OFF
  brightness: 100,
  mode: 'steady',
  activeColorId: 'white',
  strobeHz: 4,
  strobeAudioClick: false,
  sosAudioTone: true,
};

const STORAGE_KEY = 'lightflash_tactical_preferences_v1';

/**
 * Loads preferences from localStorage, falling back to RECOMMENDED_DEFAULTS
 */
export function loadPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return { ...RECOMMENDED_DEFAULTS };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...RECOMMENDED_DEFAULTS };
    }

    const parsed = JSON.parse(raw);
    return {
      lightSource: (['dual', 'torch', 'screen'].includes(parsed.lightSource)
        ? parsed.lightSource
        : RECOMMENDED_DEFAULTS.lightSource) as LightSource,
      isNightVision: typeof parsed.isNightVision === 'boolean'
        ? parsed.isNightVision
        : RECOMMENDED_DEFAULTS.isNightVision,
      brightness: typeof parsed.brightness === 'number' && parsed.brightness >= 1 && parsed.brightness <= 100
        ? parsed.brightness
        : RECOMMENDED_DEFAULTS.brightness,
      mode: (['steady', 'strobe', 'sos'].includes(parsed.mode)
        ? parsed.mode
        : RECOMMENDED_DEFAULTS.mode) as FlashlightMode,
      activeColorId: typeof parsed.activeColorId === 'string'
        ? parsed.activeColorId
        : RECOMMENDED_DEFAULTS.activeColorId,
      strobeHz: typeof parsed.strobeHz === 'number' && parsed.strobeHz >= 1 && parsed.strobeHz <= 25
        ? parsed.strobeHz
        : RECOMMENDED_DEFAULTS.strobeHz,
      strobeAudioClick: typeof parsed.strobeAudioClick === 'boolean'
        ? parsed.strobeAudioClick
        : RECOMMENDED_DEFAULTS.strobeAudioClick,
      sosAudioTone: typeof parsed.sosAudioTone === 'boolean'
        ? parsed.sosAudioTone
        : RECOMMENDED_DEFAULTS.sosAudioTone,
      lastSavedAt: parsed.lastSavedAt,
    };
  } catch (e) {
    console.warn('Failed to parse saved preferences, resetting to defaults:', e);
    return { ...RECOMMENDED_DEFAULTS };
  }
}

/**
 * Saves preferences to localStorage
 */
export function savePreferences(prefs: Omit<UserPreferences, 'lastSavedAt'>): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const payload: UserPreferences = {
      ...prefs,
      lastSavedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error('Failed to save preferences to localStorage:', err);
    return false;
  }
}

/**
 * Reset stored preferences to RECOMMENDED_DEFAULTS
 */
export function resetPreferences(): UserPreferences {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
  return { ...RECOMMENDED_DEFAULTS };
}

/**
 * Helper to match ColorFilter from ID
 */
export function getColorFilterById(id: string): ColorFilter {
  return COLOR_FILTERS.find((c) => c.id === id) || COLOR_FILTERS[1]; // Daylight White
}
