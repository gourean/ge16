import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { LogOut, FastForward, Info } from 'lucide-react';
import { playClick } from '../utils/sfx';

export default function NationalDashboard() {
  const { turn, seats, factionNames, factionParties, factionColors, setExitConfirmationOpen, setGamePhase } = useGameStore();
  const [activeFactionPop, setActiveFactionPop] = useState<string | null>(null);

  const handleExit = () => {
    setExitConfirmationOpen(true);
    playClick();
  };

  const handleEndCampaign = () => {
    playClick();
    setGamePhase('POST_ELECTION');
  };

  // Calculate current seat counts
  const seatCounts = { Faction1: 0, Faction2: 0, Faction3: 0, Others: 0, Undecided: 0 };
  
  seats.forEach(seat => {
    let leader = 'Others';
    let firstPop = -1;
    let secondPop = -1;
    for (const [coalition, pop] of Object.entries(seat.popularityTracker)) {
      if (pop > firstPop) {
        secondPop = firstPop;
        firstPop = pop;
        leader = coalition;
      } else if (pop > secondPop) {
        secondPop = pop;
      }
    }
    if (firstPop - secondPop <= 5) {
      leader = 'Undecided';
    }
    seatCounts[leader as keyof typeof seatCounts]++;
  });

  const getAbbreviation = (name: string) => {
    if (!name) return '';
    const words = name.trim().split(/\s+/);
    if (words.length > 1) {
      return words.map(w => w[0]).join('').toUpperCase();
    }
    // For single word names like "Undecided" or "Others", truncate or return as is
    if (name.length > 4) return name.substring(0, 3).toUpperCase();
    return name.toUpperCase();
  };
  const renderFactionBlock = (factionKey: string, color: string) => {
    const parties = factionParties[factionKey] || [];
    const isPopped = activeFactionPop === factionKey;
    
    return (
      <div 
        style={{ textAlign: 'center', position: 'relative', cursor: 'pointer', minWidth: 'fit-content' }} 
        className="faction-block flex-column flex-center"
        onClick={() => {
          playClick();
          setActiveFactionPop(isPopped ? null : factionKey);
        }}
      >
        <div style={{ 
          color: 'var(--text-primary)', 
          fontWeight: '800', 
          fontSize: '2.5rem', 
          fontFamily: 'var(--font-heading)',
          textShadow: `0 2px 10px rgba(0,0,0,0.5)`
        }}>
          {seatCounts[factionKey as keyof typeof seatCounts]}
        </div>
        <div style={{ 
          fontSize: '0.75rem', 
          color: isPopped ? 'var(--text-primary)' : 'var(--text-muted)', 
          whiteSpace: 'nowrap',
          fontWeight: '700',
          letterSpacing: '0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div className="faction-dot" style={{ 
            width: '10px', 
            height: '10px', 
            borderRadius: '50%', 
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`
          }} />
          <span className="faction-name">{factionNames[factionKey]}</span>
          <span className="faction-abbr" style={{ display: 'none' }}>{getAbbreviation(factionNames[factionKey])}</span>
          <Info className="faction-info-icon" size={10} style={{ opacity: 0.5 }} />
        </div>

        {/* Party Popover */}
        {isPopped && (
          <div 
            className="glass-panel animate-fade-in" 
            style={{ 
              position: 'absolute', 
              top: '110%', 
              left: '50%', 
              transform: 'translateX(-50%)',
              padding: '0.8rem',
              zIndex: 100,
              minWidth: '200px',
              border: `2px solid ${color}88`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 15px ${color}22`
            }}
          >
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px', fontWeight: 'bold' }}>Component Parties</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
              {parties.map(p => (
                <span key={p} style={{ 
                  fontSize: '0.7rem', 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="glass-panel dashboard-container" style={{ 
      position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', 
      width: '98%', maxWidth: '1300px', padding: '0.6rem 1.5rem', zIndex: 10,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <div className="flex-column status-report" style={{ minWidth: '140px', gap: '2px' }}>
        <div className="status-label" style={{ fontSize: '0.6rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '800' }}>Status Report</div>
        <h2 className="turn-label" style={{ fontSize: '1.2rem', fontWeight: '800', fontFamily: 'var(--font-heading)', lineHeight: '1' }}>Day {turn} of 14</h2>
        <span className="phase-label" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Campaign Phase</span>
      </div>

      <div className="flex-center factions-summary" style={{ gap: 'max(1.5rem, 3vw)', flex: 1, padding: '0 1rem' }}>
        {renderFactionBlock('Faction1', factionColors.Faction1)}
        {renderFactionBlock('Faction2', factionColors.Faction2)}
        {(factionParties.Faction3?.length > 0) && renderFactionBlock('Faction3', factionColors.Faction3)}
        
        <div style={{ textAlign: 'center', opacity: 0.9 }} className="faction-block flex-column flex-center undecided-block">
          <div className="faction-count" style={{ 
            color: 'var(--text-primary)', 
            fontWeight: '800', 
            fontSize: '2.5rem', 
            fontFamily: 'var(--font-heading)',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)' 
          }}>{seatCounts.Undecided}</div>
          <div className="faction-label" style={{ 
            fontSize: '0.75rem', 
            color: 'var(--text-muted)', 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'center',
            fontWeight: '700'
          }}>
            <div className="faction-dot" style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              backgroundColor: factionColors.Undecided,
              boxShadow: `0 0 8px ${factionColors.Undecided}44`,
              border: '1px solid rgba(255,255,255,0.2)'
            }} />
            <span className="faction-name">Undecided</span>
            <span className="faction-abbr" style={{ display: 'none' }}>{getAbbreviation('Undecided')}</span>
          </div>
        </div>
      </div>

      <div className="flex-center dashboard-actions" style={{ gap: '0.8rem', marginLeft: '1rem' }}>
        <button 
          onClick={handleEndCampaign}
          className="glass-button success skip-btn" 
          style={{ 
            borderRadius: '12px', 
            padding: '0.6rem 1rem',
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '0.8rem'
          }}
          title="End Campaign"
        >
          <FastForward size={16} />
          <span className="hide-on-small">Skip</span>
        </button>

        <button 
          onClick={handleExit}
          className="glass-button danger exit-btn" 
          style={{ 
            borderRadius: '12px', 
            padding: '0.6rem',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '40px',
            height: '40px'
          }}
          title="Exit Game"
        >
          <LogOut size={16} />
        </button>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .dashboard-container {
            padding: 0.4rem 0.5rem !important;
            top: calc(env(safe-area-inset-top, 0px) + 5px) !important;
            width: 100% !important;
            max-width: 100vw !important;
            border-radius: 0 0 12px 12px !important;
          }
          .status-report {
            min-width: 60px !important;
            margin-right: 4px !important;
          }
          .status-label, .phase-label {
            display: none !important;
          }
          .turn-label {
            font-size: 0.8rem !important;
            white-space: nowrap !important;
          }
          .factions-summary {
            gap: 0.3rem !important;
            padding: 0 !important;
            justify-content: center !important;
          }
          .faction-count {
            font-size: 1.3rem !important;
          }
          .faction-label {
            font-size: 0.55rem !important;
            gap: 2px !important;
          }
          .faction-name, .faction-info-icon {
            display: none !important;
          }
          .faction-abbr {
            display: inline !important;
          }
          .faction-dot {
            width: 6px !important;
            height: 6px !important;
          }
          .dashboard-actions {
            margin-left: 4px !important;
            gap: 0.3rem !important;
          }
          .skip-btn, .exit-btn {
            padding: 0.3rem !important;
            width: 28px !important;
            height: 28px !important;
            border-radius: 6px !important;
          }
          .skip-btn span {
            display: none !important;
          }
        }

      `}</style>
    </div>
  );
}
