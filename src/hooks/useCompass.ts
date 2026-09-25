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
  const refreshLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation unavailable on this device.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

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
        setGps(coords);
        setGpsLoading(false);
        // Cache to localStorage for offline survival use
        try {
          localStorage.setItem('lightflash_cached_gps', JSON.stringify(coords));
        } catch {}
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(err.message || 'GPS Signal Search Timed Out');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
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
