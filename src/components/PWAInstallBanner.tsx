/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, X, Smartphone, Share, PlusSquare } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Never show PWA web install banner when already installed as native Android APK
  if (isInstalled || dismissed || Capacitor.isNativePlatform()) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs text-slate-300 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-100 flex items-center gap-1.5">
              <span>Install Lightflash as Widget / PWA</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                OFFLINE READY
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Immediate home screen activation without cellular connection.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
          )}

          {isIOS && (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg active:scale-95 transition-all text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install (iOS)</span>
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded text-slate-500 hover:text-slate-300"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-400" />
                Add to iPhone Home Screen
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="p-1.5 bg-slate-850 rounded-lg text-blue-400">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white">Step 1:</span> Tap the{' '}
                  <span className="text-blue-400 font-semibold">Share</span> icon in Safari toolbar at the bottom.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="p-1.5 bg-slate-850 rounded-lg text-emerald-400">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white">Step 2:</span> Scroll down and choose{' '}
                  <span className="text-white font-semibold">"Add to Home Screen"</span>.
                </div>
              </div>

              <p className="text-[11px] text-slate-400 pt-1">
                This enables immediate 1-tap activation from your phone lock screen or widget shelf with 100% offline support.
              </p>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 active:scale-95 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
