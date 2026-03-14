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
import tanpuraIcon from './assets/tanpura.svg';

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
  const [tanpuraVolume, setTanpuraVolume] = useState(savedPrefs.tanpuraVolume !== undefined ? savedPrefs.tanpuraVolume : 0.25);
  const [tanpuraMode, setTanpuraMode] = useState<'Pa' | 'Ma'>(savedPrefs.tanpuraMode || 'Pa');
  const [selectedCategory, setSelectedCategory] = useState<string>(savedPrefs.selectedCategory || '1. Basic Alankars');
  const [enableGlide, setEnableGlide] = useState(savedPrefs.enableGlide || false);
  const [customPaltas, setCustomPaltas] = useState<Palta[]>(savedPrefs.customPaltas || []);
  const [currentPaltaId, setCurrentPaltaId] = useState(savedPrefs.currentPaltaId || 1);
  
  const [customPattern, setCustomPattern] = useState('');
  const [paltas, setPaltas] = useState<Palta[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(-1);
  const [currentRepetition, setCurrentRepetition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showStartPrompt, setShowStartPrompt] = useState(false);
  const [introBeat, setIntroBeat] = useState(0);
  const [showPaltaList, setShowPaltaList] = useState(false);
  const [currentTab, setCurrentTab] = useState<'practice' | 'tanpura'>('practice');
  
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
      tanpuraMode,
      selectedCategory,
      enableGlide,
      customPaltas,
      currentPaltaId
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [onboarding, selectedThaat, tempo, saNote, repetitions, loop, notation, soundType, isTanpuraPlaying, tanpuraVolume, tanpuraMode, selectedCategory, enableGlide, customPaltas, currentPaltaId]);

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
      audioEngine.startTanpura(saNote, tanpuraMode);
    } else {
      audioEngine.stopTanpura();
    }
  }, [isTanpuraPlaying, saNote, tanpuraMode, selectedThaat]);

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

    audioEngine.initialize();
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
    const currentId = ++currentPlaybackIdRef.current;
    setIsPlaying(true);
    audioEngine.initialize();
    audioEngine.start();
    const groupSize = getGroupSize(selectedPalta.pattern);
    await audioEngine.playIntro(tempo, setIntroBeat);
    if (!audioEngine.getIsPlaying() || currentPlaybackIdRef.current !== currentId) return;
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
      margin: '0',
      padding: 'var(--spacing-app)',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <style>{`
        :root {
          --spacing-app: 24px;
          --brand-primary: #6366f1;
          --brand-secondary: #f59e0b;
          --font-xs: 11px;
          --font-sm: 13px;
          --font-base: 15px;
          --font-lg: 18px;
          --font-xl: 22px;
        }
        @media (max-width: 1024px) {
          :root {
            --spacing-app: 16px;
          }
          .main-layout {
            flex-direction: column !important;
            align-items: stretch !important;
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
          .sidebar {
            width: 30% !important;
            flex-shrink: 0;
          }
          .palta-list-desktop {
            width: 70% !important;
            flex-shrink: 0;
          }
        }
        .app-container {
          overflow-x: hidden;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }
        .main-layout {
          max-width: 1400px;
          width: 100%;
          display: flex;
          gap: 24px;
          align-items: flex-start;
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
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          padding: 24px;
        }
        .hero-button {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #fff;
          border: none;
          border-radius: 16px;
          padding: 24px;
          font-size: 22px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .hero-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
        }
        .floating-tab-bar {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 6px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(226, 232, 240, 0.8);
          display: flex;
          gap: 6px;
        }
        @media (max-width: 768px) {
          .floating-tab-bar {
            bottom: 0;
            left: 0;
            right: 0;
            transform: none;
            border-radius: 0;
            border-left: none;
            border-right: none;
            border-bottom: none;
            padding: 4px 8px calc(4px + env(safe-area-inset-bottom));
            background: rgba(249, 250, 251, 0.98);
            backdrop-filter: blur(20px);
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
            justify-content: space-around;
          }
          .floating-tab-bar button {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            padding: 6px 16px !important;
            font-size: 10px !important;
            background: transparent !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .floating-tab-bar button[data-active="true"] {
            color: #6366f1 !important;
          }
          .floating-tab-bar button[data-active="false"] {
            color: #94a3b8 !important;
          }
          .tab-icon {
            font-size: 20px;
            display: block;
          }
          .tab-label {
            display: block;
            font-size: 10px;
            font-weight: 600;
          }
        }
        @media (min-width: 769px) {
          .floating-tab-bar button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .tab-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-right: 6px;
          }
          .tab-icon svg {
            display: block;
          }
          .tab-label {
            display: inline;
          }
        }
      `}</style>

      {/* Tab Navigation - Floating at Bottom */}
      {!isPracticeMode && !showStats && (
        <div className="floating-tab-bar">
          <button
            data-active={currentTab === 'practice'}
            onClick={() => {
              setCurrentTab('practice');
              setIsTanpuraPlaying(false);
            }}
            style={{
              padding: '12px 24px', borderRadius: '12px', border: 'none',
              backgroundColor: currentTab === 'practice' ? '#6366f1' : 'transparent',
              color: currentTab === 'practice' ? '#fff' : '#64748b',
              fontWeight: '800', cursor: 'pointer', fontSize: 'var(--font-xs)', textTransform: 'uppercase',
              letterSpacing: '0.5px',
              transition: 'all 0.2s',
              boxShadow: currentTab === 'practice' ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none'
            }}
          >
            <span className="tab-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </span>
            <span className="tab-label">Practice</span>
          </button>
          <button
            data-active={currentTab === 'tanpura'}
            onClick={() => {
              setCurrentTab('tanpura');
              setIsTanpuraPlaying(false);
            }}
            style={{
              padding: '12px 24px', borderRadius: '12px', border: 'none',
              backgroundColor: currentTab === 'tanpura' ? '#6366f1' : 'transparent',
              color: currentTab === 'tanpura' ? '#fff' : '#64748b',
              fontWeight: '800', cursor: 'pointer', fontSize: 'var(--font-xs)', textTransform: 'uppercase',
              letterSpacing: '0.5px',
              transition: 'all 0.2s',
              boxShadow: currentTab === 'tanpura' ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none'
            }}
          >
            <span className="tab-icon">
              <svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor">
                <path d="M432.914 51.634C435.987 53.593 438.008 55.593 440.015 57.618C441.122 58.72 441.122 58.72 442.251 59.844C443.801 61.392 445.347 62.944 446.89 64.499C449.246 66.871 451.618 69.227 453.992 71.582C455.501 73.093 457.009 74.605 458.516 76.118C459.222 76.818 459.929 77.518 460.657 78.239C466.245 83.908 469.514 89.131 470.313 97.125C469.508 107.109 464.527 113.335 457.516 120.071C456.701 120.878 455.885 121.685 455.045 122.516C452.461 125.067 449.856 127.596 447.251 130.125C445.485 131.861 443.721 133.598 441.958 135.336C437.655 139.574 433.335 143.794 429.001 148.001C430.658 151.549 432.567 153.689 435.438 156.376C440.44 161.321 443.088 164.847 443.376 172.001C443.158 178.064 441.56 181.477 437.189 185.751C431.785 189.565 427.61 190.498 421.153 189.52C413.574 187.691 408.213 180.399 403.001 175.001C398.361 178.883 393.948 182.907 389.675 187.187C389.079 187.78 388.483 188.373 387.869 188.984C385.891 190.953 383.917 192.925 381.943 194.897C380.519 196.317 379.094 197.737 377.669 199.156C373.813 202.999 369.961 206.845 366.11 210.691C363.703 213.095 361.295 215.499 358.887 217.903C351.349 225.427 343.814 232.953 336.281 240.482C327.591 249.167 318.894 257.847 310.192 266.52C303.459 273.231 296.731 279.949 290.008 286.671C285.995 290.683 281.979 294.693 277.957 298.696C274.178 302.459 270.406 306.229 266.64 310.004C265.257 311.387 263.872 312.769 262.484 314.147C260.589 316.029 258.703 317.921 256.819 319.815C256.269 320.358 255.718 320.901 255.151 321.46C250.728 325.94 247.805 330.408 247.251 336.751C247.174 337.509 247.096 338.267 247.017 339.048C247.003 341.659 247.191 344.097 247.47 346.689C250.71 376.944 246.243 413.923 227.564 439.001C226.401 440.356 225.213 441.69 224.001 443.001C223.371 443.722 222.741 444.442 222.091 445.185C211.856 456.223 199.113 463.213 185.001 468.001C184.29 468.255 183.578 468.509 182.845 468.771C162.636 474.931 139.561 469.314 121.376 459.814C106.314 451.635 94.0796 441.08 82.0014 429.001C80.9939 428.063 80.9939 428.063 79.9664 427.107C59.0599 407.328 44.5374 379.613 43.6889 350.626C44.1307 327.737 54.8204 306.839 71.0014 291.001C95.8557 268.94 133.418 265.825 165.001 267.001C168.139 267.248 171.267 267.529 174.398 267.856C180.868 268.217 185.936 265.91 191.001 262.001C193.564 259.707 195.983 257.281 198.405 254.839C199.129 254.117 199.853 253.395 200.598 252.651C203.016 250.236 205.427 247.828 207.839 245.421C209.573 243.686 211.308 241.95 213.043 240.213C216.775 236.482 220.504 232.753 224.23 229.016C229.617 223.612 235.01 218.214 240.405 212.816C249.157 204.059 257.904 195.298 266.649 186.535C275.142 178.023 283.638 169.514 292.135 161.007C292.922 160.22 292.922 160.22 293.724 159.417C296.353 156.785 298.983 154.153 301.612 151.521C323.415 129.697 345.21 107.867 367.001 86.001C366.04 84.878 365.079 83.756 364.118 82.633C363.582 82.008 363.047 81.383 362.496 80.739C361.386 79.449 360.265 78.168 359.138 76.892C358.66 76.351 358.182 75.81 357.689 75.251C357.198 74.7 356.707 74.148 356.201 73.579C352.87 69.196 353.391 63.202 354.001 58.001C355.696 53.22 358.357 50.024 362.751 47.501C367.076 45.665 371.375 45.119 376.001 46.001C380.758 47.949 383.832 50.5 387.376 54.189C388.25 55.09 389.124 55.991 390.025 56.919C390.677 57.606 391.329 58.293 392.001 59.001C395.1 57.638 397.037 56.115 399.314 53.626C409.345 43.316 422.756 42.111 432.914 51.634z"/>
                <path d="M349.704 152.196C348.666 153.241 347.63 154.288 346.597 155.338C346.027 155.912 345.458 156.486 344.871 157.078C342.947 159.019 341.026 160.964 339.106 162.909C337.733 164.295 336.36 165.681 334.986 167.067C332.019 170.062 329.052 173.058 326.086 176.054C321.386 180.8 316.68 185.539 311.971 190.276C311.177 191.075 310.382 191.874 309.564 192.698C307.115 195.161 304.666 197.624 302.217 200.087C292.074 210.29 281.936 220.498 271.821 230.729C264.452 238.183 257.068 245.622 249.668 253.046C245.754 256.973 241.848 260.906 237.959 264.858C234.29 268.585 230.603 272.293 226.901 275.988C225.554 277.338 224.214 278.695 222.882 280.06C209.409 293.848 194.436 302.85 174.563 303.126C171.603 303.138 168.736 302.862 165.801 302.509C143.357 299.94 115.597 302.254 96.2389 315.06C86.7346 323.303 79.7748 334.865 78.0014 347.376C77.1232 367.178 88.7592 384.748 101.314 399.001C102.867 400.676 104.43 402.343 106.001 404.001C106.834 404.898 107.667 405.795 108.525 406.72C121.491 420.257 140.581 434.962 160.102 435.382C174.545 435.343 184.342 431.99 195.071 422.091C209.573 406.804 212.609 380.485 212.173 360.251C211.982 356.65 211.637 353.091 211.235 349.509C209.742 333.533 212.284 317.979 222.279 305.056C223.141 304.025 224.01 302.999 224.884 301.98C225.363 301.419 225.841 300.858 226.334 300.28C232.036 293.685 238.186 287.55 244.367 281.408C245.669 280.106 246.971 278.803 248.273 277.501C251.768 273.996 255.269 270.497 258.771 267C262.445 263.338 266.113 259.681 269.781 256.024C276.711 249.1 283.647 242.181 290.583 235.265C298.488 227.382 306.387 219.494 314.286 211.605C330.518 195.394 346.757 179.19 363.001 163.001C361.403 159.616 359.622 157.382 356.938 154.751C356.225 154.045 355.512 153.339 354.778 152.611C352.107 150.192 352.454 150.567 349.704 152.196z"/>
                <path d="M139.188 339.625C140.089 339.576 140.99 339.527 141.918 339.477C150.172 340.878 156.093 347.599 161.75 353.313C162.492 354.034 163.233 354.755 163.997 355.498C169.017 360.523 173.107 365.425 174.497 372.539C174.337 378.246 173.527 382.401 169.384 386.664C164.396 391.181 160.873 392.312 154.024 392.223C149.43 391.717 145.406 389.012 142.001 386C142.001 385.34 142.001 384.68 142.001 384C140.516 383.505 140.516 383.505 139.001 383C139.001 382.34 139.001 381.68 139.001 381C137.516 380.505 137.516 380.505 136.001 380C136.001 379.34 136.001 378.68 136.001 378C135.341 378 134.681 378 134.001 378C134.001 377.34 134.001 376.68 134.001 376C133.011 375.67 132.021 375.34 131.001 375C131.001 374.34 131.001 373.68 131.001 373C130.011 372.67 129.021 372.34 128.001 372C123.891 367.7 121.582 363.354 121.376 357.375C121.765 350.906 123.761 347.076 128.563 342.625C132.105 340.264 135.013 339.778 139.188 339.625z"/>
                <path d="M416 86C419.633 87.696 421.945 89.738 424.75 92.625C425.549 93.442 426.348 94.26 427.172 95.102C427.775 95.728 428.378 96.355 429 97C424.63 102.229 420.031 107.103 415.195 111.902C414.471 112.625 413.747 113.348 413.002 114.092C410.712 116.376 408.418 118.657 406.125 120.938C404.562 122.495 403 124.053 401.438 125.611C397.628 129.41 393.815 133.206 390 137C386.367 135.304 384.055 133.262 381.25 130.375C380.451 129.558 379.652 128.74 378.828 127.898C378.225 127.272 377.622 126.645 377 126C381.37 120.771 385.969 115.897 390.805 111.098C391.529 110.375 392.253 109.653 392.998 108.908C395.288 106.624 397.582 104.343 399.875 102.063C401.438 100.505 403 98.947 404.563 97.389C408.372 93.59 412.185 89.794 416 86z"/>
              </svg>
            </span>
            <span className="tab-label">Tanpura</span>
          </button>
        </div>
      )}

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
          onTempoChange={setTempo}
          isTanpuraPlaying={isTanpuraPlaying}
          onTanpuraToggle={() => setIsTanpuraPlaying(!isTanpuraPlaying)}
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

      {currentTab === 'practice' ? (
        <div className="main-layout" style={{ paddingBottom: '100px' }}>
          <aside className="sidebar" style={{ 
            position: 'sticky', 
            top: 'var(--spacing-app)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <button
              className="hero-button"
              onClick={() => {
                handleStop();
                setShowStartPrompt(true);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                <path d="M8 5v14l11-7z"/>
              </svg>
              PRACTICE
            </button>

            <div className="card" style={{ padding: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '800', color: '#475569', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Select Practice Set
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '12px',
                  fontSize: 'var(--font-sm)',
                  borderRadius: '12px',
                  border: '2px solid #f1f5f9',
                  width: '100%',
                  backgroundColor: '#f8fafc',
                  fontWeight: '700',
                  color: '#1e293b',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px'
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
              tanpuraMode={tanpuraMode}
              onTanpuraModeChange={setTanpuraMode}
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
                  fontSize: 'var(--font-sm)'
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

          <main className="palta-list-desktop">
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
      ) : (
        /* Dedicated Tanpura Tab */
        <div className="tanpura-container" style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          paddingBottom: '120px',
          overflow: 'hidden',
          background: '#fff'
        }}>
          <style>{`
            @media (max-width: 768px) {
              .tanpura-card {
                border: none !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                padding: 24px 16px !important;
              }
              .tanpura-container {
                background: #fff !important;
              }
            }
          `}</style>
          <div className="card tanpura-card" style={{ textAlign: 'center', padding: '40px', maxWidth: '600px', width: '100%' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
              <img src={tanpuraIcon} alt="Tanpura" width="64" height="64" style={{ color: '#6366f1' }} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '10px', color: '#0f172a' }}>Tanpura Drone</h2>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>High-quality acoustic drones for your independent practice.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>Select Pitch (Sa)</label>
                <select
                  value={saNote}
                  onChange={(e) => handleSaNoteChange(e.target.value as NoteName)}
                  style={{
                    padding: '16px', fontSize: '18px', borderRadius: '16px', border: '2px solid #f1f5f9',
                    width: '100%', backgroundColor: '#f8fafc', fontWeight: '700', color: '#0f172a'
                  }}
                >
                  {Object.keys(noteFrequencies).map(note => <option key={note} value={note}>{note}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>Tuning Mode</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {(['Pa', 'Ma'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setTanpuraMode(mode)}
                      style={{
                        flex: 1, padding: '16px', borderRadius: '16px', border: 'none',
                        backgroundColor: tanpuraMode === mode ? '#6366f1' : '#f1f5f9',
                        color: tanpuraMode === mode ? '#fff' : '#64748b', fontWeight: '800', cursor: 'pointer'
                      }}
                    >Sa-{mode}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>Volume</label>
                <input
                  type="range" min="0" max="1" step="0.01" value={tanpuraVolume}
                  onChange={(e) => setTanpuraVolume(parseFloat(e.target.value))}
                  onInput={(e) => setTanpuraVolume(parseFloat((e.target as HTMLInputElement).value))}
                  style={{ 
                    width: '100%', 
                    accentColor: '#6366f1', 
                    height: '40px',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    background: 'transparent',
                    cursor: 'pointer'
                  }}
                />
                <style>{`
                  input[type="range"]::-webkit-slider-track {
                    width: 100%;
                    height: 8px;
                    background: #e2e8f0;
                    border-radius: 4px;
                  }
                  input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 24px;
                    height: 24px;
                    background: #6366f1;
                    border-radius: 50%;
                    cursor: pointer;
                    margin-top: -8px;
                  }
                  input[type="range"]::-moz-range-track {
                    width: 100%;
                    height: 8px;
                    background: #e2e8f0;
                    border-radius: 4px;
                  }
                  input[type="range"]::-moz-range-thumb {
                    width: 24px;
                    height: 24px;
                    background: #6366f1;
                    border-radius: 50%;
                    cursor: pointer;
                    border: none;
                  }
                `}</style>
              </div>

              <button
                onClick={() => setIsTanpuraPlaying(!isTanpuraPlaying)}
                style={{
                  width: '100%', padding: '24px', borderRadius: '24px', border: 'none',
                  backgroundColor: isTanpuraPlaying ? '#ef4444' : '#6366f1',
                  color: '#fff', fontSize: '20px', fontWeight: '900', cursor: 'pointer',
                  boxShadow: isTanpuraPlaying ? '0 10px 20px rgba(239, 68, 68, 0.3)' : '0 10px 20px rgba(99, 102, 241, 0.3)',
                  textTransform: 'uppercase', letterSpacing: '2px'
                }}
              >
                {isTanpuraPlaying ? 'STOP TANPURA' : 'START TANPURA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
