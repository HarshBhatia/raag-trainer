import { useState, useEffect, useRef, useMemo } from 'react';
import { Raag, NoteName, Palta, Notation, SoundType } from './types';
import { PaltaGenerator, thaats, noteFrequencies } from './utils/taanGenerator';
import { AudioEngine } from './utils/audioEngine';
import { RaagSelector } from './components/RaagSelector';
import { PaltaDisplay } from './components/PaltaDisplay';
import { Controls } from './components/Controls';
import { PracticeMode } from './components/PracticeMode';

const paltaGenerator = new PaltaGenerator('C#');
const audioEngine = new AudioEngine();

const STORAGE_KEY = 'raag_trainer_prefs';

function App() {
  const savedPrefs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

  const [selectedThaat, setSelectedThaat] = useState<Raag>(() => {
    const saved = thaats.find(r => r.name === savedPrefs.selectedRaagName);
    return saved || thaats[0];
  });
  const [tempo, setTempo] = useState(savedPrefs.tempo || 135);
  const [saNote, setSaNote] = useState<NoteName>(savedPrefs.saNote || 'C#');
  const [repetitions, setRepetitions] = useState(savedPrefs.repetitions || 2);
  const [loop, setLoop] = useState(savedPrefs.loop !== undefined ? savedPrefs.loop : false);
  const [notation, setNotation] = useState<Notation>(savedPrefs.notation || 'hindi');
  const [soundType, setSoundType] = useState<SoundType>(savedPrefs.soundType || 'harmonium');
  const [isTanpuraPlaying, setIsTanpuraPlaying] = useState(savedPrefs.isTanpuraPlaying || false);
  const [tanpuraVolume, setTanpuraVolume] = useState(savedPrefs.tanpuraVolume !== undefined ? savedPrefs.tanpuraVolume : 0.4);
  const [selectedCategory, setSelectedCategory] = useState<string>(savedPrefs.selectedCategory || 'All');
  const [customPaltas, setCustomPaltas] = useState<Palta[]>(savedPrefs.customPaltas || []);
  const [currentPaltaId, setCurrentPaltaId] = useState(savedPrefs.currentPaltaId || 1);
  
  const [customPattern, setCustomPattern] = useState('');
  const [paltas, setPaltas] = useState<Palta[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(-1);
  const [currentRepetition, setCurrentRepetition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackId, setPlaybackId] = useState(0);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [introBeat, setIntroBeat] = useState(0);
  const [showPaltaList, setShowPaltaList] = useState(false);
  
  const [playbackMode, setPlaybackMode] = useState<'loop' | 'sequential' | null>(null);
  const isAutoSwitching = useRef(false);

  useEffect(() => {
    const prefs = {
      selectedRaagName: selectedThaat.name,
      tempo,
      saNote,
      repetitions,
      loop,
      notation,
      soundType,
      isTanpuraPlaying,
      tanpuraVolume,
      selectedCategory,
      customPaltas,
      currentPaltaId
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [selectedThaat, tempo, saNote, repetitions, loop, notation, soundType, isTanpuraPlaying, tanpuraVolume, selectedCategory, customPaltas, currentPaltaId]);

  const visiblePaltas = useMemo(() => {
    if (selectedCategory === 'All') return paltas;
    return paltas.filter(p => p.category === selectedCategory);
  }, [paltas, selectedCategory]);

  const currentIndex = useMemo(() => {
    const idx = visiblePaltas.findIndex(p => p.id === currentPaltaId);
    return idx === -1 ? 1 : idx + 1;
  }, [visiblePaltas, currentPaltaId]);

  const timeRemaining = useMemo(() => {
    if (visiblePaltas.length === 0) return 0;
    const startIdx = visiblePaltas.findIndex(p => p.id === currentPaltaId);
    if (startIdx === -1) return 0;
    let totalSeconds = 0;
    const noteDuration = 60 / (tempo * 2);
    const introDuration = 4 * (60 / tempo);
    for (let i = startIdx; i < visiblePaltas.length; i++) {
      const palta = visiblePaltas[i];
      const isCurrentPalta = i === startIdx;
      totalSeconds += introDuration;
      const repsToPlay = isCurrentPalta ? Math.max(1, repetitions - (currentRepetition || 1) + 1) : repetitions;
      totalSeconds += palta.notes.length * repsToPlay * noteDuration;
    }
    return totalSeconds;
  }, [visiblePaltas, currentPaltaId, currentRepetition, repetitions, tempo]);

  const categories = useMemo(() => {
    const cats = new Set(paltas.map(p => p.category || 'Other'));
    return ['All', ...Array.from(cats)];
  }, [paltas]);

  useEffect(() => {
    paltaGenerator.setSaNote(saNote);
    const basePaltas = paltaGenerator.generateMultiplePaltas(selectedThaat);
    const updatedCustoms = customPaltas.map(cp => {
      const match = cp.pattern.match(/\(([^)]+)\)/);
      const pattern = match ? match[1].replace(/-/g, '') : '1';
      const regenerated = paltaGenerator.generateCustomPalta(selectedThaat, pattern);
      return regenerated ? { ...regenerated, id: cp.id } : cp;
    });
    const allPaltas = [...basePaltas, ...updatedCustoms];
    setPaltas(allPaltas);
    
    if (allPaltas.length > 0 && !allPaltas.find(p => p.id === currentPaltaId)) {
      setCurrentPaltaId(allPaltas[0].id);
    }
    setCurrentNoteIndex(-1);
  }, [selectedThaat, saNote, customPaltas.length]);

  useEffect(() => {
    if (isPlaying) {
      audioEngine.setTempo(tempo);
    }
  }, [tempo, isPlaying]);

  useEffect(() => {
    audioEngine.setSoundType(soundType);
  }, [soundType]);

  useEffect(() => {
    audioEngine.setTanpuraVolume(tanpuraVolume);
  }, [tanpuraVolume]);

  useEffect(() => {
    if (isTanpuraPlaying) {
      const freq = noteFrequencies[saNote];
      const hasPa = selectedThaat.aroha.includes('P');
      const mode = hasPa ? 'Pa' : 'Ma';
      audioEngine.startTanpura(freq, mode);
    } else {
      audioEngine.stopTanpura();
    }
  }, [isTanpuraPlaying, saNote, selectedThaat]);

  useEffect(() => {
    if (isPlaying && !isAutoSwitching.current) {
      const currentMode = playbackMode;
      handleStop();
      setTimeout(() => {
        if (currentMode === 'sequential') {
          handlePlaySequential(true);
        } else {
          handlePlayLoop();
        }
      }, 50);
    }
  }, [currentPaltaId]);

  const getGroupSize = (pattern: string) => {
    if (pattern.includes('Custom')) {
      const match = pattern.match(/\(([^)]+)\)/);
      if (match) {
        const customPattern = match[1];
        return customPattern.includes('-') ? customPattern.split('-').length : customPattern.length;
      }
    } else if (pattern.includes('-')) {
      const parts = pattern.split('-');
      return parts.length > 4 ? 1 : parts.length;
    }
    return 1;
  };

  const handleAddCustomPalta = () => {
    if (!customPattern.trim()) return;
    const newCustom = paltaGenerator.generateCustomPalta(selectedThaat, customPattern);
    if (newCustom) {
      setCustomPaltas(prev => [...prev, newCustom]);
      setCurrentPaltaId(newCustom.id);
      setSelectedCategory('Custom'); 
      setCustomPattern('');
    }
  };

  const handlePlaySequential = async (startFromCurrent = true) => {
    if (visiblePaltas.length === 0) return;
    setPlaybackMode('sequential');
    isAutoSwitching.current = true;
    const currentId = playbackId + 1;
    setPlaybackId(currentId);
    setIsPlaying(true);
    audioEngine.start();
    const startIndex = startFromCurrent ? visiblePaltas.findIndex(p => p.id === currentPaltaId) : 0;
    const effectiveStartIndex = startIndex === -1 ? 0 : startIndex;
    for (let paltaIndex = effectiveStartIndex; paltaIndex < visiblePaltas.length; paltaIndex++) {
      if (!audioEngine.getIsPlaying()) break;
      const palta = visiblePaltas[paltaIndex];
      isAutoSwitching.current = true;
      setCurrentPaltaId(palta.id);
      const groupSize = getGroupSize(palta.pattern);
      await audioEngine.playIntro(tempo, setIntroBeat);
      if (!audioEngine.getIsPlaying()) break;
      for (let rep = 0; rep < repetitions; rep++) {
        if (!audioEngine.getIsPlaying()) break;
        setCurrentRepetition(rep + 1);
        await audioEngine.playTaan(palta.notes, tempo, groupSize, (index) => {
          setCurrentNoteIndex(index);
        });
      }
    }
    if (loop && audioEngine.getIsPlaying()) {
      handlePlaySequential(false);
    } else {
      isAutoSwitching.current = false;
      if (audioEngine.getIsPlaying()) handleStop();
    }
  };

  const handlePlayLoop = async () => {
    const selectedPalta = visiblePaltas.find(p => p.id === currentPaltaId);
    if (!selectedPalta) return;
    setPlaybackMode('loop');
    isAutoSwitching.current = false;
    const currentId = playbackId + 1;
    setPlaybackId(currentId);
    setIsPlaying(true);
    audioEngine.start();
    const groupSize = getGroupSize(selectedPalta.pattern);
    await audioEngine.playIntro(tempo, setIntroBeat);
    if (!audioEngine.getIsPlaying()) return;
    const runLoop = async (currentRep: number) => {
      if (!audioEngine.getIsPlaying()) return;
      setCurrentRepetition(((currentRep - 1) % repetitions) + 1);
      await audioEngine.playTaan(selectedPalta.notes, tempo, groupSize, (index) => {
        setCurrentNoteIndex(index);
      });
      if (loop && audioEngine.getIsPlaying()) {
        runLoop(currentRep + 1);
      } else if (audioEngine.getIsPlaying()) {
        handleStop();
      }
    };
    runLoop(1);
  };

  const handleStop = () => {
    isAutoSwitching.current = false;
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentNoteIndex(-1);
    setCurrentRepetition(0);
    setIntroBeat(0);
    setPlaybackMode(null);
  };

  const handleRestartPractice = () => {
    handleStop();
    if (visiblePaltas.length > 0) {
      setCurrentPaltaId(visiblePaltas[0].id);
      setTimeout(() => {
        handlePlaySequential(true);
      }, 50);
    }
  };

  const handleSaNoteChange = (note: NoteName) => {
    setSaNote(note);
    paltaGenerator.setSaNote(note);
  };

  const handleManualSelectPalta = (id: number) => {
    isAutoSwitching.current = false;
    setCurrentPaltaId(id);
  };

  return (
    <div className="app-container" style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: 'var(--spacing-app)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>
      <style>{`
        :root {
          --sidebar-width: 380px;
          --spacing-app: 24px;
        }
        @media (max-width: 1024px) {
          :root {
            --sidebar-width: 100%;
            --spacing-app: 16px;
          }
          .main-layout {
            flex-direction: column !important;
          }
          .sidebar {
            position: relative !important;
            top: 0 !important;
            width: 100% !important;
          }
          .palta-list-desktop {
            display: none !important;
          }
          .palta-list-mobile {
            display: block !important;
          }
        }
        @media (min-width: 1025px) {
          .palta-list-mobile {
            display: none !important;
          }
        }
        .app-container {
          overflow-x: hidden;
        }
        button {
          touch-action: manipulation;
        }
      `}</style>

      {isPracticeMode && visiblePaltas.find(p => p.id === currentPaltaId) && (
        <PracticeMode
          palta={visiblePaltas.find(p => p.id === currentPaltaId)!}
          currentNoteIndex={currentNoteIndex}
          notation={notation}
          tempo={tempo}
          isPlaying={isPlaying}
          introBeat={introBeat}
          currentIndex={currentIndex}
          totalCount={visiblePaltas.length}
          currentRepetition={currentRepetition}
          totalRepetitions={repetitions}
          thaatName={selectedThaat.name}
          saNote={saNote}
          timeRemaining={timeRemaining}
          onRestart={handleRestartPractice}
          onTogglePlay={isPlaying ? handleStop : () => handlePlaySequential(true)}
          onExit={() => {
            handleStop();
            setIsPracticeMode(false);
          }}
        />
      )}

      <header style={{
        marginBottom: '24px',
        padding: '12px 24px',
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: '1px solid #e2e8f0'
      }}>
        <h1 style={{ color: '#1e293b', margin: 0, fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.2em' }}>🎵</span> Raag Palta Trainer
        </h1>
      </header>

      <div className="main-layout" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <aside className="sidebar" style={{ 
          width: 'var(--sidebar-width)', 
          position: 'sticky', 
          top: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* PRIMARY CALL TO ACTION */}
          <button
            onClick={() => {
              handleStop();
              setIsPracticeMode(true);
              handlePlaySequential(true);
            }}
            style={{
              width: '100%',
              padding: '24px',
              backgroundColor: '#f59e0b',
              color: '#fff',
              border: 'none',
              borderRadius: '16px',
              fontSize: '24px',
              cursor: 'pointer',
              fontWeight: '900',
              boxShadow: '0 10px 25px rgba(245, 158, 11, 0.4)',
              letterSpacing: '2px',
              transition: 'transform 0.1s'
            }}
          >
            PRACTICE
          </button>

          {/* Folder Selector */}
          <div style={{ 
            padding: '20px',
            backgroundColor: '#fff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
              Practice Set
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '12px',
                fontSize: '15px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                width: '100%',
                backgroundColor: '#f8fafc',
                fontWeight: '700',
                color: '#2563eb',
                cursor: 'pointer'
              }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat} Patterns</option>
              ))}
            </select>
          </div>

          <RaagSelector
            raags={thaats}
            selectedRaag={selectedThaat}
            onSelect={setSelectedThaat}
            notation={notation}
          />

          <Controls
            tempo={tempo}
            onTempoChange={setTempo}
            saNote={saNote}
            onSaNoteChange={handleSaNoteChange}
            repetitions={repetitions}
            onRepetitionsChange={setRepetitions}
            loop={loop}
            onLoopChange={setLoop}
            notation={notation}
            onNotationChange={setNotation}
            soundType={soundType}
            onSoundTypeChange={setSoundType}
            isTanpuraPlaying={isTanpuraPlaying}
            onTanpuraToggle={() => setIsTanpuraPlaying(!isTanpuraPlaying)}
            tanpuraVolume={tanpuraVolume}
            onTanpuraVolumeChange={setTanpuraVolume}
            customPattern={customPattern}
            onCustomPatternChange={setCustomPattern}
            onAddCustomPalta={handleAddCustomPalta}
            isPlaying={isPlaying}
          />

          {/* Mobile toggle for Palta List */}
          <div className="palta-list-mobile">
            <button
              onClick={() => setShowPaltaList(!showPaltaList)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#fff',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '14px'
              }}
            >
              {showPaltaList ? 'Hide Pattern List' : 'Show Pattern List'}
            </button>
            {showPaltaList && (
              <div style={{ marginTop: '16px' }}>
                <PaltaDisplay
                  paltas={visiblePaltas}
                  currentPaltaId={currentPaltaId}
                  currentNoteIndex={currentNoteIndex}
                  onSelectPalta={handleManualSelectPalta}
                  notation={notation}
                />
              </div>
            )}
          </div>
        </aside>

        <main className="palta-list-desktop" style={{ flex: 1, width: '100%' }}>
          {visiblePaltas.length > 0 && (
            <PaltaDisplay
              paltas={visiblePaltas}
              currentPaltaId={currentPaltaId}
              currentNoteIndex={currentNoteIndex}
              onSelectPalta={handleManualSelectPalta}
              notation={notation}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
