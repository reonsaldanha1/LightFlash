/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sun, Maximize2, Minimize2, Eye, Sparkles } from 'lucide-react';
import { COLOR_FILTERS, ColorFilter } from '../types/flashlight';

interface ScreenLightOverlayProps {
  isOn: boolean;
  brightness: number;
  onBrightnessChange: (val: number) => void;
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
          {activeColor.name} • {brightness}% ({estimatedLux} LUX)
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sun className={`w-4 h-4 ${isNightVision ? 'text-red-400' : 'text-amber-400'}`} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Screen Brightness & Light Beam
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
          boxShadow: isOn
            ? `0 0 25px ${activeColor.hex}44`
            : 'none',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
        <span className="relative z-10 text-xs font-mono font-bold tracking-widest px-3 py-1 rounded-full bg-black/60 text-white backdrop-blur border border-white/20 group-hover:scale-105 transition-transform flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          {isOn ? `${activeColor.name} • ${brightness}% (${estimatedLux} LUX)` : 'LIGHT OFF (TAP TO PREVIEW)'}
        </span>
      </div>

      {/* Adjustable Screen Brightness Slider */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>INTENSITY</span>
          <span className="font-bold text-slate-200">{brightness}%</span>
        </div>

        <input
          type="range"
          min="1"
          max="100"
          value={brightness}
          onChange={(e) => onBrightnessChange(Number(e.target.value))}
          aria-label="Adjust screen brightness"
          className="w-full"
        />

        {/* Quick Brightness Presets */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {[25, 50, 75, 100].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onBrightnessChange(preset)}
              className={`py-1 rounded text-[11px] font-mono font-medium border transition-colors ${
                brightness === preset
                  ? isNightVision
                    ? 'bg-red-900/60 border-red-600 text-white'
                    : 'bg-amber-500/20 border-amber-500/80 text-amber-300'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {preset}%
            </button>
          ))}
        </div>
      </div>

      {/* Color Filter Swatches */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
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
