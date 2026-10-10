// Audio and Background Keep-Alive Service for Tutor Mode

class AudioTimerService {
  private audioCtx: AudioContext | null = null;
  private silentAudio: HTMLAudioElement | null = null;
  private wakeLockSentinel: WakeLockSentinel | null = null;
  private isAudioUnlocked = false;

  private initAudio() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  /**
   * Must be called on user interaction (touch or button click) to satisfy browser autoplay policies
   */
  public unlockAudio() {
    this.initAudio();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    this.isAudioUnlocked = true;

    // Start silent audio keepalive to prevent Android OS from putting browser audio to sleep
    this.startSilentKeepAlive();
  }

  /**
   * Plays a short beep frequency at specified target time or immediately
   */
  public playBeep(frequency = 880, duration = 0.08, time?: number, volume = 0.8) {
    this.initAudio();
    if (!this.audioCtx) return;

    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const startTime = time ?? this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, startTime);

      // Smooth attack and decay to avoid speaker pops
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  /**
   * Plays the final completion fanfare / alert when rest time reaches 0
   */
  public playCompletionTone(time?: number) {
    this.initAudio();
    if (!this.audioCtx) return;

    try {
      const base = time ?? this.audioCtx.currentTime;
      // High pitch double-tone alert
      this.playBeep(1046.5, 0.12, base, 0.9); // C6
      this.playBeep(1318.5, 0.25, base + 0.14, 0.95); // E6
      this.playBeep(1567.98, 0.45, base + 0.35, 1.0); // G6

      // Trigger phone vibration if available
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 500]);
      }
    } catch (e) {
      console.warn('Completion tone error:', e);
    }
  }

  /**
   * Pre-schedules all beeps for the last 10 seconds on the Web Audio hardware clock!
   * This guarantees that even if the mobile screen is locked and JS timer throttles,
   * the audio hardware fires the beeps exactly at the specified seconds.
   */
  public scheduleCountdownBeeps(totalSecondsRemaining: number): { cancel: () => void } {
    this.initAudio();
    if (!this.audioCtx) {
      return { cancel: () => {} };
    }

    const scheduledNodes: OscillatorNode[] = [];
    const nowCtx = this.audioCtx.currentTime;

    // We schedule beeps for seconds 10 down to 1
    const startSec = Math.min(10, Math.floor(totalSecondsRemaining));

    for (let s = startSec; s >= 1; s--) {
      // Delay until this second happens
      const delay = totalSecondsRemaining - s;
      if (delay < 0) continue;

      const scheduleTime = nowCtx + delay;
      try {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        // Higher pitch for final 3 seconds (1000Hz vs 800Hz)
        const freq = s <= 3 ? 1046.5 : 880;
        osc.frequency.setValueAtTime(freq, scheduleTime);

        gain.gain.setValueAtTime(0.001, scheduleTime);
        gain.gain.exponentialRampToValueAtTime(0.75, scheduleTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, scheduleTime + 0.09);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(scheduleTime);
        osc.stop(scheduleTime + 0.1);
        scheduledNodes.push(osc);
      } catch (err) {
        console.warn('Failed to schedule beep for second:', s, err);
      }
    }

    // Schedule final fanfare at 0 seconds
    const finishDelay = totalSecondsRemaining;
    if (finishDelay >= 0) {
      const finishTime = nowCtx + finishDelay;
      try {
        const osc1 = this.audioCtx.createOscillator();
        const gain1 = this.audioCtx.createGain();
        osc1.frequency.setValueAtTime(1318.5, finishTime);
        gain1.gain.setValueAtTime(0.001, finishTime);
        gain1.gain.exponentialRampToValueAtTime(0.9, finishTime + 0.01);
        gain1.gain.exponentialRampToValueAtTime(0.001, finishTime + 0.3);
        osc1.connect(gain1);
        gain1.connect(this.audioCtx.destination);
        osc1.start(finishTime);
        osc1.stop(finishTime + 0.32);
        scheduledNodes.push(osc1);

        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.frequency.setValueAtTime(1760.0, finishTime + 0.15);
        gain2.gain.setValueAtTime(0.001, finishTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.95, finishTime + 0.16);
        gain2.gain.exponentialRampToValueAtTime(0.001, finishTime + 0.6);
        osc2.connect(gain2);
        gain2.connect(this.audioCtx.destination);
        osc2.start(finishTime + 0.15);
        osc2.stop(finishTime + 0.65);
        scheduledNodes.push(osc2);
      } catch (e) {
        console.warn('Error scheduling completion tones:', e);
      }
    }

    return {
      cancel: () => {
        for (const node of scheduledNodes) {
          try {
            node.stop();
            node.disconnect();
          } catch {
            // Already stopped
          }
        }
      },
    };
  }

  /**
   * Background Keep-Alive using a silent audio data URI.
   * Keeps audio subsystem active when locked/backgrounded on Android.
   */
  private startSilentKeepAlive() {
    if (this.silentAudio) return;

    try {
      // 1 second base64 silent WAV
      const silentWavBase64 = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/w==';
      const audio = new Audio(silentWavBase64);
      audio.loop = true;
      audio.volume = 0.01;
      audio.play().catch(() => {
        // May wait for gesture
      });
      this.silentAudio = audio;
    } catch {
      // Ignore
    }
  }

  /**
   * Screen Wake Lock to prevent screen sleep while working out
   */
  public async requestWakeLock(): Promise<boolean> {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLockSentinel = await navigator.wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  public releaseWakeLock() {
    if (this.wakeLockSentinel) {
      this.wakeLockSentinel.release().catch(() => {});
      this.wakeLockSentinel = null;
    }
  }

  /**
   * Show mobile system notification when rest time ends
   */
  public notifyRestComplete(exerciseName: string) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('Recupero Terminato! 💪', {
          body: `Pronto per la prossima serie di ${exerciseName}!`,
          icon: '/pwa-192x192.png',
          badge: '/icon.svg',
          tag: 'fitmaker-rest-done',
        });
      } catch {
        // Ignore
      }
    }
  }

  public async requestNotificationPermission() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch {
        // Ignore
      }
    }
  }
}

export const audioTimer = new AudioTimerService();
