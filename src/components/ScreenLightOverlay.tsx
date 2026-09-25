/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sun, Maximize2, Minimize2, Eye, Sparkles, Zap, Smartphone, Sliders } from 'lucide-react';
import { COLOR_FILTERS, ColorFilter } from '../types/flashlight';

export type IntensityTarget = 'both' | 'torch' | 'screen';

interface ScreenLightOverlayProps {
  isOn: boolean;
  brightness: number; // Screen panel brightness (1-100)
  onBrightnessChange: (val: number) => void;
  torchStrength: number; // Hardware torch intensity (1-100)
  onTorchStrengthChange: (val: number) => void;
  intensityTarget: IntensityTarget;
  onIntensityTargetChange: (target: IntensityTarget) => void;
  activeColor: ColorFilter;
  onSelectColor: (c: ColorFilter) => void;
  isNightVision: boolean;
  onToggleNightVision: () => void;
  isStrobeFlash?: boolean;
}

export const ScreenLightOverlay: React.FC<ScreenLightOverlayProps> = ({
  isOn,
  brightness,
  onBrightnessChange,
  torchStrength,
  onTorchStrengthChange,
  intensityTarget,
  onIntensityTargetChange,
  activeColor,
  onSelectColor,
  isNightVision,
  onToggleNightVision,
  isStrobeFlash = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Approximate screen lumens (modern smartphones produce ~400-800 nits max screen backlight)
  const estimatedLux = Math.round((brightness / 100) * (isNightVision ? 180 : 580));

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const handleSliderChange = (newVal: number) => {
    if (intensityTarget === 'both') {
      onTorchStrengthChange(newVal);
      onBrightnessChange(newVal);
    } else if (intensityTarget === 'torch') {
      onTorchStrengthChange(newVal);
    } else {
      onBrightnessChange(newVal);
    }
  };

  const handlePresetClick = (presetVal: number) => {
    if (intensityTarget === 'both') {
      onTorchStrengthChange(presetVal);
      onBrightnessChange(presetVal);
    } else if (intensityTarget === 'torch') {
      onTorchStrengthChange(presetVal);
    } else {
      onBrightnessChange(presetVal);
    }
  };

  // Determine current active slider value based on selected target
  const currentActiveValue =
    intensityTarget === 'both'
      ? Math.round((torchStrength + brightness) / 2)
      : intensityTarget === 'torch'
      ? torchStrength
      : brightness;

  // Fullscreen Pure Light Lantern Mode
  if (isFullscreen) {
    return (
      <div
        onClick={toggleFullscreen}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 select-none cursor-pointer transition-colors duration-75"
        style={{
          backgroundColor: isStrobeFlash ? '#000000' : activeColor.hex,
          opacity: isStrobeFlash ? 0.05 : brightness / 100,
        }}
      >
        <div className="w-full flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(false);
            }}
            className="p-3 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/20 active:scale-95"
            aria-label="Exit fullscreen"
          >
            <Minimize2 className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-black/50 text-white backdrop-blur-md px-4 py-2 rounded-full text-xs font-mono tracking-wider border border-white/20 pointer-events-none">
          TAP ANYWHERE TO EXIT FULLSCREEN LANTERN
        </div>

        <div className="text-[11px] font-mono text-black/60 font-bold bg-white/30 backdrop-blur px-3 py-1 rounded-full">
          {activeColor.name} • Screen {brightness}% • Torch {torchStrength}% ({estimatedLux} LUX)
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sun className={`w-4 h-4 ${isNightVision ? 'text-red-400' : 'text-amber-400'}`} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Beam Intensity & Spectrum
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              isNightVision
                ? 'border-red-800/60 bg-red-950/40 text-red-300 hover:bg-red-900/50'
                : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fullscreen Lantern</span>
          </button>
        </div>
      </div>

      {/* Screen Preview & Luminous Swatch */}
      <div
        onClick={toggleFullscreen}
        className="relative w-full h-16 rounded-xl border border-slate-700/80 overflow-hidden cursor-pointer group flex items-center justify-center transition-all"
        style={{
          backgroundColor: activeColor.hex,
          opacity: isOn ? Math.max(0.12, brightness / 100) : 0.08,
          boxShadow: isOn ? `0 0 25px ${activeColor.hex}44` : 'none',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
        <span className="relative z-10 text-xs font-mono font-bold tracking-widest px-3 py-1 rounded-full bg-black/60 text-white backdrop-blur border border-white/20 group-hover:scale-105 transition-transform flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          {isOn
            ? `${activeColor.name} • Torch: ${torchStrength}% • Screen: ${brightness}%`
            : 'LIGHT OFF (TAP TO PREVIEW)'}
        </span>
      </div>

      {/* Intensity Target Selection (Both, Torch Only, Screen Only) */}
      <div className="bg-slate-950/70 p-1.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5 px-1">
          <span className="flex items-center gap-1">
            <Sliders className="w-3 h-3 text-amber-400" />
            <span>INTENSITY CONTROL TARGET:</span>
          </span>
          <span className="text-amber-400 font-bold uppercase">{intensityTarget}</span>
        </div>

        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => onIntensityTargetChange('both')}
            className={`py-1.5 px-2 rounded-lg font-mono text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
              intensityTarget === 'both'
                ? isNightVision
                  ? 'bg-red-700 text-white shadow'
                  : 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>BOTH (SYNC)</span>
          </button>

          <button
            type="button"
            onClick={() => onIntensityTargetChange('torch')}
            className={`py-1.5 px-2 rounded-lg font-mono text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
              intensityTarget === 'torch'
                ? isNightVision
                  ? 'bg-red-700 text-white shadow'
                  : 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3 h-3" />
            <span>REAR FLASH</span>
          </button>

          <button
            type="button"
            onClick={() => onIntensityTargetChange('screen')}
            className={`py-1.5 px-2 rounded-lg font-mono text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
              intensityTarget === 'screen'
                ? isNightVision
                  ? 'bg-red-700 text-white shadow'
                  : 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span>SCREEN ONLY</span>
          </button>
        </div>
      </div>

      {/* Active Intensity Slider */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-mono text-slate-300">
          <span className="font-bold flex items-center gap-1.5">
            {intensityTarget === 'both' && '⚡ SYNCHRONIZED BEAM INTENSITY'}
            {intensityTarget === 'torch' && '🔦 HARDWARE TORCH STRENGTH'}
            {intensityTarget === 'screen' && '📱 SCREEN BACKLIGHT BRIGHTNESS'}
          </span>
          <span
            className={`px-2 py-0.5 rounded font-black text-xs ${
              isNightVision ? 'bg-red-950 text-red-300' : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {currentActiveValue}%
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="100"
          value={currentActiveValue}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          aria-label="Adjust light intensity"
          className="w-full accent-amber-500 cursor-pointer"
        />

        {/* Quick Intensity Presets */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {[25, 50, 75, 100].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={`py-1 rounded text-[11px] font-mono font-medium border transition-colors ${
                currentActiveValue === preset
                  ? isNightVision
                    ? 'bg-red-900/60 border-red-600 text-white'
                    : 'bg-amber-500/20 border-amber-500/80 text-amber-300'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {preset === 100 ? '100% MAX' : `${preset}%`}
            </button>
          ))}
        </div>

        {/* Status Indicators for Dual Sources */}
        <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                torchStrength > 0 ? 'bg-amber-400' : 'bg-slate-600'
              }`}
            />
            <span>Rear Torch: <strong className="text-slate-200">{torchStrength}%</strong></span>
          </span>
          <span className="flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                brightness > 0 ? 'bg-blue-400' : 'bg-slate-600'
              }`}
            />
            <span>Screen: <strong className="text-slate-200">{brightness}%</strong> ({estimatedLux} LUX)</span>
          </span>
        </div>
      </div>

      {/* Color Filter Swatches */}
      <div className="pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wide">
            Beam Spectrum / Filter
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {activeColor.wavelengthDescription.split('•')[0]}
          </span>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {COLOR_FILTERS.map((filter) => {
            const isSelected = activeColor.id === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => {
                  onSelectColor(filter);
                  if (filter.isRedNightVision && !isNightVision) {
                    onToggleNightVision();
                  }
                }}
                title={`${filter.name} - ${filter.wavelengthDescription}`}
                className={`relative flex flex-col items-center p-1.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-white ring-2 ring-white/30 scale-105'
                    : 'border-slate-800 hover:border-slate-600'
                }`}
                style={{ backgroundColor: `${filter.hex}15` }}
              >
                <div
                  className="w-7 h-7 rounded-full shadow-inner border border-white/30 flex items-center justify-center"
                  style={{
                    backgroundColor: filter.hex,
                    boxShadow: isSelected ? `0 0 12px ${filter.hex}` : 'none',
                  }}
                >
                  {filter.isRedNightVision && <Eye className="w-3.5 h-3.5 text-white drop-shadow" />}
                </div>
                <span className="text-[9px] font-mono mt-1 text-slate-300 truncate w-full text-center">
                  {filter.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
