/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo } from 'react';
import { BatteryState, FlashlightMode, LightSource } from '../types/flashlight';

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

export function useBattery(
  isLightOn: boolean,
  mode: FlashlightMode,
  lightSource: LightSource,
  brightness: number, // 0 - 100
  isNightVision: boolean
) {
  const [level, setLevel] = useState<number>(0.85); // fallback initial
  const [charging, setCharging] = useState<boolean>(false);
  const [chargingTime, setChargingTime] = useState<number>(0);
  const [dischargingTime, setDischargingTime] = useState<number>(Infinity);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isEcoMode, setIsEcoMode] = useState<boolean>(false);

  useEffect(() => {
    const nav = typeof window !== 'undefined' ? (window.navigator as NavigatorWithBattery) : null;
    let batteryInstance: BatteryManager | null = null;

    if (nav?.getBattery) {
      nav.getBattery().then((batt) => {
        batteryInstance = batt;
        setIsSupported(true);
        setLevel(batt.level);
        setCharging(batt.charging);
        setChargingTime(batt.chargingTime);
        setDischargingTime(batt.dischargingTime);

        const onLevelChange = () => setLevel(batt.level);
        const onChargingChange = () => setCharging(batt.charging);
        const onDischargingChange = () => setDischargingTime(batt.dischargingTime);
        const onChargingTimeChange = () => setChargingTime(batt.chargingTime);

        batt.addEventListener('levelchange', onLevelChange);
        batt.addEventListener('chargingchange', onChargingChange);
        batt.addEventListener('dischargingtimechange', onDischargingChange);
        batt.addEventListener('chargingtimechange', onChargingTimeChange);
      }).catch(() => {
        setIsSupported(false);
      });
    }

    return () => {
      // Clean up battery listeners if available
    };
  }, []);

  // Calculate estimated electrical current burn rate in milliAmps (mA)
  // Typical smartphone battery capacity: ~4,000 mAh
  const burnRateMa = useMemo(() => {
    // Idle baseline system drain: ~80 mA
    let totalMa = 80;

    if (!isLightOn) {
      return totalMa;
    }

    const effectiveBrightness = isEcoMode ? Math.min(brightness, 35) : brightness;

    // Hardware Rear Camera LED Torch: ~400-500 mA at 100% duty cycle
    if (lightSource === 'torch' || lightSource === 'dual') {
      if (mode === 'steady') {
        totalMa += 420;
      } else if (mode === 'strobe') {
        // Strobe operates at ~50% duty cycle
        totalMa += 210;
      } else if (mode === 'sos') {
        // SOS average active duty cycle ~45%
        totalMa += 190;
      }
    }

    // Screen Panel Illumination:
    // Full white screen at 100% brightness ~320 mA on modern AMOLED/IPS
    // Red Light Night filter activates only red subpixels on AMOLED, reducing screen drain by ~60%!
    if (lightSource === 'screen' || lightSource === 'dual') {
      const baseScreenMa = (effectiveBrightness / 100) * 320;
      const screenMa = isNightVision ? baseScreenMa * 0.4 : baseScreenMa;

      if (mode === 'strobe') {
        totalMa += screenMa * 0.5;
      } else if (mode === 'sos') {
        totalMa += screenMa * 0.45;
      } else {
        totalMa += screenMa;
      }
    }

    // Eco Mode optimization discount
    if (isEcoMode) {
      totalMa = Math.max(90, totalMa * 0.7);
    }

    return Math.round(totalMa);
  }, [isLightOn, mode, lightSource, brightness, isNightVision, isEcoMode]);

  // Calculate estimated remaining operating hours based on 4000mAh typical battery & current percentage
  const estimatedRemainingHours = useMemo(() => {
    const batteryCapacityMah = 4000;
    const remainingMah = batteryCapacityMah * level;
    if (burnRateMa <= 0) return 99;
    const hours = remainingMah / burnRateMa;
    return Math.round(hours * 10) / 10;
  }, [level, burnRateMa]);

  const toggleEcoMode = () => {
    setIsEcoMode((prev) => !prev);
  };

  const batteryState: BatteryState = {
    level,
    charging,
    chargingTime,
    dischargingTime,
    isSupported,
    burnRateMa,
    estimatedRemainingHours,
    isEcoMode,
  };

  return {
    batteryState,
    toggleEcoMode,
    setLevel, // For testing or simulated slider if desired
  };
}
