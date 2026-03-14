import { useRef, useEffect } from 'react';

interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function VolumeSlider({ value, onChange }: VolumeSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      
      const update = (clientX: number) => {
        const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        onChange(pct);
      };
      
      update(e.touches[0].clientX);
      
      const handleTouchMove = (ev: TouchEvent) => {
        ev.preventDefault();
        update(ev.touches[0].clientX);
      };
      
      const handleTouchEnd = () => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
      
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
    };
  }, [onChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = sliderRef.current;
    if (!el) return;
    
    const rect = el.getBoundingClientRect();
    
    const update = (clientX: number) => {
      const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      onChange(pct);
    };
    
    update(e.clientX);
    
    const handleMouseMove = (ev: MouseEvent) => update(ev.clientX);
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={sliderRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'relative',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      <div style={{ position: 'absolute', left: 0, right: 0, height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px' }}>
        <div style={{ width: `${value * 100}%`, height: '100%', backgroundColor: '#6366f1', borderRadius: '3px' }} />
      </div>
      <div style={{
        position: 'absolute',
        left: `calc(${value * 100}% - 12px)`,
        width: '24px',
        height: '24px',
        backgroundColor: '#6366f1',
        borderRadius: '50%',
        boxShadow: '0 2px 6px rgba(99,102,241,0.5)',
        border: '2px solid #fff',
        pointerEvents: 'none'
      }} />
    </div>
  );
}
