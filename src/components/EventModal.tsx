import { useGameStore } from '../store/gameStore';
import { playClick } from '../utils/sfx';

export default function EventModal() {
  const activeEvent = useGameStore(state => state.activeEvent);
  const resolveEvent = useGameStore(state => state.resolveEvent);

  if (!activeEvent) return null;

  // Clean choice text: remove bullet points and outer quotes, including those ending with !"
  const cleanText = (text: string) => {
    // Specifically handle the pattern of quotes around the answer part before the parenthesis
    // e.g. "Answer text!" (+5 Pop) -> Answer text! (+5 Pop)
    // First, remove leading bullets
    let cleaned = text.replace(/^[•\-\s]+/, '');
    // Remove quotes that wrap phrases (even with punctuation)
    cleaned = cleaned.replace(/^"(.+?)"(\s*\(.*\))?$/, '$1$2');
    // Fallback: general single/double quote stripping for any remaining edge cases
    return cleaned.replace(/^['"]+|['"]+$/g, '').trim();
  };

  const getHeaderColor = () => {
    switch (activeEvent.type) {
      case 'BLACK_SWAN': return 'var(--accent-red)';
      case 'EVENT': return 'var(--accent-teal)';
      default: return 'var(--accent-gold)';
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(5, 5, 10, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '650px',
        width: '100%',
        padding: '3rem',
        textAlign: 'left',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 20px ${getHeaderColor()}22`
      }}>
        {/* Top Accent Line */}
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '4px',
            background: `linear-gradient(90deg, transparent, ${getHeaderColor()}, transparent)`,
            borderRadius: '16px 16px 0 0'
        }} />

        <div style={{ 
          fontSize: '0.9rem',
          color: getHeaderColor(),
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '4px',
          marginBottom: '1.5rem',
          opacity: 0.8
        }}>
          {activeEvent.type === 'BLACK_SWAN' ? 'Critical Alert' : 
           activeEvent.type === 'EVENT' ? 'National News' : 'Press Inquiry'}
        </div>
        
        <h2 style={{ 
            fontSize: '2rem', 
            marginBottom: '1.5rem',
            lineHeight: 1.2,
            fontWeight: 800,
            background: 'linear-gradient(to bottom, #fff, #a0a6b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
        }}>
            {activeEvent.title}
        </h2>
        
        <p style={{ 
          fontSize: '1.25rem', 
          marginBottom: '3rem', 
          lineHeight: '1.6', 
          color: 'var(--text-muted)',
          fontWeight: 400,
          textAlign: 'justify'
        }}>
          {activeEvent.description}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {activeEvent.choices.map((choice, index) => (
            <button
              key={index}
              className="glass-button action-btn-hover"
              onClick={() => {
                resolveEvent(index);
                playClick();
              }}
              style={{ 
                padding: '1.5rem 2rem', 
                width: '100%', 
                textAlign: 'left',
                fontSize: '1.1rem',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '1.2rem',
                background: 'rgba(255, 255, 255, 0.03)'
              }}
            >
              <div style={{ 
                  color: getHeaderColor(), 
                  fontWeight: 800,
                  fontSize: '1.4rem',
                  opacity: 0.6
              }}>{'>'}</div>
              <span style={{ 
                flex: 1, 
                lineHeight: '1.4', 
                fontWeight: 500 
              }}>{cleanText(choice.text)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
