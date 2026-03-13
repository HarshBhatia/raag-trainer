import { Raag, Notation, Swara } from '../types';

interface RaagSelectorProps {
  raags: Raag[];
  selectedRaag: Raag;
  onSelect: (raag: Raag) => void;
  notation: Notation;
}

const swaraToHindi: Record<Swara, string> = {
  'S': 'स', 'r': 'रे', 'R': 'रे', 'g': 'ग', 'G': 'ग', 'M': 'म',
  'm': 'म', 'P': 'प', 'd': 'ध', 'D': 'ध', 'n': 'नि', 'N': 'नि'
};

const swaraToNumber: Record<Swara, string> = {
  'S': '1', 'r': '2', 'R': '2', 'g': '3', 'G': '3', 'M': '4',
  'm': '4', 'P': '5', 'd': '6', 'D': '6', 'n': '7', 'N': '7'
};

export function RaagSelector({ raags, selectedRaag, onSelect, notation }: RaagSelectorProps) {
  
  const renderSwara = (swara: Swara, octave: number = 0) => {
    let base = swara as string;
    if (notation === 'hindi') base = swaraToHindi[swara];
    else if (notation === 'numbers') base = swaraToNumber[swara];

    const komal = ['r', 'g', 'd', 'n'].includes(swara);
    const teevra = swara === 'm';

    return (
      <span style={{ 
        display: 'inline-flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        verticalAlign: 'middle',
        lineHeight: 1,
        margin: '0 2px'
      }}>
        {/* Upper Dot */}
        <span style={{ height: '4px', fontSize: '10px', lineHeight: 1 }}>
          {octave === 1 ? '•' : teevra && (notation === 'hindi' || notation === 'numbers') ? ' ' : ''}
          {teevra && (notation === 'hindi' || notation === 'numbers') && <span style={{ borderLeft: '1px solid currentColor', height: '6px', display: 'inline-block' }}></span>}
        </span>
        
        {/* Base Swara */}
        <span style={{ 
          textDecoration: (komal && (notation === 'hindi' || notation === 'numbers')) ? 'underline' : 'none',
          fontSize: '15px',
          fontWeight: '600'
        }}>
          {base}
        </span>
        
        {/* Lower Dot */}
        <span style={{ height: '4px', fontSize: '10px', lineHeight: 1 }}>
          {octave === -1 ? '•' : ''}
        </span>
      </span>
    );
  };

  return (
    <div style={{ 
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
        Select Raag
      </label>
      <select
        value={selectedRaag.name}
        onChange={(e) => {
          const raag = raags.find(r => r.name === e.target.value);
          if (raag) onSelect(raag);
        }}
        style={{
          padding: '10px 12px',
          fontSize: '15px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          width: '100%',
          backgroundColor: '#fff',
          cursor: 'pointer',
          fontWeight: '600',
          color: '#1e293b'
        }}
      >
        {raags.map(raag => (
          <option key={raag.name} value={raag.name}>
            {raag.name}
          </option>
        ))}
      </select>
      <div style={{ 
        marginTop: '16px', 
        padding: '12px',
        backgroundColor: '#f8fafc',
        borderRadius: '10px',
        fontSize: '14px', 
        color: '#475569',
        border: '1px solid #f1f5f9'
      }}>
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: '700', color: '#64748b', minWidth: '60px' }}>Aroha:</span> 
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            {selectedRaag.aroha.map((s, i) => <span key={i}>{renderSwara(s)}</span>)}
            {renderSwara('S', 1)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: '700', color: '#64748b', minWidth: '60px' }}>Avaroha:</span> 
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            {renderSwara('S', 1)}
            {selectedRaag.avaroha.map((s, i) => <span key={i}>{renderSwara(s)}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
