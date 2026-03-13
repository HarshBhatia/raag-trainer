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
  loop: boolean;
  onLoopChange: (loop: boolean) => void;
  customPattern: string;
  onCustomPatternChange: (pattern: string) => void;
  onAddCustomPalta: () => void;
  isPlaying: boolean;
  notation: Notation;
  onNotationChange: (notation: Notation) => void;
  soundType: SoundType;
  onSoundTypeChange: (type: SoundType) => void;
  isTanpuraPlaying: boolean;
  onTanpuraToggle: () => void;
  tanpuraVolume: number;
  onTanpuraVolumeChange: (volume: number) => void;
}

export function Controls({
  tempo,
  onTempoChange,
  saNote,
  onSaNoteChange,
  repetitions,
  onRepetitionsChange,
  loop,
  onLoopChange,
  customPattern,
  onCustomPatternChange,
  onAddCustomPalta,
  isPlaying,
  notation,
  onNotationChange,
  soundType,
  onSoundTypeChange,
  isTanpuraPlaying,
  onTanpuraToggle,
  tanpuraVolume,
  onTanpuraVolumeChange
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
      gap: '16px',
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      {/* Primary Settings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>
            Sa Note
          </label>
          <select
            value={saNote}
            onChange={(e) => onSaNoteChange(e.target.value as NoteName)}
            style={{
              padding: '10px',
              fontSize: '14px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              width: '100%',
              backgroundColor: '#f8fafc',
              fontWeight: '600'
            }}
          >
            {noteNames.map(note => (
              <option key={note} value={note}>{note}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>
            Tempo
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '40px' }}>
             <input
              type="number"
              value={tempo}
              onChange={(e) => onTempoChange(Number(e.target.value))}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: '700' }}
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={{
          padding: '10px',
          backgroundColor: 'transparent',
          color: '#6366f1',
          border: '1px dashed #6366f1',
          borderRadius: '10px',
          cursor: 'pointer',
          fontWeight: '700',
          fontSize: '12px',
          textTransform: 'uppercase'
        }}
      >
        {showAdvanced ? 'Collapse Settings ↑' : 'More Settings ↓'}
      </button>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
          
          {/* Tanpura Section */}
          <div style={{ backgroundColor: '#fffbeb', padding: '12px', borderRadius: '12px', border: '1px solid #fef3c7' }}>
            <button
              onClick={onTanpuraToggle}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: isTanpuraPlaying ? '#f59e0b' : '#fff',
                color: isTanpuraPlaying ? '#fff' : '#b45309',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '12px',
                marginBottom: isTanpuraPlaying ? '10px' : '0'
              }}
            >
              TANPURA {isTanpuraPlaying ? 'ON' : 'OFF'}
            </button>
            {isTanpuraPlaying && (
              <input
                type="range" min="0" max="1" step="0.01" value={tanpuraVolume}
                onChange={(e) => onTanpuraVolumeChange(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#f59e0b' }}
              />
            )}
          </div>

          {/* Instrument & Notation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#475569', fontSize: '11px' }}>INSTRUMENT</label>
              <select 
                value={soundType} 
                onChange={(e) => onSoundTypeChange(e.target.value as SoundType)}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              >
                {Object.entries(instrumentNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#475569', fontSize: '11px' }}>NOTATION</label>
              <div style={{ display: 'flex', gap: '2px', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                {['hindi', 'english', 'numbers'].map((n) => (
                  <button
                    key={n} onClick={() => onNotationChange(n as Notation)}
                    style={{
                      flex: 1, padding: '6px 2px', fontSize: '10px', fontWeight: '700', borderRadius: '4px',
                      backgroundColor: notation === n ? '#fff' : 'transparent',
                      border: 'none', color: notation === n ? '#2563eb' : '#64748b'
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
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#475569', fontSize: '11px' }}>REPETITIONS</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3, 4].map(count => (
                <button
                  key={count} onClick={() => onRepetitionsChange(count)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                    backgroundColor: repetitions === count ? '#3b82f6' : '#f1f5f9',
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
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#475569', fontSize: '11px' }}>ADD CUSTOM PATTERN</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="text" value={customPattern}
                onChange={(e) => onCustomPatternChange(e.target.value)}
                placeholder="e.g. 1321"
                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <button
                onClick={onAddCustomPalta}
                style={{ padding: '8px 12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px' }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
