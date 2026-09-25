/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  private initPromise: Promise<boolean> | null = null;

  /**
   * Test whether hardware torch is available
   */
  public async checkSupport(): Promise<boolean> {
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
   * Acquire rear camera track with torch capability
   */
  private async acquireTrack(): Promise<MediaStreamTrack | null> {
    if (this.track && this.track.readyState === 'live') {
      return this.track;
    }

    try {
      // First try rear environment camera
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
        // Fallback without advanced constraint on initial request
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } },
        });
      }

      const tracks = this.stream.getVideoTracks();
      if (tracks.length === 0) return null;

      const track = tracks[0];
      this.track = track;

      // Inspect capabilities
      // MediaStreamTrack.getCapabilities() is supported in modern browsers
      const capabilities = (track as unknown as { getCapabilities?: () => { torch?: boolean } }).getCapabilities?.();
      this.isTorchSupported = !!capabilities?.torch;

      return track;
    } catch (err: unknown) {
      console.warn('Torch acquire warning:', err);
      return null;
    }
  }

  /**
   * Set physical torch LED state
   */
  public async setTorch(on: boolean): Promise<boolean> {
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
        this.stopStream();
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

  public getIsLit(): boolean {
    return this.isLit;
  }

  public getIsTorchSupported(): boolean {
    return this.isTorchSupported;
  }

  /**
   * Stop video stream to release camera hardware
   */
  public stopStream(): void {
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
