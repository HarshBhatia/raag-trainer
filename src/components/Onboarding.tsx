import { useState } from 'react';
import { UserGender, UserExperience, UserPrefs } from '../types';

interface OnboardingProps {
  onComplete: (prefs: UserPrefs) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [gender, setGender] = useState<UserGender | null>(null);
  const [experience, setExperience] = useState<UserExperience>('beginner');

  const handleComplete = () => {
    if (!gender) return;
    onComplete({
      gender,
      experience,
      onboarded: true
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#0f172a', color: '#fff', zIndex: 2000,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '20px', textAlign: 'center'
    }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '10px', color: '#38bdf8' }}>Welcome!</h1>
        <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Let's personalize your practice session.</p>

        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>I am a...</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setGender('male')}
              style={{
                flex: 1, padding: '20px', borderRadius: '16px', 
                border: gender === 'male' ? '2px solid #38bdf8' : '2px solid #334155',
                backgroundColor: gender === 'male' ? 'rgba(56, 189, 248, 0.1)' : 'transparent', 
                color: gender === 'male' ? '#38bdf8' : '#fff', 
                cursor: 'pointer', fontWeight: '700',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '24px', display: 'block' }}>👨</span>
              Male (C#)
            </button>
            <button
              onClick={() => setGender('female')}
              style={{
                flex: 1, padding: '20px', borderRadius: '16px', 
                border: gender === 'female' ? '2px solid #38bdf8' : '2px solid #334155',
                backgroundColor: gender === 'female' ? 'rgba(56, 189, 248, 0.1)' : 'transparent', 
                color: gender === 'female' ? '#38bdf8' : '#fff', 
                cursor: 'pointer', fontWeight: '700',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '24px', display: 'block' }}>👩</span>
              Female (G#)
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>My experience level is...</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(['beginner', 'intermediate', 'advanced'] as UserExperience[]).map(exp => (
              <label key={exp} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
                borderRadius: '12px', border: experience === exp ? '1px solid #38bdf8' : '1px solid #1e293b', 
                cursor: 'pointer', backgroundColor: experience === exp ? 'rgba(56, 189, 248, 0.05)' : '#1e293b',
                transition: 'all 0.2s'
              }}>
                <input 
                  type="radio" 
                  name="exp" 
                  value={exp} 
                  checked={experience === exp} 
                  onChange={() => setExperience(exp)}
                  style={{ accentColor: '#38bdf8' }}
                />
                <span style={{ textTransform: 'capitalize', fontWeight: '600', color: experience === exp ? '#38bdf8' : '#fff' }}>{exp}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleComplete}
          disabled={!gender}
          style={{
            width: '100%', padding: '20px', borderRadius: '16px',
            backgroundColor: gender ? '#38bdf8' : '#1e293b', 
            color: gender ? '#0f172a' : '#475569', 
            border: 'none', fontSize: '18px', fontWeight: '900', 
            cursor: gender ? 'pointer' : 'not-allowed',
            boxShadow: gender ? '0 10px 15px -3px rgba(56, 189, 248, 0.4)' : 'none',
            textTransform: 'uppercase', letterSpacing: '2px',
            transition: 'all 0.2s'
          }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
