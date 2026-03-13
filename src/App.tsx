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
  const [tempo, setTempo] = useState(savedPrefs.tempo || (savedPrefs.onboarding?.experience === 'beginner' ? 120 : savedPrefs.onboarding?.experience === 'intermediate' ? 150 : 180));
  const [saNote, setSaNote] = useState<NoteName>(savedPrefs.saNote || (savedPrefs.onboarding?.gender === 'male' ? 'C#' : 'G#'));
  const [repetitions, setRepetitions] = useState(savedPrefs.repetitions || 2);
  const [loop] = useState(savedPrefs.loop !== undefined ? savedPrefs.loop : false);
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
  const [showStats, setShowStats] = useState(false);
  const [introBeat, setIntroBeat] = useState(0);
  const [showPaltaList, setShowPaltaList] = useState(false);
  
  const [playbackMode, setPlaybackMode] = useState<'loop' | 'sequential' | null>(null);
  const isAutoSwitching = useRef(false);

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
      customPaltas,
      currentPaltaId
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [onboarding, selectedThaat, tempo, saNote, repetitions, loop, notation, soundType, isTanpuraPlaying, tanpuraVolume, selectedCategory, customPaltas, currentPaltaId]);

  const visiblePaltas = useMemo(() => {
    let base = paltas;
    if (selectedCategory !== 'All') {
      base = paltas.filter(p => p.category === selectedCategory);
    }
    // Set order based on experience
    if (onboarding?.experience === 'advanced') {
      return [...base].reverse(); // Complex first
    }
    return base;
  }, [paltas, selectedCategory, onboarding]);

  const currentIndex = useMemo(() => {
    const idx = visiblePaltas.findIndex(p => p.id === currentPaltaId);
    return idx === -1 ? 1 : idx + 1;
  }, [visiblePaltas, currentPaltaId]);

  // Update dynamic timer when playing
  useEffect(() => {
    let timer: number;
    if (isPlaying && playbackMode === 'sequential') {
      timer = window.setInterval(() => {
        const startIdx = visiblePaltas.findIndex(p => p.id === currentPaltaId);
        if (startIdx === -1) return;
        
        let totalSeconds = 0;
        const noteDuration = 60 / (tempo * 2);
        const introDuration = 4 * (60 / tempo);
        
        // Remaining time for current palta
        const currentPalta = visiblePaltas[startIdx];
        const remainingReps = repetitions - (currentRepetition || 1) + 1;
        const notesInCurrentRep = currentPalta.notes.length - (currentNoteIndex + 1);
        
        totalSeconds += notesInCurrentRep * noteDuration;
        totalSeconds += (remainingReps - 1) * currentPalta.notes.length * noteDuration;
        
        // Time for subsequent paltas
        for (let i = startIdx + 1; i < visiblePaltas.length; i++) {
          const palta = visiblePaltas[i];
          totalSeconds += introDuration;
          totalSeconds += palta.notes.length * repetitions * noteDuration;
        }
        setDynamicTimeRemaining(Math.max(0, totalSeconds));
      }, 100);
    } else {
      setDynamicTimeRemaining(0);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackMode, visiblePaltas, currentPaltaId, currentNoteIndex, currentRepetition, repetitions, tempo]);

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
    
    if (!sessionStartTime.current) {
      sessionStartTime.current = Date.now();
      totalNotesPlayed.current = 0;
      completedPaltasCount.current = 0;
    }

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
          totalNotesPlayed.current += 1;
        });
      }
      completedPaltasCount.current += 1;
    }
    
    if (audioEngine.getIsPlaying()) {
      // Finished all paltas naturally
      const duration = (Date.now() - sessionStartTime.current!) / 1000;
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
      if (audioEngine.getIsPlaying()) {
        runLoop(currentRep + 1);
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

  const handleOnboardingComplete = (prefs: UserPrefs) => {
    setOnboarding(prefs);
    setSaNote(prefs.gender === 'male' ? 'C#' : 'G#');
    setTempo(prefs.experience === 'beginner' ? 120 : prefs.experience === 'intermediate' ? 150 : 180);
  };

  if (!onboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

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
          background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
          color: #fff;
          border: none;
          border-radius: 24px;
          padding: 32px;
          font-size: 32px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 20px 40px -10px rgba(245, 158, 11, 0.5);
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
          box-shadow: 0 25px 50px -12px rgba(245, 158, 11, 0.6);
        }
      `}</style>

      {showStats && (
        <PracticeStats
          durationSeconds={finalStats.duration}
          paltasCount={finalStats.paltas}
          notesCount={finalStats.notes}
          onExit={() => setShowStats(false)}
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
          timeRemaining={dynamicTimeRemaining}
          onRestart={handleRestartPractice}
          onTogglePlay={isPlaying ? handleStop : () => handlePlaySequential(true)}
          onExit={() => {
            handleStop();
            setIsPracticeMode(false);
            sessionStartTime.current = null;
          }}
        />
      )}

      <header style={{
        marginBottom: '40px',
        padding: '24px 32px',
        backgroundColor: '#fff',
        borderRadius: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid #e2e8f0'
      }}>
        <h1 style={{ color: '#1e293b', margin: 0, fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ 
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            width: '48px', height: '48px', borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
          }}>🎵</span>
          <span>Raag <span style={{ color: '#6366f1' }}>Trainer</span></span>
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ padding: '6px 14px', backgroundColor: '#f1f5f9', borderRadius: '100px', fontSize: '12px', fontWeight: '700', color: '#64748b', border: '1px solid #e2e8f0' }}>
            {onboarding.gender === 'male' ? '👨 Male' : '👩 Female'}
          </span>
          <span style={{ padding: '6px 14px', backgroundColor: '#f1f5f9', borderRadius: '100px', fontSize: '12px', fontWeight: '700', color: '#64748b', border: '1px solid #e2e8f0' }}>
            ⚡️ {onboarding.experience.toUpperCase()}
          </span>
        </div>
      </header>

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
              setIsPracticeMode(true);
              handlePlaySequential(true);
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
