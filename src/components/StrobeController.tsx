/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Zap, Activity, Volume2, VolumeX, ShieldAlert } from 'lucide-react';

interface StrobeControllerProps {
  frequencyHz: number;
  onFrequencyChange: (hz: number) => void;
  isActive: boolean;
  onToggleStrobe: () => void;
  audioClickEnabled: boolean;
  onToggleAudioClick: () => void;
  isNightVision: boolean;
}

export const StrobeController: React.FC<StrobeControllerProps> = ({
  frequencyHz,
  onFrequencyChange,
  isActive,
  onToggleStrobe,
  audioClickEnabled,
  onToggleAudioClick,
  isNightVision,
}) => {
  const presets = [
    { hz: 1, label: '1 Hz', desc: 'Long-life Beacon' },
    { hz: 4, label: '4 Hz', desc: 'Cyclist / Safety' },
    { hz: 10, label: '10 Hz', desc: 'Tactical Defense' },
    { hz: 18, label: '18 Hz', desc: 'Disorientation' },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 ${isNightVision ? 'text-red-400' : 'text-amber-400'}`} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Strobe Mode & Tactical Frequency
          </h3>
        </div>

        <button
          onClick={onToggleAudioClick}
          className={`p-1.5 rounded-lg border text-xs transition-colors ${
            audioClickEnabled
              ? isNightVision
                ? 'bg-red-950/80 border-red-800 text-red-300'
                : 'bg-amber-500/20 border-amber-500/80 text-amber-300'
              : 'bg-slate-800/60 border-slate-700 text-slate-500 hover:text-slate-300'
          }`}
          title={audioClickEnabled ? 'Audio Pulse Tick Enabled' : 'Audio Pulse Muted'}
          aria-label={audioClickEnabled ? 'Mute pulse audio' : 'Enable pulse audio'}
        >
          {audioClickEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main Switch for Strobe */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
              isActive
                ? isNightVision
                  ? 'bg-red-950/80 border-red-700 text-red-400'
                  : 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <Activity className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-200">
              {isActive ? 'STROBE ACTIVE' : 'STROBE ARMED'}
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              {frequencyHz} Cycles / Second ({Math.round(1000 / frequencyHz)}ms interval)
            </div>
          </div>
        </div>

        <button
          onClick={onToggleStrobe}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-md ${
            isActive
              ? isNightVision
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/50'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-950/50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          {isActive ? 'DISENGAGE' : 'ENGAGE'}
        </button>
      </div>

      {/* Frequency Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>PULSE FREQUENCY</span>
          <span className="font-bold text-slate-100 flex items-center gap-1.5">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isActive ? 'bg-amber-400 animate-ping' : 'bg-slate-600'
              }`}
            />
            {frequencyHz} HZ
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="25"
          step="1"
          value={frequencyHz}
          onChange={(e) => onFrequencyChange(Number(e.target.value))}
          aria-label="Adjust strobe frequency"
          className="w-full"
        />

        {/* Hz Presets */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {presets.map((preset) => {
            const isSelected = frequencyHz === preset.hz;
            return (
              <button
                key={preset.hz}
                onClick={() => onFrequencyChange(preset.hz)}
                className={`py-1.5 px-2 rounded-lg text-center border transition-all ${
                  isSelected
                    ? isNightVision
                      ? 'bg-red-900/60 border-red-500 text-red-200'
                      : 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="text-xs font-mono font-bold">{preset.label}</div>
                <div className="text-[9px] text-slate-400 truncate">{preset.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Epilepsy / Safety Warning */}
      <div className="mt-3 flex items-start gap-2 text-[10px] text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <span>
          Caution: Rapid flashing frequencies above 10Hz can cause photosensitive discomfort. Use responsibly.
        </span>
      </div>
    </div>
  );
};
