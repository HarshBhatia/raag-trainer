import { useState, useEffect, useRef, useMemo } from 'react';
import { Raag, NoteName, Palta, Notation, SoundType } from './types';
import { PaltaGenerator, thaats, noteFrequencies } from './utils/taanGenerator';
import { AudioEngine } from './utils/audioEngine';
import { RaagSelector } from './components/RaagSelector';
import { PaltaDisplay } from './components/PaltaDisplay';
import { Controls } from './components/Controls';
import { PracticeMode } from './components/PracticeMode';
import { Onboarding } from './components/Onboarding';
import { PracticeStats } from './components/PracticeStats';
import { StartPractice } from './components/StartPractice';
import { UserPrefs } from './types';

const paltaGenerator = new PaltaGenerator('C#');
const audioEngine = new AudioEngine();

const STORAGE_KEY = 'raag_trainer_prefs';

function App() {
  const savedPrefs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

  const [onboarding, setOnboarding] = useState<UserPrefs | null>(savedPrefs.onboarding || null);
  const [selectedThaat, setSelectedThaat] = useState<Raag>(() => {
    const saved = thaats.find(r => r.name === savedPrefs.selectedRaagName);
    return saved || thaats[0];
  });
  const [tempo, setTempo] = useState(savedPrefs.tempo || (savedPrefs.onboarding?.experience === 'beginner' ? 80 : savedPrefs.onboarding?.experience === 'intermediate' ? 120 : 160));
  const [saNote, setSaNote] = useState<NoteName>(savedPrefs.saNote || (savedPrefs.onboarding?.gender === 'male' ? 'C#' : 'G#'));
  const [repetitions, setRepetitions] = useState(savedPrefs.repetitions || 2);
  const [loop] = useState(savedPrefs.loop !== undefined ? savedPrefs.loop : false);
  const [notation, setNotation] = useState<Notation>(savedPrefs.notation || 'hindi');
  const [soundType, setSoundType] = useState<SoundType>(savedPrefs.soundType || 'piano');
  const [isTanpuraPlaying, setIsTanpuraPlaying] = useState(savedPrefs.isTanpuraPlaying || false);
  const [tanpuraVolume, setTanpuraVolume] = useState(savedPrefs.tanpuraVolume !== undefined ? savedPrefs.tanpuraVolume : 0.4);
  const [selectedCategory, setSelectedCategory] = useState<string>(savedPrefs.selectedCategory || '1. Basic Alankars');
  const [enableGlide, setEnableGlide] = useState(savedPrefs.enableGlide || false);
  const [customPaltas, setCustomPaltas] = useState<Palta[]>(savedPrefs.customPaltas || []);
  const [currentPaltaId, setCurrentPaltaId] = useState(savedPrefs.currentPaltaId || 1);
  
  const [customPattern, setCustomPattern] = useState('');
  const [paltas, setPaltas] = useState<Palta[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(-1);
  const [currentRepetition, setCurrentRepetition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackId, setPlaybackId] = useState(0);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showStartPrompt, setShowStartPrompt] = useState(false);
  const [introBeat, setIntroBeat] = useState(0);
  const [showPaltaList, setShowPaltaList] = useState(false);
  
  const [playbackMode, setPlaybackMode] = useState<'loop' | 'sequential' | null>(null);
  const isAutoSwitching = useRef(false);
  const skipRequested = useRef(false);
  const isStartingNextSet = useRef(false);
  const currentPlaybackIdRef = useRef(0);

  // Stats tracking
  const sessionStartTime = useRef<number | null>(null);
  const totalNotesPlayed = useRef(0);
  const completedPaltasCount = useRef(0);
  const [finalStats, setFinalStats] = useState({ duration: 0, paltas: 0, notes: 0 });

  // Real-time timer state
  const [dynamicTimeRemaining, setDynamicTimeRemaining] = useState(0);

  useEffect(() => {
    const prefs = {
      onboarding,
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
      enableGlide,
      customPaltas,
      currentPaltaId
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [onboarding, selectedThaat, tempo, saNote, repetitions, loop, notation, soundType, isTanpuraPlaying, tanpuraVolume, selectedCategory, enableGlide, customPaltas, currentPaltaId]);

  const visiblePaltas = useMemo(() => {
    let base = paltas;
    if (selectedCategory !== 'All') {
      base = paltas.filter(p => p.category === selectedCategory);
    }
    // Strict linear order as requested (paltas are already in order from generator)
    return base;
  }, [paltas, selectedCategory]);

  const currentIndex = useMemo(() => {
    const idx = visiblePaltas.findIndex(p => p.id === currentPaltaId);
    return idx === -1 ? 1 : idx + 1;
  }, [visiblePaltas, currentPaltaId]);

  // Update dynamic timer when playing
  useEffect(() => {
    let timer: number;
    if (isPlaying && playbackMode === 'sequential') {
      const updateTimer = () => {
        const startIdx = visiblePaltas.findIndex(p => p.id === currentPaltaId);
        if (startIdx === -1) return;
        
        let totalSeconds = 0;
        const noteDuration = 60 / (tempo * 2);
        const introDuration = 4 * (60 / tempo);
        
        // Time for subsequent paltas
        for (let i = startIdx + 1; i < visiblePaltas.length; i++) {
          const palta = visiblePaltas[i];
          totalSeconds += introDuration;
          totalSeconds += palta.notes.length * repetitions * noteDuration;
        }

        // Current palta
        const currentPalta = visiblePaltas[startIdx];
        if (introBeat > 0) {
          totalSeconds += (4 - introBeat + 1) * (60 / tempo);
          totalSeconds += repetitions * currentPalta.notes.length * noteDuration;
        } else {
          const remainingReps = Math.max(0, repetitions - currentRepetition);
          const notesLeftInRep = Math.max(0, currentPalta.notes.length - (currentNoteIndex + 1));
          totalSeconds += notesLeftInRep * noteDuration;
          totalSeconds += remainingReps * currentPalta.notes.length * noteDuration;
        }
        
        setDynamicTimeRemaining(Math.max(0, Math.ceil(totalSeconds)));
      };

      updateTimer();
      timer = window.setInterval(updateTimer, 200);
    } else {
      setDynamicTimeRemaining(0);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackMode, visiblePaltas, currentPaltaId, currentNoteIndex, currentRepetition, repetitions, tempo, introBeat]);

  const categories = useMemo(() => {
    const cats = new Set(paltas.map(p => p.category || 'Other'));
    const sortedCats = Array.from(cats).sort();
    return [...sortedCats, 'All'];
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

    if (isStartingNextSet.current) {
      isStartingNextSet.current = false;
      setTimeout(() => {
        handlePlaySequential(true);
      }, 150);
    }
  }, [selectedThaat, saNote, customPaltas.length, selectedCategory]);

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
    setIsPlaying(true);
    
    if (!sessionStartTime.current) {
      sessionStartTime.current = Date.now();
      totalNotesPlayed.current = 0;
      completedPaltasCount.current = 0;
    }

    audioEngine.start();
    const playbackId = ++currentPlaybackIdRef.current;

    let startIndex = startFromCurrent ? visiblePaltas.findIndex(p => p.id === currentPaltaId) : 0;
    if (startIndex === -1) startIndex = 0;

    for (let paltaIndex = startIndex; paltaIndex < visiblePaltas.length; paltaIndex++) {
      if (playbackId !== currentPlaybackIdRef.current) break;
      const palta = visiblePaltas[paltaIndex];
      
      // RESET SKIP FLAG AT START OF EACH NEW PALTA
      skipRequested.current = false;
      
      setCurrentPaltaId(palta.id);
      setCurrentRepetition(0);
      setCurrentNoteIndex(-1);
      
      const groupSize = getGroupSize(palta.pattern);
      
      await audioEngine.playIntro(tempo, (beat) => {
        if (playbackId === currentPlaybackIdRef.current && !skipRequested.current) {
          setIntroBeat(beat);
        }
      });

      if (playbackId !== currentPlaybackIdRef.current) break;
      
      // If skip was pressed during intro, skipRequested is now true, loop will continue
      if (skipRequested.current) {
        continue;
      }
      
      for (let rep = 0; rep < repetitions; rep++) {
        if (playbackId !== currentPlaybackIdRef.current || skipRequested.current) break;
        setCurrentRepetition(rep + 1);
        await audioEngine.playTaan(palta.notes, tempo, groupSize, (index) => {
          if (playbackId === currentPlaybackIdRef.current && !skipRequested.current) {
            setCurrentNoteIndex(index);
            if (index !== -1) totalNotesPlayed.current += 1;
          }
        }, enableGlide);
      }
      
      if (playbackId !== currentPlaybackIdRef.current) break;

      if (skipRequested.current) {
        continue;
      }

      completedPaltasCount.current += 1;
    }
    
    // Check if we finished naturally
    if (playbackId === currentPlaybackIdRef.current) {
      if (loop) {
        handlePlaySequential(false);
      } else {
        const duration = (Date.now() - (sessionStartTime.current || Date.now())) / 1000;
        setFinalStats({
          duration,
          paltas: completedPaltasCount.current,
          notes: totalNotesPlayed.current
        });
        handleStop();
        setIsPracticeMode(false);
        setShowStats(true);
        sessionStartTime.current = null;
      }
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
      if (!audioEngine.getIsPlaying() || currentPlaybackIdRef.current !== currentId) return;
      setCurrentRepetition(((currentRep - 1) % repetitions) + 1);
      await audioEngine.playTaan(selectedPalta.notes, tempo, groupSize, (index) => {
        if (currentPlaybackIdRef.current === currentId) {
          setCurrentNoteIndex(index);
        }
      }, enableGlide);
      if (audioEngine.getIsPlaying() && currentPlaybackIdRef.current === currentId) {
        runLoop(currentRep + 1);
      }
    };
    runLoop(1);
  };

  const handleStop = () => {
    currentPlaybackIdRef.current++;
    skipRequested.current = false;
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
    const wasPlaying = isPlaying;
    const currentMode = playbackMode;
    
    if (wasPlaying) {
      handleStop();
    }
    
    setCurrentPaltaId(id);
    
    if (wasPlaying) {
      setTimeout(() => {
        if (currentMode === 'sequential') {
          handlePlaySequential(true);
        } else {
          handlePlayLoop();
        }
      }, 50);
    }
  };

  const handleSkip = () => {
    if (playbackMode === 'sequential') {
      skipRequested.current = true;
      audioEngine.stop(); // Breaks current playTaan/playIntro
      audioEngine.start(); // Restart engine state so loop condition remains true
    } else {
      handleStop();
    }
  };

  const getNextSetName = () => {
    const currentIdx = categories.indexOf(selectedCategory);
    if (currentIdx !== -1 && currentIdx < categories.length - 1) {
      return categories[currentIdx + 1];
    }
    return null;
  };

  const handleStartNextSet = () => {
    const nextSet = getNextSetName();
    if (nextSet) {
      isStartingNextSet.current = true;
      setSelectedCategory(nextSet);
      setShowStats(false);
      setIsPracticeMode(true);
      
      // The palta state update effect will now trigger handlePlaySequential
    }
  };

  const handleOnboardingComplete = (prefs: UserPrefs) => {
    setOnboarding(prefs);
    setSaNote(prefs.gender === 'male' ? 'C#' : 'G#');
    setTempo(prefs.experience === 'beginner' ? 80 : prefs.experience === 'intermediate' ? 120 : 160);
  };

  if (!onboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="app-container" style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: 'var(--spacing-app)',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>
      <style>{`
        :root {
          --sidebar-width: 420px;
          --spacing-app: 32px;
          --brand-primary: #6366f1;
          --brand-secondary: #f59e0b;
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
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }
        button {
          touch-action: manipulation;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        button:active {
          transform: scale(0.98);
        }
        .card {
          background: #fff;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          padding: 24px;
        }
        .hero-button {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #fff;
          border: none;
          border-radius: 24px;
          padding: 32px;
          font-size: 32px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 20px 40px -10px rgba(16, 185, 129, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          width: 100%;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .hero-button:hover {
          transform: translateY(-4px);
          box-shadow: 0 25px 50px -12px rgba(16, 185, 129, 0.6);
        }
      `}</style>

      {showStats && (
        <PracticeStats
          durationSeconds={finalStats.duration}
          paltasCount={finalStats.paltas}
          notesCount={finalStats.notes}
          nextSetName={getNextSetName()}
          onStartNextSet={handleStartNextSet}
          onRestartSet={() => {
            setShowStats(false);
            if (visiblePaltas.length > 0) {
              setCurrentPaltaId(visiblePaltas[0].id);
            }
            setIsPracticeMode(true);
            setTimeout(() => {
              handlePlaySequential(true);
            }, 100);
          }}
          onExit={() => setShowStats(false)}
        />
      )}

      {showStartPrompt && (
        <StartPractice
          onStart={() => {
            setShowStartPrompt(false);
            setIsPracticeMode(true);
            handlePlaySequential(true);
          }}
          onExit={() => setShowStartPrompt(false)}
        />
      )}

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
          category={selectedCategory}
          timeRemaining={dynamicTimeRemaining}
          onRestart={handleRestartPractice}
          onSkip={handleSkip}
          onTogglePlay={isPlaying ? handleStop : () => handlePlaySequential(true)}
          onExit={() => {
            handleStop();
            setIsPracticeMode(false);
            sessionStartTime.current = null;
          }}
        />
      )}

      <div className="main-layout" style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        <aside className="sidebar" style={{ 
          width: 'var(--sidebar-width)', 
          position: 'sticky', 
          top: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <button
            className="hero-button"
            onClick={() => {
              handleStop();
              // Resuming only works for 'All' set
              if (selectedCategory !== 'All' && visiblePaltas.length > 0) {
                setCurrentPaltaId(visiblePaltas[0].id);
              }
              setShowStartPrompt(true);
            }}
          >
            <span>▶</span> PRACTICE
          </button>

          <div className="card">
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '800', color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Select Practice Set
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '16px',
                fontSize: '16px',
                borderRadius: '16px',
                border: '2px solid #f1f5f9',
                width: '100%',
                backgroundColor: '#f8fafc',
                fontWeight: '700',
                color: '#1e293b',
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'org.w3.19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
                backgroundSize: '20px'
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
            notation={notation}
            onNotationChange={setNotation}
            soundType={soundType}
            onSoundTypeChange={setSoundType}
            isTanpuraPlaying={isTanpuraPlaying}
            onTanpuraToggle={() => setIsTanpuraPlaying(!isTanpuraPlaying)}
            tanpuraVolume={tanpuraVolume}
            onTanpuraVolumeChange={setTanpuraVolume}
            enableGlide={enableGlide}
            onEnableGlideChange={setEnableGlide}
            onResetToDefaults={() => {
              localStorage.removeItem(STORAGE_KEY);
              window.location.reload();
            }}
            customPattern={customPattern}
            onCustomPatternChange={setCustomPattern}
            onAddCustomPalta={handleAddCustomPalta}
          />

          <div className="palta-list-mobile">
            <button
              onClick={() => setShowPaltaList(!showPaltaList)}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#fff',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                fontWeight: '700',
                fontSize: '14px'
              }}
            >
              {showPaltaList ? 'Hide Patterns' : 'Show Patterns'}
            </button>
            {showPaltaList && (
              <div style={{ marginTop: '24px' }}>
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
