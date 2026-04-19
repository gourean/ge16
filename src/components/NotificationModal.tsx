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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'all'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '450px',
        width: '90%',
        padding: '2rem',
        textAlign: 'center',
        border: `1px solid ${getAccentColor()}33`,
        position: 'relative',
        boxShadow: `0 0 30px ${getAccentColor()}11`
      }}>
        
        <button 
          onClick={dismissNotification}
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

        <div style={{ 
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
          <h2 style={{ 
            color: 'white', 
            marginBottom: '0.5rem',
            fontSize: '1.4rem'
          }}>
            {current.title}
          </h2>
        )}
        
        <p style={{ 
          marginBottom: '1.5rem', 
          lineHeight: '1.5', 
          color: 'var(--text-primary)',
          fontSize: '1rem'
        }}>
          {current.message}
        </p>

        <button
          className="glass-button"
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
    </div>
  );
}
