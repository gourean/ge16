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
          <div style={{ 
            width: '10px', 
            height: '10px', 
            borderRadius: '50%', 
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`
          }} />
          {factionNames[factionKey]}
          <Info size={10} style={{ opacity: 0.5 }} />
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
    <div className="glass-panel" style={{ 
      position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', 
      width: '98%', maxWidth: '1300px', padding: '0.6rem 1.5rem', zIndex: 10,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <div className="flex-column" style={{ minWidth: '140px', gap: '2px' }}>
        <div style={{ fontSize: '0.6rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '800' }}>Status Report</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', fontFamily: 'var(--font-heading)', lineHeight: '1' }}>Day {turn} of 14</h2>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Campaign Phase</span>
      </div>

      <div className="flex-center" style={{ gap: 'max(1.5rem, 3vw)', flex: 1, padding: '0 1rem' }}>
        {renderFactionBlock('Faction1', factionColors.Faction1)}
        {renderFactionBlock('Faction2', factionColors.Faction2)}
        {(factionParties.Faction3?.length > 0) && renderFactionBlock('Faction3', factionColors.Faction3)}
        
        <div style={{ textAlign: 'center', opacity: 0.9 }} className="faction-block flex-column flex-center">
          <div style={{ 
            color: 'var(--text-primary)', 
            fontWeight: '800', 
            fontSize: '2.5rem', 
            fontFamily: 'var(--font-heading)',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)' 
          }}>{seatCounts.Undecided}</div>
          <div style={{ 
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
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              backgroundColor: factionColors.Undecided,
              boxShadow: `0 0 8px ${factionColors.Undecided}44`,
              border: '1px solid rgba(255,255,255,0.2)'
            }} />
            Undecided
          </div>
        </div>
      </div>

      <div className="flex-center" style={{ gap: '0.8rem', marginLeft: '1rem' }}>
        <button 
          onClick={handleEndCampaign}
          className="glass-button success" 
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
          className="glass-button danger" 
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
    </div>
  );
}
