import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { 
  Megaphone, 
  AlertTriangle, 
  ShieldCheck, 
  Users, 
  CloudLightning,
  Smartphone
} from 'lucide-react';
import { getSeatsInSameState, getThematicManifestoEffect } from '../utils/campaignUtils';
import { playClick } from '../utils/sfx';

type ActionType = 'CERAMAH' | 'SMEAR' | 'SOCIAL_MEDIA' | 'GROUND_WAR' | 'CYBER_ATTACK' | 'MANIFESTO_THEMATIC';

export default function ActionMenu({ activeSeatId }: { activeSeatId: string | null }) {
  const [open, setOpen] = useState(false);
  const { playAction, nextTurn, playerState, actionsRemaining, pushNotification } = useGameStore();

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
      if (type === 'MANIFESTO_THEMATIC') {
        pushNotification({
          title: "Thematic Rally",
          message: "Campaign Rally executed! Focusing on your core manifesto pillars.",
          type: "success",
          duration: 3000
        });
      }
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
    <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
      
      {open && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1rem', display: 'flex', gap: '0.8rem', marginBottom: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          
          <ActionBtn 
            icon={<Megaphone size={20} />} 
            label="Ceramah" 
            sub="RM 0.5M | State" 
            onClick={() => handleAction('CERAMAH')} 
          />
          
          <ActionBtn 
            icon={<AlertTriangle size={20} />} 
            label="Smear" 
            sub="RM 0.2M | Local" 
            onClick={() => handleAction('SMEAR')} 
          />

          <ActionBtn 
            icon={<Smartphone size={20} />} 
            label="Social Blitz" 
            sub="RM 1.0M | Urban" 
            onClick={() => handleAction('SOCIAL_MEDIA')} 
          />

          <ActionBtn 
            icon={<Users size={20} />} 
            label="Ground War" 
            sub="RM 0.1M | Rural" 
            onClick={() => handleAction('GROUND_WAR')} 
          />

          <ActionBtn 
            icon={<CloudLightning size={20} />} 
            label="Cyber Attack" 
            sub="RM 0.3M | National" 
            onClick={() => handleAction('CYBER_ATTACK')} 
          />

          <ActionBtn 
            icon={<ShieldCheck size={20} />} 
            label="Policy Rally" 
            sub="RM 1.5M | National" 
            onClick={() => handleAction('MANIFESTO_THEMATIC')} 
          />

        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        
        <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions Left</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: actionsRemaining > 0 ? 'var(--accent-teal)' : '#ff5252' }}>
            {actionsRemaining} / 3
          </span>
        </div>

        <button 
          className="glass-button" 
          onClick={() => {
            setOpen(!open);
            playClick();
          }}
          style={{ padding: '1rem 2rem', fontSize: '1.1rem', minWidth: '140px' }}
        >
          {open ? 'Close' : 'Plan Action'}
        </button>
        
        <button 
          className="glass-button active pulse-glow" 
          onClick={() => {
            nextTurn();
            playClick();
          }}
          style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
        >
          End Day
        </button>
      </div>

    </div>
  );
}

function ActionBtn({ icon, label, sub, onClick }: { icon: any, label: string, sub: string, onClick: () => void }) {
  return (
    <button className="glass-button flex-column flex-center action-btn-hover" onClick={onClick} style={{ width: '110px', padding: '0.8rem', flexShrink: 0 }}>
      <div style={{ marginBottom: '8px', color: 'var(--accent-blue)' }}>{icon}</div>
      <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{label}</span>
      <span style={{ fontSize: '0.6rem', color: 'var(--accent-gold)', marginTop: '2px' }}>{sub}</span>
    </button>
  );
}
