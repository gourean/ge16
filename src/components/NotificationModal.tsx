import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { CheckCircle, AlertTriangle, ShieldAlert, Info, X } from 'lucide-react';

export default function NotificationModal() {
  const { notificationQueue, dismissNotification } = useGameStore();
  const current = notificationQueue[0];

  useEffect(() => {
    if (current && current.duration) {
      const timer = setTimeout(() => {
        dismissNotification();
      }, current.duration);
      return () => clearTimeout(timer);
    }
  }, [current, dismissNotification]);

  if (!current) return null;

  const getIcon = () => {
    switch (current.type) {
      case 'success': return <CheckCircle size={32} color="var(--accent-teal)" />;
      case 'warning': return <AlertTriangle size={32} color="var(--accent-gold)" />;
      case 'error': return <ShieldAlert size={32} color="var(--accent-red)" />;
      case 'info': return <Info size={32} color="var(--accent-blue)" />;
      default: return <Info size={32} />;
    }
  };

  const getAccentColor = () => {
    switch (current.type) {
      case 'success': return 'var(--accent-teal)';
      case 'warning': return 'var(--accent-gold)';
      case 'error': return 'var(--accent-red)';
      case 'info': return 'var(--accent-blue)';
      default: return 'white';
    }
  };

  return (
    <div className="notification-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      pointerEvents: 'all'
    }}>
      <div className="glass-panel animate-fade-in notification-content" style={{
        maxWidth: '450px',
        width: '90%',
        maxHeight: '85vh',
        overflowY: 'auto',
        padding: '2rem',
        textAlign: 'center',
        border: `1px solid ${getAccentColor()}33`,
        position: 'relative',
        boxShadow: `0 0 30px ${getAccentColor()}11`
      }}>
        
        <button 
          onClick={dismissNotification}
          className="close-notif-btn"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        <div className="notif-icon-wrapper" style={{ 
          margin: '0 auto 1.2rem', 
          width: '56px', 
          height: '56px', 
          borderRadius: '50%', 
          background: `${getAccentColor()}11`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          {getIcon()}
        </div>

        {current.title && (
          <h2 className="notif-title" style={{ 
            color: 'white', 
            marginBottom: '0.5rem',
            fontSize: '1.4rem'
          }}>
            {current.title}
          </h2>
        )}
        
        <p className="notif-message" style={{ 
          marginBottom: '1.5rem', 
          lineHeight: '1.5', 
          color: 'var(--text-primary)',
          fontSize: '1rem'
        }}>
          {current.message}
        </p>

        <button
          className="glass-button dismiss-btn"
          onClick={dismissNotification}
          style={{ 
            minWidth: '120px',
            padding: '0.8rem 2rem',
            borderColor: `${getAccentColor()}44`,
            fontSize: '0.9rem'
          }}
        >
          Dismiss
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .notification-overlay {
            padding: 0.5rem !important;
            padding-top: env(safe-area-inset-top, 0px) !important;
            padding-bottom: env(safe-area-inset-bottom, 0px) !important;
          }
          .notification-content {
            padding: 1.5rem !important;
            max-height: 80vh !important;
          }
          .notif-icon-wrapper {
            width: 44px !important;
            height: 44px !important;
            margin-bottom: 0.8rem !important;
          }
          .notif-title {
            font-size: 1.1rem !important;
          }
          .notif-message {
            font-size: 0.9rem !important;
            margin-bottom: 1rem !important;
          }
          .dismiss-btn {
            padding: 0.6rem 1.5rem !important;
            font-size: 0.85rem !important;
          }
        }
      `}</style>
    </div>

  );
}
