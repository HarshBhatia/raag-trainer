import { Swara, Raag, TaanNote, NoteName, Palta } from '../types';

export const thaats: Raag[] = [
  {
    name: 'Bilawal',
    aroha: ['S', 'R', 'G', 'M', 'P', 'D', 'N'],
    avaroha: ['N', 'D', 'P', 'M', 'G', 'R', 'S'],
  },
  {
    name: 'Kalyan',
    aroha: ['S', 'R', 'G', 'm', 'P', 'D', 'N'],
    avaroha: ['N', 'D', 'P', 'm', 'G', 'R', 'S'],
  },
  {
    name: 'Khamaj',
    aroha: ['S', 'R', 'G', 'M', 'P', 'D', 'n'],
    avaroha: ['n', 'D', 'P', 'M', 'G', 'R', 'S'],
  },
  {
    name: 'Kafi',
    aroha: ['S', 'R', 'g', 'M', 'P', 'D', 'n'],
    avaroha: ['n', 'D', 'P', 'M', 'g', 'R', 'S'],
  },
  {
    name: 'Bhairav',
    aroha: ['S', 'r', 'G', 'M', 'P', 'd', 'N'],
    avaroha: ['N', 'd', 'P', 'M', 'G', 'r', 'S'],
  },
  {
    name: 'Bhairavi',
    aroha: ['S', 'r', 'g', 'M', 'P', 'd', 'n'],
    avaroha: ['n', 'd', 'P', 'M', 'g', 'r', 'S'],
  },
  {
    name: 'Asavari',
    aroha: ['S', 'R', 'g', 'M', 'P', 'd', 'n'],
    avaroha: ['n', 'd', 'P', 'M', 'g', 'R', 'S'],
  },
  {
    name: 'Todi',
    aroha: ['S', 'r', 'g', 'm', 'P', 'd', 'N'],
    avaroha: ['N', 'd', 'P', 'm', 'g', 'r', 'S'],
  },
  {
    name: 'Poorvi',
    aroha: ['S', 'r', 'G', 'm', 'P', 'd', 'N'],
    avaroha: ['N', 'd', 'P', 'm', 'G', 'r', 'S'],
  },
  {
    name: 'Marwa',
    aroha: ['S', 'r', 'G', 'm', 'P', 'D', 'N'],
    avaroha: ['N', 'D', 'P', 'm', 'G', 'r', 'S'],
  },
];

export const noteFrequencies: Record<NoteName, number> = {
  'C': 130.81, 'C#': 138.59, 'D': 146.83, 'D#': 155.56, 'E': 164.81, 'F': 174.61,
  'F#': 185.00, 'G': 196.00, 'G#': 207.65, 'A': 220.00, 'A#': 233.08, 'B': 246.94,
};

export class PaltaGenerator {
  private baseFreq: number;

  constructor(saNote: NoteName = 'C#') {
    this.baseFreq = noteFrequencies[saNote];
  }

  setSaNote(saNote: NoteName) {
    this.baseFreq = noteFrequencies[saNote];
  }

  private getFrequency(swara: Swara, octave: number = 0): number {
    const baseSwaras: Record<string, number> = {
      'S': 1.0, 'r': 16/15, 'R': 9/8, 'g': 6/5, 'G': 5/4, 'M': 4/3,
      'm': 45/32, 'P': 3/2, 'd': 8/5, 'D': 5/3, 'n': 9/5, 'N': 15/8,
    };
    const ratio = baseSwaras[swara] || 1.0;
    return this.baseFreq * ratio * Math.pow(2, octave);
  }

  // Merukhand Helper: Generates all permutations of a sequence
  private getPermutations(arr: number[]): number[][] {
    const results: number[][] = [];
    const permute = (current: number[], remaining: number[]) => {
      if (remaining.length === 0) {
        results.push(current);
        return;
      }
      for (let i = 0; i < remaining.length; i++) {
        permute(
          [...current, remaining[i]],
          [...remaining.slice(0, i), ...remaining.slice(i + 1)]
        );
      }
    };
    permute([], arr);
    return results;
  }

  private generateMerukhandPalta(raag: Raag, numNotes: number, id: number): Palta {
    const scale = [...raag.aroha, 'S' as Swara]; // S R G M P D N S'
    const indices = Array.from({ length: numNotes }, (_, i) => i + 1);
    const permutations = this.getPermutations(indices);
    
    const notes: TaanNote[] = [];
    permutations.forEach(p => {
      p.forEach(idx => {
        const swara = scale[idx - 1];
        const octave = (idx - 1 === scale.length - 1) ? 1 : 0;
        notes.push({ swara, frequency: this.getFrequency(swara, octave), octave });
      });
    });

    return {
      id,
      notes,
      pattern: `Merukhand ${numNotes} notes`,
      category: '5. Merukhand',
      arohaNoteCount: notes.length // Single direction for Merukhand usually
    };
  }

  private generateVocalRangePaltas(raag: Raag, startId: number): Palta[] {
    const scale = [...raag.aroha, 'S' as Swara]; // S R G M P D N S'
    const results: Palta[] = [];

    // ORIGINAL: Building (S, SRS, SRGRS...)
    const p1Notes: TaanNote[] = [];
    for (let i = 1; i <= scale.length; i++) {
      for (let j = 0; j < i; j++) {
        const swara = scale[j];
        const octave = (j === scale.length - 1) ? 1 : 0;
        p1Notes.push({ swara, frequency: this.getFrequency(swara, octave), octave });
      }
      for (let j = i - 2; j >= 0; j--) {
        const swara = scale[j];
        p1Notes.push({ swara, frequency: this.getFrequency(swara, 0), octave: 0 });
      }
    }
    results.push({
      id: startId,
      notes: p1Notes,
      pattern: "Building Pyramid",
      category: "3. Vocal Range Increase",
      arohaNoteCount: p1Notes.length
    });

    // NEW: Progressive High Reach (Comfortable start -> Taar Pa)
    const highReachNotes: TaanNote[] = [];
    const extendedHighScale = [...scale, 'R' as Swara, 'G' as Swara, 'M' as Swara, 'P' as Swara];
    for (let i = 2; i <= extendedHighScale.length; i++) {
      for (let j = 0; j < i; j++) {
        const swara = extendedHighScale[j];
        const octave = j >= scale.length - 1 ? 1 : 0;
        highReachNotes.push({ swara, frequency: this.getFrequency(swara, octave), octave });
      }
      for (let j = i - 2; j >= 0; j--) {
        const swara = extendedHighScale[j];
        const octave = j >= scale.length - 1 ? 1 : 0;
        highReachNotes.push({ swara, frequency: this.getFrequency(swara, octave), octave });
      }
    }
    results.push({
      id: startId + 1,
      notes: highReachNotes,
      pattern: "Progressive High Reach",
      category: "3. Vocal Range Increase",
      arohaNoteCount: highReachNotes.length
    });

    // NEW: Progressive Low Reach (Comfortable start -> Mandra Pa)
    const lowReachNotes: TaanNote[] = [];
    const lowerScale = ['P' as Swara, 'D' as Swara, 'N' as Swara, 'S' as Swara]; // P. D. N. S
    for (let i = 2; i >= 0; i--) {
      for (let j = 3; j >= i; j--) {
        const swara = lowerScale[j];
        const octave = swara === 'S' ? 0 : -1;
        lowReachNotes.push({ swara, frequency: this.getFrequency(swara, octave), octave });
      }
      for (let j = i + 1; j <= 3; j++) {
        const swara = lowerScale[j];
        const octave = swara === 'S' ? 0 : -1;
        lowReachNotes.push({ swara, frequency: this.getFrequency(swara, octave), octave });
      }
    }
    results.push({
      id: startId + 2,
      notes: lowReachNotes,
      pattern: "Progressive Low Reach",
      category: "3. Vocal Range Increase",
      arohaNoteCount: lowReachNotes.length
    });

    // ORIGINAL: SS, SR, SG...
    const expandingNotes: TaanNote[] = [];
    for (let i = 0; i < scale.length; i++) {
      expandingNotes.push({ swara: 'S', frequency: this.getFrequency('S'), octave: 0 });
      const swara = scale[i];
      const octave = (i === scale.length - 1) ? 1 : 0;
      expandingNotes.push({ swara, frequency: this.getFrequency(swara, octave), octave });
    }
    results.push({
      id: startId + 3,
      notes: expandingNotes,
      pattern: "Expanding Intervals",
      category: "3. Vocal Range Increase",
      arohaNoteCount: expandingNotes.length
    });

    // NEW: Full Range Glide
    const glideNotes: TaanNote[] = [];
    const fullExtendedScale = [
      { s: 'P', o: -1 }, { s: 'D', o: -1 }, { s: 'N', o: -1 },
      { s: 'S', o: 0 }, { s: 'R', o: 0 }, { s: 'G', o: 0 }, { s: 'M', o: 0 }, { s: 'P', o: 0 }, { s: 'D', o: 0 }, { s: 'N', o: 0 },
      { s: 'S', o: 1 }, { s: 'R', o: 1 }, { s: 'G', o: 1 }, { s: 'M', o: 1 }, { s: 'P', o: 1 }
    ];
    const allowedSwaras = new Set(raag.aroha);
    allowedSwaras.add('S');
    const raagScale = fullExtendedScale.filter(item => allowedSwaras.has(item.s as Swara));
    raagScale.forEach(item => glideNotes.push({ swara: item.s as Swara, frequency: this.getFrequency(item.s as Swara, item.o), octave: item.o }));
    [...raagScale].reverse().forEach(item => glideNotes.push({ swara: item.s as Swara, frequency: this.getFrequency(item.s as Swara, item.o), octave: item.o }));

    results.push({
      id: startId + 4,
      notes: glideNotes,
      pattern: "Full Range Glide",
      category: "3. Vocal Range Increase",
      arohaNoteCount: raagScale.length
    });

    return results;
  }

  generatePattern(raag: Raag, patternStr: string, maxIterations?: number): { notes: TaanNote[], arohaCount: number } {
    const pattern = patternStr.split('').map(n => parseInt(n));
    const notes: TaanNote[] = [];
    const fullAroha = [...raag.aroha, 'S' as Swara];
    const fullAvaroha = ['S' as Swara, ...raag.avaroha];
    const maxPatternVal = Math.max(...pattern);

    // ASCENT
    const arohaLimit = maxIterations 
      ? Math.min(fullAroha.length - maxPatternVal, maxIterations - 1)
      : fullAroha.length - maxPatternVal;

    for (let i = 0; i <= arohaLimit; i++) {
      pattern.forEach(p => {
        const scaleIdx = i + p - 1;
        const swara = fullAroha[scaleIdx];
        const octave = (scaleIdx === fullAroha.length - 1) ? 1 : 0;
        notes.push({ swara, frequency: this.getFrequency(swara, octave), octave });
      });
    }
    const arohaCount = notes.length;

    // DESCENT
    const avarohaLimit = maxIterations
      ? Math.min(fullAvaroha.length - maxPatternVal, maxIterations - 1)
      : fullAvaroha.length - maxPatternVal;

    for (let i = 0; i <= avarohaLimit; i++) {
      pattern.forEach(p => {
        const scaleIdx = i + p - 1;
        const swara = fullAvaroha[scaleIdx];
        const octave = (scaleIdx === 0) ? 1 : 0;
        notes.push({ swara, frequency: this.getFrequency(swara, octave), octave });
      });
    }
    return { notes, arohaCount };
  }

  generateMultiplePaltas(raag: Raag): Palta[] {
    const definitions: { p: string, cat: string, max?: number }[] = [
      // 1. Basic Alankars (8)
      { p: "1", cat: "1. Basic Alankars" },
      { p: "12", cat: "1. Basic Alankars" },
      { p: "123", cat: "1. Basic Alankars" },
      { p: "1234", cat: "1. Basic Alankars" },
      { p: "12345", cat: "1. Basic Alankars" },
      { p: "123456", cat: "1. Basic Alankars" },
      { p: "1234567", cat: "1. Basic Alankars" },
      { p: "12345678", cat: "1. Basic Alankars" },
      
      // 2. Jumping Notes (8)
      { p: "13", cat: "2. Jumping Notes" },
      { p: "132", cat: "2. Jumping Notes" },
      { p: "1324", cat: "2. Jumping Notes" },
      { p: "132435", cat: "2. Jumping Notes" },
      { p: "14", cat: "2. Jumping Notes" },
      { p: "1425", cat: "2. Jumping Notes" },
      { p: "1432", cat: "2. Jumping Notes" },
      { p: "153", cat: "2. Jumping Notes" },
      
      // 4. Complex Palta (8)
      { p: "1213", cat: "4. Complex Palta" },
      { p: "13243546", cat: "4. Complex Palta" },
      { p: "1231", cat: "4. Complex Palta" },
      { p: "1234123", cat: "4. Complex Palta" },
      { p: "13214321", cat: "4. Complex Palta" },
      { p: "1423", cat: "4. Complex Palta" },
      { p: "1342", cat: "4. Complex Palta" },
      { p: "1243", cat: "4. Complex Palta" },
    ];

    const standardPaltas = definitions.map((item, i) => {
      const { notes, arohaCount } = this.generatePattern(raag, item.p, item.max);
      return {
        id: i + 1,
        notes,
        arohaNoteCount: arohaCount,
        pattern: item.p.split('').join('-'),
        category: item.cat
      };
    });

    const rangePaltas = this.generateVocalRangePaltas(raag, 100);
    const m3 = this.generateMerukhandPalta(raag, 3, 200);
    const m4 = this.generateMerukhandPalta(raag, 4, 201);
    const m5 = this.generateMerukhandPalta(raag, 5, 202);

    return [...standardPaltas, ...rangePaltas, m3, m4, m5].sort((a, b) => {
      // Keep category order: 1, 2, 3, 4, 5
      return (a.category || '').localeCompare(b.category || '');
    });
  }

  generateCustomPalta(raag: Raag, pattern: string): Palta | null {
    const cleanPattern = pattern.replace(/[^1-9]/g, '');
    if (!cleanPattern) return null;
    const { notes, arohaCount } = this.generatePattern(raag, cleanPattern);
    return {
      id: Date.now(),
      notes,
      arohaNoteCount: arohaCount,
      pattern: `Custom (${cleanPattern.split('').join('-')})`,
      category: 'Custom'
    };
  }
}
