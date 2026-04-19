import { Settings, Volume2, VolumeX, X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { playClick } from '../utils/sfx';

const SettingsMenu = () => {
  const { 
    isSettingsOpen, 
    setSettingsOpen, 
    audioSettings, 
    setAudioSettings 
  } = useGameStore();

  if (!isSettingsOpen) {
    return (
      <button 
        onClick={() => {
          setSettingsOpen(true);
          playClick();
        }}
        className="glass-button"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px',
          borderRadius: '50%',
          zIndex: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Settings"
      >
        <Settings size={24} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }} onClick={() => {
      setSettingsOpen(false);
      playClick();
    }}>
      <div 
        className="glass-panel animate-fade-in" 
        style={{
          maxWidth: '450px',
          width: '90%',
          padding: '2.5rem',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setSettingsOpen(false);
            playClick();
          }}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '8px'
          }}
        >
          <X size={24} />
        </button>

        <h2 style={{ marginBottom: '2rem', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={28} className="pulse-glow" style={{ color: 'var(--accent-blue)' }} /> System Settings
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Volume Section */}
          <div className="flex-column" style={{ gap: '0.8rem' }}>
            <div className="flex-between">
              <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Master Volume</label>
              <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{audioSettings.volume}%</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {audioSettings.isMuted || audioSettings.volume === 0 ? 
                <VolumeX size={20} color="var(--text-muted)" /> : 
                <Volume2 size={20} color="var(--accent-blue)" />
              }
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={audioSettings.volume}
                onChange={(e) => setAudioSettings({ volume: parseInt(e.target.value) })}
                className="premium-slider"
                style={{ flex: 1 }}
              />
            </div>
          </div>
          
          {/* Effect Volume Section */}
          <div className="flex-column" style={{ gap: '0.8rem', paddingTop: '1.2rem', borderTop: '1px solid var(--border-glass)' }}>
            <div className="flex-between">
              <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Effect Volume</label>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{audioSettings.sfxVolume}%</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {audioSettings.isMuted || audioSettings.sfxVolume === 0 ? 
                <VolumeX size={20} color="var(--text-muted)" /> : 
                <Volume2 size={20} color="var(--accent-gold)" />
              }
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={audioSettings.sfxVolume}
                onChange={(e) => {
                  setAudioSettings({ sfxVolume: parseInt(e.target.value) });
                  playClick();
                }}
                className="premium-slider"
                style={{ flex: 1 }}
              />
            </div>
          </div>

          {/* Mute Toggle Section */}
          <div className="flex-between" style={{ padding: '1.2rem 0', borderTop: '1px solid var(--border-glass)' }}>
            <div className="flex-column">
              <span style={{ fontWeight: 600 }}>Mute Music</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Silence background tracks</span>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={audioSettings.isMuted} 
                onChange={(e) => {
                  setAudioSettings({ isMuted: e.target.checked });
                  playClick();
                }} 
              />
              <span className="slider-toggle round"></span>
            </label>
          </div>

          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            borderRadius: '12px', 
            background: 'rgba(255,255,255,0.03)', 
            fontSize: '0.85rem', 
            color: 'var(--text-muted)',
            lineHeight: '1.4'
          }}>
            <p><strong>Pro-Tip:</strong> Use the Volume slider to satisfy browser interaction policies and enable sound immediately.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;
