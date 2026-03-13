import { TaanNote } from '../types';

interface TaanDisplayProps {
  notes: TaanNote[];
  currentNoteIndex: number;
}

export function TaanDisplay({ notes, currentNoteIndex }: TaanDisplayProps) {
  const formatSwara = (note: TaanNote) => {
    if (note.octave === -1) {
      return note.swara + '̱'; // Lower octave dot below
    } else if (note.octave === 1) {
      return note.swara + '̇'; // Upper octave dot above
    }
    return note.swara;
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      marginBottom: '20px',
      minHeight: '100px',
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Taan Notation:</h3>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '20px',
      }}>
        {notes.map((note, index) => (
          <span
            key={index}
            style={{
              padding: '8px 12px',
              backgroundColor: currentNoteIndex === index ? '#4CAF50' : '#fff',
              color: currentNoteIndex === index ? '#fff' : '#000',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontWeight: currentNoteIndex === index ? 'bold' : 'normal',
              transition: 'all 0.1s',
            }}
          >
            {formatSwara(note)}
          </span>
        ))}
      </div>
    </div>
  );
}
