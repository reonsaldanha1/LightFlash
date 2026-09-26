/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerPlugin, Capacitor } from '@capacitor/core';

export interface NativeTorchPlugin {
  isAvailable(): Promise<{
    available: boolean;
    supportsStrength?: boolean;
    maxStrength?: number;
    currentStrength?: number;
  }>;
  setTorch(options: {
    enabled: boolean;
    strength?: number;
  }): Promise<{
    success: boolean;
    isOn: boolean;
    strength: number;
    maxStrength?: number;
    supportsStrength?: boolean;
  }>;
  setTorchStrength(options: {
    strength: number;
  }): Promise<{
    success: boolean;
    strength: number;
    isOn: boolean;
    maxStrength?: number;
    supportsStrength?: boolean;
  }>;
  setScreenBrightness(options: {
    brightness: number;
  }): Promise<{
    success: boolean;
  }>;
  toggleTorch(): Promise<{
    success: boolean;
    isOn: boolean;
    strength: number;
  }>;
  getTorchState(): Promise<{
    isOn: boolean;
    strength: number;
    maxStrength?: number;
    supportsStrength?: boolean;
  }>;
  requestPinWidget(): Promise<{ supported: boolean; success: boolean }>;
  checkLaunchIntent(): Promise<{ triggerSos: boolean }>;
  shareLocation(options: { text: string }): Promise<{ success: boolean }>;
  getNativeLocation(): Promise<{
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
    accuracy: number | null;
  }>;
  openUrl(options: { url: string }): Promise<{ success: boolean }>;
}

export const NativeTorch = registerPlugin<NativeTorchPlugin>('NativeTorch');

export interface TorchStatus {
  isAvailable: boolean;
  isOn: boolean;
  hasHardwareTorch: boolean;
  errorMessage: string | null;
}

class TorchController {
  private stream: MediaStream | null = null;
  private track: MediaStreamTrack | null = null;
  private isTorchSupported: boolean = false;
  private isLit: boolean = false;
  private currentStrength: number = 100;
  private supportsHardwareStrength: boolean = false;
  private maxTorchStrength: number = 1;

  /**
   * Test whether hardware torch is available
   */
  public async checkSupport(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await NativeTorch.isAvailable();
        this.isTorchSupported = res.available;
        this.supportsHardwareStrength = !!res.supportsStrength;
        this.maxTorchStrength = res.maxStrength || 1;
        if (res.currentStrength) this.currentStrength = res.currentStrength;
        return res.available;
      } catch {
        this.isTorchSupported = true;
        return true;
      }
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      return videoDevices.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Acquire rear camera track with torch capability (Web fallback)
   */
  private async acquireTrack(): Promise<MediaStreamTrack | null> {
    if (this.track && this.track.readyState === 'live') {
      return this.track;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          advanced: [{ torch: true } as unknown as MediaTrackConstraintSet],
        } as MediaTrackConstraints,
      };

      try {
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } },
        });
      }

      const tracks = this.stream.getVideoTracks();
      if (tracks.length === 0) return null;

      const track = tracks[0];
      this.track = track;

      const capabilities = (track as unknown as { getCapabilities?: () => { torch?: boolean } }).getCapabilities?.();
      this.isTorchSupported = !!capabilities?.torch;

      return track;
    } catch (err: unknown) {
      console.warn('Torch acquire warning:', err);
      return null;
    }
  }

  /**
   * Set physical torch LED state with optional brightness level (1-100%)
   * @param on whether to turn LED on or off
   * @param keepTrackAlive if true, avoids stopping the camera stream (crucial for rapid strobe/SOS)
   * @param strength percentage intensity (1-100)
   */
  public async setTorch(
    on: boolean,
    keepTrackAlive: boolean = false,
    strength?: number
  ): Promise<boolean> {
    if (strength !== undefined) {
      this.currentStrength = Math.max(1, Math.min(100, Math.round(strength)));
    }

    // 1. Primary: Native Android hardware camera torch via CameraManager
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await NativeTorch.setTorch({
          enabled: on,
          strength: this.currentStrength,
        });
        this.isLit = res.isOn;
        if (res.supportsStrength !== undefined) {
          this.supportsHardwareStrength = res.supportsStrength;
        }
        if (res.maxStrength !== undefined) {
          this.maxTorchStrength = res.maxStrength;
        }
        return res.success;
      } catch (err) {
        console.warn('NativeTorch plugin error, falling back to web API:', err);
      }
    }

    // 2. Fallback: Browser WebRTC MediaStreamTrack
    try {
      if (!on) {
        if (this.track && this.track.readyState === 'live') {
          try {
            await (this.track as unknown as {
              applyConstraints: (c: { advanced: Array<{ torch?: boolean }> }) => Promise<void>;
            }).applyConstraints({
              advanced: [{ torch: false }],
            });
          } catch {}
        }
        if (!keepTrackAlive) {
          this.stopStream();
        }
        this.isLit = false;
        return true;
      }

      const track = await this.acquireTrack();
      if (!track) {
        this.isLit = false;
        return false;
      }

      await (track as unknown as {
        applyConstraints: (c: { advanced: Array<{ torch?: boolean }> }) => Promise<void>;
      }).applyConstraints({
        advanced: [{ torch: true }],
      });

      this.isLit = true;
      return true;
    } catch (err) {
      console.warn('Unable to toggle torch:', err);
      this.isLit = false;
      return false;
    }
  }

  /**
   * Set torch hardware intensity level (1-100%)
   */
  public async setTorchStrength(strength: number): Promise<boolean> {
    this.currentStrength = Math.max(1, Math.min(100, Math.round(strength)));
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await NativeTorch.setTorchStrength({ strength: this.currentStrength });
        this.isLit = res.isOn;
        return res.success;
      } catch (err) {
        console.warn('NativeTorch setStrength error:', err);
      }
    }
    return true;
  }

  /**
   * Set native device screen brightness (1-100%)
   */
  public async setScreenBrightness(brightness: number): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        await NativeTorch.setScreenBrightness({
          brightness: Math.max(1, Math.min(100, Math.round(brightness))),
        });
        return true;
      } catch (err) {
        console.warn('NativeTorch setScreenBrightness error:', err);
      }
    }
    return true;
  }

  public getIsLit(): boolean {
    return this.isLit;
  }

  public getIsTorchSupported(): boolean {
    return this.isTorchSupported;
  }

  public getCurrentStrength(): number {
    return this.currentStrength;
  }

  public getSupportsHardwareStrength(): boolean {
    return this.supportsHardwareStrength;
  }

  public getMaxTorchStrength(): number {
    return this.maxTorchStrength;
  }

  public async checkLaunchIntent(): Promise<{ triggerSos: boolean }> {
    if (Capacitor.isNativePlatform()) {
      try {
        return await NativeTorch.checkLaunchIntent();
      } catch (err) {
        console.warn('NativeTorch checkLaunchIntent error:', err);
      }
    }
    return { triggerSos: false };
  }

  public async shareLocation(text: string): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await NativeTorch.shareLocation({ text });
        return !!res.success;
      } catch (err) {
        console.warn('NativeTorch shareLocation error:', err);
      }
    }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Lightflash Location',
          text,
        });
        return true;
      } catch (err) {
        console.warn('Web navigator.share error:', err);
      }
    }
    return false;
  }

  public async getNativeLocation(): Promise<{
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
    accuracy: number | null;
  }> {
    if (Capacitor.isNativePlatform()) {
      try {
        return await NativeTorch.getNativeLocation();
      } catch (err) {
        console.warn('NativeTorch getNativeLocation error:', err);
      }
    }
    return { latitude: null, longitude: null, altitude: null, accuracy: null };
  }

  public async openUrl(url: string): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await NativeTorch.openUrl({ url });
        return !!res.success;
      } catch (err) {
        console.warn('NativeTorch openUrl error:', err);
      }
    }
    if (typeof window !== 'undefined') {
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
        return true;
      } catch (err) {
        console.warn('window.open error:', err);
      }
    }
    return false;
  }

  /**
   * Stop video stream to release camera hardware
   */
  public stopStream(): void {
    if (Capacitor.isNativePlatform()) {
      NativeTorch.setTorch({ enabled: false }).catch(() => {});
    }
    if (this.track) {
      try {
        this.track.stop();
      } catch {}
      this.track = null;
    }
    if (this.stream) {
      try {
        this.stream.getTracks().forEach((t) => t.stop());
      } catch {}
      this.stream = null;
    }
    this.isLit = false;
  }
}

export const torchController = new TorchController();
