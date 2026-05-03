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
    <div className="confirm-modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="glass-panel animate-fade-in confirm-modal-content" style={{
        maxWidth: '400px',
        width: '90%',
        maxHeight: '85vh',
        overflowY: 'auto',
        padding: '2.5rem',
        textAlign: 'center',
        border: '1px solid rgba(255, 82, 82, 0.3)',
        boxShadow: '0 0 40px rgba(255, 82, 82, 0.1)',
        position: 'relative'
      }}>
        <div className="confirm-icon-wrapper" style={{ 
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

        <h2 className="confirm-title" style={{ 
          color: 'white', 
          marginBottom: '0.5rem',
          fontSize: '1.5rem'
        }}>
          Exit Game?
        </h2>
        
        <p className="confirm-message" style={{ 
          marginBottom: '2rem', 
          lineHeight: '1.5', 
          color: 'var(--text-muted)',
          fontSize: '0.95rem'
        }}>
          You are about to leave the current simulation. All unsaved progress will be permanently lost.
        </p>

        <div className="confirm-actions" style={{ 
          display: 'flex', 
          gap: '1rem',
          width: '100%'
        }}>
          <button
            className="glass-button stay-btn"
            onClick={handleCancel}
            style={{ flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Stay
          </button>
          <button
            className="glass-button exit-btn"
            onClick={handleConfirm}
            style={{ 
              flex: 1, 
              padding: '1rem', 
              background: 'rgba(255, 82, 82, 0.2)', 
              color: '#ff5252', 
              borderColor: 'rgba(255, 82, 82, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Exit
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .confirm-modal-overlay {
            padding: 0.75rem !important;
            padding-top: env(safe-area-inset-top, 0.75rem) !important;
            padding-bottom: env(safe-area-inset-bottom, 0.75rem) !important;
          }
          .confirm-modal-content {
            padding: 1.5rem !important;
            width: 95% !important;
            max-width: 360px !important;
            max-height: 85vh !important;
          }
          .confirm-icon-wrapper {
            width: 48px !important;
            height: 48px !important;
            margin-bottom: 1rem !important;
          }
          .confirm-title {
            font-size: 1.25rem !important;
          }
          .confirm-message {
            font-size: 0.85rem !important;
            margin-bottom: 1.5rem !important;
          }
          .confirm-actions {
            flex-direction: row !important;
            gap: 0.75rem !important;
          }
          .stay-btn, .exit-btn {
            padding: 1rem 0.5rem !important;
            font-size: 1rem !important;
            flex: 1 !important;
            min-width: 0;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            height: 3.5rem !important; /* Force equal height */
          }
          .exit-btn {
            background: rgba(255, 82, 82, 0.3) !important;
          }
        }
      `}</style>
    </div>


  );
}
