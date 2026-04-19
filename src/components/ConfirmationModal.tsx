import { useGameStore } from '../store/gameStore';
import { AlertTriangle } from 'lucide-react';
import { playClick } from '../utils/sfx';

export default function ConfirmationModal() {
  const { exitConfirmationOpen, setExitConfirmationOpen, resetGame } = useGameStore();

  if (!exitConfirmationOpen) return null;

  const handleConfirm = () => {
    playClick();
    resetGame();
    setExitConfirmationOpen(false);
  };

  const handleCancel = () => {
    playClick();
    setExitConfirmationOpen(false);
  };

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
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '400px',
        width: '90%',
        padding: '2.5rem',
        textAlign: 'center',
        border: '1px solid rgba(255, 82, 82, 0.3)',
        boxShadow: '0 0 40px rgba(255, 82, 82, 0.1)'
      }}>
        <div style={{ 
          margin: '0 auto 1.5rem', 
          width: '60px', 
          height: '60px', 
          borderRadius: '50%', 
          background: 'rgba(255, 82, 82, 0.1)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <AlertTriangle size={32} color="#ff5252" />
        </div>

        <h2 style={{ 
          color: 'white', 
          marginBottom: '0.5rem',
          fontSize: '1.5rem'
        }}>
          Exit Game?
        </h2>
        
        <p style={{ 
          marginBottom: '2rem', 
          lineHeight: '1.5', 
          color: 'var(--text-muted)',
          fontSize: '0.95rem'
        }}>
          You are about to leave the current simulation. All unsaved progress will be permanently lost.
        </p>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className="glass-button"
            onClick={handleCancel}
            style={{ flex: 1, padding: '1rem' }}
          >
            Stay
          </button>
          <button
            className="glass-button"
            onClick={handleConfirm}
            style={{ 
              flex: 1, 
              padding: '1rem', 
              background: 'rgba(255, 82, 82, 0.2)', 
              color: '#ff5252', 
              borderColor: 'rgba(255, 82, 82, 0.4)' 
            }}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
