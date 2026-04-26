
import { useGameStore } from '../store/gameStore';
import { playClick } from '../utils/sfx';
import { Play, Megaphone } from 'lucide-react';

export default function IntroSplash() {
  const { hasInteractionStarted, setInteractionStarted } = useGameStore();

  if (hasInteractionStarted) return null;

  const handleStart = () => {
    setInteractionStarted(true);
    playClick(); // Direct interaction allows AudioContext to start
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, #0f0f1a 100%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      textAlign: 'center',
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '650px',
        width: '100%',
        padding: '3rem 2rem',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 1)',
        position: 'relative'
      }}>
        {/* Decorative Background Element */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            padding: '8px 16px',
            borderRadius: '100px',
            fontSize: '0.75rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            marginBottom: '2rem'
          }}>
            <Megaphone size={14} />
            Breaking News alert
          </div>

          <div style={{
            fontSize: '1.2rem',
            fontWeight: '600',
            color: '#f0f2f8',
            marginBottom: '0.5rem',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            opacity: 0.8
          }}>
            Special Announcement
          </div>

          <h1 style={{
            fontSize: '3.5rem',
            lineHeight: '1.1',
            marginBottom: '2rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #a0a6b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '900',
            letterSpacing: '-1px',
            textTransform: 'uppercase'
          }}>
            Parliament Dissolved
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '2rem',
            maxWidth: '500px',
            margin: '0 auto 2rem',
            lineHeight: '1.6'
          }}>
            PMX Anwar Ibrahim has officially advised the King to dissolve the 15th Parliament.
            The nation prepares for the General Election. How will you lead?
          </p>

          <button
            onClick={handleStart}
            className="glass-button active pulse-glow"
            style={{
              fontSize: '1.2rem',
              padding: '1.2rem 4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0 auto',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}
          >
            <Play size={20} fill="currentColor" /> ENTER THE ARENA
          </button>

          <div style={{
            marginTop: '2.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div>beta 0.3.0</div>
            <div>
              GE15 result and demographic data sourced from <a href="https://github.com/Thevesh/analysis-election-msia" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255, 255, 255, 0.5)', textDecoration: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>Thevesh/analysis-election-msia</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
