/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Power, Zap, AlertTriangle, Radio } from 'lucide-react';
import { FlashlightMode, LightSource } from '../types/flashlight';
import { playTacticalClick, triggerHaptic, HAPTIC_PATTERNS } from '../utils/audio';

interface TacticalSwitchProps {
  isOn: boolean;
  onToggle: () => void;
  mode: FlashlightMode;
  lightSource: LightSource;
  activeColorHex: string;
  isNightVision: boolean;
  burnRateMa: number;
}

export const TacticalSwitch: React.FC<TacticalSwitchProps> = ({
  isOn,
  onToggle,
  mode,
  lightSource,
  activeColorHex,
  isNightVision,
  burnRateMa,
}) => {
  const handleClick = () => {
    const nextState = !isOn;
    playTacticalClick(nextState);
    triggerHaptic(nextState ? HAPTIC_PATTERNS.POWER_ON : HAPTIC_PATTERNS.POWER_OFF);
    onToggle();
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'strobe':
        return 'STROBE BURST';
      case 'sos':
        return 'SOS DISTRESS';
      default:
        return 'STEADY BEAM';
    }
  };

  const getSourceLabel = () => {
    switch (lightSource) {
      case 'torch':
        return 'REAR LED';
      case 'screen':
        return 'SCREEN PANEL';
      case 'dual':
        return 'DUAL LUMEN';
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'strobe':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'sos':
        return <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />;
      default:
        return <Radio className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-4 select-none">
      {/* Outer Tactical Bezel */}
      <div
        className={`relative p-3 rounded-full transition-all duration-300 ${
          isOn
            ? 'shadow-[0_0_60px_rgba(245,158,11,0.35)]'
            : 'shadow-[0_8px_30px_rgba(0,0,0,0.8)]'
        }`}
        style={
          isOn
            ? {
                boxShadow: isNightVision
                  ? '0 0 65px rgba(239, 68, 68, 0.6), 0 0 120px rgba(239, 68, 68, 0.25)'
                  : `0 0 65px ${activeColorHex}88, 0 0 120px ${activeColorHex}35`,
              }
            : undefined
        }
      >
        {/* Decorative Dial Ticks */}
        <div className="absolute inset-0 rounded-full border border-slate-700/60 pointer-events-none" />
        <div className="absolute -inset-1 rounded-full border border-dashed border-slate-800/80 pointer-events-none" />

        {/* Main Push Button */}
        <button
          onClick={handleClick}
          type="button"
          aria-label={isOn ? 'Turn flashlight off' : 'Turn flashlight on'}
          className={`relative w-44 h-44 sm:w-52 sm:h-52 rounded-full flex flex-col items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer outline-none focus:outline-none border-4 ${
            isOn
              ? 'shadow-[inset_0_2px_12px_rgba(255,255,255,0.4)]'
              : 'bg-gradient-to-b from-slate-800 via-slate-900 to-black text-slate-400 border-slate-700 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)] hover:border-slate-600'
          }`}
          style={
            isOn
              ? isNightVision
                ? {
                    background: 'linear-gradient(180deg, #dc2626 0%, #7f1d1d 55%, #450a0a 100%)',
                    borderColor: '#ef4444',
                    color: '#ffffff',
                    boxShadow: '0 0 35px rgba(239, 68, 68, 0.5), inset 0 2px 10px rgba(255, 255, 255, 0.4)',
                  }
                : {
                    background: `linear-gradient(180deg, ${activeColorHex} 0%, ${activeColorHex}cc 50%, #090d16 100%)`,
                    borderColor: activeColorHex,
                    color: ['#ffffff', '#ffb74d'].includes(activeColorHex.toLowerCase()) ? '#090d16' : '#ffffff',
                    boxShadow: `0 0 35px ${activeColorHex}77, inset 0 2px 10px rgba(255, 255, 255, 0.4)`,
                  }
              : undefined
          }
        >
          {/* Inner Glowing Core */}
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isOn
                ? 'ring-8'
                : 'bg-slate-900/80 ring-2 ring-slate-800 text-slate-500'
            }`}
            style={
              isOn
                ? isNightVision
                  ? {
                      backgroundColor: 'rgba(239, 68, 68, 0.35)',
                      borderColor: '#ef4444',
                      color: '#fee2e2',
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
                    }
                  : {
                      backgroundColor: `${activeColorHex}40`,
                      borderColor: activeColorHex,
                      color: ['#ffffff', '#ffb74d'].includes(activeColorHex.toLowerCase()) ? '#090d16' : '#ffffff',
                      boxShadow: `0 0 20px ${activeColorHex}66`,
                    }
                : undefined
            }
          >
            <Power
              className={`w-10 h-10 sm:w-12 sm:h-12 transition-transform duration-300 ${
                isOn ? 'scale-110 drop-shadow-md' : 'scale-95'
              }`}
              strokeWidth={isOn ? 2.8 : 2}
            />
          </div>

          {/* Status Text inside button */}
          <span
            className={`mt-3 text-xs sm:text-sm font-black tracking-widest uppercase ${
              isOn
                ? isNightVision
                  ? 'text-white drop-shadow'
                  : ['#ffffff', '#ffb74d'].includes(activeColorHex.toLowerCase())
                  ? 'text-slate-950 font-black'
                  : 'text-white drop-shadow'
                : 'text-slate-500'
            }`}
          >
            {isOn ? 'LIGHT ON' : 'STANDBY'}
          </span>

          {/* Energy Consumption live badge */}
          {isOn && (
            <span
              className={`text-[10px] font-mono tracking-tight px-2 py-0.5 mt-1 rounded-full ${
                isNightVision
                  ? 'bg-red-950/80 text-red-200 border border-red-700/50'
                  : 'bg-black/40 text-white font-semibold border border-white/20'
              }`}
            >
              ~{burnRateMa} mA
            </span>
          )}
        </button>
      </div>

      {/* Mode & Source Sub-status Pills */}
      <div className="flex items-center gap-2 mt-4 text-xs font-mono">
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors ${
            isOn
              ? isNightVision
                ? 'bg-red-950/60 border-red-800 text-red-300'
                : 'bg-slate-900 border-slate-700 text-slate-200'
              : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}
          style={
            isOn && !isNightVision
              ? {
                  borderColor: `${activeColorHex}66`,
                  color: activeColorHex === '#ffffff' ? '#ffffff' : activeColorHex,
                }
              : undefined
          }
        >
          {getModeIcon()}
          <span className="font-semibold tracking-wide">{getModeLabel()}</span>
        </div>

        <div className="px-2.5 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-slate-400 text-[11px] font-mono">
          {getSourceLabel()}
        </div>
      </div>
    </div>
  );
};
