/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

interface WakeLockSentinel extends EventTarget {
  released: boolean;
  type: string;
  release: () => Promise<void>;
}

export function useWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function requestLock() {
      if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
        return;
      }

      try {
        if (enabled && !wakeLockRef.current) {
          const lock = await (navigator as unknown as {
            wakeLock: { request: (type: 'screen') => Promise<WakeLockSentinel> };
          }).wakeLock.request('screen');

          if (isCancelled) {
            lock.release();
            return;
          }

          wakeLockRef.current = lock;
          lock.addEventListener('release', () => {
            wakeLockRef.current = null;
          });
        } else if (!enabled && wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
      } catch (err) {
        // WakeLock request could fail if battery is critically low or tab is in background
      }
    }

    requestLock();

    // Re-acquire lock if tab becomes visible again while enabled
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isCancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [enabled]);
}
