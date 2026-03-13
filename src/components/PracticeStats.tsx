interface PracticeStatsProps {
  durationSeconds: number;
  paltasCount: number;
  notesCount: number;
  onExit: () => void;
}

export function PracticeStats({ durationSeconds, paltasCount, notesCount, onExit }: PracticeStatsProps) {
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    let result = '';
    if (hrs > 0) result += `${hrs}h `;
    if (mins > 0 || hrs > 0) result += `${mins}m `;
    result += `${secs}s`;
    return result;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#0f172a', color: '#fff', zIndex: 3000,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '20px', textAlign: 'center'
    }}>
      <div style={{ 
        maxWidth: '500px', width: '100%', backgroundColor: '#1e293b', 
        padding: '40px', borderRadius: '24px', border: '1px solid #334155',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏆</div>
        <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '10px', color: '#10b981' }}>Great work!</h1>
        <p style={{ color: '#94a3b8', marginBottom: '40px' }}>You've completed your practice session.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '40px' }}>
          <div style={{ backgroundColor: '#0f172a', padding: '15px', borderRadius: '16px' }}>
            <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '5px' }}>Time</p>
            <p style={{ fontSize: '18px', fontWeight: '800' }}>{formatTime(durationSeconds)}</p>
          </div>
          <div style={{ backgroundColor: '#0f172a', padding: '15px', borderRadius: '16px' }}>
            <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '5px' }}>Paltas</p>
            <p style={{ fontSize: '24px', fontWeight: '800' }}>{paltasCount}</p>
          </div>
          <div style={{ backgroundColor: '#0f172a', padding: '15px', borderRadius: '16px' }}>
            <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '5px' }}>Notes</p>
            <p style={{ fontSize: '24px', fontWeight: '800' }}>{notesCount}</p>
          </div>
        </div>

        <button
          onClick={onExit}
          style={{
            width: '100%', padding: '18px', borderRadius: '16px',
            backgroundColor: '#3b82f6', color: '#fff', border: 'none',
            fontSize: '18px', fontWeight: '800', cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4)'
          }}
        >
          BACK TO HOME
        </button>
      </div>
    </div>
  );
}
