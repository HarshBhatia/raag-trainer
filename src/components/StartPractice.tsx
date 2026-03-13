import { useState, useEffect } from 'react';

interface StartPracticeProps {
  onStart: () => void;
  onExit: () => void;
}

export function StartPractice({ onStart, onExit }: StartPracticeProps) {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    // Only run timer on Desktop
    if (isMobile) return;

    if (secondsLeft <= 0) {
      onStart();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, onStart, isMobile]);

  const handleManualStart = () => {
    onStart();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#0f172a', color: '#fff', zIndex: 2500,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '20px', textAlign: 'center',
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{ 
        maxWidth: '450px', width: '100%', backgroundColor: '#1e293b', 
        padding: '40px', borderRadius: '40px', border: '1px solid #334155',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        position: 'relative'
      }}>
        <h1 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '20px', color: '#f59e0b' }}>All the Best!</h1>
        
        {/* Volume Hint */}
        <div style={{ 
          marginBottom: '30px', padding: '12px', borderRadius: '12px', 
          backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>🔊</span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#f59e0b' }}>Turn up volume & check Silent Mode</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
          <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '24px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🌬️</span>
            <p style={{ margin: 0, fontWeight: '800', fontSize: '14px', color: '#94a3b8' }}>BREATHE</p>
          </div>
          <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '24px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🧘</span>
            <p style={{ margin: 0, fontWeight: '800', fontSize: '14px', color: '#94a3b8' }}>RELAX</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <button
            onClick={handleManualStart}
            style={{
              width: '180px', height: '180px', borderRadius: '50%',
              backgroundColor: '#10b981', color: '#fff',
              fontSize: '20px', fontWeight: '900', cursor: 'pointer',
              boxShadow: '0 15px 30px -5px rgba(16, 185, 129, 0.4)',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              gap: '8px', position: 'relative',
              transition: 'transform 0.2s',
              border: '4px solid #fff'
            }}
          >
            <span style={{ fontSize: '12px', opacity: 0.9 }}>{isMobile ? 'READY?' : 'STARTING IN'}</span>
            <span style={{ fontSize: '40px' }}>{isMobile ? 'GO' : secondsLeft}</span>
          </button>

          <button
            onClick={onExit}
            style={{
              marginTop: '15px', padding: '12px 24px', borderRadius: '100px',
              backgroundColor: 'transparent', color: '#64748b', border: '1px solid #334155',
              fontSize: '14px', fontWeight: '800', cursor: 'pointer'
            }}
          >
            CANCEL
          </button>
        </div>

        {isMobile && (
          <div style={{
            marginTop: '25px', padding: '10px', borderRadius: '16px',
            backgroundColor: 'rgba(56, 189, 248, 0.05)',
            display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center'
          }}>
            <span style={{ fontSize: '18px', animation: 'rotateIcon 2s infinite' }}>📱</span>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#38bdf8' }}>Rotate for better experience</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes rotateIcon {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(90deg); }
          75% { transform: rotate(90deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
