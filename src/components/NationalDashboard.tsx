import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { LogOut, FastForward, Info } from 'lucide-react';
import { playClick } from '../utils/sfx';

export default function NationalDashboard() {
  const { turn, playerState, seats, factionNames, factionParties, factionColors, setExitConfirmationOpen, setGamePhase } = useGameStore();
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
          color, 
          fontWeight: '800', 
          fontSize: '1.4rem', 
          fontFamily: 'var(--font-heading)',
          textShadow: `0 0 10px ${color}44`
        }}>
          {seatCounts[factionKey as keyof typeof seatCounts]}
        </div>
        <div style={{ 
          fontSize: '0.75rem', 
          color: isPopped ? 'var(--text-primary)' : 'var(--text-muted)', 
          whiteSpace: 'nowrap',
          fontWeight: '600',
          letterSpacing: '0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
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
              border: `1px solid ${color}44`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 15px ${color}22`
            }}
          >
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '1px' }}>Component Parties</div>
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
      width: '95%', maxWidth: '1200px', padding: '0.8rem 2.5rem', zIndex: 10,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <div className="flex-column" style={{ minWidth: '160px', gap: '4px' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '800' }}>Status Report</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-heading)', lineHeight: '1' }}>Day {turn} of 14</h2>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Campaign Phase</span>
      </div>

      <div className="flex-center" style={{ gap: 'max(1rem, 2vw)', flex: 1, padding: '0 1rem' }}>
        {renderFactionBlock('Faction1', factionColors.Faction1)}
        {renderFactionBlock('Faction2', factionColors.Faction2)}
        {renderFactionBlock('Faction3', factionColors.Faction3)}
        
        <div style={{ textAlign: 'center', opacity: 0.8 }}>
          <div style={{ color: factionColors.Undecided, fontWeight: '800', fontSize: '1.2rem' }}>{seatCounts.Undecided}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Undecided</div>
        </div>
        
        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }}></div>

        <div className="flex-center" style={{ gap: '1.5rem' }}>
          <div className="flex-column" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Campaign Funds</span>
            <div style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--accent-gold)', fontFamily: 'var(--font-heading)' }}>
              RM {(playerState.funds / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="flex-column" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pol. Capital</span>
            <div style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--accent-teal)', fontFamily: 'var(--font-heading)' }}>
              {playerState.politicalCapital} PC
            </div>
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
