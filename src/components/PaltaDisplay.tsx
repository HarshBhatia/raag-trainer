import { useEffect, useRef, useState } from 'react';
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
  const [viewingPalta, setViewingPalta] = useState<Palta | null>(null);

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

  const renderNote = (note: { swara: Swara; octave: number; index: number }, isActive: boolean, mini: boolean = false) => {
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
          minWidth: mini ? '28px' : (notation === 'hindi' ? '40px' : '36px'),
          height: mini ? '36px' : '52px',
          backgroundColor: isActive ? '#6366f1' : '#f8fafc',
          color: isActive ? '#fff' : '#1e293b',
          borderRadius: mini ? '6px' : '8px',
          border: isActive ? '1px solid #6366f1' : '1px solid #e2e8f0',
          position: 'relative',
          padding: mini ? '0' : '2px 0'
        }}
      >
        {!mini && <div style={{ height: '8px', display: 'flex', alignItems: 'center' }}>
          {note.octave === 1 && <div style={{ width: '4px', height: '4px', backgroundColor: isActive ? '#fff' : '#1e293b', borderRadius: '50%' }} />}
          {(notation === 'hindi' || notation === 'numbers') && teevra && <div style={{ width: '1.5px', height: '7px', backgroundColor: isActive ? '#fff' : '#1e293b' }} />}
        </div>}

        <div style={{ 
          fontSize: mini ? '15px' : (notation === 'hindi' ? '20px' : '18px'), 
          fontWeight: '800',
          lineHeight: 1,
          textDecoration: (!mini && (notation === 'hindi' || notation === 'numbers') && komal) ? 'underline' : 'none'
        }}>
          {base}
          {mini && note.octave === 1 && <span style={{ fontSize: '9px', verticalAlign: 'top' }}>'</span>}
          {mini && note.octave === -1 && <span style={{ fontSize: '9px', verticalAlign: 'bottom' }}>.</span>}
        </div>

        {!mini && <div style={{ height: '8px', display: 'flex', alignItems: 'center' }}>
          {note.octave === -1 && <div style={{ width: '4px', height: '4px', backgroundColor: isActive ? '#fff' : '#1e293b', borderRadius: '50%' }} />}
        </div>}
      </div>
    );
  };

  const categories: Record<string, Palta[]> = {};
  paltas.forEach(p => {
    const cat = p.category || 'Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(p);
  });

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '16px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', fontSize: '18px', fontWeight: '900' }}>
        Practice Patterns
      </h3>
      
      {Object.entries(categories).map(([category, categoryPaltas]) => (
        <div key={category} style={{ marginBottom: '32px' }}>
          <h4 style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: '800' }}>
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
                  style={{
                    padding: '8px 12px',
                    backgroundColor: isActivePalta ? '#f5f3ff' : '#fff',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: isActivePalta ? '2px solid #6366f1' : '1px solid #e2e8f0',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    scrollMargin: '120px'
                  }}
                >
                  <div style={{ 
                    minWidth: '36px', fontWeight: '900', color: isActivePalta ? '#6366f1' : '#94a3b8', fontSize: '13px'
                  }}>
                    #{palta.id > 100 ? (palta.id > 200 ? 'M' : 'V') : palta.id}
                  </div>
                  
                  {/* Single Row Preview */}
                  <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '3px',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    maskImage: 'linear-gradient(to right, black 90%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, black 90%, transparent 100%)'
                  }}>
                    {groupedNotes.map((group, gIdx) => (
                      <div key={gIdx} style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                        {group.map(n => renderNote(n, isActivePalta && currentNoteIndex === n.index, true))}
                        {gIdx < groupedNotes.length - 1 && <span style={{ color: '#cbd5e1', fontSize: '12px' }}>•</span>}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingPalta(palta);
                    }}
                    style={{
                      padding: '8px 14px', borderRadius: '10px', border: '1px solid #e0e7ff',
                      backgroundColor: '#fff', color: '#6366f1', fontSize: '11px', fontWeight: '800',
                      cursor: 'pointer', flexShrink: 0
                    }}
                  >
                    VIEW
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Modal for Full View */}
      {viewingPalta && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 5000, padding: '20px'
          }}
          onClick={() => setViewingPalta(null)}
        >
          <div 
            style={{
              backgroundColor: '#fff', borderRadius: '24px', maxWidth: '800px', width: '100%',
              maxHeight: '85vh', overflowY: 'auto', padding: '32px', position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setViewingPalta(null)}
              style={{
                position: 'absolute', top: '20px', right: '20px',
                width: '32px', height: '32px', borderRadius: '50%',
                border: 'none', backgroundColor: '#f1f5f9', color: '#64748b',
                cursor: 'pointer', fontWeight: '800'
              }}
            >✕</button>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '800' }}>
              {viewingPalta.category}
            </h3>
            <h2 style={{ margin: '0 0 30px 0', fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>
              Pattern Detail
            </h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {getGroupedNotes(viewingPalta).map((group, groupIndex) => {
                const isAvaroha = group.some((n: any) => n.index >= (viewingPalta.arohaNoteCount || 0) && !viewingPalta.category?.includes('Merukhand') && !viewingPalta.category?.includes('Vocal Range'));
                const isFirstAvarohaGroup = isAvaroha && (groupIndex === 0 || !getGroupedNotes(viewingPalta)[groupIndex - 1].some((n: any) => n.index >= (viewingPalta.arohaNoteCount || 0)));

                return (
                  <div key={groupIndex} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    width: isFirstAvarohaGroup && groupIndex !== 0 ? '100%' : 'auto',
                    marginTop: isFirstAvarohaGroup && groupIndex !== 0 ? '20px' : '0',
                    justifyContent: isFirstAvarohaGroup && groupIndex !== 0 ? 'center' : 'flex-start'
                  }}>
                    <div style={{ 
                      display: 'flex', gap: '4px', padding: '10px 14px', 
                      borderRadius: '14px', border: `1px solid ${isAvaroha ? '#fee2e2' : '#dcfce7'}`,
                      backgroundColor: isAvaroha ? '#fef2f2' : '#f0fdf4'
                    }}>
                      {group.map((note) => renderNote(note, false))}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                onSelectPalta(viewingPalta.id);
                setViewingPalta(null);
              }}
              style={{
                marginTop: '40px', width: '100%', padding: '18px', borderRadius: '16px',
                backgroundColor: '#6366f1', color: '#fff', border: 'none',
                fontSize: '16px', fontWeight: '800', cursor: 'pointer',
                boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
              }}
            >
              SELECT & PRACTICE THIS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
