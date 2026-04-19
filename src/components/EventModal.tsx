import { useGameStore } from '../store/gameStore';
import { playClick } from '../utils/sfx';

export default function EventModal() {
  const activeEvent = useGameStore(state => state.activeEvent);
  const resolveEvent = useGameStore(state => state.resolveEvent);

  if (!activeEvent) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '500px',
        padding: '2rem',
        textAlign: 'center',
        border: '1px solid var(--accent-gold)'
      }}>
        <h2 style={{ 
          color: 'var(--accent-gold)', 
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          {activeEvent.type === 'EVENT' ? 'News Flash' : 'Press Question'}
        </h2>
        
        <h3 style={{ marginBottom: '1rem' }}>{activeEvent.title}</h3>
        
        <p style={{ 
          marginBottom: '2rem', 
          lineHeight: '1.6', 
          color: 'var(--text-main)' 
        }}>
          {activeEvent.description}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeEvent.choices.map((choice, index) => (
            <button
              key={index}
              className="glass-button"
              onClick={() => {
                resolveEvent(index);
                playClick();
              }}
              style={{ padding: '1rem', width: '100%', textAlign: 'left' }}
            >
              • {choice.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
