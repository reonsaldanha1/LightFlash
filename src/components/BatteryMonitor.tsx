/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BatteryCharging, Battery, BatteryMedium, BatteryWarning, Leaf, ShieldAlert } from 'lucide-react';
import { BatteryState } from '../types/flashlight';

interface BatteryMonitorProps {
  battery: BatteryState;
  onToggleEcoMode: () => void;
  isNightVision: boolean;
}

export const BatteryMonitor: React.FC<BatteryMonitorProps> = ({
  battery,
  onToggleEcoMode,
  isNightVision,
}) => {
  const percent = Math.round(battery.level * 100);
  const isLow = percent <= 15;
  const isMedium = percent > 15 && percent <= 45;

  const getBatteryIcon = () => {
    if (battery.charging) {
      return <BatteryCharging className="w-4 h-4 text-emerald-400" />;
    }
    if (isLow) {
      return <BatteryWarning className="w-4 h-4 text-rose-500 animate-pulse" />;
    }
    if (isMedium) {
      return <BatteryMedium className="w-4 h-4 text-amber-400" />;
    }
    return <Battery className="w-4 h-4 text-emerald-400" />;
  };

  const getProgressColor = () => {
    if (isNightVision) return 'bg-red-500';
    if (isLow) return 'bg-rose-500';
    if (isMedium) return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getBatteryIcon()}
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Battery Telemetry & Energy Consumption
          </h3>
        </div>

        <button
          onClick={onToggleEcoMode}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border transition-all active:scale-95 ${
            battery.isEcoMode
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          aria-label={battery.isEcoMode ? 'Disable eco battery saver' : 'Enable eco battery saver'}
        >
          <Leaf className={`w-3.5 h-3.5 ${battery.isEcoMode ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span>{battery.isEcoMode ? 'ECO SAVER ON' : 'ECO SAVER OFF'}</span>
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-3">
        {/* Battery Level */}
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Power Level</div>
          <div className="text-lg font-black text-slate-100 mt-0.5 flex items-baseline gap-1">
            <span>{percent}%</span>
            {battery.charging && (
              <span className="text-[10px] font-semibold text-emerald-400 font-mono">CHG</span>
            )}
          </div>
          <div className="text-[10px] font-mono text-slate-500 truncate">
            {battery.charging ? 'External Power' : 'Discharging'}
          </div>
        </div>

        {/* Burn Rate */}
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Current Draw</div>
          <div className="text-lg font-black text-amber-400 mt-0.5">
            ~{battery.burnRateMa} <span className="text-xs font-normal">mA</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            {battery.isEcoMode ? 'Throttled 30%' : 'Standard Draw'}
          </div>
        </div>

        {/* Estimated Runtime */}
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Est. Runtime</div>
          <div className="text-lg font-black text-emerald-400 mt-0.5">
            {battery.estimatedRemainingHours > 48 ? '> 48h' : `${battery.estimatedRemainingHours}h`}
          </div>
          <div className="text-[10px] font-mono text-slate-500">Continuous Beam</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>0% CRITICAL</span>
          <span>50% NOMINAL</span>
          <span>100% MAXIMUM</span>
        </div>
      </div>

      {/* Low Battery Warning Banner */}
      {isLow && (
        <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs font-mono">
          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
          <span>
            CRITICAL BATTERY LEVEL ({percent}%). Switch to Eco Saver or 1Hz Beacon to prevent power loss!
          </span>
        </div>
      )}
    </div>
  );
};
