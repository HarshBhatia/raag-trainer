import { UserGender, UserExperience, UserPrefs } from '../types';

interface OnboardingProps {
  onComplete: (prefs: UserPrefs) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const handleComplete = (gender: UserGender, experience: UserExperience) => {
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

        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>I am a...</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                const exp = (document.querySelector('input[name="exp"]:checked') as HTMLInputElement)?.value as UserExperience || 'beginner';
                handleComplete('male', exp);
              }}
              style={{
                flex: 1, padding: '20px', borderRadius: '16px', border: '2px solid #334155',
                backgroundColor: 'transparent', color: '#fff', cursor: 'pointer', fontWeight: '700'
              }}
            >
              <span style={{ fontSize: '24px', display: 'block' }}>👨</span>
              Male (C#)
            </button>
            <button
              onClick={() => {
                const exp = (document.querySelector('input[name="exp"]:checked') as HTMLInputElement)?.value as UserExperience || 'beginner';
                handleComplete('female', exp);
              }}
              style={{
                flex: 1, padding: '20px', borderRadius: '16px', border: '2px solid #334155',
                backgroundColor: 'transparent', color: '#fff', cursor: 'pointer', fontWeight: '700'
              }}
            >
              <span style={{ fontSize: '24px', display: 'block' }}>👩</span>
              Female (G#)
            </button>
          </div>
        </div>

        <div>
          <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>My experience level is...</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(['beginner', 'intermediate', 'advanced'] as UserExperience[]).map(exp => (
              <label key={exp} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '15px',
                borderRadius: '12px', border: '1px solid #1e293b', cursor: 'pointer',
                backgroundColor: '#1e293b'
              }}>
                <input type="radio" name="exp" value={exp} defaultChecked={exp === 'beginner'} />
                <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{exp}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
