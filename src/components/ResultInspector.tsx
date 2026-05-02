import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { playClick } from '../utils/sfx';
import { availableParties } from '../data/parties';

interface ResultInspectorProps {
  seatId: string | null;
  onClose: () => void;
  stableResults: Record<string, any>;
  declaredSeatIds: string[];
}

export default function ResultInspector({ seatId, onClose, stableResults, declaredSeatIds }: ResultInspectorProps) {
  const { seats, factionNames, factionColors, factionParties, customParties } = useGameStore();
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [activeFactionPop, setActiveFactionPop] = useState<string | null>(null);

  const resolvePartyName = (id: string) => {
    const custom = customParties.find(cp => cp.id === id);
    if (custom) return custom.name;
    const available = availableParties.find(ap => ap.id === id);
    if (available) return available.name;
    return id;
  };
  
  if (!seatId) return null;
  const cleanId = seatId.replace('.', '');
  const seat = seats.find(s => s.id.replace('.', '') === cleanId);
  if (!seat) return null;

  const isDeclared = declaredSeatIds.includes(seat.id);
  const result = stableResults[seat.id];

  return (
    <div className="glass-panel animate-fade-in result-inspector-container" style={{ 
      position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)',
      width: '380px', padding: '1.5rem', zIndex: 30,
      background: 'rgba(10, 10, 12, 0.95)',
      boxShadow: '0 -10px 40px rgba(0,0,0,0.8)',
      borderRadius: '12px 12px 0 0'
    }}>
      <div className="flex-between inspector-header" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h3 style={{ fontSize: '1.4rem', margin: 0, fontFamily: 'var(--font-heading)' }}>{seat.name} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>({seat.id})</span></h3>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{seat.state}</div>
        </div>
        <button onClick={() => {
          onClose();
          playClick();
        }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', alignSelf: 'flex-start' }}>
          <X size={24} />
        </button>
      </div>

      <div className="inspector-content">
        {!isDeclared ? (
          <div style={{ 
            padding: '2rem 1rem', 
            textAlign: 'center', 
            background: 'rgba(0,0,0,0.3)', 
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div className="animate-pulse" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
            <div style={{ fontWeight: 'bold', letterSpacing: '1px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              COUNTING IN PROGRESS
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem' }}>
              No official result from SPR yet.
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1.2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Official Result</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 'bold', 
                  color: factionColors[result.winner] || 'white' 
                }}>
                  {factionNames[result.winner] || result.winner}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Majority: <strong style={{ color: 'white' }}>{result.majorityVotes.toLocaleString()}</strong>
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div>FACTION</div>
                  <div style={{ textAlign: 'right' }}>VOTES</div>
                  <div style={{ textAlign: 'right', width: '40px' }}>%</div>
               </div>
               
               {Object.entries(result.factionVotes)
                 .sort((a, b) => (b[1] as number) - (a[1] as number))
                 .map(([coalition, votes]) => {
                   const pop = result.perturbedTracker[coalition];
                   const color = factionColors[coalition] || 'var(--text-muted)';
                   const name = factionNames[coalition] || coalition;
                   if (name === 'Faction 3' && (!factionParties.Faction3 || factionParties.Faction3.length === 0)) return null;
                   
                   return (
                      <div key={coalition} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', alignItems: 'center', marginBottom: '8px', position: 'relative', zIndex: activeFactionPop === coalition ? 100 : 1 }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', cursor: 'pointer' }} onClick={() => { playClick(); setActiveFactionPop(activeFactionPop === coalition ? null : coalition); }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                            <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                            <Info size={10} style={{ opacity: 0.5, flexShrink: 0 }} />
                         </div>

                         {/* Party Popover */}
                         {activeFactionPop === coalition && (
                           <div 
                             className="glass-panel animate-fade-in" 
                             style={{ 
                               position: 'absolute', 
                               top: '100%', 
                               left: '0', 
                               zIndex: 1000,
                               padding: '0.6rem',
                               minWidth: '180px',
                               background: 'rgba(10, 10, 12, 0.98)',
                               border: `1px solid ${color}88`,
                               boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
                             }}
                           >
                             <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '1px', fontWeight: 'bold' }}>Component Parties</div>
                             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                               {(factionParties[coalition as keyof typeof factionParties] || []).map(p => (
                                 <span key={p} style={{ 
                                   fontSize: '0.65rem', 
                                   background: 'rgba(255,255,255,0.05)', 
                                   padding: '1px 6px', 
                                   borderRadius: '4px',
                                   color: 'var(--text-primary)',
                                   border: '1px solid rgba(255,255,255,0.1)'
                                 }}>
                                   {resolvePartyName(p)}
                                 </span>
                               ))}
                             </div>
                           </div>
                         )}
                        <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                           {(votes as number).toLocaleString()}
                        </div>
                        <div style={{ textAlign: 'right', fontWeight: 'bold', width: '40px' }}>
                           {(pop as number).toFixed(1)}
                        </div>
                     </div>
                   );
               })}
               <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.1)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div>Total Valid Votes</div>
                  <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>{result.totalVotes.toLocaleString()}</div>
                  <div style={{ width: '40px' }}></div>
               </div>
            </div>

            <button 
               className="glass-button" 
               style={{ width: '100%', padding: '8px', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.05)' }}
               onClick={() => { playClick(); setShowMoreInfo(!showMoreInfo); }}
            >
               {showMoreInfo ? 'Hide Info' : 'More Info'} {showMoreInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showMoreInfo && (
              <div className="animate-fade-in" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Demographics</div>
                <div style={{ fontSize: '0.85rem', marginBottom: '12px' }}>{seat.demographics}</div>
                
                {seat.ethnicity && (
                  <div className="ethnicity-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    columnGap: '12px', 
                    rowGap: '6px', 
                    fontSize: '0.8rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    paddingTop: '8px'
                  }}>
                    {seat.ethnicity.malay > 0 && <div>Malay: <b>{seat.ethnicity.malay}%</b></div>}
                    {seat.ethnicity.chinese > 0 && <div>Chinese: <b>{seat.ethnicity.chinese}%</b></div>}
                    {seat.ethnicity.indian > 0 && <div>Indian: <b>{seat.ethnicity.indian}%</b></div>}
                    {seat.ethnicity.bumiSabah > 0 && <div>B. Sabah: <b>{seat.ethnicity.bumiSabah}%</b></div>}
                    {seat.ethnicity.bumiSarawak > 0 && <div>B. S'wak: <b>{seat.ethnicity.bumiSarawak}%</b></div>}
                    {seat.ethnicity.orangAsli > 0 && <div>O. Asli: <b>{seat.ethnicity.orangAsli}%</b></div>}
                    {seat.ethnicity.others > 0 && <div>Others: <b>{seat.ethnicity.others}%</b></div>}
                  </div>
                )}
                
                {seat.winnerGE15 && (
                   <div style={{ marginTop: '1rem', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>GE15 Winner: </span>
                      <strong style={{ color: factionColors[seat.winnerGE15] || 'white' }}>{seat.winnerGE15}</strong>
                   </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .result-inspector-container {
            bottom: 0 !important;
            left: 0 !important;
            transform: none !important;
            width: 100% !important;
            border-radius: 20px 20px 0 0 !important;
            padding: 1.2rem !important;
            max-height: 80vh !important;
            display: flex !important;
            flex-direction: column !important;
            box-shadow: 0 -10px 40px rgba(0,0,0,0.5) !important;
          }
          .inspector-content {
            overflow-y: auto !important;
            flex: 1 !important;
            padding-right: 5px !important;
          }
        }
      `}</style>
    </div>
  );
}
