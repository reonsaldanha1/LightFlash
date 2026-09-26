/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { GPSCoordinates } from '../types/flashlight';

export function useCompass() {
  const [heading, setHeading] = useState<number | null>(null);
  const [gps, setGps] = useState<GPSCoordinates>({
    latitude: null,
    longitude: null,
    altitude: null,
    accuracy: null,
    heading: null,
    speed: null,
    timestamp: null,
  });
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Compass heading via DeviceOrientation
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // iOS WebKit compass heading
      if ('webkitCompassHeading' in e && typeof (e as unknown as { webkitCompassHeading: number }).webkitCompassHeading === 'number') {
        setHeading(Math.round((e as unknown as { webkitCompassHeading: number }).webkitCompassHeading));
      } else if (e.alpha !== null) {
        // Standard Android/Desktop alpha
        setHeading(Math.round(360 - e.alpha));
      }
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, []);

  // Fetch or refresh offline cached GPS coordinates
  const refreshLocation = async (): Promise<GPSCoordinates | null> => {
    setGpsLoading(true);
    setGpsError(null);

    // 1. Try Native Android Location first (instantaneous & accurate on devices)
    try {
      const nativeLoc = await torchController.getNativeLocation();
      if (nativeLoc && nativeLoc.latitude !== null && nativeLoc.longitude !== null) {
        const coords: GPSCoordinates = {
          latitude: nativeLoc.latitude,
          longitude: nativeLoc.longitude,
          altitude: nativeLoc.altitude ? Math.round(nativeLoc.altitude) : null,
          accuracy: nativeLoc.accuracy ? Math.round(nativeLoc.accuracy) : null,
          heading: null,
          speed: null,
          timestamp: Date.now(),
        };
        setGps(coords);
        try {
          localStorage.setItem('lightflash_cached_gps', JSON.stringify(coords));
        } catch {}
      }
    } catch (e) {
      console.warn('Native location lookup error:', e);
    }

    // 2. Query Geolocation API with high accuracy and fresh fix (maximumAge: 0)
    return new Promise<GPSCoordinates | null>((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setGpsError('Geolocation unavailable');
        setGpsLoading(false);
        resolve(null);
        return;
      }

      // Minimum animation time so user sees the refresh spinner spin
      const startTime = Date.now();
      const finish = (resultCoords: GPSCoordinates | null, errorMsg?: string) => {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 500 - elapsed);
        setTimeout(() => {
          if (resultCoords) {
            setGps(resultCoords);
            try {
              localStorage.setItem('lightflash_cached_gps', JSON.stringify(resultCoords));
            } catch {}
          }
          if (errorMsg) {
            setGpsError(errorMsg);
          }
          setGpsLoading(false);
          resolve(resultCoords);
        }, delay);
      };

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: GPSCoordinates = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            altitude: pos.coords.altitude ? Math.round(pos.coords.altitude) : null,
            accuracy: Math.round(pos.coords.accuracy),
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
          };
          finish(coords);
        },
        (err) => {
          finish(null, err.message || 'GPS Signal Search Timed Out');
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0, // Force fresh fix
        }
      );
    });
  };

  // Load initial cached coordinates on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem('lightflash_cached_gps');
      if (cached) {
        setGps(JSON.parse(cached));
      }
    } catch {}
    refreshLocation();
  }, []);

  // Cardinal direction label
  const getCardinal = (deg: number | null): string => {
    if (deg === null) return '---';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 45) % 8;
    return directions[index];
  };

  return {
    heading,
    cardinal: getCardinal(heading),
    gps,
    gpsLoading,
    gpsError,
    refreshLocation,
  };
}
