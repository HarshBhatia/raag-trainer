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
  onTempoChange: (newTempo: number) => void;
  isTanpuraPlaying: boolean;
  onTanpuraToggle: () => void;
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
  hasBeenPlayed,
  activeColor, 
  notation, 
  scaleFactor 
}: { 
  note: any, 
  isActive: boolean,
  hasBeenPlayed: boolean,
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

  // Determine background color based on state
  const getBackgroundColor = () => {
    if (isActive) return activeColor;
    if (hasBeenPlayed) {
      // Darker tint based on whether it's aroha (green) or avaroha (red)
      return activeColor === '#10b981' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)';
    }
    return '#1e293b';
  };

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: getBackgroundColor(),
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
  onTempoChange,
  isTanpuraPlaying,
  onTanpuraToggle,
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
  const [playedNotes, setPlayedNotes] = useState<Set<number>>(new Set());
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track played notes (including index 0)
  useEffect(() => {
    if (currentNoteIndex >= 0 || currentNoteIndex === 0) {
      setPlayedNotes(prev => new Set(prev).add(currentNoteIndex));
    }
  }, [currentNoteIndex]);

  // Reset played notes when palta changes, when restarting, or on new repetition
  useEffect(() => {
    setPlayedNotes(new Set());
  }, [palta.id, currentIndex, currentRepetition]);

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
                    hasBeenPlayed={playedNotes.has(note.absoluteIndex)}
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
          {totalRepetitions > 1 && (
            <>
              <div style={{ width: '1px', height: '18px', backgroundColor: '#334155' }}></div>
              <span style={{ fontSize: isMobile ? '16px' : '24px', fontWeight: '900', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '8px' }}>
                {currentRepetition || 1}/{totalRepetitions}
              </span>
            </>
          )}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
          <button
            onClick={onTanpuraToggle}
            style={{
              width: isMobile ? '40px' : '44px',
              height: isMobile ? '40px' : '44px',
              borderRadius: '10px',
              backgroundColor: isTanpuraPlaying ? '#6366f1' : '#334155',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
            title={isTanpuraPlaying ? 'Turn off Tanpura' : 'Turn on Tanpura'}
          >
            <svg width={isMobile ? '20' : '24'} height={isMobile ? '20' : '24'} viewBox="0 0 512 512" fill="currentColor">
              <path d="M432.914 51.634C435.987 53.593 438.008 55.593 440.015 57.618C441.122 58.72 441.122 58.72 442.251 59.844C443.801 61.392 445.347 62.944 446.89 64.499C449.246 66.871 451.618 69.227 453.992 71.582C455.501 73.093 457.009 74.605 458.516 76.118C459.222 76.818 459.929 77.518 460.657 78.239C466.245 83.908 469.514 89.131 470.313 97.125C469.508 107.109 464.527 113.335 457.516 120.071C456.701 120.878 455.885 121.685 455.045 122.516C452.461 125.067 449.856 127.596 447.251 130.125C445.485 131.861 443.721 133.598 441.958 135.336C437.655 139.574 433.335 143.794 429.001 148.001C430.658 151.549 432.567 153.689 435.438 156.376C440.44 161.321 443.088 164.847 443.376 172.001C443.158 178.064 441.56 181.477 437.189 185.751C431.785 189.565 427.61 190.498 421.153 189.52C413.574 187.691 408.213 180.399 403.001 175.001C398.361 178.883 393.948 182.907 389.675 187.187C389.079 187.78 388.483 188.373 387.869 188.984C385.891 190.953 383.917 192.925 381.943 194.897C380.519 196.317 379.094 197.737 377.669 199.156C373.813 202.999 369.961 206.845 366.11 210.691C363.703 213.095 361.295 215.499 358.887 217.903C351.349 225.427 343.814 232.953 336.281 240.482C327.591 249.167 318.894 257.847 310.192 266.52C303.459 273.231 296.731 279.949 290.008 286.671C285.995 290.683 281.979 294.693 277.957 298.696C274.178 302.459 270.406 306.229 266.64 310.004C265.257 311.387 263.872 312.769 262.484 314.147C260.589 316.029 258.703 317.921 256.819 319.815C256.269 320.358 255.718 320.901 255.151 321.46C250.728 325.94 247.805 330.408 247.251 336.751C247.174 337.509 247.096 338.267 247.017 339.048C247.003 341.659 247.191 344.097 247.47 346.689C250.71 376.944 246.243 413.923 227.564 439.001C226.401 440.356 225.213 441.69 224.001 443.001C223.371 443.722 222.741 444.442 222.091 445.185C211.856 456.223 199.113 463.213 185.001 468.001C184.29 468.255 183.578 468.509 182.845 468.771C162.636 474.931 139.561 469.314 121.376 459.814C106.314 451.635 94.0796 441.08 82.0014 429.001C80.9939 428.063 80.9939 428.063 79.9664 427.107C59.0599 407.328 44.5374 379.613 43.6889 350.626C44.1307 327.737 54.8204 306.839 71.0014 291.001C95.8557 268.94 133.418 265.825 165.001 267.001C168.139 267.248 171.267 267.529 174.398 267.856C180.868 268.217 185.936 265.91 191.001 262.001C193.564 259.707 195.983 257.281 198.405 254.839C199.129 254.117 199.853 253.395 200.598 252.651C203.016 250.236 205.427 247.828 207.839 245.421C209.573 243.686 211.308 241.95 213.043 240.213C216.775 236.482 220.504 232.753 224.23 229.016C229.617 223.612 235.01 218.214 240.405 212.816C249.157 204.059 257.904 195.298 266.649 186.535C275.142 178.023 283.638 169.514 292.135 161.007C292.922 160.22 292.922 160.22 293.724 159.417C296.353 156.785 298.983 154.153 301.612 151.521C323.415 129.697 345.21 107.867 367.001 86.001C366.04 84.878 365.079 83.756 364.118 82.633C363.582 82.008 363.047 81.383 362.496 80.739C361.386 79.449 360.265 78.168 359.138 76.892C358.66 76.351 358.182 75.81 357.689 75.251C357.198 74.7 356.707 74.148 356.201 73.579C352.87 69.196 353.391 63.202 354.001 58.001C355.696 53.22 358.357 50.024 362.751 47.501C367.076 45.665 371.375 45.119 376.001 46.001C380.758 47.949 383.832 50.5 387.376 54.189C388.25 55.09 389.124 55.991 390.025 56.919C390.677 57.606 391.329 58.293 392.001 59.001C395.1 57.638 397.037 56.115 399.314 53.626C409.345 43.316 422.756 42.111 432.914 51.634z"/>
              <path d="M349.704 152.196C348.666 153.241 347.63 154.288 346.597 155.338C346.027 155.912 345.458 156.486 344.871 157.078C342.947 159.019 341.026 160.964 339.106 162.909C337.733 164.295 336.36 165.681 334.986 167.067C332.019 170.062 329.052 173.058 326.086 176.054C321.386 180.8 316.68 185.539 311.971 190.276C311.177 191.075 310.382 191.874 309.564 192.698C307.115 195.161 304.666 197.624 302.217 200.087C292.074 210.29 281.936 220.498 271.821 230.729C264.452 238.183 257.068 245.622 249.668 253.046C245.754 256.973 241.848 260.906 237.959 264.858C234.29 268.585 230.603 272.293 226.901 275.988C225.554 277.338 224.214 278.695 222.882 280.06C209.409 293.848 194.436 302.85 174.563 303.126C171.603 303.138 168.736 302.862 165.801 302.509C143.357 299.94 115.597 302.254 96.2389 315.06C86.7346 323.303 79.7748 334.865 78.0014 347.376C77.1232 367.178 88.7592 384.748 101.314 399.001C102.867 400.676 104.43 402.343 106.001 404.001C106.834 404.898 107.667 405.795 108.525 406.72C121.491 420.257 140.581 434.962 160.102 435.382C174.545 435.343 184.342 431.99 195.071 422.091C209.573 406.804 212.609 380.485 212.173 360.251C211.982 356.65 211.637 353.091 211.235 349.509C209.742 333.533 212.284 317.979 222.279 305.056C223.141 304.025 224.01 302.999 224.884 301.98C225.363 301.419 225.841 300.858 226.334 300.28C232.036 293.685 238.186 287.55 244.367 281.408C245.669 280.106 246.971 278.803 248.273 277.501C251.768 273.996 255.269 270.497 258.771 267C262.445 263.338 266.113 259.681 269.781 256.024C276.711 249.1 283.647 242.181 290.583 235.265C298.488 227.382 306.387 219.494 314.286 211.605C330.518 195.394 346.757 179.19 363.001 163.001C361.403 159.616 359.622 157.382 356.938 154.751C356.225 154.045 355.512 153.339 354.778 152.611C352.107 150.192 352.454 150.567 349.704 152.196z"/>
              <path d="M139.188 339.625C140.089 339.576 140.99 339.527 141.918 339.477C150.172 340.878 156.093 347.599 161.75 353.313C162.492 354.034 163.233 354.755 163.997 355.498C169.017 360.523 173.107 365.425 174.497 372.539C174.337 378.246 173.527 382.401 169.384 386.664C164.396 391.181 160.873 392.312 154.024 392.223C149.43 391.717 145.406 389.012 142.001 386C142.001 385.34 142.001 384.68 142.001 384C140.516 383.505 140.516 383.505 139.001 383C139.001 382.34 139.001 381.68 139.001 381C137.516 380.505 137.516 380.505 136.001 380C136.001 379.34 136.001 378.68 136.001 378C135.341 378 134.681 378 134.001 378C134.001 377.34 134.001 376.68 134.001 376C133.011 375.67 132.021 375.34 131.001 375C131.001 374.34 131.001 373.68 131.001 373C130.011 372.67 129.021 372.34 128.001 372C123.891 367.7 121.582 363.354 121.376 357.375C121.765 350.906 123.761 347.076 128.563 342.625C132.105 340.264 135.013 339.778 139.188 339.625z"/>
              <path d="M416 86C419.633 87.696 421.945 89.738 424.75 92.625C425.549 93.442 426.348 94.26 427.172 95.102C427.775 95.728 428.378 96.355 429 97C424.63 102.229 420.031 107.103 415.195 111.902C414.471 112.625 413.747 113.348 413.002 114.092C410.712 116.376 408.418 118.657 406.125 120.938C404.562 122.495 403 124.053 401.438 125.611C397.628 129.41 393.815 133.206 390 137C386.367 135.304 384.055 133.262 381.25 130.375C380.451 129.558 379.652 128.74 378.828 127.898C378.225 127.272 377.622 126.645 377 126C381.37 120.771 385.969 115.897 390.805 111.098C391.529 110.375 392.253 109.653 392.998 108.908C395.288 106.624 397.582 104.343 399.875 102.063C401.438 100.505 403 98.947 404.563 97.389C408.372 93.59 412.185 89.794 416 86z"/>
            </svg>
          </button>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => onTempoChange(Math.max(40, tempo - 5))}
              style={{
                width: isMobile ? '32px' : '36px',
                height: isMobile ? '32px' : '36px',
                borderRadius: '8px',
                backgroundColor: '#334155',
                color: '#fff',
                border: 'none',
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              −
            </button>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '8px', color: '#94a3b8', margin: '0 0 1px 0', textTransform: 'uppercase' }}>Tempo</p>
              <p style={{ fontSize: isMobile ? '14px' : '20px', fontWeight: '900', margin: 0 }}>{tempo}</p>
            </div>
            <button
              onClick={() => onTempoChange(Math.min(300, tempo + 5))}
              style={{
                width: isMobile ? '32px' : '36px',
                height: isMobile ? '32px' : '36px',
                borderRadius: '8px',
                backgroundColor: '#334155',
                color: '#fff',
                border: 'none',
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              +
            </button>
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
