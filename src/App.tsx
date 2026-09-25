/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Flashlight,
  Compass,
  Radio,
  Share2,
  RefreshCw,
  Sun,
  Shield,
  Layers,
  Sparkles,
  Info,
  Check,
  Save,
  SlidersHorizontal,
} from 'lucide-react';
import {
  FlashlightMode,
  LightSource,
  COLOR_FILTERS,
  ColorFilter,
} from './types/flashlight';
import { TacticalSwitch } from './components/TacticalSwitch';
import { ScreenLightOverlay } from './components/ScreenLightOverlay';
import { StrobeController } from './components/StrobeController';
import { SosBeacon } from './components/SosBeacon';
import { BatteryMonitor } from './components/BatteryMonitor';
import { MissionVault } from './components/MissionVault';
import { QuickWidget } from './components/QuickWidget';
import { NightModeToggle } from './components/NightModeToggle';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { MorseReferenceModal } from './components/MorseReferenceModal';
import { PreferencesModal } from './components/PreferencesModal';
import { torchController } from './utils/torch';
import {
  playTacticalClick,
  startMorseTone,
  stopMorseTone,
  playStrobeTick,
  triggerHaptic,
  HAPTIC_PATTERNS,
} from './utils/audio';
import {
  loadPreferences,
  savePreferences,
  getColorFilterById,
  UserPreferences,
} from './utils/preferences';
import { useBattery } from './hooks/useBattery';
import { useWakeLock } from './hooks/useWakeLock';
import { useCompass } from './hooks/useCompass';

export default function App() {
  // Initialize settings from saved user preferences or recommended defaults
  // Default when app opens: rear flash (torch) and night vision red light filter OFF
  const initialPrefs = useRef<UserPreferences>(loadPreferences());

  // Main flashlight state
  const [isLightOn, setIsLightOn] = useState(false);
  const [mode, setMode] = useState<FlashlightMode>(initialPrefs.current.mode);
  const [lightSource, setLightSource] = useState<LightSource>(initialPrefs.current.lightSource); // 'torch' by default
  const [brightness, setBrightness] = useState<number>(initialPrefs.current.brightness);
  const [activeColor, setActiveColor] = useState<ColorFilter>(
    getColorFilterById(initialPrefs.current.activeColorId)
  );
  const [isNightVision, setIsNightVision] = useState<boolean>(initialPrefs.current.isNightVision); // false by default

  // Strobe configuration
  const [strobeHz, setStrobeHz] = useState<number>(initialPrefs.current.strobeHz);
  const [strobeAudioClick, setStrobeAudioClick] = useState<boolean>(initialPrefs.current.strobeAudioClick);
  const [strobeFlashState, setStrobeFlashState] = useState<boolean>(false);

  // SOS configuration
  const [sosAudioTone, setSosAudioTone] = useState<boolean>(initialPrefs.current.sosAudioTone);
  const [sosActiveSymbol, setSosActiveSymbol] = useState<number>(-1);
  const [sosCycleCount, setSosCycleCount] = useState<number>(0);

  // Modals & Navigation Tabs
  const [activeTab, setActiveTab] = useState<'light' | 'strobe' | 'sos' | 'vault'>('light');
  const [showMorseRef, setShowMorseRef] = useState<boolean>(false);
  const [showPrefsModal, setShowPrefsModal] = useState<boolean>(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);

  // Custom hooks
  const { batteryState, toggleEcoMode } = useBattery(
    isLightOn,
    mode,
    lightSource,
    brightness,
    isNightVision
  );

  const { heading, cardinal, gps, gpsLoading, refreshLocation } = useCompass();

  // Wake lock prevents screen sleep while flashlight is turned on
  useWakeLock(isLightOn);

  // Sync body class for Red Night Vision Filter
  useEffect(() => {
    if (isNightVision) {
      document.body.classList.add('night-vision-active');
    } else {
      document.body.classList.remove('night-vision-active');
    }
  }, [isNightVision]);

  // Parse URL search params for PWA home screen shortcuts (?mode=max, ?mode=sos, ?mode=night)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get('mode');
      if (urlMode === 'max') {
        setIsLightOn(true);
        setBrightness(100);
        setActiveColor(COLOR_FILTERS[1]); // White
        setIsNightVision(false);
      } else if (urlMode === 'sos') {
        setIsLightOn(true);
        setMode('sos');
        setActiveTab('sos');
      } else if (urlMode === 'night') {
        setIsLightOn(true);
        setIsNightVision(true);
        setActiveColor(COLOR_FILTERS[0]); // Red
      }
    }
  }, []);

  // Synchronize Hardware Torch LED
  const applyHardwareTorch = useCallback(
    async (state: boolean, keepTrackAlive: boolean = false) => {
      if (lightSource === 'screen') {
        await torchController.setTorch(false, false);
        return;
      }
      try {
        await torchController.setTorch(state, keepTrackAlive);
      } catch {
        // Fallback gracefully
      }
    },
    [lightSource]
  );

  // Turn off hardware torch on unmount
  useEffect(() => {
    return () => {
      torchController.stopStream();
      stopMorseTone();
    };
  }, []);

  // Strobe Timer Loop
  useEffect(() => {
    let strobeTimer: ReturnType<typeof setInterval> | null = null;

    if (isLightOn && mode === 'strobe') {
      const intervalMs = Math.max(35, Math.round(1000 / (strobeHz * 2)));
      let flash = true;

      strobeTimer = setInterval(() => {
        flash = !flash;
        setStrobeFlashState(flash);

        if (flash) {
          applyHardwareTorch(true, true);
          if (strobeAudioClick) playStrobeTick();
        } else {
          applyHardwareTorch(false, true);
        }
      }, intervalMs);
    } else {
      setStrobeFlashState(false);
      if (mode !== 'sos' && isLightOn) {
        applyHardwareTorch(true, false);
      } else if (!isLightOn) {
        applyHardwareTorch(false, false);
      }
    }

    return () => {
      if (strobeTimer) clearInterval(strobeTimer);
      if (mode === 'strobe') {
        applyHardwareTorch(false, false);
      }
    };
  }, [isLightOn, mode, strobeHz, strobeAudioClick, applyHardwareTorch]);

  // SOS Morse Code Loop (... --- ...)
  useEffect(() => {
    let isCancelled = false;

    // Standard ITU Morse sequence:
    // Dot = 1 unit, Dash = 3 units, Intrasymbol = 1 unit, Interletter = 3 units, Word gap = 7 units
    const unitMs = 140;

    const sosSequence: Array<{
      symbolIndex: number; // 0-8 or -1 for gap
      isOn: boolean;
      duration: number;
    }> = [
      // S: dot, gap, dot, gap, dot
      { symbolIndex: 0, isOn: true, duration: unitMs },
      { symbolIndex: -1, isOn: false, duration: unitMs },
      { symbolIndex: 1, isOn: true, duration: unitMs },
      { symbolIndex: -1, isOn: false, duration: unitMs },
      { symbolIndex: 2, isOn: true, duration: unitMs },
      // Letter gap
      { symbolIndex: -1, isOn: false, duration: unitMs * 3 },

      // O: dash, gap, dash, gap, dash
      { symbolIndex: 3, isOn: true, duration: unitMs * 3 },
      { symbolIndex: -1, isOn: false, duration: unitMs },
      { symbolIndex: 4, isOn: true, duration: unitMs * 3 },
      { symbolIndex: -1, isOn: false, duration: unitMs },
      { symbolIndex: 5, isOn: true, duration: unitMs * 3 },
      // Letter gap
      { symbolIndex: -1, isOn: false, duration: unitMs * 3 },

      // S: dot, gap, dot, gap, dot
      { symbolIndex: 6, isOn: true, duration: unitMs },
      { symbolIndex: -1, isOn: false, duration: unitMs },
      { symbolIndex: 7, isOn: true, duration: unitMs },
      { symbolIndex: -1, isOn: false, duration: unitMs },
      { symbolIndex: 8, isOn: true, duration: unitMs },
      // End of word loop gap
      { symbolIndex: -1, isOn: false, duration: unitMs * 7 },
    ];

    async function runSosLoop() {
      while (!isCancelled) {
        for (const step of sosSequence) {
          if (isCancelled) break;

          setSosActiveSymbol(step.symbolIndex);

          if (step.isOn) {
            applyHardwareTorch(true, true);
            setStrobeFlashState(true);
            if (sosAudioTone) startMorseTone(850);
          } else {
            applyHardwareTorch(false, true);
            setStrobeFlashState(false);
            stopMorseTone();
          }

          await new Promise((resolve) => setTimeout(resolve, step.duration));
        }

        if (!isCancelled) {
          setSosCycleCount((c) => c + 1);
        }
      }
      stopMorseTone();
      setSosActiveSymbol(-1);
      setStrobeFlashState(false);
      applyHardwareTorch(false, false);
    }

    if (isLightOn && mode === 'sos') {
      runSosLoop();
    } else {
      stopMorseTone();
      setSosActiveSymbol(-1);
      setStrobeFlashState(false);
      applyHardwareTorch(false, false);
    }

    return () => {
      isCancelled = true;
      stopMorseTone();
      applyHardwareTorch(false, false);
    };
  }, [isLightOn, mode, sosAudioTone, applyHardwareTorch]);

  // Main Toggle
  const handleTogglePower = () => {
    setIsLightOn((prev) => {
      const next = !prev;
      if (!next) {
        applyHardwareTorch(false, false);
      } else if (mode === 'steady') {
        applyHardwareTorch(true, false);
      }
      return next;
    });
  };

  // Quick Action: Instant Max Lumens Burst
  const handleInstantMaxBurst = () => {
    setIsLightOn(true);
    setMode('steady');
    setActiveTab('light');
    setBrightness(100);
    setActiveColor(COLOR_FILTERS[1]); // Daylight White 6500K
    setIsNightVision(false);
    if (lightSource !== 'screen') {
      applyHardwareTorch(true);
    }
  };

  // Quick Action: Instant SOS Distress Loop
  const handleInstantSos = () => {
    if (isLightOn && mode === 'sos') {
      setMode('steady');
      setIsLightOn(false);
      applyHardwareTorch(false);
    } else {
      setIsLightOn(true);
      setMode('sos');
      setActiveTab('sos');
      setBrightness(100);
      setActiveColor(COLOR_FILTERS[0]); // Red for emergency
    }
  };

  // Quick Action: Instant Night Vision Red Filter
  const handleInstantNightVision = () => {
    const nextVal = !isNightVision;
    setIsNightVision(nextVal);
    if (nextVal) {
      setActiveColor(COLOR_FILTERS[0]); // Red
    } else {
      setActiveColor(COLOR_FILTERS[1]); // White
    }
  };

  // Copy GPS Coordinates
  const copyGpsCoords = () => {
    if (gps.latitude === null || gps.longitude === null) return;
    const latDir = gps.latitude >= 0 ? 'N' : 'S';
    const lngDir = gps.longitude >= 0 ? 'E' : 'W';
    const latFormatted = `${Math.abs(gps.latitude).toFixed(5)}°${latDir}`;
    const lngFormatted = `${Math.abs(gps.longitude).toFixed(5)}°${lngDir}`;
    const text = `LIGHTFLASH GPS: ${latFormatted}, ${lngFormatted} (Alt: ${gps.altitude || 0}m, Acc: ±${gps.accuracy}m)`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Save current preferences to persistent storage
  const handleSavePreferences = useCallback((showToast = true) => {
    const prefsToSave: Omit<UserPreferences, 'lastSavedAt'> = {
      lightSource,
      isNightVision,
      brightness,
      mode,
      activeColorId: activeColor.id,
      strobeHz,
      strobeAudioClick,
      sosAudioTone,
    };
    savePreferences(prefsToSave);
    playTacticalClick(true);
    triggerHaptic(HAPTIC_PATTERNS.SAVE_PREFS);

    if (showToast) {
      const srcName =
        lightSource === 'torch'
          ? 'Rear Flash'
          : lightSource === 'screen'
          ? 'Screen Panel'
          : 'Dual Beam';
      const nvName = isNightVision ? 'Night Vision ON' : 'Night Vision OFF';
      setSaveNotification(`Preferences Saved: ${srcName} • ${nvName} • ${brightness}%`);
      setTimeout(() => {
        setSaveNotification(null);
      }, 3500);
    }
  }, [
    lightSource,
    isNightVision,
    brightness,
    mode,
    activeColor.id,
    strobeHz,
    strobeAudioClick,
    sosAudioTone,
  ]);

  // Apply preferences (e.g. from modal or reset)
  const handleApplyPreferences = useCallback((newPrefs: UserPreferences) => {
    setLightSource(newPrefs.lightSource);
    setIsNightVision(newPrefs.isNightVision);
    setBrightness(newPrefs.brightness);
    setMode(newPrefs.mode);
    setActiveColor(getColorFilterById(newPrefs.activeColorId));
    setStrobeHz(newPrefs.strobeHz);
    setStrobeAudioClick(newPrefs.strobeAudioClick);
    setSosAudioTone(newPrefs.sosAudioTone);
    const srcName =
      newPrefs.lightSource === 'torch'
        ? 'Rear Flash'
        : newPrefs.lightSource === 'screen'
        ? 'Screen Panel'
        : 'Dual Beam';
    const nvName = newPrefs.isNightVision ? 'Night Vision ON' : 'Night Vision OFF';
    setSaveNotification(`Defaults Applied: ${srcName} • ${nvName}`);
    setTimeout(() => {
      setSaveNotification(null);
    }, 3500);
  }, []);

  return (
    <div
      className={`min-h-screen pb-32 transition-colors duration-300 ${
        isNightVision ? 'night-filter-red bg-black text-red-100' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Dynamic Screen Flashlight Overlay when screen source is active */}
      {isLightOn && (lightSource === 'screen' || lightSource === 'dual') && (
        <div
          className="fixed inset-0 pointer-events-none transition-opacity duration-75 z-0"
          style={{
            backgroundColor: activeColor.hex,
            opacity:
              mode === 'strobe' || mode === 'sos'
                ? strobeFlashState
                  ? (brightness / 100) * 0.95
                  : 0.04
                : (brightness / 100) * 0.85,
          }}
        />
      )}

      {/* App Header / Navigation */}
      <header className="relative z-10 sticky top-0 backdrop-blur-md bg-black/70 border-b border-white/10 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border font-black shadow-md ${
                isNightVision
                  ? 'bg-red-950 border-red-600 text-red-400'
                  : 'bg-amber-500/20 border-amber-500 text-amber-400'
              }`}
            >
              <Flashlight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-wider uppercase">
                  LIGHTFLASH
                </h1>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    isNightVision
                      ? 'bg-red-900 text-red-200 border border-red-700'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                  }`}
                >
                  OFFLINE E2EE
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Tactical Illumination & Survival Vault
              </div>
            </div>
          </div>

          {/* Quick Compass, Morse Chart & Preferences Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playTacticalClick(true);
                setShowPrefsModal(true);
              }}
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white active:scale-95 transition-all text-xs flex items-center gap-1.5"
              title="Startup Preferences & Defaults"
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline font-mono">Prefs</span>
            </button>

            <button
              onClick={() => setShowMorseRef(true)}
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white active:scale-95 transition-all text-xs flex items-center gap-1.5"
              title="International Morse Code Chart"
            >
              <Radio className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline font-mono">Morse</span>
            </button>

            {/* Compass Heading Pill */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                isNightVision
                  ? 'bg-red-950/80 border-red-800 text-red-300'
                  : 'bg-slate-900/80 border-slate-700 text-amber-400'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>
                {heading !== null ? `${heading}° ${cardinal}` : 'COMPASS'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* PWA Install Banner */}
        <PWAInstallBanner />

        {/* Tactical HUD: GPS & Sensor Bar */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">
              {gps.latitude !== null && gps.longitude !== null
                ? `${gps.latitude.toFixed(4)}°, ${gps.longitude.toFixed(4)}° (±${gps.accuracy}m)`
                : 'Searching GPS constellation...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshLocation}
              disabled={gpsLoading}
              className="text-slate-400 hover:text-white"
              title="Refresh GPS"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={copyGpsCoords}
              className="text-slate-400 hover:text-white"
              title="Copy GPS Coordinates"
            >
              {copiedCoords ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* PRIMARY TACTICAL SWITCH & POWER CORE */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          <div className="tactical-grid absolute inset-0 opacity-20 pointer-events-none" />

          {/* Light Source Switcher (Dual, Rear LED, Screen) */}
          <div className="flex items-center justify-center gap-1 p-1 bg-slate-900 rounded-full border border-slate-800 text-[11px] font-mono mb-2 max-w-xs mx-auto">
            <button
              onClick={() => {
                setLightSource('dual');
                playTacticalClick(true);
                triggerHaptic(HAPTIC_PATTERNS.BUTTON_CLICK);
              }}
              className={`flex-1 py-1 px-2 rounded-full font-bold transition-all ${
                lightSource === 'dual'
                  ? isNightVision
                    ? 'bg-red-700 text-white'
                    : 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DUAL BEAM
            </button>

            <button
              onClick={() => {
                setLightSource('torch');
                playTacticalClick(true);
                triggerHaptic(HAPTIC_PATTERNS.BUTTON_CLICK);
              }}
              className={`flex-1 py-1 px-2 rounded-full font-bold transition-all ${
                lightSource === 'torch'
                  ? isNightVision
                    ? 'bg-red-700 text-white'
                    : 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              REAR FLASH
            </button>

            <button
              onClick={() => {
                setLightSource('screen');
                playTacticalClick(true);
                triggerHaptic(HAPTIC_PATTERNS.BUTTON_CLICK);
              }}
              className={`flex-1 py-1 px-2 rounded-full font-bold transition-all ${
                lightSource === 'screen'
                  ? isNightVision
                    ? 'bg-red-700 text-white'
                    : 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SCREEN PANEL
            </button>
          </div>

          {/* Quick Save Preferences Action & Notification */}
          <div className="flex items-center justify-between max-w-xs mx-auto mb-2.5 text-[10px] font-mono gap-1.5">
            <button
              onClick={() => handleSavePreferences(true)}
              className={`flex-1 py-1.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all active:scale-95 font-bold shadow-sm ${
                isNightVision
                  ? 'bg-red-950/70 border-red-800 text-red-200 hover:bg-red-900/80 hover:text-white'
                  : 'bg-slate-900 border-slate-800 text-amber-300 hover:text-amber-200 hover:border-slate-700'
              }`}
              title="Save current light source, night vision & settings as startup defaults"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Preferences</span>
            </button>

            <button
              onClick={() => {
                playTacticalClick(true);
                setShowPrefsModal(true);
              }}
              className={`px-2.5 py-1.5 rounded-xl border transition-all active:scale-95 flex items-center gap-1 ${
                isNightVision
                  ? 'bg-red-950/40 border-red-900 text-red-300 hover:text-red-100'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
              title="Configure Startup Profile & Defaults"
              aria-label="Open startup profile settings"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Profile</span>
            </button>
          </div>

          {/* Quick Save Confirmation Alert */}
          {saveNotification && (
            <div className="max-w-xs mx-auto mb-3 px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 text-[10px] font-mono flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200 shadow-lg">
              <div className="flex items-center gap-1.5 truncate mr-1">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{saveNotification}</span>
              </div>
              <button
                onClick={() => setSaveNotification(null)}
                className="text-emerald-400 hover:text-emerald-100 font-bold px-1"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          )}

          {/* Tactical Big Switch */}
          <TacticalSwitch
            isOn={isLightOn}
            onToggle={handleTogglePower}
            mode={mode}
            lightSource={lightSource}
            activeColorHex={activeColor.hex}
            isNightVision={isNightVision}
            burnRateMa={batteryState.burnRateMa}
          />
        </div>

        {/* MODE TABS BAR: Steady Beam | Strobe Burst | SOS Distress | Encrypted Vault */}
        <div className="grid grid-cols-4 gap-1 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => {
              setActiveTab('light');
              setMode('steady');
              playTacticalClick(true);
              triggerHaptic(HAPTIC_PATTERNS.MODE_STEADY);
            }}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'light'
                ? isNightVision
                  ? 'bg-red-900/70 border border-red-600 text-white font-bold'
                  : 'bg-amber-500/20 border border-amber-500 text-amber-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">STEADY</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('strobe');
              setMode('strobe');
              playTacticalClick(true);
              triggerHaptic(HAPTIC_PATTERNS.MODE_STROBE);
            }}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'strobe'
                ? isNightVision
                  ? 'bg-red-900/70 border border-red-600 text-white font-bold'
                  : 'bg-amber-500/20 border border-amber-500 text-amber-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">STROBE</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('sos');
              setMode('sos');
              playTacticalClick(true);
              triggerHaptic(HAPTIC_PATTERNS.MODE_SOS);
            }}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'sos'
                ? 'bg-rose-900/70 border border-rose-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4 text-rose-400" />
            <span className="text-[10px] tracking-tight text-rose-400">SOS DISTRESS</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('vault');
              playTacticalClick(true);
              triggerHaptic(HAPTIC_PATTERNS.MODE_VAULT);
            }}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'vault'
                ? isNightVision
                  ? 'bg-red-900/70 border border-red-600 text-white font-bold'
                  : 'bg-amber-500/20 border border-amber-500 text-amber-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">VAULT (E2EE)</span>
          </button>
        </div>

        {/* NIGHT VISION RED FILTER TOGGLE */}
        <NightModeToggle
          isNightVision={isNightVision}
          onToggle={handleInstantNightVision}
        />

        {/* ACTIVE TAB VIEWS */}
        {activeTab === 'light' && (
          <ScreenLightOverlay
            isOn={isLightOn}
            brightness={brightness}
            onBrightnessChange={setBrightness}
            activeColor={activeColor}
            onSelectColor={setActiveColor}
            isNightVision={isNightVision}
            onToggleNightVision={handleInstantNightVision}
            isStrobeFlash={strobeFlashState}
          />
        )}

        {activeTab === 'strobe' && (
          <div className="space-y-4">
            <StrobeController
              frequencyHz={strobeHz}
              onFrequencyChange={setStrobeHz}
              isActive={isLightOn && mode === 'strobe'}
              onToggleStrobe={() => {
                if (isLightOn && mode === 'strobe') {
                  setIsLightOn(false);
                  applyHardwareTorch(false);
                } else {
                  setIsLightOn(true);
                  setMode('strobe');
                }
              }}
              audioClickEnabled={strobeAudioClick}
              onToggleAudioClick={() => setStrobeAudioClick(!strobeAudioClick)}
              isNightVision={isNightVision}
            />

            {/* Also include brightness control for the strobe beam */}
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span>STROBE BEAM LUMINANCE</span>
                <span className="font-bold text-slate-200">{brightness}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}

        {activeTab === 'sos' && (
          <SosBeacon
            isActive={isLightOn && mode === 'sos'}
            onToggleSos={() => {
              if (isLightOn && mode === 'sos') {
                setIsLightOn(false);
                applyHardwareTorch(false);
              } else {
                setIsLightOn(true);
                setMode('sos');
              }
            }}
            audioToneEnabled={sosAudioTone}
            onToggleAudioTone={() => setSosAudioTone(!sosAudioTone)}
            activeSymbolIndex={sosActiveSymbol}
            cycleCount={sosCycleCount}
            gps={gps}
            isNightVision={isNightVision}
          />
        )}

        {activeTab === 'vault' && (
          <MissionVault gps={gps} isNightVision={isNightVision} />
        )}

        {/* BATTERY TELEMETRY & ENERGY BURN MONITOR */}
        <BatteryMonitor
          battery={batteryState}
          onToggleEcoMode={toggleEcoMode}
          isNightVision={isNightVision}
        />
      </main>

      {/* QUICK-ACCESS HOME SCREEN / URGENT ACTIVATION WIDGET */}
      <QuickWidget
        isOn={isLightOn}
        onInstantMaxBurst={handleInstantMaxBurst}
        onInstantSos={handleInstantSos}
        onInstantNightVision={handleInstantNightVision}
        isNightVision={isNightVision}
        isSosActive={isLightOn && mode === 'sos'}
        batteryPercent={Math.round(batteryState.level * 100)}
      />

      {/* OFFLINE MORSE CODE REFERENCE MODAL */}
      <MorseReferenceModal
        isOpen={showMorseRef}
        onClose={() => setShowMorseRef(false)}
      />

      {/* STARTUP PREFERENCES & DEFAULTS MODAL */}
      <PreferencesModal
        isOpen={showPrefsModal}
        onClose={() => setShowPrefsModal(false)}
        currentLightSource={lightSource}
        currentIsNightVision={isNightVision}
        currentBrightness={brightness}
        currentMode={mode}
        currentColor={activeColor}
        currentStrobeHz={strobeHz}
        currentStrobeAudioClick={strobeAudioClick}
        currentSosAudioTone={sosAudioTone}
        onApplyPreferences={handleApplyPreferences}
        isNightVision={isNightVision}
      />
    </div>
  );
}
