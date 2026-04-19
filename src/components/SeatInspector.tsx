import { useGameStore } from '../store/gameStore';
import { X } from 'lucide-react';
import { playClick } from '../utils/sfx';

export default function SeatInspector({ seatId, onClose }: { seatId: string | null; onClose: () => void }) {
  const { seats, factionNames, factionParties, factionColors } = useGameStore();
  
  if (!seatId) return null;
  const seat = seats.find(s => s.id.replace('.', '') === seatId);
  if (!seat) return null;

  return (
    <div className="glass-panel animate-fade-in" style={{ 
      position: 'absolute', top: '100px', right: '20px', 
      width: '320px', padding: '1.5rem', zIndex: 10 
    }}>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.2rem' }}>{seat.name} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>({seat.id})</span></h3>
        <button onClick={() => {
          onClose();
          playClick();
        }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>State</div>
        <div>{seat.state}</div>
      </div>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Demographics</div>
        <div style={{ marginBottom: '8px' }}>{seat.demographics}</div>
        {seat.ethnicity && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', 
            columnGap: '8px', 
            rowGap: '4px', 
            fontSize: '0.8rem',
            background: 'rgba(0,0,0,0.1)',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.05)'
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
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Popularity Tracker</div>
        
        {['Faction1', 'Faction2', 'Faction3', 'Others'].map(coalition => {
          const pop = seat.popularityTracker[coalition as keyof typeof seat.popularityTracker];
          const parties = factionParties[coalition] || [];
          return (
            <div key={coalition} style={{ marginBottom: '8px' }}>
              <div className="flex-between" style={{ fontSize: '0.9rem', marginBottom: '2px' }}>
                <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={factionNames[coalition] || coalition}>
                  {factionNames[coalition] || coalition}
                </span>
                <span>{typeof pop === 'number' ? pop.toFixed(1) : pop}%</span>
              </div>
              {parties.length > 0 && (
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={parties.join(', ')}>
                  {parties.join(' · ')}
                </div>
              )}
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${pop}%`, 
                  height: '100%', 
                  background: factionColors[coalition] || 'var(--text-muted)',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>
      
      {seat.winnerGE15 && (
         <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>GE15 Winner</div>
            <div style={{ 
              color: factionColors[seat.winnerGE15] || (seat.winnerGE15 === 'PH' ? '#ed1c24' : seat.winnerGE15 === 'PN' ? '#006a71' : seat.winnerGE15 === 'BN' ? '#0033a0' : 'var(--text-muted)'), 
              fontWeight: 'bold' 
            }}>
              {seat.winnerGE15}
            </div>
         </div>
      )}
    </div>
  );
}
