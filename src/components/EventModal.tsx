import { useGameStore } from '../store/gameStore';
import { playClick } from '../utils/sfx';

export default function EventModal() {
  const activeEvent = useGameStore(state => state.activeEvent);
  const resolveEvent = useGameStore(state => state.resolveEvent);
  const playerState = useGameStore(state => state.playerState);
  const isCheatMode = useGameStore(state => state.isCheatMode);

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
    <div className="event-modal-overlay" style={{
      position: 'fixed',
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
      padding: '1rem'
    }}>
      <div className="glass-panel animate-fade-in event-modal-content" style={{
        maxWidth: '650px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
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

        <div className="event-type" style={{ 
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
        
        <h2 className="event-title" style={{ 
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
        
        <p className="event-description" style={{ 
          fontSize: '1.25rem', 
          marginBottom: '3rem', 
          lineHeight: '1.6', 
          color: 'var(--text-muted)',
          fontWeight: 400,
          textAlign: 'justify'
        }}>
          {activeEvent.description}
        </p>

        <div className="event-choices" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {activeEvent.choices.map((choice, index) => {
            const canAffordF = isCheatMode || !choice.costFunds || playerState.funds >= choice.costFunds;
            const canAffordPC = isCheatMode || !choice.costPC || playerState.politicalCapital >= choice.costPC;
            const canAfford = canAffordF && canAffordPC;

            return (
              <button
                key={index}
                className={`glass-button event-choice-btn ${canAfford ? 'action-btn-hover' : ''}`}
                disabled={!canAfford}
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
                  background: canAfford ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.01)',
                  opacity: canAfford ? 1 : 0.4,
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                  filter: canAfford ? 'none' : 'grayscale(0.8)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ 
                    color: getHeaderColor(), 
                    fontWeight: 800,
                    fontSize: '1.4rem',
                    opacity: canAfford ? 0.6 : 0.2
                }}>{'>'}</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ 
                        lineHeight: '1.4', 
                        fontWeight: 500 
                    }}>{cleanText(choice.text)}</span>
                    {!canAfford && (
                        <span style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--accent-red)', 
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                             Insufficient Resources
                        </span>
                    )}
                </div>
              </button>
            );
          })}

          {activeEvent.choices.every(choice => {
            const canAffordF = isCheatMode || !choice.costFunds || playerState.funds >= choice.costFunds;
            const canAffordPC = isCheatMode || !choice.costPC || playerState.politicalCapital >= choice.costPC;
            return !canAffordF || !canAffordPC;
          }) && !isCheatMode && (
            <button
              className="glass-button action-btn-hover"
              onClick={() => {
                resolveEvent(-1);
                playClick();
              }}
              style={{
                marginTop: '1rem',
                padding: '1.5rem 2rem',
                width: '100%',
                border: '1px solid var(--accent-red)',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--accent-red)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
              }}
            >
              <span>⚠</span>
              <span>Unable to Respond (Suffer Heavy Consequences)</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .event-modal-overlay {
             padding: 0.5rem !important;
             padding-top: env(safe-area-inset-top, 0px) !important;
             padding-bottom: env(safe-area-inset-bottom, 0px) !important;
          }
          .event-modal-content {
            padding: 1.5rem !important;
            max-height: 85vh !important;
          }
          .event-type {
            font-size: 0.7rem !important;
            letter-spacing: 2px !important;
            margin-bottom: 0.8rem !important;
          }
          .event-title {
            font-size: 1.4rem !important;
            margin-bottom: 1rem !important;
          }
          .event-description {
            font-size: 1rem !important;
            margin-bottom: 1.5rem !important;
            line-height: 1.4 !important;
          }
          .event-choices {
            gap: 0.8rem !important;
          }
          .event-choice-btn {
            padding: 1rem !important;
            font-size: 0.95rem !important;
            gap: 0.8rem !important;
          }
          .event-choice-btn > div:first-child {
            font-size: 1.1rem !important;
          }
        }
      `}</style>
    </div>

  );
}
