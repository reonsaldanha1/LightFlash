/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Volume2, Radio, Info } from 'lucide-react';
import { startMorseTone, stopMorseTone } from '../utils/audio';

interface MorseReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MORSE_ALPHABET: Record<string, string> = {
  A: '• —',
  B: '— • • •',
  C: '— • — •',
  D: '— • •',
  E: '•',
  F: '• • — •',
  G: '— — •',
  H: '• • • •',
  I: '• •',
  J: '• — — —',
  K: '— • —',
  L: '• — • •',
  M: '— —',
  N: '— •',
  O: '— — —',
  P: '• — — •',
  Q: '— — • —',
  R: '• — •',
  S: '• • •',
  T: '—',
  U: '• • —',
  V: '• • • —',
  W: '• — —',
  X: '— • • —',
  Y: '— • — —',
  Z: '— — • •',
  '1': '• — — — —',
  '2': '• • — — —',
  '3': '• • • — —',
  '4': '• • • • —',
  '5': '• • • • •',
  '0': '— — — — —',
  SOS: '• • • — — — • • •',
};

export const MorseReferenceModal: React.FC<MorseReferenceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [playingChar, setPlayingChar] = useState<string | null>(null);

  if (!isOpen) return null;

  const playMorseSequence = async (char: string, code: string) => {
    if (playingChar) return;
    setPlayingChar(char);

    const unitMs = 120;
    const parts = code.split(' ');

    for (const part of parts) {
      if (part === '•') {
        startMorseTone(850);
        await new Promise((r) => setTimeout(r, unitMs));
        stopMorseTone();
      } else if (part === '—') {
        startMorseTone(850);
        await new Promise((r) => setTimeout(r, unitMs * 3));
        stopMorseTone();
      }
      await new Promise((r) => setTimeout(r, unitMs));
    }

    setPlayingChar(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              International Morse Code Survival Table
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto my-3 pr-1 space-y-3">
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Tap any letter to listen to the audio acoustic transmission. ITU standard specifies:
              1 Dash length = 3 Dots length.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(MORSE_ALPHABET).map(([char, code]) => {
              const isPlaying = playingChar === char;
              const isSos = char === 'SOS';
              return (
                <button
                  key={char}
                  onClick={() => playMorseSequence(char, code)}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs font-mono transition-all ${
                    isSos
                      ? 'col-span-2 sm:col-span-3 bg-rose-950/60 border-rose-600 text-rose-200 font-bold'
                      : isPlaying
                      ? 'bg-amber-500/30 border-amber-400 text-amber-200 ring-1 ring-amber-400'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{char}</span>
                    <span className="tracking-widest text-slate-400">{code}</span>
                  </div>
                  <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all"
        >
          Close Reference Table
        </button>
      </div>
    </div>
  );
};
