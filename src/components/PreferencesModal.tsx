/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  SlidersHorizontal,
  X,
  Check,
  RotateCcw,
  Save,
  Flashlight,
  Eye,
  Sun,
  Shield,
  Layers,
  Radio,
  Sparkles,
} from 'lucide-react';
import {
  FlashlightMode,
  LightSource,
  COLOR_FILTERS,
  ColorFilter,
} from '../types/flashlight';
import {
  UserPreferences,
  RECOMMENDED_DEFAULTS,
  savePreferences,
  resetPreferences,
} from '../utils/preferences';
import { playTacticalClick, triggerHaptic, HAPTIC_PATTERNS } from '../utils/audio';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Current active settings in the app
  currentLightSource: LightSource;
  currentIsNightVision: boolean;
  currentBrightness: number;
  currentMode: FlashlightMode;
  currentColor: ColorFilter;
  currentStrobeHz: number;
  currentStrobeAudioClick: boolean;
  currentSosAudioTone: boolean;
  // Callback when saved or reset
  onApplyPreferences: (prefs: UserPreferences) => void;
  isNightVision: boolean;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  currentLightSource,
  currentIsNightVision,
  currentBrightness,
  currentMode,
  currentColor,
  currentStrobeHz,
  currentStrobeAudioClick,
  currentSosAudioTone,
  onApplyPreferences,
  isNightVision,
}) => {
  const [justSaved, setJustSaved] = useState(false);
  const [justReset, setJustReset] = useState(false);

  if (!isOpen) return null;

  const handleSaveCurrent = () => {
    const prefsToSave: Omit<UserPreferences, 'lastSavedAt'> = {
      lightSource: currentLightSource,
      isNightVision: currentIsNightVision,
      brightness: currentBrightness,
      mode: currentMode,
      activeColorId: currentColor.id,
      strobeHz: currentStrobeHz,
      strobeAudioClick: currentStrobeAudioClick,
      sosAudioTone: currentSosAudioTone,
    };

    savePreferences(prefsToSave);
    playTacticalClick(true);
    triggerHaptic(HAPTIC_PATTERNS.SAVE_PREFS);

    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  const handleResetDefaults = () => {
    const defaults = resetPreferences();
    onApplyPreferences(defaults);
    playTacticalClick(false);
    triggerHaptic(HAPTIC_PATTERNS.BUTTON_CLICK);

    setJustReset(true);
    setTimeout(() => setJustReset(false), 2500);
  };

  const getLightSourceLabel = (src: LightSource) => {
    switch (src) {
      case 'torch':
        return 'Rear Camera Flash (Torch)';
      case 'screen':
        return 'Screen Display Panel';
      case 'dual':
        return 'Dual Beam (Rear Flash + Screen)';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isNightVision
            ? 'bg-slate-950 border-red-800/80 text-red-100 shadow-[0_0_50px_rgba(239,68,68,0.2)]'
            : 'bg-slate-900 border-slate-700/80 text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.8)]'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                isNightVision
                  ? 'bg-red-950 border-red-600 text-red-400'
                  : 'bg-amber-500/20 border-amber-500 text-amber-400'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wider uppercase">
                Startup Preferences
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Device Defaults & Startup Memory
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playTacticalClick(false);
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close preferences"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Active Configuration Summary */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold tracking-wider text-slate-400">
              <span>CURRENT LIVE CONFIGURATION</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Flashlight className="w-3.5 h-3.5 text-amber-400" />
                  Beam Source:
                </span>
                <span className="font-bold text-slate-200">
                  {getLightSourceLabel(currentLightSource)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-red-400" />
                  Night Vision Red Filter:
                </span>
                <span
                  className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                    currentIsNightVision
                      ? 'bg-red-900/80 text-red-200 border border-red-600'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {currentIsNightVision ? 'ENGAGED (ON)' : 'OFF (RECOMMENDED)'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  Intensity / Luminance:
                </span>
                <span className="font-bold text-slate-200">{currentBrightness}%</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  Active Light Mode:
                </span>
                <span className="font-bold uppercase text-slate-200">{currentMode}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Color Filter:
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/40"
                    style={{ backgroundColor: currentColor.hex }}
                  />
                  <span className="font-bold text-slate-200">{currentColor.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {justSaved && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 flex items-center gap-2.5 animate-in slide-in-from-top duration-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-xs">Preferences Saved Successfully!</div>
                <div className="text-[10px] text-emerald-300/80">
                  These settings are now saved as your default profile when Lightflash opens.
                </div>
              </div>
            </div>
          )}

          {justReset && (
            <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-500 text-amber-200 flex items-center gap-2.5 animate-in slide-in-from-top duration-200">
              <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="font-bold text-xs">Reset to Factory Defaults!</div>
                <div className="text-[10px] text-amber-300/80">
                  Rear Flash enabled, Night Vision filter set to OFF, 100% Daylight White.
                </div>
              </div>
            </div>
          )}

          {/* Guidance note */}
          <div className="text-[11px] text-slate-400 leading-relaxed font-mono bg-slate-900/60 p-3 rounded-xl border border-white/5">
            <span className="font-bold text-slate-200">Tactical Tip:</span> Save your preferred beam source and filters here. Whenever you open the app or launch it from your home screen widget, Lightflash will immediately initialize with this setup.
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-white/10 bg-black/50 space-y-2">
          {/* Main Save Button */}
          <button
            onClick={handleSaveCurrent}
            className={`w-full py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg ${
              isNightVision
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/40'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences as Default</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleResetDefaults}
            className="w-full py-2.5 px-4 rounded-xl font-mono text-[11px] text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent hover:border-white/10 flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Recommended (Rear Flash & Night Vision Off)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
