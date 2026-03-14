import { NoteName, Notation, SoundType } from '../types';
import { noteFrequencies } from '../utils/taanGenerator';
import { useState } from 'react';

interface ControlsProps {
  tempo: number;
  onTempoChange: (tempo: number) => void;
  saNote: NoteName;
  onSaNoteChange: (note: NoteName) => void;
  repetitions: number;
  onRepetitionsChange: (reps: number) => void;
  customPattern: string;
  onCustomPatternChange: (pattern: string) => void;
  onAddCustomPalta: () => void;
  notation: Notation;
  onNotationChange: (notation: Notation) => void;
  soundType: SoundType;
  onSoundTypeChange: (type: SoundType) => void;
  isTanpuraPlaying: boolean;
  onTanpuraToggle: () => void;
  tanpuraVolume: number;
  onTanpuraVolumeChange: (volume: number) => void;
  tanpuraMode: 'Pa' | 'Ma';
  onTanpuraModeChange: (mode: 'Pa' | 'Ma') => void;
  enableGlide: boolean;
  onEnableGlideChange: (val: boolean) => void;
  onResetToDefaults: () => void;
}

export function Controls({
  tempo,
  onTempoChange,
  saNote,
  onSaNoteChange,
  repetitions,
  onRepetitionsChange,
  customPattern,
  onCustomPatternChange,
  onAddCustomPalta,
  notation,
  onNotationChange,
  soundType,
  onSoundTypeChange,
  isTanpuraPlaying,
  onTanpuraToggle,
  tanpuraVolume,
  onTanpuraVolumeChange,
  tanpuraMode,
  onTanpuraModeChange,
  enableGlide,
  onEnableGlideChange,
  onResetToDefaults
}: ControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const noteNames = Object.keys(noteFrequencies) as NoteName[];

  const instrumentNames: Record<SoundType, string> = {
    harmonium: 'Harmonium',
    flute: 'Flute',
    piano: 'Piano',
    synth: 'Synth'
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '20px',
      padding: '24px',
      backgroundColor: '#fff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      {/* Primary Settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#475569', fontSize: 'var(--font-xs)', textTransform: 'uppercase' }}>
            Sa Note
          </label>
          <select
            value={saNote}
            onChange={(e) => onSaNoteChange(e.target.value as NoteName)}
            style={{
              padding: '14px',
              fontSize: 'var(--font-base)',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              width: '100%',
              backgroundColor: '#f8fafc',
              fontWeight: '600',
              color: '#0f172a'
            }}
          >
            {noteNames.map(note => (
              <option key={note} value={note}>{note}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#475569', fontSize: 'var(--font-xs)', textTransform: 'uppercase' }}>
            Tempo
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
            <button
              onClick={() => onTempoChange(Math.max(40, tempo - 10))}
              style={{
                padding: '10px 12px',
                fontSize: 'var(--font-sm)',
                fontWeight: '700',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
                color: '#64748b',
                cursor: 'pointer',
                minWidth: '44px'
              }}
            >
              -10
            </button>
            <button
              onClick={() => onTempoChange(Math.max(40, tempo - 5))}
              style={{
                padding: '10px 12px',
                fontSize: 'var(--font-sm)',
                fontWeight: '700',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
                color: '#64748b',
                cursor: 'pointer',
                minWidth: '44px'
              }}
            >
              -5
            </button>
            <button
              onClick={() => onTempoChange(Math.max(40, tempo - 1))}
              style={{
                padding: '10px 12px',
                fontSize: 'var(--font-sm)',
                fontWeight: '700',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
                color: '#64748b',
                cursor: 'pointer',
                minWidth: '44px'
              }}
            >
              -1
            </button>
            <div style={{
              flex: 1,
              padding: '10px 16px',
              fontSize: 'var(--font-lg)',
              fontWeight: '900',
              borderRadius: '8px',
              backgroundColor: '#6366f1',
              color: '#fff',
              textAlign: 'center',
              minWidth: '80px'
            }}>
              {tempo}
            </div>
            <button
              onClick={() => onTempoChange(Math.min(300, tempo + 1))}
              style={{
                padding: '10px 12px',
                fontSize: 'var(--font-sm)',
                fontWeight: '700',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
                color: '#64748b',
                cursor: 'pointer',
                minWidth: '44px'
              }}
            >
              +1
            </button>
            <button
              onClick={() => onTempoChange(Math.min(300, tempo + 5))}
              style={{
                padding: '10px 12px',
                fontSize: 'var(--font-sm)',
                fontWeight: '700',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
                color: '#64748b',
                cursor: 'pointer',
                minWidth: '44px'
              }}
            >
              +5
            </button>
            <button
              onClick={() => onTempoChange(Math.min(300, tempo + 10))}
              style={{
                padding: '10px 12px',
                fontSize: 'var(--font-sm)',
                fontWeight: '700',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
                color: '#64748b',
                cursor: 'pointer',
                minWidth: '44px'
              }}
            >
              +10
            </button>
          </div>
        </div>

        {/* Tanpura Controls - Moved from More Settings */}
        <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <button
            onClick={onTanpuraToggle}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: isTanpuraPlaying ? '#6366f1' : '#fff',
              color: isTanpuraPlaying ? '#fff' : '#6366f1',
              border: '1px solid #6366f1',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '800',
              fontSize: 'var(--font-xs)',
              marginBottom: isTanpuraPlaying ? '10px' : '0'
            }}
          >
            TANPURA {isTanpuraPlaying ? 'ON' : 'OFF'}
          </button>
          
          {isTanpuraPlaying && (
            <>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                {(['Pa', 'Ma'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => onTanpuraModeChange(mode)}
                    style={{
                      flex: 1, padding: '8px', fontSize: 'var(--font-xs)', fontWeight: '800',
                      borderRadius: '8px', border: '1px solid #e2e8f0',
                      backgroundColor: tanpuraMode === mode ? '#6366f1' : '#fff',
                      color: tanpuraMode === mode ? '#fff' : '#64748b',
                      cursor: 'pointer',
                      boxShadow: tanpuraMode === mode ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >Sa-{mode}</button>
                ))}
              </div>
              <input
                type="range" min="0" max="1" step="0.01" value={tanpuraVolume}
                onChange={(e) => onTanpuraVolumeChange(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1' }}
              />
            </>
          )}
        </div>
      </div>

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={{
          padding: '12px',
          backgroundColor: 'transparent',
          color: '#6366f1',
          border: '1px solid #e0e7ff',
          borderRadius: '12px',
          cursor: 'pointer',
          fontWeight: '700',
          fontSize: 'var(--font-xs)',
          textTransform: 'uppercase'
        }}
      >
        {showAdvanced ? 'Collapse Settings ↑' : 'More Settings ↓'}
      </button>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-xs)', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Note Glide (Meend)</span>
              <button
                onClick={() => onEnableGlideChange(!enableGlide)}
                style={{
                  padding: '6px 14px', borderRadius: '100px', border: 'none',
                  backgroundColor: enableGlide ? '#6366f1' : '#e2e8f0',
                  color: enableGlide ? '#fff' : '#64748b', fontSize: 'var(--font-xs)', fontWeight: '800', cursor: 'pointer'
                }}
              >
                {enableGlide ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Instrument & Notation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#475569', fontSize: 'var(--font-xs)' }}>INSTRUMENT</label>
              <select 
                value={soundType} 
                onChange={(e) => onSoundTypeChange(e.target.value as SoundType)}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 'var(--font-sm)', color: '#0f172a' }}
              >
                {Object.entries(instrumentNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#475569', fontSize: 'var(--font-xs)' }}>NOTATION</label>
              <div style={{ display: 'flex', gap: '2px', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '8px' }}>
                {['hindi', 'english', 'numbers'].map((n) => (
                  <button
                    key={n} onClick={() => onNotationChange(n as Notation)}
                    style={{
                      flex: 1, padding: '8px 2px', fontSize: 'var(--font-xs)', fontWeight: '700', borderRadius: '6px',
                      backgroundColor: notation === n ? '#fff' : 'transparent',
                      border: 'none', color: notation === n ? '#6366f1' : '#64748b',
                      boxShadow: notation === n ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                    }}
                  >
                    {n === 'hindi' ? 'अ' : n === 'english' ? 'Abc' : '123'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Repetitions */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#475569', fontSize: 'var(--font-xs)' }}>REPETITIONS</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3, 4].map(count => (
                <button
                  key={count} onClick={() => onRepetitionsChange(count)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px', fontSize: 'var(--font-sm)', fontWeight: '700',
                    backgroundColor: repetitions === count ? '#6366f1' : '#f1f5f9',
                    color: repetitions === count ? '#fff' : '#64748b', border: 'none'
                  }}
                >
                  {count}x
                </button>
              ))}
            </div>
          </div>

          {/* Custom Pattern */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#475569', fontSize: 'var(--font-xs)' }}>ADD CUSTOM PATTERN</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="text" value={customPattern}
                onChange={(e) => onCustomPatternChange(e.target.value)}
                placeholder="e.g. 1321"
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 'var(--font-sm)' }}
              />
              <button
                onClick={onAddCustomPalta}
                style={{ padding: '10px 16px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: 'var(--font-sm)' }}
              >
                Add
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              if (confirm('Reset all settings to default?')) {
                onResetToDefaults();
              }
            }}
            style={{
              marginTop: '10px',
              padding: '12px',
              backgroundColor: 'transparent',
              color: '#ef4444',
              border: '1px solid #fee2e2',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: 'var(--font-xs)',
              textTransform: 'uppercase'
            }}
          >
            Reset All to Defaults
          </button>
        </div>
      )}
    </div>
  );
}
