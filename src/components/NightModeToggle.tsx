/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Eye, Shield, Moon } from 'lucide-react';
import { playTacticalClick } from '../utils/audio';

interface NightModeToggleProps {
  isNightVision: boolean;
  onToggle: () => void;
}

export const NightModeToggle: React.FC<NightModeToggleProps> = ({
  isNightVision,
  onToggle,
}) => {
  const handleClick = () => {
    playTacticalClick(!isNightVision);
    onToggle();
  };

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer rounded-2xl p-3.5 sm:p-4 border transition-all select-none ${
        isNightVision
          ? 'bg-red-950/70 border-red-600/80 shadow-[0_0_25px_rgba(239,68,68,0.25)] ring-1 ring-red-500'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
              isNightVision
                ? 'bg-red-900/60 border-red-500 text-red-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Eye className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Night Vision Red Light Filter
              </span>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  isNightVision
                    ? 'bg-red-900 text-red-100 border border-red-500'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {isNightVision ? 'ENGAGED' : 'OFF'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Filters all blue/white spectrums to 630nm deep ruby red to preserve retinal rhodopsin.
            </p>
          </div>
        </div>

        {/* Tactical Toggle Switch UI */}
        <div
          className={`w-11 h-6 rounded-full transition-colors duration-200 relative shrink-0 border ${
            isNightVision ? 'bg-red-600 border-red-400' : 'bg-slate-800 border-slate-700'
          }`}
        >
          <div
            className={`absolute top-[2px] w-[18px] h-[18px] rounded-full shadow-md transition-all duration-200 ${
              isNightVision
                ? 'left-[22px] bg-white'
                : 'left-[2px] bg-slate-300'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
