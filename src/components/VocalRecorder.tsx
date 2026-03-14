import { useState, useRef } from 'react';
import { Swara, NoteName } from '../types';
import { AudioEngine } from '../utils/audioEngine';

const swaras: Swara[] = ['S', 'r', 'R', 'g', 'G', 'M', 'm', 'P', 'd', 'D', 'n', 'N'];

const audioEngine = new AudioEngine();

export function VocalRecorder() {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [recordingSwara, setRecordingSwara] = useState<Swara | null>(null);
  const [recordings, setRecordings] = useState<Record<string, string>>({});
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const trimSilence = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0);
    const threshold = 0.01; // Amplitude threshold
    
    let start = 0;
    while (start < channelData.length && Math.abs(channelData[start]) < threshold) {
      start++;
    }
    
    let end = channelData.length - 1;
    while (end > start && Math.abs(channelData[end]) < threshold) {
      end--;
    }
    
    const trimmedLen = end - start + 1;
    if (trimmedLen <= 0) return url;

    const trimmedBuffer = ctx.createBuffer(1, trimmedLen, audioBuffer.sampleRate);
    trimmedBuffer.getChannelData(0).set(channelData.subarray(start, end + 1));
    
    return bufferToWaveUrl(trimmedBuffer);
  };

  const bufferToWaveUrl = (buffer: AudioBuffer) => {
    const length = buffer.length * 2;
    const bufferArr = new ArrayBuffer(44 + length);
    const view = new DataView(bufferArr);
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    return URL.createObjectURL(new Blob([view], { type: 'audio/wav' }));
  };

  const startRecording = async (swara: Swara) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks.current = [];
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/mpeg' });
        const rawUrl = URL.createObjectURL(audioBlob);
        const trimmedUrl = await trimSilence(rawUrl);
        setRecordings(prev => ({ ...prev, [`${gender}_${swara}`]: trimmedUrl }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current = recorder;
      setRecordingSwara(swara);
      recorder.start();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not supported.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      setRecordingSwara(null);
    }
  };

  const playReferenceSwara = async (swara: Swara) => {
    // Ensure engine is initialized and context is resumed
    const pitch: NoteName = gender === 'male' ? 'C#' : 'G#';
    await audioEngine.initialize(pitch);
    
    // Explicitly resume if needed (extra safety for some browsers)
    const ctx = (audioEngine as any).audioContext as AudioContext;
    if (ctx && ctx.state !== 'running') {
      await ctx.resume();
    }

    audioEngine.start();
    
    const swaraRatios: Record<string, number> = {
      'S': 1.0, 'r': 16/15, 'R': 9/8, 'g': 6/5, 'G': 5/4, 'M': 4/3,
      'm': 45/32, 'P': 3/2, 'd': 8/5, 'D': 5/3, 'n': 9/5, 'N': 15/8,
    };
    const baseSa = gender === 'male' ? 277.18 : 415.30;
    const freq = baseSa * (swaraRatios[swara] || 1.0);
    
    // Just use harmonium for reference
    (audioEngine as any).createHarmoniumNote(freq, 0, 2.0, 0.5);
  };

  const downloadSample = (swara: Swara) => {
    const url = recordings[`${gender}_${swara}`];
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${swara}.wav`;
    a.click();
  };

  const downloadAll = () => {
    swaras.forEach(s => {
      if (recordings[`${gender}_${s}`]) {
        setTimeout(() => downloadSample(s), 100);
      }
    });
  };

  return (
    <div style={{
      padding: '30px', backgroundColor: '#fff', borderRadius: '24px',
      border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
      maxWidth: '800px', margin: '40px auto'
    }}>
      <h2 style={{ margin: '0 0 5px 0', color: '#0f172a', fontWeight: '900' }}>Vocal Sample Recorder</h2>
      <p style={{ margin: '0 0 25px 0', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
        Tip: Listen to the REF and aim for a steady 2-second note.
      </p>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', alignItems: 'center' }}>
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
          <button 
            onClick={() => setGender('male')}
            style={{ 
              padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              backgroundColor: gender === 'male' ? '#fff' : 'transparent',
              color: gender === 'male' ? '#6366f1' : '#64748b',
              fontWeight: '700', boxShadow: gender === 'male' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
            }}
          >Male (C#)</button>
          <button 
            onClick={() => setGender('female')}
            style={{ 
              padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              backgroundColor: gender === 'female' ? '#fff' : 'transparent',
              color: gender === 'female' ? '#6366f1' : '#64748b',
              fontWeight: '700', boxShadow: gender === 'female' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
            }}
          >Female (G#)</button>
        </div>
      </div>

      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
        gap: '15px', marginBottom: '30px' 
      }}>
        {swaras.map(swara => {
          const isRecording = recordingSwara === swara;
          const hasRecording = !!recordings[`${gender}_${swara}`];

          return (
            <div key={swara} style={{ 
              padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0',
              backgroundColor: isRecording ? '#fff1f2' : '#f8fafc',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: '900', fontSize: '20px' }}>{swara}</p>
              
              <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
                <button 
                  onClick={() => playReferenceSwara(swara)}
                  style={{ 
                    flex: 1, padding: '8px', backgroundColor: '#6366f1', color: '#fff',
                    border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >REF</button>

                {!isRecording ? (
                  <button 
                    onClick={() => startRecording(swara)}
                    style={{ 
                      flex: 2, padding: '8px', backgroundColor: '#ef4444', color: '#fff',
                      border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer'
                    }}
                  >REC</button>
                ) : (
                  <button 
                    onClick={stopRecording}
                    style={{ 
                      flex: 2, padding: '8px', backgroundColor: '#0f172a', color: '#fff',
                      border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer',
                      animation: 'pulse 1s infinite'
                    }}
                  >STOP</button>
                )}
              </div>

              {hasRecording && (
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button 
                    onClick={() => {
                      const audio = new Audio(recordings[`${gender}_${swara}`]);
                      audio.play();
                    }}
                    style={{ flex: 1, padding: '6px', fontSize: '12px', cursor: 'pointer' }}
                  >▶</button>
                  <button 
                    onClick={() => downloadSample(swara)}
                    style={{ flex: 1, padding: '6px', fontSize: '12px', cursor: 'pointer' }}
                  >💾</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {Object.keys(recordings).filter(k => k.startsWith(gender)).length > 0 && (
        <button 
          onClick={downloadAll}
          style={{ 
            width: '100%', padding: '15px', backgroundColor: '#10b981', color: '#fff',
            border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          DOWNLOAD ALL {gender.toUpperCase()} SAMPLES
        </button>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
