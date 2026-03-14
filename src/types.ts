export type Swara = 'S' | 'r' | 'R' | 'g' | 'G' | 'M' | 'm' | 'P' | 'd' | 'D' | 'n' | 'N';

export type Notation = 'english' | 'hindi' | 'numbers';

export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export type EndNote = 'sa' | 'pa' | 'upper-sa';

export type SoundType = 'harmonium' | 'flute' | 'piano' | 'synth' | 'male_vocal' | 'female_vocal';

export interface Raag {
  name: string;
  aroha: Swara[];
  avaroha: Swara[];
}

export interface AlankarPattern {
  name: string;
  description: string;
  type: 'basic' | 'triplet' | 'quadruplet';
}

export interface TaanNote {
  swara: Swara;
  frequency: number;
  octave: number;
}

export type Palta = {
  id: number;
  notes: TaanNote[];
  pattern: string;
  category?: string;
  arohaNoteCount?: number;
};

export type UserExperience = 'beginner' | 'intermediate' | 'advanced';
export type UserGender = 'male' | 'female';

export interface UserPrefs {
  gender: UserGender;
  experience: UserExperience;
  onboarded: boolean;
}
