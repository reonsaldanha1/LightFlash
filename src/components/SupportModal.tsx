/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Coffee,
  Heart,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { playTacticalClick, triggerHaptic, HAPTIC_PATTERNS } from '../utils/audio';
import { torchController } from '../utils/torch';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNightVision: boolean;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  isNightVision,
}) => {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const upiId = 'saldanhareon01@oksbi';
  const payeeName = 'Reon Saldanha';
  const bmacUrl = 'https://buymeacoffee.com/reonsaldanha1';
  const upiDeepLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&cu=INR`;

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    playTacticalClick(true);
    triggerHaptic(HAPTIC_PATTERNS.BUTTON_CLICK);
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(upiId);
      }
    } catch {}
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleOpenBmac = () => {
    playTacticalClick(true);
    triggerHaptic(HAPTIC_PATTERNS.BUTTON_CLICK);
    torchController.openUrl(bmacUrl);
  };

  const handleOpenUpiApp = () => {
    playTacticalClick(true);
    triggerHaptic(HAPTIC_PATTERNS.BUTTON_CLICK);
    torchController.openUrl(upiDeepLink);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border shadow-2xl p-5 sm:p-6 transition-all ${
          isNightVision
            ? 'bg-red-950/95 border-red-700/80 text-red-100 shadow-[0_0_50px_rgba(239,68,68,0.3)]'
            : 'bg-slate-950/95 border-slate-700/80 text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.9)]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border font-black ${
                isNightVision
                  ? 'bg-red-900/60 border-red-600 text-red-300'
                  : 'bg-amber-500/20 border-amber-500/80 text-amber-400'
              }`}
            >
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-wider uppercase">
                  Support Lightflash
                </h2>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    isNightVision
                      ? 'bg-red-900 text-red-200 border border-red-700'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  COMMUNITY
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Support independent tactical software development
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playTacticalClick(false);
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white active:scale-95 transition-all"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Intro Message */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
          <p>
            Lightflash is built to be <strong className="text-white">100% free, private, offline-first</strong>, and completely ad-free. If this tactical illumination toolkit has helped you during nighttime expeditions, search missions, or everyday tasks, your support makes a huge difference!
          </p>
        </div>

        {/* Option 1: Buy Me a Coffee */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900/70 to-slate-950 border border-amber-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                <Coffee className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold font-mono text-amber-300 uppercase tracking-wide">
                Option 1 • Buy Me a Coffee
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              International Cards & PayPal
            </span>
          </div>

          <p className="text-xs text-slate-300 mb-3">
            Support via credit card, debit card, Apple Pay, Google Pay, or PayPal worldwide.
          </p>

          <button
            onClick={handleOpenBmac}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs tracking-wider uppercase shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Coffee className="w-4 h-4 text-slate-950" />
            <span>Buy Me a Coffee (buymeacoffee.com/reonsaldanha1)</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1 text-slate-950" />
          </button>
        </div>

        {/* Option 2: Direct UPI QR Code (India / Any UPI App) */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                <QrCode className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold font-mono text-emerald-300 uppercase tracking-wide">
                Option 2 • Donate via UPI QR Code
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Zero Fees / Instant
            </span>
          </div>

          <p className="text-xs text-slate-300 mb-3">
            Scan using Google Pay, PhonePe, Paytm, BHIM, CRED, Amazon Pay, or any UPI banking app.
          </p>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-slate-900 shadow-inner max-w-xs mx-auto mb-3.5">
            <div className="w-56 h-auto overflow-hidden rounded-xl">
              <img
                src="/donate-upi-qr.png"
                alt="Reon Saldanha UPI QR Code"
                className="w-full h-auto object-contain block select-none"
              />
            </div>
          </div>

          {/* UPI ID Details & Quick Actions */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Recipient / UPI ID
              </div>
              <div className="text-xs font-mono font-bold text-amber-400 truncate">
                {payeeName} ({upiId})
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyUpi}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                title="Copy UPI ID to clipboard"
              >
                {copiedUpi ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>

              <button
                onClick={handleOpenUpiApp}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50"
                title="Directly launch UPI application"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Open UPI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Gratitude Guarantee */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-mono text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Thank you for supporting open, tracker-free tactical tools!</span>
        </div>

        {/* Close Button */}
        <div className="mt-5">
          <button
            onClick={() => {
              playTacticalClick(false);
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-mono font-bold active:scale-95 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
