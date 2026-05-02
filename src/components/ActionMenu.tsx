import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { 
  Megaphone, 
  AlertTriangle, 
  ShieldCheck, 
  Users, 
  CloudLightning,
  Smartphone,
  X,
  Target
} from 'lucide-react';
import { getSeatsInSameState, getThematicManifestoEffect } from '../utils/campaignUtils';
import { playClick, playDayEnd, playError } from '../utils/sfx';

type ActionType = 'CERAMAH' | 'SMEAR' | 'SOCIAL_MEDIA' | 'GROUND_WAR' | 'CYBER_ATTACK' | 'MANIFESTO_THEMATIC' | 'FUNDRAISING' | 'POLITICAL_LOBBYING';

export default function ActionMenu({ activeSeatId }: { activeSeatId: string | null }) {
  const [open, setOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    playAction, nextTurn, playerState, seats, actionsRemaining, 
    pushNotification, turn, isCheatMode, notificationQueue 
  } = useGameStore();

  const activeSeat = activeSeatId ? seats.find(s => s.id === activeSeatId || s.id.replace('.', '') === activeSeatId) : null;

  // Immediate transition if notice is dismissed
  useEffect(() => {
    if (isTransitioning && notificationQueue.length === 0) {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
      nextTurn();
    }
  }, [isTransitioning, notificationQueue.length, nextTurn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  const handleAction = (type: ActionType) => {
    playClick();
    let costF = 0;
    let costPC = 0;
    let collectedFunds = 0;
    
    if (type === 'CERAMAH') { costF = 1000000; costPC = 5; }
    if (type === 'SMEAR') { costF = 500000; costPC = 15; }
    if (type === 'SOCIAL_MEDIA') { costF = 1000000; costPC = 20; }
    if (type === 'GROUND_WAR') { costF = 500000; costPC = 10; }
    if (type === 'CYBER_ATTACK') { costF = 500000; costPC = 15; }
    if (type === 'MANIFESTO_THEMATIC') { costF = 3000000; costPC = 30; }
    if (type === 'FUNDRAISING') { 
        costF = 0; 
        costPC = 15; 
        // Generate funds in clean RM 100,000 increments (between 0.5M and 2.0M)
        collectedFunds = (Math.floor(Math.random() * (20 - 5 + 1)) + 5) * 100000;
    }
    if (type === 'POLITICAL_LOBBYING') { costF = 2000000; costPC = -15; }

    let backlashOccurred = false;
    let nationalAddressBoost = 0;

    if (type === 'MANIFESTO_THEMATIC') {
      nationalAddressBoost = Number((Math.random() * (5.0 - 2.0) + 2.0).toFixed(1));
    }

    const success = playAction(costF, costPC, (currentSeats) => {
      // Handle backlash check (30% chance for certain actions)
      if (type === 'SMEAR' || type === 'CYBER_ATTACK') {
        if (Math.random() < 0.3) {
          backlashOccurred = true;
        }
      }

      // Pre-calculate target seats for regional effects
      const stateSeats = activeSeatId ? getSeatsInSameState(currentSeats, activeSeatId) : [];
      const stateSeatIds = stateSeats.map(s => s.id);

      // Manifesto category for thematic launch (choose one randomly or rotate)
      const categories: ("Economy" | "Identity" | "Institutional" | "Infrastructure" | "Labor")[] = ["Economy", "Identity", "Labor"];
      const selectedCategory = categories[Math.floor(Math.random() * categories.length)];

      return currentSeats.map(s => {
        const isSelected = activeSeatId && (s.id === activeSeatId || s.id.replace('.', '') === activeSeatId);
        const isInState = stateSeatIds.includes(s.id);
        
        const newTracker = { ...s.popularityTracker };
        const myCoal = playerState.currentCoalition as keyof typeof newTracker;
        
        // Base effect magnitude
        let boost = 0;
        let penalty = 0;

        if (type === 'CERAMAH') {
          if (isSelected) boost = 6;
          else if (isInState) boost = 3;
          else boost = 0;
          
          newTracker[myCoal] = Math.min(100, newTracker[myCoal] + boost);
        } 
        else if (type === 'SMEAR') {
           if (isSelected) {
             let opp = findHighestOpponent(newTracker, myCoal as string);
             newTracker[opp as keyof typeof newTracker] = Math.max(0, newTracker[opp as keyof typeof newTracker] - (backlashOccurred ? 4 : 8));
             newTracker[myCoal] += (backlashOccurred ? 0 : 4);
           }
        }
        else if (type === 'SOCIAL_MEDIA') {
          // National effect, weighted for Urban
          boost = s.isUrban ? 4 : 1;
          newTracker[myCoal] = Math.min(100, newTracker[myCoal] + boost);
        }
        else if (type === 'GROUND_WAR') {
          // Localized effect, weighted for Rural
          if (isSelected) {
            boost = s.isRural ? 8 : 3;
            newTracker[myCoal] = Math.min(100, newTracker[myCoal] + boost);
          }
        }
        else if (type === 'CYBER_ATTACK') {
          // National opponent drop
          let opp = findHighestOpponent(newTracker, myCoal as string);
          penalty = backlashOccurred ? 0 : 3;
          newTracker[opp as keyof typeof newTracker] = Math.max(0, newTracker[opp as keyof typeof newTracker] - penalty);
          if (backlashOccurred) newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 2);
        }
        else if (type === 'MANIFESTO_THEMATIC') {
          // Powerful Nationwide boost (Buffed: 2-5%)
          newTracker[myCoal] = Math.min(100, newTracker[myCoal] + nationalAddressBoost);
        }
        else if (type === 'FUNDRAISING') {
          // Funds added below via state update
        }
        else if (type === 'POLITICAL_LOBBYING') {
          // No popularity hit anymore
        }
        
        return { ...s, popularityTracker: newTracker };
      });
    });

    if (success && type === 'FUNDRAISING') {
        useGameStore.setState((s) => ({
            playerState: {
                ...s.playerState,
                funds: s.playerState.funds + collectedFunds
            }
        }));
    }

    if (success && type === 'POLITICAL_LOBBYING') {
        // No stability hit anymore
    }

    if (success && type === 'MANIFESTO_THEMATIC') {
        // Stability boost for National Address
        useGameStore.setState((s) => ({
            playerState: {
                ...s.playerState,
                stability: Math.min(100, s.playerState.stability + 5)
            }
        }));
    }

    if (success) {
      if (backlashOccurred) {
        playError();
        pushNotification({
          title: "Backlash Triggered",
          message: "⚠️ Backlash! Voters perceived your aggressive tactics as hate speech, alienating moderate support.",
          type: "warning",
          duration: 6000
        });
      } else {
        let successMsg = "Action executed successfully!";
        if (type === 'CERAMAH' && activeSeat) successMsg = `Ceramah mobilized supporters across ${activeSeat.state}!`;
        else if (type === 'SMEAR' && activeSeat) successMsg = `Smear campaign executed in ${activeSeat.name}!`;
        else if (type === 'GROUND_WAR' && activeSeat) successMsg = `Ground operation in ${activeSeat.name} completed.`;
        else if (type === 'SOCIAL_MEDIA') successMsg = "Campaign gained traction among young and urban voters!";
        else if (type === 'CYBER_ATTACK') successMsg = "Opposition narrative weakened; widespread confusion triggered among opponent supporters.";
        else if (type === 'MANIFESTO_THEMATIC') successMsg = `National Address complete! Public confidence surged by ${nationalAddressBoost}% nationwide.`;
        else if (type === 'FUNDRAISING') successMsg = `Grassroots Milo Tin drive successful! Collected RM ${(collectedFunds / 1000000).toFixed(2)}M.`;
        else if (type === 'POLITICAL_LOBBYING') successMsg = "Cash is King! Strategic lobbying has secured 15 Political Capital.";

        pushNotification({
          title: "Success",
          message: successMsg,
          type: "success",
          duration: 6000
        });
      }
      setOpen(false);
    } else {
      playError();
      const needsFunds = !isCheatMode && playerState.funds < costF;
      const needsPC = !isCheatMode && playerState.politicalCapital < costPC;
      const needsActions = actionsRemaining <= 0;

      let errorMsg = "Unable to execute action.";
      if (needsActions) errorMsg = "No strategic actions remaining for today.";
      else if (needsFunds && needsPC) errorMsg = "Insufficient Funds and Political Capital!";
      else if (needsFunds) errorMsg = "Insufficient Funds to deploy this strategy.";
      else if (needsPC) errorMsg = "Insufficient Political Capital to authorize this action.";

      pushNotification({
        title: "Action Failed",
        message: errorMsg,
        type: "error",
        duration: 6000
      });
    }
  };

  const findHighestOpponent = (tracker: Record<string, number>, myCoal: string) => {
    let opp = 'Others';
    let maxOpp = -1;
    for (const c in tracker) {
      if (c !== myCoal && c !== 'Undecided' && tracker[c] > maxOpp) {
          maxOpp = tracker[c];
          opp = c;
      }
    }
    return opp as keyof typeof tracker;
  };

  return (
    <div className="action-menu-container" style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '95%' }}>
      
      {open && (
        <div className="glass-panel animate-fade-in action-plan-panel" style={{ padding: '1.5rem', marginBottom: '10px', width: 'fit-content', maxWidth: '1400px', position: 'relative' }}>
          
          <div className="flex-between action-plan-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.8rem' }}>
            <div className="flex-column">
              <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '2px' }}>Strategic Action Plan</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span className="action-subtext" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Deploy resources to sway voters</span>
                {activeSeat && (
                  <div className="target-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="desktop-only" style={{ color: 'var(--border-glass)' }}>|</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Target size={12} /> Targeting: {activeSeat.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button 
              className="glass-button flex-center close-btn" 
              onClick={() => setOpen(false)}
              style={{ padding: '0.5rem', borderRadius: '50%', width: '32px', height: '32px' }}
            >
              <X size={18} />
            </button>
          </div>

          <div className="action-buttons-grid" style={{ display: 'flex', gap: '0.8rem', flexWrap: 'nowrap', justifyContent: 'center' }}>
            <ActionBtn 
              icon={<Megaphone size={20} />} 
              label="Ceramah" 
              sub="RM 1.0M | 5 PC" 
              desc={!activeSeat ? "Target Required" : "Statewide rally"}
              onClick={() => handleAction('CERAMAH')} 
              disabled={!activeSeat || isTransitioning}
            />
            
            <ActionBtn 
              icon={<AlertTriangle size={20} />} 
              label="Smear" 
              sub="RM 0.5M | 15 PC" 
              desc={!activeSeat ? "Target Required" : "Targeted damage"}
              onClick={() => handleAction('SMEAR')} 
              disabled={!activeSeat || isTransitioning}
            />

            <ActionBtn 
              icon={<Smartphone size={20} />} 
              label="Online Campaign" 
              sub="RM 1.0M | 20 PC" 
              desc="Young & urban boost"
              onClick={() => handleAction('SOCIAL_MEDIA')} 
              disabled={isTransitioning}
            />

            <ActionBtn 
              icon={<Users size={20} />} 
              label="Ground War" 
              sub="RM 0.5M | 10 PC" 
              desc={!activeSeat ? "Target Required" : "Localized rural"}
              onClick={() => handleAction('GROUND_WAR')} 
              disabled={!activeSeat || isTransitioning}
            />

            <ActionBtn 
              icon={<CloudLightning size={20} />} 
              label="Cyber Attack" 
              sub="RM 0.5M | 15 PC" 
              desc="National disruption"
              onClick={() => handleAction('CYBER_ATTACK')} 
              disabled={isTransitioning}
            />

            <ActionBtn 
              icon={<ShieldCheck size={20} />} 
              label="National Address" 
              sub="RM 3.0M | 30 PC" 
              desc="Nationwide +2-5% boost & +5 Stability"
              onClick={() => handleAction('MANIFESTO_THEMATIC')} 
              disabled={isTransitioning}
            />

            <ActionBtn 
              icon={<Users size={20} />} 
              label="Milo Tin Drive" 
              sub="Random RM | 15 PC" 
              desc="Grassroots fundraising"
              onClick={() => handleAction('FUNDRAISING')} 
              disabled={isTransitioning}
            />

            <ActionBtn 
              icon={<ShieldCheck size={20} />} 
              label="Lobbying" 
              sub="RM 2.0M | +15 PC" 
              desc="Cash is King"
              onClick={() => handleAction('POLITICAL_LOBBYING')} 
              disabled={isTransitioning}
            />
          </div>

        </div>
      )}

      {/* Campaign Dashboard Bottom Bar */}
      <div className="bottom-bar-layout" style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '1200px' }}>
        
        {/* Resources & Stability - Centered Status Bar */}
        <div className="glass-panel resource-bar" style={{ padding: '0.5rem 1.5rem', display: 'flex', gap: '2rem', alignItems: 'center', background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex-column resource-item" style={{ alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Funds</span>
            <span style={{ fontSize: isCheatMode ? '1.5rem' : '1.1rem', fontWeight: 'bold', color: 'var(--accent-gold)', lineHeight: 1 }}>
              {isCheatMode ? '∞' : `RM ${(playerState.funds / 1000000).toFixed(1)}M`}
            </span>
          </div>
          
          <div className="desktop-only" style={{ width: '1px', height: '28px', background: 'var(--border-glass)' }}></div>
          
          <div className="flex-column resource-item" style={{ alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>PC</span>
            <span style={{ fontSize: isCheatMode ? '1.5rem' : '1.1rem', fontWeight: 'bold', color: 'var(--accent-teal)', lineHeight: 1 }}>
              {isCheatMode ? '∞' : playerState.politicalCapital}
            </span>
          </div>

          <div className="desktop-only" style={{ width: '1px', height: '28px', background: 'var(--border-glass)' }}></div>

          {/* Stability Widget */}
          <div className="flex-column stability-widget" style={{ alignItems: 'flex-start', minWidth: '120px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '2px' }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Stability</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: playerState.stability < 50 ? '#ff5252' : '#00e676' }}>{Math.round(playerState.stability)}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ 
                  width: `${playerState.stability}%`, 
                  height: '100%', 
                  background: playerState.stability < 40 ? '#ff5252' : playerState.stability < 70 ? '#ffab00' : '#00c853',
                  boxShadow: playerState.stability < 50 ? '0 0 10px rgba(255, 82, 82, 0.4)' : 'none',
                  transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }} />
            </div>
          </div>
        </div>

        <div className="glass-panel actions-count-panel" style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: actionsRemaining > 0 ? 'var(--accent-teal)' : '#ff5252' }}>
            {actionsRemaining}
          </span>
        </div>

        <button 
          className={`glass-button plan-btn ${open ? 'active' : ''}`}
          disabled={isTransitioning}
          onClick={() => {
            setOpen(!open);
            playClick();
          }}
          style={{ padding: '1rem 2rem', fontSize: '1.1rem', minWidth: '160px', opacity: isTransitioning ? 0.5 : 1 }}
        >
          {open ? 'Back' : 'Plan Action'}
        </button>
        
        <button 
          className="glass-button active pulse-glow end-day-btn" 
          disabled={isTransitioning}
          onClick={() => {
            if (turn >= 14) {
              setIsTransitioning(true);
              pushNotification({
                title: "Campaign Concluded",
                message: "Final strategies deployed. Proceeding to Election Night...",
                type: "success",
                duration: 4500
              });
            }
            
            // nextTurn in gameStore will push the 'Day Complete' notification
            const timeout = setTimeout(() => {
              nextTurn();
            }, turn < 14 ? 500 : 5000);

            if (turn >= 14) {
              transitionTimeoutRef.current = timeout;
            }
            
            playDayEnd();
          }}
          style={{ padding: '1rem 2rem', fontSize: '1.1rem', opacity: isTransitioning ? 0.7 : 1 }}
        >
          {turn < 14 ? 'End Day' : 'Election Night'}
        </button>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .action-menu-container {
            bottom: calc(env(safe-area-inset-bottom, 0px) + 10px) !important;
            width: 98% !important;
            gap: 0.5rem !important;
          }
          .action-plan-panel {
            width: 100% !important;
            padding: 1rem !important;
            margin-bottom: 5px !important;
          }
          .action-plan-header {
            margin-bottom: 1rem !important;
          }
          .action-buttons-grid {
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }
          .action-buttons-grid > button {
            width: calc(33.33% - 0.4rem) !important;
            padding: 0.5rem !important;
          }
          .bottom-bar-layout {
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }
          .resource-bar {
            width: 100% !important;
            padding: 0.4rem 1rem !important;
            gap: 1rem !important;
            order: 1;
          }
          .resource-item span:first-child {
            font-size: 0.5rem !important;
          }
          .resource-item span:last-child {
            font-size: 0.9rem !important;
          }
          .actions-count-panel {
            flex: 1 !important;
            order: 2;
            padding: 0.4rem !important;
            min-width: 0 !important;
          }
          .plan-btn, .end-day-btn {
            flex: 2 !important;
            order: 2;
            padding: 0.6rem 1rem !important;
            font-size: 0.9rem !important;
            min-width: 0 !important;
          }
          .stability-widget {
            min-width: 80px !important;
          }
          .target-info {
             margin-top: 2px;
          }
        }
      `}</style>
    </div>
  );
}

function ActionBtn({ icon, label, sub, desc, onClick, disabled }: { icon: any, label: string, sub: string, desc?: string, onClick: () => void, disabled?: boolean }) {
  return (
    <button 
      className={`glass-button flex-column flex-center ${disabled ? 'disabled-action' : 'action-btn-hover'}`} 
      onClick={disabled ? undefined : onClick} 
      style={{ 
        width: '115px', 
        padding: '1rem 0.5rem', 
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        filter: disabled ? 'grayscale(1)' : 'none'
      }}
    >
      <div style={{ marginBottom: '8px', color: disabled ? 'var(--text-muted)' : 'var(--accent-blue)' }}>{icon}</div>
      <span style={{ fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontSize: '0.65rem', color: disabled ? 'var(--text-muted)' : 'var(--accent-gold)', marginTop: '4px' }}>{sub}</span>
      {desc && <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center', lineHeight: '1.2' }}>{desc}</span>}
    </button>
  );
}
