class SoundFX {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  slash(heavy = false) {
    if (heavy) {
      this.playTone(190, 58, 0.14, 'sawtooth', 0.11);
    } else {
      this.playTone(460, 140, 0.08, 'triangle', 0.08);
    }
  }

  hit(crit = false) {
    if (crit) {
      this.playTone(260, 75, 0.13, 'square', 0.12);
      this.playTone(720, 420, 0.09, 'triangle', 0.08);
    } else {
      this.playTone(170, 62, 0.09, 'sawtooth', 0.09);
    }
  }

  guardClang() {
    this.playTone(620, 310, 0.11, 'square', 0.08);
  }

  dash() {
    this.playTone(340, 120, 0.09, 'sine', 0.07);
  }

  jump() {
    this.playTone(220, 440, 0.09, 'triangle', 0.07);
  }

  swap() {
    this.playTone(330, 660, 0.12, 'triangle', 0.1);
    setTimeout(() => {
      this.playTone(520, 780, 0.11, 'sine', 0.08);
    }, 45);
  }

  skill() {
    this.playTone(280, 540, 0.14, 'sawtooth', 0.08);
  }

  hurt() {
    this.playTone(150, 50, 0.18, 'sawtooth', 0.13);
  }

  heal() {
    this.playTone(440, 660, 0.14, 'sine', 0.08);
    setTimeout(() => this.playTone(660, 880, 0.16, 'sine', 0.07), 70);
  }

  waveClear() {
    this.playTone(392, 523, 0.14, 'triangle', 0.09);
    setTimeout(() => this.playTone(523, 659, 0.18, 'triangle', 0.09), 90);
    setTimeout(() => this.playTone(659, 784, 0.24, 'triangle', 0.1), 180);
  }

  bossSpawn() {
    this.playTone(130, 55, 0.42, 'sawtooth', 0.13);
  }
}

export const soundFX = new SoundFX();
