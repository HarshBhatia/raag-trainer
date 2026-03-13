import { useState, useEffect } from 'react';

interface StartPracticeProps {
  onStart: () => void;
  onExit: () => void;
}

export function StartPractice({ onStart, onExit }: StartPracticeProps) {
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onStart();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, onStart]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#0f172a', color: '#fff', zIndex: 2500,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '20px', textAlign: 'center'
    }}>
      <div style={{ 
        maxWidth: '500px', width: '100%', backgroundColor: '#1e293b', 
        padding: '40px', borderRadius: '32px', border: '1px solid #334155',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>✨</div>
        <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '10px', color: '#f59e0b' }}>All the Best!</h1>
        <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Starting in {secondsLeft} seconds...</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#0f172a', padding: '16px', borderRadius: '16px' }}>
            <span style={{ fontSize: '24px' }}>🌬️</span>
            <div>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>Deep Breathing</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Inhale deeply from your diaphragm before you start.</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#0f172a', padding: '16px', borderRadius: '16px' }}>
            <span style={{ fontSize: '24px' }}>🧘</span>
            <div>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>Relax Shoulders</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Keep your posture upright but shoulders completely loose.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#0f172a', padding: '16px', borderRadius: '16px' }}>
            <span style={{ fontSize: '24px' }}>🎤</span>
            <div>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>Stay Focused</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Listen to the Tanpura and find your center.</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onExit}
            style={{
              flex: 1, padding: '18px', borderRadius: '16px',
              backgroundColor: 'transparent', color: '#94a3b8', border: '2px solid #334155',
              fontSize: '16px', fontWeight: '800', cursor: 'pointer'
            }}
          >
            CANCEL
          </button>
          <button
            onClick={onStart}
            style={{
              flex: 2, padding: '18px', borderRadius: '16px',
              backgroundColor: '#f59e0b', color: '#fff', border: 'none',
              fontSize: '18px', fontWeight: '900', cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.4)',
              textTransform: 'uppercase', letterSpacing: '1px'
            }}
          >
            START NOW ({secondsLeft}s)
          </button>
        </div>
      </div>
    </div>
  );
}
