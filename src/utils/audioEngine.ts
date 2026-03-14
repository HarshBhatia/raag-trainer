import { TaanNote, SoundType, NoteName } from '../types';
import { noteFrequencies } from './taanGenerator';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private isPlaying = false;
  private currentTempo = 120;
  private currentPlaybackId: number = 0;
  private soundType: SoundType = 'piano';
  private sampleCache: Map<string, AudioBuffer> = new Map();
  private baseFreq: number = 277.18;
  
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

  async initialize(saNote: NoteName = 'C#') {
    this.baseFreq = noteFrequencies[saNote] || 277.18;
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Always check and resume
    if (this.audioContext.state === 'suspended' || this.audioContext.state === 'interrupted') {
      await this.audioContext.resume();
    }
  }

  async loadVocalSamples(gender: 'male' | 'female') {
    if (!this.audioContext) await this.initialize();
    const swaras = ['S', 'r', 'R', 'g', 'G', 'M', 'm', 'P', 'd', 'D', 'n', 'N'];
    const promises = swaras.map(async (swara) => {
      const key = `${gender}_${swara}`;
      if (this.sampleCache.has(key)) return;

      try {
        const response = await fetch(`/samples/${gender}/${swara}.mp3`);
        if (!response.ok) throw new Error(`Failed to load ${swara}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        this.sampleCache.set(key, audioBuffer);
      } catch (e) {
        console.warn(`Could not load vocal sample for ${swara}`, e);
      }
    });
    await Promise.all(promises);
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
    const harmonics = [
      { ratio: 1.0, amplitude: 1.0 },
      { ratio: 2.0, amplitude: 0.5 },
      { ratio: 3.0, amplitude: 0.3 },
      { ratio: 4.0, amplitude: 0.15 },
      { ratio: 5.0, amplitude: 0.1 },
    ];

    const masterGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2500;
    
    masterGain.connect(filter);
    filter.connect(ctx.destination);

    harmonics.forEach(({ ratio, amplitude }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(frequency * ratio, startTime);
      if (targetFrequency) {
        // Steeper curve: setTargetAtTime provides a more natural quadratic-like approach
        // We use a small time constant relative to duration
        const timeConstant = duration * 0.2; 
        osc.frequency.setTargetAtTime(targetFrequency * ratio, startTime, timeConstant);
      }
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(masterGain);
      gain.gain.value = amplitude * 0.15;
      osc.start(startTime);
      osc.stop(startTime + duration);
    });

    masterGain.gain.setValueAtTime(0, startTime);
    masterGain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
    masterGain.gain.setValueAtTime(volume, startTime + duration - 0.05);
    masterGain.gain.linearRampToValueAtTime(0, startTime + duration);
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

  private createVocalNote(swara: string, frequency: number, startTime: number, duration: number, volume: number, gender: 'male' | 'female') {
    if (!this.audioContext) return;
    const key = `${gender}_${swara}`;
    const buffer = this.sampleCache.get(key);
    
    if (!buffer) {
      this.createSynthNote(frequency, startTime, duration, volume);
      return;
    }

    const ctx = this.audioContext;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    
    const baseSa = gender === 'male' ? 277.18 : 415.30;
    const swaraRatios: Record<string, number> = {
      'S': 1.0, 'r': 16/15, 'R': 9/8, 'g': 6/5, 'G': 5/4, 'M': 4/3,
      'm': 45/32, 'P': 3/2, 'd': 8/5, 'D': 5/3, 'n': 9/5, 'N': 15/8,
    };
    
    // Determine octave relative to current baseFreq
    let octave = 0;
    if (frequency > this.baseFreq * 1.8) octave = 1;
    else if (frequency < this.baseFreq * 0.9) octave = -1;

    const sampleFreq = baseSa * (swaraRatios[swara] || 1.0) * Math.pow(2, octave);
    source.playbackRate.value = frequency / sampleFreq;

    source.connect(gain);
    gain.connect(ctx.destination);
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume * 1.2, startTime + 0.05);
    gain.gain.setValueAtTime(volume * 1.2, startTime + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    
    source.start(startTime);
    source.stop(startTime + duration);
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
      const volume = isGroupStart ? 0.45 : 0.25; 
      const duration = 60 / (this.currentTempo * 2); 
      
      const targetFrequency = (glide && i < notes.length - 1) ? notes[i + 1].frequency : undefined;

      switch(this.soundType) {
        case 'flute': this.createFluteNote(note.frequency, now, duration, volume, targetFrequency); break;
        case 'piano': this.createPianoNote(note.frequency, now, duration, volume, targetFrequency); break;
        case 'synth': this.createSynthNote(note.frequency, now, duration, volume, targetFrequency); break;
        case 'male_vocal': this.createVocalNote(note.swara, note.frequency, now, duration, volume, 'male'); break;
        case 'female_vocal': this.createVocalNote(note.swara, note.frequency, now, duration, volume, 'female'); break;
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
