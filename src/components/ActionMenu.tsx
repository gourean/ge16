import { useState } from 'react';
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
import { playClick, playDayEnd } from '../utils/sfx';

type ActionType = 'CERAMAH' | 'SMEAR' | 'SOCIAL_MEDIA' | 'GROUND_WAR' | 'CYBER_ATTACK' | 'MANIFESTO_THEMATIC';

export default function ActionMenu({ activeSeatId }: { activeSeatId: string | null }) {
  const [open, setOpen] = useState(false);
  const { playAction, nextTurn, playerState, seats, actionsRemaining, pushNotification, turn, isCheatMode } = useGameStore();

  const activeSeat = activeSeatId ? seats.find(s => s.id === activeSeatId || s.id.replace('.', '') === activeSeatId) : null;

  const handleAction = (type: ActionType) => {
    playClick();
    let costF = 0;
    let costPC = 0;
    
    if (type === 'CERAMAH') { costF = 500000; costPC = 5; }
    if (type === 'SMEAR') { costF = 200000; costPC = 15; }
    if (type === 'SOCIAL_MEDIA') { costF = 1000000; costPC = 20; }
    if (type === 'GROUND_WAR') { costF = 100000; costPC = 10; }
    if (type === 'CYBER_ATTACK') { costF = 300000; costPC = 15; }
    if (type === 'MANIFESTO_THEMATIC') { costF = 1500000; costPC = 25; }

    const success = playAction(costF, costPC, (currentSeats) => {
      // Handle backlash check (20% chance for certain actions)
      let backlash = false;
      if (type === 'SMEAR' || type === 'CYBER_ATTACK') {
        if (Math.random() < 0.2) {
          backlash = true;
          // Notify backlash via in-game notification
          setTimeout(() => pushNotification({
            title: "Backlash Triggered",
            message: "⚠️ Your aggressive tactics have alienated some moderate voters. Popularity gains reduced.",
            type: "warning"
          }), 100);
        }
      }

      // Pre-calculate target seats for regional effects
      const stateSeats = activeSeatId ? getSeatsInSameState(currentSeats, activeSeatId) : [];
      const stateSeatIds = stateSeats.map(s => s.id);

      // Manifesto category for thematic launch (choose one randomly or rotate)
      const categories: ("Economy" | "Identity" | "Institutional" | "Infrastructure" | "Labor")[] = ["Economy", "Identity", "Labor"];
      const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
      const manifestoBonus = type === 'MANIFESTO_THEMATIC' ? getThematicManifestoEffect(selectedCategory, playerState.manifestoChoices) : null;

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
          
          newTracker[myCoal] = Math.min(100, newTracker[myCoal] + (backlash ? boost * 0.5 : boost));
        } 
        else if (type === 'SMEAR') {
           if (isSelected) {
             let opp = findHighestOpponent(newTracker, myCoal as string);
             newTracker[opp as keyof typeof newTracker] = Math.max(0, newTracker[opp as keyof typeof newTracker] - (backlash ? 4 : 8));
             newTracker[myCoal] += (backlash ? 0 : 4);
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
          penalty = backlash ? 0 : 3;
          newTracker[opp as keyof typeof newTracker] = Math.max(0, newTracker[opp as keyof typeof newTracker] - penalty);
          if (backlash) newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 2);
        }
        else if (type === 'MANIFESTO_THEMATIC') {
          // Boost based on manifesto choices
          if (manifestoBonus) {
            Object.entries(manifestoBonus).forEach(([demo, val]) => {
              // Simple mapping: if seat matches demo or has it in data
              if (demo === 'urban' && s.isUrban) newTracker[myCoal] += (val / 10);
              if (demo === 'rural' && s.isRural) newTracker[myCoal] += (val / 10);
              if (demo === 'borneo' && s.isBorneo) newTracker[myCoal] += (val / 10);
              // General boost for others
              if (['youth', 'b40', 'm40', 'reformist', 'nationalist'].includes(demo)) {
                newTracker[myCoal] += (val / 20);
              }
            });
          }
          newTracker[myCoal] = Math.min(100, newTracker[myCoal]);
        }
        
        return { ...s, popularityTracker: newTracker };
      });
    });

    if (success) {
      let successMsg = "Action executed successfully!";
      if (type === 'CERAMAH' && activeSeat) successMsg = `Ceramah mobilized supporters across ${activeSeat.state}!`;
      else if (type === 'SMEAR' && activeSeat) successMsg = `Smear campaign executed in ${activeSeat.name}!`;
      else if (type === 'GROUND_WAR' && activeSeat) successMsg = `Ground operation in ${activeSeat.name} completed.`;
      else if (type === 'SOCIAL_MEDIA') successMsg = "Social Blitz boosted national urban sentiment!";
      else if (type === 'CYBER_ATTACK') successMsg = "Cyber attack disrupted opponent communications!";
      else if (type === 'MANIFESTO_THEMATIC') successMsg = "Policy Rally energized the base!";

      pushNotification({
        title: "Success",
        message: successMsg,
        type: "success",
        duration: 3000
      });
      setOpen(false);
    } else {
      pushNotification({
        title: "Action Failed",
        message: actionsRemaining <= 0 ? "You have no actions remaining today." : "Not enough funds or political capital!",
        type: "error"
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
              sub="RM 0.5M | 5 PC" 
              desc={!activeSeat ? "Target Required" : "Statewide rally"}
              onClick={() => handleAction('CERAMAH')} 
              disabled={!activeSeat}
            />
            
            <ActionBtn 
              icon={<AlertTriangle size={20} />} 
              label="Smear" 
              sub="RM 0.2M | 15 PC" 
              desc={!activeSeat ? "Target Required" : "Targeted damage"}
              onClick={() => handleAction('SMEAR')} 
              disabled={!activeSeat}
            />

            <ActionBtn 
              icon={<Smartphone size={20} />} 
              label="Social Blitz" 
              sub="RM 1.0M | 20 PC" 
              desc="National urban boost"
              onClick={() => handleAction('SOCIAL_MEDIA')} 
            />

            <ActionBtn 
              icon={<Users size={20} />} 
              label="Ground War" 
              sub="RM 0.1M | 10 PC" 
              desc={!activeSeat ? "Target Required" : "Localized rural"}
              onClick={() => handleAction('GROUND_WAR')} 
              disabled={!activeSeat}
            />

            <ActionBtn 
              icon={<CloudLightning size={20} />} 
              label="Cyber Attack" 
              sub="RM 0.3M | 15 PC" 
              desc="National disruption"
              onClick={() => handleAction('CYBER_ATTACK')} 
            />

            <ActionBtn 
              icon={<ShieldCheck size={20} />} 
              label="Policy Rally" 
              sub="RM 1.5M | 25 PC" 
              desc="Manifesto boost"
              onClick={() => handleAction('MANIFESTO_THEMATIC')} 
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
          onClick={() => {
            setOpen(!open);
            playClick();
          }}
          style={{ padding: '1rem 2rem', fontSize: '1.1rem', minWidth: '160px' }}
        >
          {open ? 'Back' : 'Plan Action'}
        </button>
        
        <button 
          className="glass-button active pulse-glow end-day-btn" 
          onClick={() => {
            if (turn < 14) {
              pushNotification({
                title: "Day Complete",
                message: `Day ${turn} strategy finalized. Actions replenished.`,
                type: "info",
                duration: 1500
              });
            } else {
              pushNotification({
                title: "Campaign Concluded",
                message: "Final strategies deployed. Proceeding to Election Night...",
                type: "success",
                duration: 2000
              });
            }
            
            // Delay nextTurn so that it doesn't overlap at all with the summary
            setTimeout(() => {
              nextTurn();
            }, turn < 14 ? 1600 : 2100);
            playDayEnd();
          }}
          style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
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
