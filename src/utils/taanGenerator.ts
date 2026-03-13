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

  generatePattern(raag: Raag, patternStr: string): { notes: TaanNote[], arohaCount: number } {
    const pattern = patternStr.split('').map(n => parseInt(n));
    const notes: TaanNote[] = [];
    const fullAroha = [...raag.aroha, 'S' as Swara];
    const fullAvaroha = ['S' as Swara, ...raag.avaroha];
    const maxPatternVal = Math.max(...pattern);

    // ASCENT
    for (let i = 0; i <= fullAroha.length - maxPatternVal; i++) {
      pattern.forEach(p => {
        const scaleIdx = i + p - 1;
        const swara = fullAroha[scaleIdx];
        const octave = (scaleIdx === fullAroha.length - 1) ? 1 : 0;
        notes.push({ swara, frequency: this.getFrequency(swara, octave), octave });
      });
    }
    const arohaCount = notes.length;

    // DESCENT
    for (let i = 0; i <= fullAvaroha.length - maxPatternVal; i++) {
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
    const definitions = [
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
      { p: "13", cat: "2. Jumping Notes (builds agility)" },
      { p: "132", cat: "2. Jumping Notes (builds agility)" },
      { p: "1324", cat: "2. Jumping Notes (builds agility)" },
      { p: "132435", cat: "2. Jumping Notes (builds agility)" },
      { p: "14", cat: "2. Jumping Notes (builds agility)" },
      { p: "1425", cat: "2. Jumping Notes (builds agility)" },
      { p: "1432", cat: "2. Jumping Notes (builds agility)" },
      { p: "153", cat: "2. Jumping Notes (builds agility)" },
      
      // 3. Vocal Range Increase (8)
      { p: "1", cat: "3. Vocal Range Increase" },
      { p: "121", cat: "3. Vocal Range Increase" },
      { p: "12321", cat: "3. Vocal Range Increase" },
      { p: "1234321", cat: "3. Vocal Range Increase" },
      { p: "123454321", cat: "3. Vocal Range Increase" },
      { p: "12345654321", cat: "3. Vocal Range Increase" },
      { p: "1234567654321", cat: "3. Vocal Range Increase" },
      { p: "123456787654321", cat: "3. Vocal Range Increase" },
      
      // 4. Complex Palta (8)
      { p: "1213", cat: "4. Complex Palta" },
      { p: "13243546", cat: "4. Complex Palta" },
      { p: "1231", cat: "4. Complex Palta" },
      { p: "1234123", cat: "4. Complex Palta" },
      { p: "13214321", cat: "4. Complex Palta" },
      { p: "1423", cat: "4. Complex Palta" },
      { p: "1342", cat: "4. Complex Palta" },
      { p: "1243", cat: "4. Complex Palta" },

      // 5. Merukhand (8 - The 3-note permutations)
      { p: "123", cat: "5. Merukhand" },
      { p: "132", cat: "5. Merukhand" },
      { p: "213", cat: "5. Merukhand" },
      { p: "231", cat: "5. Merukhand" },
      { p: "312", cat: "5. Merukhand" },
      { p: "321", cat: "5. Merukhand" },
      { p: "123213", cat: "5. Merukhand" }, // Combination
      { p: "132321", cat: "5. Merukhand" }, // Combination
    ];

    return definitions.map((item, i) => {
      const { notes, arohaCount } = this.generatePattern(raag, item.p);
      return {
        id: i + 1,
        notes,
        arohaNoteCount: arohaCount,
        pattern: item.p.split('').join('-'),
        category: item.cat
      };
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
