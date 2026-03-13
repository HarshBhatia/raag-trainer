import { useEffect, useRef } from 'react';
import { Palta, Swara, Notation } from '../types';

interface PaltaDisplayProps {
  paltas: Palta[];
  currentPaltaId: number;
  currentNoteIndex: number;
  onSelectPalta: (id: number) => void;
  notation: Notation;
}

const swaraToHindiBase: Record<Swara, string> = {
  'S': 'स', 'r': 'रे', 'R': 'रे', 'g': 'ग', 'G': 'ग', 'M': 'म',
  'm': 'म', 'P': 'प', 'd': 'ध', 'D': 'ध', 'n': 'नि', 'N': 'नि'
};

const swaraToNumberBase: Record<Swara, string> = {
  'S': '1', 'r': '2', 'R': '2', 'g': '3', 'G': '3', 'M': '4',
  'm': '4', 'P': '5', 'd': '6', 'D': '6', 'n': '7', 'N': '7'
};

const isKomal = (s: Swara) => ['r', 'g', 'd', 'n'].includes(s);
const isTeevra = (s: Swara) => s === 'm';

export function PaltaDisplay({ paltas, currentPaltaId, currentNoteIndex, onSelectPalta, notation }: PaltaDisplayProps) {
  const activePaltaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activePaltaRef.current) {
      activePaltaRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentPaltaId]);

  const getGroupSize = (palta: Palta) => {
    const pattern = palta.pattern;
    if (pattern.includes('Merukhand')) {
      const match = pattern.match(/(\d+) notes/);
      return match ? parseInt(match[1]) : 3;
    }
    if (pattern === 'Building Pyramid') return 1;
    if (pattern === 'Expanding Intervals') return 2;
    if (pattern === 'High Note Anchor') return 2;

    if (pattern.includes('Custom')) {
      const match = pattern.match(/\(([^)]+)\)/);
      if (match) {
        const p = match[1];
        return p.includes('-') ? p.split('-').length : p.length;
      }
    }
    if (pattern.includes('-')) {
      return pattern.split('-').length;
    }
    return 1;
  };

  const getGroupedNotes = (palta: Palta) => {
    const groups: Array<Array<{ swara: Swara; octave: number; index: number }>> = [];
    const notes = palta.notes;
    const groupSize = getGroupSize(palta);
    
    if (palta.pattern === 'Building Pyramid') {
      let currentOffset = 0;
      const scaleLength = 8;
      for (let i = 1; i <= scaleLength; i++) {
        const phraseLen = i + (i - 1);
        const group = [];
        for (let j = 0; j < phraseLen && currentOffset + j < notes.length; j++) {
          group.push({ swara: notes[currentOffset + j].swara, octave: notes[currentOffset + j].octave, index: currentOffset + j });
        }
        if (group.length > 0) groups.push(group);
        currentOffset += phraseLen;
      }
      return groups;
    }

    if (palta.pattern === 'Progressive High Reach') {
      let currentOffset = 0;
      for (let i = 2; i <= 12; i++) {
        const phraseLen = i + (i - 1);
        const group = [];
        for (let j = 0; j < phraseLen && currentOffset + j < notes.length; j++) {
          group.push({ swara: notes[currentOffset + j].swara, octave: notes[currentOffset + j].octave, index: currentOffset + j });
        }
        if (group.length > 0) groups.push(group);
        currentOffset += phraseLen;
      }
      return groups;
    }

    if (palta.pattern === 'Progressive Low Reach') {
      let currentOffset = 0;
      for (let i = 3; i <= 7; i += 2) {
        const group = [];
        for (let j = 0; j < i && currentOffset + j < notes.length; j++) {
          group.push({ swara: notes[currentOffset + j].swara, octave: notes[currentOffset + j].octave, index: currentOffset + j });
        }
        if (group.length > 0) groups.push(group);
        currentOffset += i;
      }
      return groups;
    }

    for (let i = 0; i < notes.length; i += groupSize) {
      const group = [];
      for (let j = 0; j < groupSize && i + j < notes.length; j++) {
        group.push({ swara: notes[i + j].swara, octave: notes[i + j].octave, index: i + j });
      }
      if (group.length > 0) groups.push(group);
    }
    return groups;
  };

  const categories: Record<string, Palta[]> = {};
  paltas.forEach(p => {
    const cat = p.category || 'Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(p);
  });

  const renderNote = (note: { swara: Swara; octave: number; index: number }, isActive: boolean) => {
    let base = note.swara as string;
    if (notation === 'hindi') base = swaraToHindiBase[note.swara];
    else if (notation === 'numbers') base = swaraToNumberBase[note.swara];
    
    const komal = isKomal(note.swara);
    const teevra = isTeevra(note.swara);

    return (
      <div
        key={note.index}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: notation === 'hindi' ? '32px' : '28px',
          height: '42px',
          backgroundColor: isActive ? '#10b981' : '#f8fafc',
          color: isActive ? '#fff' : '#1e293b',
          borderRadius: '6px',
          border: isActive ? '1px solid #10b981' : '1px solid #e2e8f0',
          position: 'relative',
          padding: '1px 0'
        }}
      >
        <div style={{ height: '8px', display: 'flex', alignItems: 'center' }}>
          {note.octave === 1 && <div style={{ width: '4px', height: '4px', backgroundColor: isActive ? '#fff' : '#1e293b', borderRadius: '50%' }} />}
          {(notation === 'hindi' || notation === 'numbers') && teevra && <div style={{ width: '1.5px', height: '7px', backgroundColor: isActive ? '#fff' : '#1e293b' }} />}
        </div>

        <div style={{ 
          fontSize: notation === 'hindi' ? '16px' : '14px', 
          fontWeight: '800',
          lineHeight: 1,
          textDecoration: ((notation === 'hindi' || notation === 'numbers') && komal) ? 'underline' : 'none'
        }}>
          {base}
        </div>

        <div style={{ height: '8px', display: 'flex', alignItems: 'center' }}>
          {note.octave === -1 && <div style={{ width: '4px', height: '4px', backgroundColor: isActive ? '#fff' : '#1e293b', borderRadius: '50%' }} />}
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <style>{`
        @media (max-width: 640px) {
          .palta-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
            padding: 12px 16px !important;
          }
          .palta-pattern-name {
            min-width: 100% !important;
          }
        }
      `}</style>
      <h3 style={{ marginBottom: '20px', color: '#1a237e', borderBottom: '2px solid #e0e0e0', paddingBottom: '8px', fontSize: '18px', fontWeight: '800' }}>
        Practice Patterns
      </h3>
      
      {Object.entries(categories).map(([category, categoryPaltas]) => (
        <div key={category} style={{ marginBottom: '28px' }}>
          <h4 style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px', fontWeight: '800' }}>
            {category}
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categoryPaltas.map(palta => {
              const groupedNotes = getGroupedNotes(palta);
              const isActivePalta = currentPaltaId === palta.id;
              
              return (
                <div
                  key={palta.id}
                  ref={isActivePalta ? activePaltaRef : null}
                  onClick={() => onSelectPalta(palta.id)}
                  className="palta-row"
                  style={{
                    padding: '12px 20px',
                    backgroundColor: isActivePalta ? '#eff6ff' : '#fff',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: isActivePalta ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    scrollMargin: '120px'
                  }}
                >
                  <div className="palta-pattern-name" style={{ minWidth: '80px', fontWeight: '800', color: isActivePalta ? '#1d4ed8' : '#64748b', fontSize: '14px' }}>
                    {palta.pattern}
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', flex: 1 }}>
                    {groupedNotes.map((group, groupIndex) => {
                      const isAvaroha = group.some((n: any) => n.index >= (palta.arohaNoteCount || 0) && !palta.category?.includes('Merukhand') && !palta.category?.includes('Vocal Range'));
                      const isFirstAvarohaGroup = isAvaroha && (groupIndex === 0 || !groupedNotes[groupIndex - 1].some((n: any) => n.index >= (palta.arohaNoteCount || 0)));

                      return (
                        <div key={groupIndex} style={{ display: 'flex', alignItems: 'center', gap: '3px', width: isFirstAvarohaGroup && groupIndex !== 0 ? '100%' : 'auto' }}>
                          <div style={{ display: 'flex', gap: '3px' }}>
                            {group.map((note) => renderNote(note, isActivePalta && currentNoteIndex === note.index))}
                          </div>
                          {groupIndex < groupedNotes.length - 1 && !isFirstAvarohaGroup && <span style={{ color: '#cbd5e1', fontSize: '14px' }}>•</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
