export class SoundEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private noiseSource: AudioBufferSourceNode | null = null;
  private enabled = true;
  private currentChapter = '';

  async start(): Promise<void> {
    if (!this.context) {
      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;
      this.context = new AudioContextCtor();
      this.master = this.context.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(this.context.destination);
      this.ambientGain = this.context.createGain();
      this.ambientGain.gain.value = 0;
      this.ambientGain.connect(this.master);
    }
    if (this.context.state === 'suspended') await this.context.resume();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(enabled ? 0.16 : 0, this.context.currentTime, 0.05);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private stopVoices(): void {
    this.oscillators.forEach((osc) => {
      try { osc.stop(); } catch { /* already stopped */ }
      osc.disconnect();
    });
    this.oscillators = [];
    if (this.noiseSource) {
      try { this.noiseSource.stop(); } catch { /* already stopped */ }
      this.noiseSource.disconnect();
      this.noiseSource = null;
    }
  }

  setChapter(id: string): void {
    if (!this.context || !this.master || !this.ambientGain || id === this.currentChapter) return;
    this.currentChapter = id;
    this.stopVoices();
    const now = this.context.currentTime;
    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
    this.ambientGain.gain.linearRampToValueAtTime(0, now + 0.15);

    const createOsc = (type: OscillatorType, frequency: number, gainValue: number): void => {
      if (!this.context || !this.ambientGain) return;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.value = gainValue;
      osc.connect(gain).connect(this.ambientGain);
      osc.start();
      this.oscillators.push(osc);
    };

    const createNoise = (gainValue: number, filterHz: number): void => {
      if (!this.context || !this.ambientGain) return;
      const length = this.context.sampleRate * 2;
      const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterHz;
      const gain = this.context.createGain();
      gain.gain.value = gainValue;
      source.connect(filter).connect(gain).connect(this.ambientGain);
      source.start();
      this.noiseSource = source;
    };

    if (id === 'launch' || id === 'ascent') {
      createOsc('sawtooth', 36, 0.34);
      createOsc('sine', 71, 0.15);
      createNoise(0.52, 620);
    } else if (id === 'descent' || id === 'ascent-rendezvous') {
      createOsc('sawtooth', 44, 0.16);
      createOsc('sine', 96, 0.05);
      createNoise(0.18, 920);
    } else if (id === 'reentry') {
      createNoise(0.36, 1300);
      createOsc('sine', 52, 0.08);
    } else if (id === 'eva') {
      createOsc('sine', 57, 0.025);
    } else {
      createOsc('sine', 48, 0.03);
      createOsc('sine', 93, 0.012);
    }
    this.ambientGain.gain.linearRampToValueAtTime(this.enabled ? 0.55 : 0, now + 0.8);
  }

  pulse(kind: 'event' | 'select' | 'touchdown'): void {
    if (!this.context || !this.master || !this.enabled) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    osc.type = kind === 'touchdown' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(kind === 'touchdown' ? 72 : kind === 'select' ? 420 : 220, now);
    osc.frequency.exponentialRampToValueAtTime(kind === 'touchdown' ? 34 : 90, now + (kind === 'touchdown' ? 0.7 : 0.16));
    gain.gain.setValueAtTime(kind === 'touchdown' ? 0.16 : 0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'touchdown' ? 0.85 : 0.18));
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.9);
  }

  dispose(): void {
    this.stopVoices();
    this.context?.close();
    this.context = null;
  }
}
