import { TaanNote, SoundType } from '../types';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private isPlaying = false;
  private currentTempo = 120;
  private currentPlaybackId: number = 0;
  private soundType: SoundType = 'piano';
  
  // Tanpura properties
  private tanpuraPlaying = false;
  private tanpuraTimer: any = null;
  private tanpuraGain: GainNode | null = null;
  private currentTanpuraVolume: number = 0.4;
  private sampledTanpuraAudio: HTMLAudioElement | null = null;

  private tanpuraUrls: Record<string, Record<'Pa' | 'Ma', string>> = {
    'C': {
      'Pa': 'https://ragajunglism.org/wp-content/uploads/2020/03/c-tanpura-thick.mp3',
      'Ma': 'https://ragajunglism.org/wp-content/uploads/2021/02/C-Tanpura-B5-SaMa-2021.mp3'
    },
    'C#': {
      'Pa': 'https://ragajunglism.org/wp-content/uploads/2020/03/db-tanpura-thick.mp3',
      'Ma': 'https://ragajunglism.org/wp-content/uploads/2021/02/Db-Tanpura-B5-SaMa-2021.mp3'
    },
    'D': {
      'Pa': 'https://ragajunglism.org/wp-content/uploads/2020/03/d-tanpura-thick.mp3',
      'Ma': 'https://ragajunglism.org/wp-content/uploads/2021/02/D-Tanpura-B5-SaMa-2021.mp3'
    },
    'D#': {
      'Pa': 'https://ragajunglism.org/wp-content/uploads/2020/03/eb-tanpura-thick.mp3',
      'Ma': 'https://ragajunglism.org/wp-content/uploads/2021/02/Eb-Tanpura-B5-SaMa-2021.mp3'
    },
    'E': {
      'Pa': 'https://ragajunglism.org/wp-content/uploads/2020/03/e-tanpura-thick.mp3',
      'Ma': 'https://ragajunglism.org/wp-content/uploads/2021/02/E-Tanpura-B5-SaMa-2021.mp3'
    },
    'F': {
      'Pa': 'https://ragajunglism.org/wp-content/uploads/2020/03/f-tanpura-thick.mp3',
      'Ma': 'https://ragajunglism.org/wp-content/uploads/2021/02/F-Tanpuras-B5-SaMa-2021.mp3'
    },
    'F#': {
      'Pa': 'https://ragajunglism.org/wp-content/uploads/2020/03/gb-tanpura-thick.mp3',
      'Ma': 'https://ragajunglism.org/wp-content/uploads/2021/02/Gb-Tanpura-B5-SaMa-2021.mp3'
    },
    'G': {
      'Pa': 'https://ragajunglism.org/wp-content/uploads/2020/03/g-tanpura-thick.mp3',
      'Ma': 'https://ragajunglism.org/wp-content/uploads/2021/02/G-Tanpura-B5-SaMa-2021.mp3'
    },
    'G#': {
      'Pa': 'https://ragajunglism.org/wp-content/uploads/2020/03/ab-tanpura-thick.mp3',
      'Ma': 'https://ragajunglism.org/wp-content/uploads/2021/02/Ab-Tanpura-B5-SaMa-2021.mp3'
    },
    'A': {
      'Pa': 'https://ragajunglism.org/wp-content/uploads/2020/03/a-tanpura-thick.mp3',
      'Ma': 'https://ragajunglism.org/wp-content/uploads/2021/02/A-Tanpura-B5-SaMa-2021.mp3'
    },
    'A#': {
      'Pa': 'https://ragajunglism.org/wp-content/uploads/2020/03/bb-tanpura-thick.mp3',
      'Ma': 'https://ragajunglism.org/wp-content/uploads/2021/02/Bb-Tanpura-B5-SaMa-2021.mp3'
    },
    'B': {
      'Pa': 'https://ragajunglism.org/wp-content/uploads/2020/03/b-tanpura-thick.mp3',
      'Ma': 'https://ragajunglism.org/wp-content/uploads/2021/02/B-Tanpura-B5-SaMa-2021.mp3'
    }
  };

  async initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Always check and resume
    if (this.audioContext.state === 'suspended' || this.audioContext.state === 'interrupted') {
      await this.audioContext.resume();
    }
  }

  setTempo(tempo: number) {
    this.currentTempo = tempo;
  }

  setSoundType(type: SoundType) {
    this.soundType = type;
  }

  setTanpuraVolume(volume: number) {
    this.currentTanpuraVolume = volume;
    if (this.sampledTanpuraAudio) {
      this.sampledTanpuraAudio.volume = volume;
    }
    if (this.tanpuraGain && this.audioContext) {
      this.tanpuraGain.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
    }
  }

  private createHarmoniumNote(frequency: number, startTime: number, duration: number, volume: number, targetFrequency?: number) {
      if (!this.audioContext) return;
      const ctx = this.audioContext;

      // Harmonium has a reed-based sound with rich harmonics
      const harmonics = [
        { ratio: 1.0, amplitude: 1.0 },      // Fundamental
        { ratio: 2.0, amplitude: 0.6 },      // 2nd harmonic (octave)
        { ratio: 3.0, amplitude: 0.4 },      // 3rd harmonic (fifth)
        { ratio: 4.0, amplitude: 0.25 },     // 4th harmonic
        { ratio: 5.0, amplitude: 0.15 },     // 5th harmonic
        { ratio: 6.0, amplitude: 0.1 },      // 6th harmonic
        { ratio: 7.0, amplitude: 0.08 },     // 7th harmonic
        { ratio: 8.0, amplitude: 0.05 },     // 8th harmonic
      ];

      const masterGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Bandpass filter for reed-like character
      filter.type = 'bandpass';
      filter.frequency.value = frequency * 2;
      filter.Q.value = 1.5;

      masterGain.connect(filter);
      filter.connect(ctx.destination);

      // Create harmonics with slight detuning for warmth
      harmonics.forEach(({ ratio, amplitude }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Slight detuning for organic sound
        const detune = (Math.random() - 0.5) * 2;
        osc.frequency.setValueAtTime(frequency * ratio + detune, startTime);
        if (targetFrequency) {
          const timeConstant = duration * 0.2; 
          osc.frequency.setTargetAtTime(targetFrequency * ratio + detune, startTime, timeConstant);
        }
        osc.type = 'sawtooth'; // Sawtooth for reed-like timbre

        osc.connect(gain);
        gain.connect(masterGain);
        gain.gain.value = amplitude * 0.12;

        osc.start(startTime);
        osc.stop(startTime + duration);
      });

      // Envelope: Quick attack, sustained, gentle release
      masterGain.gain.setValueAtTime(0, startTime);
      masterGain.gain.linearRampToValueAtTime(volume, startTime + 0.03);
      masterGain.gain.setValueAtTime(volume * 0.95, startTime + duration - 0.08);
      masterGain.gain.linearRampToValueAtTime(0, startTime + duration);

      // Filter envelope for brightness
      filter.frequency.setValueAtTime(frequency * 2, startTime);
      filter.frequency.linearRampToValueAtTime(frequency * 3, startTime + 0.05);
      filter.frequency.exponentialRampToValueAtTime(Math.max(frequency * 1.5, 20), startTime + duration);
    }

  private createFluteNote(frequency: number, startTime: number, duration: number, volume: number, targetFrequency?: number) {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, startTime);
    if (targetFrequency) {
      const timeConstant = duration * 0.2;
      osc.frequency.setTargetAtTime(targetFrequency, startTime, timeConstant);
    }
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.frequency.value = 5;
    vibratoGain.gain.value = frequency * 0.01;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    vibrato.start(startTime);
    vibrato.stop(startTime + duration);
    filter.type = 'lowpass';
    filter.frequency.value = 1500;
    osc.connect(gain);
    gain.connect(filter);
    filter.connect(ctx.destination);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(volume * 0.8, startTime + duration);
    gain.gain.linearRampToValueAtTime(0, startTime + duration + 0.05);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  private createPianoNote(frequency: number, startTime: number, duration: number, volume: number, targetFrequency?: number) {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, startTime);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(frequency * 2, startTime);
    if (targetFrequency) {
      const timeConstant = duration * 0.2;
      osc.frequency.setTargetAtTime(targetFrequency, startTime, timeConstant);
      osc2.frequency.setTargetAtTime(targetFrequency * 2, startTime, timeConstant);
    }
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 2);
    osc.start(startTime);
    osc2.start(startTime);
    osc.stop(startTime + duration);
    osc2.stop(startTime + duration);
  }

  private createSynthNote(frequency: number, startTime: number, duration: number, volume: number, targetFrequency?: number) {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(frequency, startTime);
    if (targetFrequency) {
      const timeConstant = duration * 0.2;
      osc.frequency.setTargetAtTime(targetFrequency, startTime, timeConstant);
    }
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, startTime);
    filter.frequency.exponentialRampToValueAtTime(3000, startTime + 0.1);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume * 0.5, startTime + 0.02);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  startTanpura(baseFreqName: string, mode: 'Pa' | 'Ma' | 'Ni' = 'Pa') {
    if (this.tanpuraPlaying) {
      this.stopTanpura();
    }
    
    this.tanpuraPlaying = true;
    const effectiveMode = mode === 'Ma' ? 'Ma' : 'Pa'; // Ni maps to Pa for now
    const url = this.tanpuraUrls[baseFreqName]?.[effectiveMode];

    if (!url) {
      console.warn(`No Tanpura sample found for ${baseFreqName} ${mode}`);
      return;
    }

    this.sampledTanpuraAudio = new Audio(url);
    this.sampledTanpuraAudio.loop = true;
    this.sampledTanpuraAudio.volume = this.currentTanpuraVolume;
    this.sampledTanpuraAudio.play().catch(e => console.error("Tanpura play failed:", e));
  }

  stopTanpura() {
    this.tanpuraPlaying = false;
    if (this.sampledTanpuraAudio) {
      this.sampledTanpuraAudio.pause();
      this.sampledTanpuraAudio.currentTime = 0;
      this.sampledTanpuraAudio = null;
    }
    if (this.tanpuraTimer) clearTimeout(this.tanpuraTimer);
  }

  private playClick(startTime: number, isAccent: boolean) {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 1200 : 800, startTime);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.06);
  }

  async playIntro(tempo: number, onBeat?: (beat: number) => void) {
    if (!this.audioContext || this.audioContext.state === 'suspended') {
      await this.initialize();
    }
    if (!this.audioContext) return;
    const beatDuration = 60 / tempo;
    const now = this.audioContext.currentTime;
    for (let i = 0; i < 4 && this.isPlaying; i++) {
      onBeat?.(i + 1);
      this.playClick(now + (i * beatDuration), i === 0);
      await new Promise(resolve => setTimeout(resolve, beatDuration * 1000));
    }
    onBeat?.(0);
  }

  async playTaan(
    notes: TaanNote[], 
    tempo: number, 
    groupSize: number = 1,
    onNoteChange?: (index: number) => void,
    glide: boolean = false
  ) {
    if (!this.audioContext || this.audioContext.state === 'suspended') {
      await this.initialize();
    }
    if (!this.audioContext) return;
    const playbackId = this.currentPlaybackId;
    this.isPlaying = true;
    this.currentTempo = tempo;
    for (let i = 0; i < notes.length && this.isPlaying && playbackId === this.currentPlaybackId; i++) {
      const note = notes[i];
      const isGroupStart = i % groupSize === 0;
      onNoteChange?.(i);
      const now = this.audioContext.currentTime;
      const volume = isGroupStart ? 0.7 : 0.5; 
      const duration = 60 / (this.currentTempo * 2); 
      
      const targetFrequency = (glide && i < notes.length - 1) ? notes[i + 1].frequency : undefined;

      switch(this.soundType) {
        case 'flute': this.createFluteNote(note.frequency, now, duration, volume, targetFrequency); break;
        case 'piano': this.createPianoNote(note.frequency, now, duration, volume, targetFrequency); break;
        case 'synth': this.createSynthNote(note.frequency, now, duration, volume, targetFrequency); break;
        default: this.createHarmoniumNote(note.frequency, now, duration, volume, targetFrequency);
      }
      await new Promise(resolve => setTimeout(resolve, duration * 1000));
    }
    if (playbackId === this.currentPlaybackId) {
      onNoteChange?.(-1);
    }
  }

  stop() {
    this.isPlaying = false;
    this.currentPlaybackId++;
  }

  start() {
    this.currentPlaybackId++;
    this.isPlaying = true;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
