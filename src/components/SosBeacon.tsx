/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Volume2, VolumeX, Copy, Check, Radio } from 'lucide-react';
import { GPSCoordinates } from '../types/flashlight';

interface SosBeaconProps {
  isActive: boolean;
  onToggleSos: () => void;
  audioToneEnabled: boolean;
  onToggleAudioTone: () => void;
  activeSymbolIndex: number; // 0 to 8: S (0,1,2), O (3,4,5), S (6,7,8) or -1 for gap
  cycleCount: number;
  gps: GPSCoordinates;
  isNightVision: boolean;
}

export const SosBeacon: React.FC<SosBeaconProps> = ({
  isActive,
  onToggleSos,
  audioToneEnabled,
  onToggleAudioTone,
  activeSymbolIndex,
  cycleCount,
  gps,
  isNightVision,
}) => {
  const [copied, setCopied] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const copyDistressDispatch = () => {
    const timeStr = new Date().toISOString();
    const latStr =
      gps.latitude !== null
        ? `${Math.abs(gps.latitude).toFixed(5)}°${gps.latitude >= 0 ? 'N' : 'S'}`
        : 'UNKNOWN';
    const lngStr =
      gps.longitude !== null
        ? `${Math.abs(gps.longitude).toFixed(5)}°${gps.longitude >= 0 ? 'E' : 'W'}`
        : 'UNKNOWN';
    const altStr = gps.altitude !== null ? `${gps.altitude}m` : 'N/A';

    const dispatchText = `MAYDAY DISTRESS DISPATCH (LIGHTFLASH BEACON ACTIVE)\nTIME: ${timeStr}\nCOORDINATES: LAT ${latStr}, LNG ${lngStr} (±${gps.accuracy || 15}m)\nALTITUDE: ${altStr}\nSTATUS: Emergency SOS Beacon Loop Engaged.\nAUDIO/OPTICAL: 850Hz Continuous ITU Morse SOS (... --- ...).`;

    navigator.clipboard.writeText(dispatchText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Morse symbols representation:
  // S: 0: dot, 1: dot, 2: dot
  // O: 3: dash, 4: dash, 5: dash
  // S: 6: dot, 7: dot, 8: dot
  const symbols = [
    { id: 0, char: '•', isDash: false, letter: 'S' },
    { id: 1, char: '•', isDash: false, letter: 'S' },
    { id: 2, char: '•', isDash: false, letter: 'S' },
    { id: 3, char: '—', isDash: true, letter: 'O' },
    { id: 4, char: '—', isDash: true, letter: 'O' },
    { id: 5, char: '—', isDash: true, letter: 'O' },
    { id: 6, char: '•', isDash: false, letter: 'S' },
    { id: 7, char: '•', isDash: false, letter: 'S' },
    { id: 8, char: '•', isDash: false, letter: 'S' },
  ];

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition-all ${
        isActive
          ? 'bg-rose-950/40 border-rose-600/80 shadow-[0_0_30px_rgba(244,63,94,0.2)]'
          : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={`w-4 h-4 ${isActive ? 'text-rose-500 animate-bounce' : 'text-rose-400'}`}
          />
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">
            Emergency SOS Distress Beacon
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleAudioTone}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              audioToneEnabled
                ? 'bg-rose-900/60 border-rose-700 text-rose-200'
                : 'bg-slate-800/60 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
            title={audioToneEnabled ? '850Hz Siren Tone Active' : 'Siren Audio Muted'}
            aria-label={audioToneEnabled ? 'Mute emergency siren' : 'Enable emergency siren'}
          >
            {audioToneEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main SOS Trigger Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isActive ? 'bg-rose-500 animate-ping' : 'bg-slate-600'
              }`}
            />
            <span className="text-sm font-black tracking-wide text-slate-100">
              {isActive ? 'TRANSMITTING SOS SIGNAL' : 'DISTRESS BEACON STANDBY'}
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-3">
            <span>Cycles: {cycleCount}</span>
            <span>Duration: {formatElapsed(elapsedSeconds)}</span>
            <span>ITU Standard 3-3-3</span>
          </div>
        </div>

        <button
          onClick={onToggleSos}
          className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all active:scale-95 shadow-lg ${
            isActive
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/60 ring-2 ring-rose-400'
              : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-950/50'
          }`}
        >
          {isActive ? 'ABORT SOS SIGNAL' : 'ACTIVATE SOS BEACON'}
        </button>
      </div>

      {/* Interactive Live Morse Code Visualizer */}
      <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-800">
        <div className="text-[10px] font-mono text-slate-400 mb-2 flex items-center justify-between">
          <span>MORSE TIMELINE: [ ... ] [ --- ] [ ... ]</span>
          <span className="text-rose-400 font-bold">
            {activeSymbolIndex >= 0 ? `TRANSMITTING ELEMENT #${activeSymbolIndex + 1}` : 'INTERVAL GAP'}
          </span>
        </div>

        <div className="grid grid-cols-9 gap-1.5 sm:gap-2">
          {symbols.map((sym) => {
            const isCurrent = activeSymbolIndex === sym.id;
            return (
              <div
                key={sym.id}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all duration-75 ${
                  isCurrent
                    ? 'bg-rose-600 border-white text-white scale-110 shadow-[0_0_15px_rgba(244,63,94,0.9)] ring-2 ring-white'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-lg font-black leading-none">
                  {sym.isDash ? '━' : '●'}
                </span>
                <span className="text-[9px] font-mono mt-1 opacity-70">
                  {sym.letter}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Emergency GPS Dispatch Export */}
      <div className="mt-3 flex items-center justify-between bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span className="truncate max-w-[200px] sm:max-w-none">
            {gps.latitude !== null && gps.longitude !== null
              ? `GPS: ${gps.latitude.toFixed(4)}°, ${gps.longitude.toFixed(4)}° (±${gps.accuracy}m)`
              : 'Acquiring GPS fix for distress payload...'}
          </span>
        </div>

        <button
          onClick={copyDistressDispatch}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 active:scale-95 transition-all shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Dispatch</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
