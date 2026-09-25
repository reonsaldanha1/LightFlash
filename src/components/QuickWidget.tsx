/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Zap, AlertTriangle, Eye, Flame, ChevronUp, ChevronDown, LayoutGrid, Check } from 'lucide-react';
import { playTacticalClick } from '../utils/audio';
import { NativeTorch } from '../utils/torch';
import { Capacitor } from '@capacitor/core';

interface QuickWidgetProps {
  isOn: boolean;
  onInstantMaxBurst: () => void;
  onInstantSos: () => void;
  onInstantNightVision: () => void;
  isNightVision: boolean;
  isSosActive: boolean;
  batteryPercent: number;
}

export const QuickWidget: React.FC<QuickWidgetProps> = ({
  isOn,
  onInstantMaxBurst,
  onInstantSos,
  onInstantNightVision,
  isNightVision,
  isSosActive,
  batteryPercent,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [widgetToast, setWidgetToast] = useState<string | null>(null);

  const handleAddWidget = async () => {
    playTacticalClick(true);
    try {
      if (Capacitor.isNativePlatform()) {
        const res = await NativeTorch.requestPinWidget();
        if (res && res.supported) {
          setWidgetToast('Check home screen or tap Add in system dialog!');
          setTimeout(() => setWidgetToast(null), 4000);
          return;
        }
      }
    } catch {}

    // Guide instruction
    setWidgetToast('Tip: Long-press your phone home screen > Widgets > Lightflash');
    setTimeout(() => setWidgetToast(null), 4500);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-md select-none transition-all">
      <div
        className={`rounded-2xl border backdrop-blur-xl transition-all shadow-2xl ${
          isNightVision
            ? 'bg-red-950/90 border-red-700/80 shadow-[0_8px_32px_rgba(239,68,68,0.3)]'
            : 'bg-slate-950/90 border-slate-700/80 shadow-[0_8px_32px_rgba(0,0,0,0.85)]'
        }`}
      >
        {/* Widget Top Bar / Toggle Pill */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between px-4 py-2 cursor-pointer border-b border-white/10"
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isOn ? (isNightVision ? 'bg-red-500 animate-ping' : 'bg-amber-400 animate-ping') : 'bg-slate-500'
              }`}
            />
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-300">
              Quick Tactical Actions
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-slate-400">
              PWR: {batteryPercent}%
            </span>
            <button
              type="button"
              className="p-0.5 rounded text-slate-400 hover:text-slate-100"
              aria-label={isExpanded ? 'Collapse widget' : 'Expand widget'}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Quick Action Grid */}
        {isExpanded && (
          <div className="p-3 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {/* 1. Instant 100% Lumens Panic Burst */}
              <button
                onClick={() => {
                  playTacticalClick(true);
                  onInstantMaxBurst();
                }}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 active:scale-95 text-slate-950 font-bold shadow-md transition-all border border-amber-300"
              >
                <Flame className="w-5 h-5 mb-1" />
                <span className="text-[11px] font-black tracking-tight leading-tight">
                  MAX BURST
                </span>
                <span className="text-[9px] font-mono opacity-80">100% LUMEN</span>
              </button>

              {/* 2. Instant SOS Emergency Beacon */}
              <button
                onClick={() => {
                  playTacticalClick(true);
                  onInstantSos();
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl active:scale-95 text-white font-bold shadow-md transition-all border ${
                  isSosActive
                    ? 'bg-rose-600 border-white ring-2 ring-rose-400'
                    : 'bg-gradient-to-b from-rose-700 to-red-900 border-rose-600'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 mb-1 ${isSosActive ? 'animate-bounce' : ''}`} />
                <span className="text-[11px] font-black tracking-tight leading-tight">
                  {isSosActive ? 'ABORT SOS' : 'PANIC SOS'}
                </span>
                <span className="text-[9px] font-mono opacity-80">DISTRESS LOOP</span>
              </button>

              {/* 3. Instant Night Vision Red Filter */}
              <button
                onClick={() => {
                  playTacticalClick(!isNightVision);
                  onInstantNightVision();
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl active:scale-95 font-bold shadow-md transition-all border ${
                  isNightVision
                    ? 'bg-red-700 border-white text-white'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                <Eye className="w-5 h-5 mb-1 text-red-400" />
                <span className="text-[11px] font-black tracking-tight leading-tight">
                  {isNightVision ? 'NIGHT ON' : 'NIGHT RED'}
                </span>
                <span className="text-[9px] font-mono opacity-80">630nm FILTER</span>
              </button>
            </div>

            {/* Install Android Phone Home Screen Widget Button */}
            {Capacitor.isNativePlatform() && (
              <div className="pt-1">
                <button
                  onClick={handleAddWidget}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-700/80 text-amber-300 font-mono text-[10px] flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-sm"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                  <span>Add 1-Tap Widget to Phone Home Screen</span>
                </button>
                {widgetToast && (
                  <div className="mt-1 text-[10px] text-center text-amber-200 font-mono bg-amber-950/60 p-1.5 rounded-lg border border-amber-500/50 animate-in fade-in duration-150">
                    {widgetToast}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
