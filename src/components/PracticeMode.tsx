import React, { useState, useEffect, useMemo } from 'react';
import { Palta, Swara, Notation } from '../types';

interface PracticeModeProps {
  palta: Palta;
  currentNoteIndex: number;
  notation: Notation;
  onExit: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  tempo: number;
  introBeat: number; 
  currentIndex: number;
  totalCount: number;
  currentRepetition: number;
  totalRepetitions: number;
  thaatName: string;
  saNote: string;
  category: string;
  timeRemaining: number;
  onRestart: () => void;
  onSkip: () => void;
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

const PracticeNote = React.memo(({ 
  note, 
  isActive, 
  activeColor, 
  notation, 
  scaleFactor 
}: { 
  note: any, 
  isActive: boolean, 
  activeColor: string, 
  notation: Notation,
  scaleFactor: number
}) => {
  const base = useMemo(() => {
    if (notation === 'hindi') return swaraToHindiBase[note.swara as Swara];
    if (notation === 'numbers') return swaraToNumberBase[note.swara as Swara];
    return note.swara;
  }, [note.swara, notation]);
  
  const komal = isKomal(note.swara);
  const teevra = isTeevra(note.swara);

  const width = (notation === 'hindi' ? 100 : 80) * scaleFactor;
  const height = 110 * scaleFactor; // Slightly shorter
  const fontSize = (notation === 'hindi' ? 48 : 40) * scaleFactor;
  const dotSize = 7 * scaleFactor;
  const teevraHeight = 14 * scaleFactor;

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: isActive ? activeColor : '#1e293b',
        borderRadius: `${10 * scaleFactor}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        border: isActive ? `${Math.max(2, 4 * scaleFactor)}px solid #fff` : `${Math.max(1, 1.5 * scaleFactor)}px solid #334155`,
        position: 'relative',
        flexShrink: 0,
        margin: `${1.5 * scaleFactor}px`,
      }}
    >
      <div style={{ height: `${16 * scaleFactor}px`, display: 'flex', alignItems: 'center', marginBottom: `${1 * scaleFactor}px` }}>
        {note.octave === 1 && <div style={{ width: `${dotSize}px`, height: `${dotSize}px`, backgroundColor: '#fff', borderRadius: '50%' }} />}
        {(notation === 'hindi' || notation === 'numbers') && teevra && <div style={{ width: `${Math.max(1.5, 2.5 * scaleFactor)}px`, height: `${teevraHeight}px`, backgroundColor: '#fff' }} />}
      </div>

      <div style={{ 
        fontSize: `${fontSize}px`, 
        fontWeight: '900',
        lineHeight: 1,
        color: '#fff',
        textDecoration: ((notation === 'hindi' || notation === 'numbers') && komal) ? 'underline' : 'none'
      }}>
        {base}
      </div>

      <div style={{ height: `${16 * scaleFactor}px`, display: 'flex', alignItems: 'center', marginTop: `${2 * scaleFactor}px` }}>
        {note.octave === -1 && <div style={{ width: `${dotSize}px`, height: `${dotSize}px`, backgroundColor: '#fff', borderRadius: '50%' }} />}
      </div>
    </div>
  );
});

export function PracticeMode({ 
  palta, 
  currentNoteIndex, 
  notation, 
  onExit, 
  isPlaying, 
  onTogglePlay, 
  tempo,
  introBeat,
  currentIndex,
  totalCount,
  currentRepetition,
  totalRepetitions,
  thaatName,
  saNote,
  category,
  timeRemaining,
  onRestart,
  onSkip
}: PracticeModeProps) {
  const [showRestartPrompt, setShowRestartPrompt] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (currentIndex > 1) {
      setShowRestartPrompt(true);
      const timer = setTimeout(() => setShowRestartPrompt(false), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const groupSize = useMemo(() => {
    const pattern = palta.pattern;
    if (pattern.includes('Merukhand')) {
      const match = pattern.match(/(\d+) notes/);
      return match ? parseInt(match[1]) : 3;
    }
    if (pattern === 'Building Pyramid') return 1; // Special handling for building
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
  }, [palta.pattern]);

  const arohaCount = palta.arohaNoteCount || palta.notes.length / 2;

  const sections = useMemo(() => {
    const isSingleSection = palta.category?.includes('Merukhand') || palta.category?.includes('Vocal Range');
    
    const getGroups = (notes: any[], offset: number, size: number) => {
      const groups: any[] = [];
      if (palta.pattern === 'Building Pyramid') {
        let currentOffset = 0;
        const scaleLength = 8;
        for (let i = 1; i <= scaleLength; i++) {
          const phraseLen = i + (i - 1);
          groups.push(notes.slice(currentOffset, currentOffset + phraseLen).map((n, idx) => ({ ...n, absoluteIndex: offset + currentOffset + idx })));
          currentOffset += phraseLen;
        }
        return groups;
      }

      if (palta.pattern === 'Progressive High Reach') {
        let currentOffset = 0;
        // Phrases grow from 2 notes up to 24 (S-R-S... to S...P'...S)
        // Sizes are 3, 5, 7, 9... (2n+1)
        for (let i = 2; i <= 12; i++) {
          const phraseLen = i + (i - 1);
          groups.push(notes.slice(currentOffset, currentOffset + phraseLen).map((n, idx) => ({ ...n, absoluteIndex: offset + currentOffset + idx })));
          currentOffset += phraseLen;
        }
        return groups;
      }

      if (palta.pattern === 'Progressive Low Reach') {
        let currentOffset = 0;
        // Phrases are S-N.-S (3), S-N.-D.-N.-S (5), S-N.-D.-P.-D.-N.-S (7)
        for (let i = 3; i <= 7; i += 2) {
          groups.push(notes.slice(currentOffset, currentOffset + i).map((n, idx) => ({ ...n, absoluteIndex: offset + currentOffset + idx })));
          currentOffset += i;
        }
        return groups;
      }

      for (let i = 0; i < notes.length; i += size) {
        groups.push(notes.slice(i, i + size).map((n, idx) => ({ ...n, absoluteIndex: offset + i + idx })));
      }
      return groups;
    };

    if (isSingleSection) {
      return {
        aroha: getGroups(palta.notes, 0, groupSize),
        avaroha: []
      };
    }

    const arohaNotes = palta.notes.slice(0, arohaCount);
    const avarohaNotes = palta.notes.slice(arohaCount);

    return {
      aroha: getGroups(arohaNotes, 0, groupSize),
      avaroha: getGroups(avarohaNotes, arohaCount, groupSize)
    };
  }, [palta.notes, arohaCount, groupSize, palta.category, palta.pattern]);

  const isMobile = windowWidth < 768;

  const PHRASES_PER_PAGE = isMobile ? 24 : 24;

  // Pagination Logic
  const paginatedSections = useMemo(() => {
    const allGroups = [...sections.aroha, ...sections.avaroha];
    // Only paginate if we have many phrases
    if (allGroups.length <= PHRASES_PER_PAGE) {
      return [allGroups];
    }
    const pages: any[][] = [];
    for (let i = 0; i < allGroups.length; i += PHRASES_PER_PAGE) {
      pages.push(allGroups.slice(i, i + PHRASES_PER_PAGE));
    }
    return pages;
  }, [sections, PHRASES_PER_PAGE]);

  const currentPageIndex = useMemo(() => {
    if (currentNoteIndex === -1) return 0;
    const page = paginatedSections.findIndex(page => 
      page.some(group => group.some((n: any) => n.absoluteIndex === currentNoteIndex))
    );
    return page === -1 ? 0 : page;
  }, [currentNoteIndex, paginatedSections]);

  const scaleFactor = useMemo(() => {
    let factor = isMobile ? 0.55 : 1.0;
    // Base scale on PHRASES PER PAGE now, not total notes
    const notesInView = paginatedSections[currentPageIndex]?.reduce((acc, g) => acc + g.length, 0) || 0;
    
    if (notesInView > 60) factor *= 0.45;
    else if (notesInView > 48) factor *= 0.5;
    else if (notesInView > 32) factor *= 0.6;
    else if (notesInView > 24) factor *= 0.7;
    else if (notesInView > 12) factor *= 0.8;
    return factor;
  }, [currentPageIndex, paginatedSections, isMobile]);

  const renderPage = (groups: any[]) => (
    <div style={{ width: '100%', marginBottom: isMobile ? '4px' : '15px' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: `${8 * scaleFactor}px`,
        justifyContent: 'center',
        padding: '2px'
      }}>
        {groups.map((group, groupIdx) => {
          const isAvaroha = group.some((n: any) => n.absoluteIndex >= (palta.arohaNoteCount || 0) && !palta.category?.includes('Merukhand') && !palta.category?.includes('Vocal Range'));
          const isFirstAvarohaGroup = isAvaroha && (groupIdx === 0 || !groups[groupIdx - 1].some((n: any) => n.absoluteIndex >= (palta.arohaNoteCount || 0)));
          const color = isAvaroha ? '#ef4444' : '#10b981';
          
          return (
            <React.Fragment key={groupIdx}>
              {isFirstAvarohaGroup && groupIdx !== 0 && <div style={{ width: '100%', height: '20px' }} />}
              <div 
                style={{ 
                  display: 'flex', 
                  flexWrap: 'nowrap', 
                  justifyContent: 'center',
                  gap: `${3 * scaleFactor}px`, 
                  padding: `${4 * scaleFactor}px`, 
                  border: `${Math.max(1, 1 * scaleFactor)}px solid ${color}`,
                  borderRadius: `${8 * scaleFactor}px`,
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  alignItems: 'center',
                }}
              >
                {group.map((note: any) => (
                  <PracticeNote 
                    key={note.absoluteIndex} 
                    note={note} 
                    isActive={currentNoteIndex === note.absoluteIndex}
                    activeColor={color}
                    notation={notation}
                    scaleFactor={scaleFactor}
                  />
                ))}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#0f172a', color: '#fff', zIndex: 1000,
      display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
      overflow: 'hidden', height: '100dvh'
    }}>
      {showRestartPrompt && (
        <div style={{
          position: 'absolute', bottom: isMobile ? '85px' : '120px', left: isMobile ? '10px' : '40px',
          zIndex: 2000, backgroundColor: '#3b82f6', padding: isMobile ? '8px 16px' : '12px 24px',
          borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: '15px',
          animation: 'slideInLeft 4s forwards', border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '700' }}>Resuming from {currentIndex}...</span>
          <button 
            onClick={() => { 
              if (isPlaying) onTogglePlay(); 
              onRestart(); 
              setShowRestartPrompt(false); 
            }}
            style={{
              padding: '4px 12px', backgroundColor: '#fff', color: '#3b82f6',
              border: 'none', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', fontSize: '10px'
            }}
          >
            RESTART
          </button>
        </div>
      )}

      {/* Simplified Header for Mobile */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: isMobile ? '12px 16px' : '15px 30px', width: '100%',
        boxSizing: 'border-box', borderBottom: '1px solid #1e293b', flexShrink: 0, gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '20px', overflow: 'hidden' }}>
          <span style={{ fontSize: isMobile ? '16px' : '24px', fontWeight: '900', color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '4px 8px', borderRadius: '8px' }}>
            {currentIndex}/{totalCount}
          </span>
          <div style={{ width: '1px', height: '18px', backgroundColor: '#334155' }}></div>
          <span style={{ fontSize: isMobile ? '16px' : '24px', fontWeight: '900', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '8px' }}>
            {currentRepetition || 1}/{totalRepetitions}
          </span>
          <div style={{ width: '1px', height: '18px', backgroundColor: '#334155' }}></div>
          <span style={{ fontSize: isMobile ? '14px' : '20px', fontWeight: '900', color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: '8px' }}>
            {formatTime(timeRemaining)}
          </span>
          {paginatedSections.length > 1 && (
            <span style={{ fontSize: isMobile ? '12px' : '16px', fontWeight: '800', color: '#94a3b8', backgroundColor: 'rgba(148, 163, 184, 0.1)', padding: '4px 8px', borderRadius: '8px', marginLeft: '4px' }}>
              PG {currentPageIndex + 1}/{paginatedSections.length}
            </span>
          )}
        </div>
        <button 
          onClick={onExit}
          style={{
            padding: isMobile ? '10px 16px' : '12px 24px', backgroundColor: '#ef4444', color: '#fff',
            border: 'none', borderRadius: '10px', fontSize: isMobile ? '14px' : '16px',
            fontWeight: '900', cursor: 'pointer', flexShrink: 0, textTransform: 'uppercase'
          }}
        >
          Exit
        </button>
      </div>

      {/* Set Name Bar (Separate line on mobile for readability) */}
      <div style={{ 
        width: '100%', padding: isMobile ? '8px 16px' : '0', 
        display: isMobile ? 'block' : 'none', 
        backgroundColor: 'rgba(30, 41, 59, 0.3)',
        borderBottom: '1px solid #1e293b'
      }}>
        <h2 style={{ fontSize: '13px', margin: 0, color: '#94a3b8', fontWeight: '700', textAlign: 'center' }}>
          {category} • {thaatName} • {saNote}
        </h2>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: isMobile ? '2px' : '10px 40px',
        width: '100%', boxSizing: 'border-box', overflowY: 'auto'
      }}>
        {/* Metronome */}
        <div style={{ height: isMobile ? '25px' : '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: '2px', flexShrink: 0 }}>
          {introBeat > 0 && introBeat <= 4 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4].map(b => (
                <div key={b} style={{
                  width: isMobile ? '20px' : '36px', height: isMobile ? '20px' : '36px', borderRadius: '50%',
                  backgroundColor: introBeat >= b ? '#fbbf24' : '#334155',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  fontSize: isMobile ? '11px' : '16px', fontWeight: '900', color: introBeat >= b ? '#000' : '#475569'
                }}>{b}</div>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          {paginatedSections[currentPageIndex] && renderPage(paginatedSections[currentPageIndex])}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: isMobile ? '6px 10px' : '15px 30px', width: '100%',
        boxSizing: 'border-box', display: 'flex', justifyContent: 'center',
        flexShrink: 0, borderTop: '1px solid #1e293b', backgroundColor: '#0f172a'
      }}>
        <div style={{
          padding: isMobile ? '4px 15px' : '10px 30px', display: 'flex',
          justifyContent: 'center', alignItems: 'center', gap: isMobile ? '12px' : '30px',
          backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', width: isMobile ? '100%' : 'auto'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '8px', color: '#94a3b8', margin: '0 0 1px 0', textTransform: 'uppercase' }}>Tempo</p>
            <p style={{ fontSize: isMobile ? '14px' : '20px', fontWeight: '900', margin: 0 }}>{tempo}</p>
          </div>
          <button
            onClick={onTogglePlay}
            style={{
              width: isMobile ? '50px' : '60px', height: isMobile ? '50px' : '60px',
              borderRadius: '50%', backgroundColor: isPlaying ? '#ef4444' : '#10b981',
              color: '#fff', border: 'none', fontSize: isMobile ? '18px' : '28px',
              cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)', position: 'relative'
            }}
          >
            {isPlaying ? (
              // Custom Pause Icon
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{ width: '6px', height: '20px', backgroundColor: '#fff', borderRadius: '2px' }}></div>
                <div style={{ width: '6px', height: '20px', backgroundColor: '#fff', borderRadius: '2px' }}></div>
              </div>
            ) : (
              // Custom Play Icon
              <div style={{ 
                width: 0, height: 0, 
                borderTop: '12px solid transparent',
                borderBottom: '12px solid transparent',
                borderLeft: '20px solid #fff',
                marginLeft: '4px'
              }}></div>
            )}
          </button>
          
          <button
            onClick={onSkip}
            style={{
              padding: isMobile ? '10px 16px' : '12px 24px',
              backgroundColor: '#334155', color: '#fff',
              border: 'none', borderRadius: '12px', fontSize: isMobile ? '12px' : '14px',
              fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <span>SKIP</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <div style={{ 
                width: 0, height: 0, 
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderLeft: '10px solid #fff' 
              }}></div>
              <div style={{ width: '3px', height: '12px', backgroundColor: '#fff', borderRadius: '1px' }}></div>
            </div>
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes slideInLeft {
          0% { opacity: 0; transform: translateX(-100px); }
          10% { opacity: 1; transform: translateX(0); }
          90% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(-50px); }
        }
      `}</style>
    </div>
  );
}
