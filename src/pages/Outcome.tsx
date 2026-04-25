import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { playClick } from '../utils/sfx';

export default function Outcome() {
  const { seats, playerState, factionNames, factionColors, factionParties, resetGame } = useGameStore();
  const navigate = useNavigate();

  const results = useMemo(() => {
    const counts = { Faction1: 0, Faction2: 0, Faction3: 0, Others: 0 };
    seats.forEach(seat => {
      let leader = 'Others';
      let max = -1;
      for (const [faction, pop] of Object.entries(seat.popularityTracker)) {
        if ((pop as number) > max) {
          max = pop as number;
          leader = faction;
        }
      }
      counts[leader as keyof typeof counts]++;
    });
    return counts;
  }, [seats]);

  const coalitions = [
    { id: 'Faction1', count: results.Faction1 },
    { id: 'Faction2', count: results.Faction2 },
    { id: 'Faction3', count: results.Faction3 },
    { id: 'Others', count: results.Others },
  ].filter(c => c.id !== 'Faction3' || factionParties.Faction3?.length > 0).sort((a,b) => b.count - a.count);

  const myCoalition = playerState.currentCoalition;
  const myCount = results[myCoalition as keyof typeof results] || 0;
  const myRank = coalitions.findIndex(c => c.id === myCoalition) + 1;
  
  const winnerBlock = coalitions.find(c => c.count >= 112);
  const isHung = !winnerBlock;

  const unionInfo = useMemo(() => {
    if (!isHung) return null;

    // Filter available factions for coalition (Faction 1, 2, 3)
    const blocks = coalitions.filter(c => ['Faction1', 'Faction2', 'Faction3'].includes(c.id));
    const pairs: { a: string, b: string, total: number }[] = [];

    // Find all pairs that make a majority (112+)
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const total = blocks[i].count + blocks[j].count;
        if (total >= 112) {
          pairs.push({ a: blocks[i].id, b: blocks[j].id, total });
        }
      }
    }

    if (pairs.length === 0) {
      // Fallback: search for largest possible pair if none reach 112
      const allPairs = [];
      for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
          allPairs.push({ a: blocks[i].id, b: blocks[j].id, total: blocks[i].count + blocks[j].count });
        }
      }
      allPairs.sort((a, b) => b.total - a.total);
      return allPairs[0] || null;
    }

    // Randomly select one valid pair
    return pairs[Math.floor(Math.random() * pairs.length)];
  }, [isHung, coalitions]);

  const isPlayerInUnion = unionInfo && (unionInfo.a === myCoalition || unionInfo.b === myCoalition);
  const isWinner = myCount >= 112;
  const isTop2 = myRank <= 2;
  
  const isPoorPerformance = myRank >= 3 || myCount < 30;
  const myAllianceName = factionNames[myCoalition as keyof typeof factionNames];

  let status = "";
  let description = "";
  let title = "";
  let imagePath = "./assets/images/outcome/pm_victory.webp"; 
  
  if (isWinner) {
    status = "Election of the 11th Prime Minister";
    title = "A DEFINING MANDATE";
    description = `With a decisive count of ${myCount} seats, ${myAllianceName} has secured an absolute majority in Parliament. The Yang di-Pertuan Agong has formally invited the coalition leadership to Seri Perdana. A new era of governance is set to begin.`;
    imagePath = "./assets/images/outcome/pm_victory.webp";
  } else if (isHung && isPlayerInUnion && unionInfo) {
    const partnerId = unionInfo.a === myCoalition ? unionInfo.b : unionInfo.a;
    const partnerName = factionNames[partnerId as keyof typeof factionNames];
    status = "Union Government Formed";
    title = "THE POWER SHARING ACCORD";
    description = `In a historic resolution to the Hung Parliament, ${myAllianceName} has entered into a strategic union with ${partnerName}. Combining for ${unionInfo.total} seats, the two blocs have secured a stable majority to govern the nation under a shared mandate of reconciliation and reform.`;
    imagePath = "./assets/images/outcome/union.webp";
  } else if (isTop2) {
    status = "Official Opposition Formed";
    title = isHung ? "STALEMATE RESOLVED" : "THE SHADOW CABINET";
    description = isHung 
      ? `${myAllianceName} has secured ${myCount} seats in a fragmented Parliament. Despite the Hung Parliament outcome, the coalition was unable to secure a partnership in the new Union Government and will now lead the Opposition to ensure rigorous oversight.`
      : `${myAllianceName} has secured ${myCount} seats, establishing a formidable presence as the primary opposition bloc. While falling short of a majority, the coalition remains the largest alternative force in the House.`;
    imagePath = "./assets/images/outcome/opposition_leader.webp";
  } else {
    status = "Leadership Resignation Announced";
    title = "SHOCK DEFEAT";
    description = `Following a performance that yielded only ${myCount} seats, the leadership of ${myAllianceName} has announced a strategic withdrawal from the frontlines. A period of internal restructuring is expected as the coalition reels from these historic losses.`;
    imagePath = "./assets/images/outcome/resignation.webp";
  }

  return (
    <div className="page-container" style={{ background: 'radial-gradient(circle at 50% 10%, rgba(59, 130, 246, 0.1), transparent 40%)' }}>
      
      <div className="animate-fade-in" style={{ maxWidth: '900px', width: '100%', position: 'relative' }}>
        
        {/* Newspaper Style Header — Digital Version */}
        <div style={{ textAlign: 'center', marginBottom: '3rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.5rem' }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '4rem', marginBottom: '0.5rem', letterSpacing: '-1.5px', textTransform: 'uppercase', color: 'white' }}>MALAYSIA GAZETTE</h1>
            <div className="flex-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 'bold' }}>
               <span>Digital Archives</span>
               <span>{new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
               <span>Final Report</span>
            </div>
        </div>

        {/* Main Content: Digital Glass Panel */}
        <div className="glass-panel" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2.5rem', background: 'rgba(255,255,255,0.01)' }}>
           
           {/* Headline */}
           <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '3.5rem', lineHeight: '1', fontWeight: '900', color: isPoorPerformance ? 'var(--accent-red)' : 'var(--accent-gold)', marginBottom: '0.8rem', letterSpacing: '-1px' }}>
                {title}
              </h2>
              <div style={{ fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '5px', fontWeight: 'bold' }}>
                 {status}
              </div>
           </div>

           {/* Landscape Image with Digital Scan Effect */}
           <div className="digital-scan" style={{ borderRadius: '12px', border: '1px solid var(--border-glass)', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}>
              <img 
                src={imagePath} 
                className="digital-scan-blue"
                alt="Front Page Story" 
                style={{ width: '100%', maxHeight: '450px', objectFit: 'cover', display: 'block' }} 
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textAlign: 'center', fontStyle: 'italic', zIndex: 3 }}>
                 DATA RECONSTRUCTION: CERTIFIED ELECTION OUTCOME — SATURDAY 22:45
              </div>
           </div>

           {/* Report Text */}
           <div className="flex-row" style={{ gap: '2rem', alignItems: 'flex-start' }}>
              <div style={{ flex: 1.5 }}>
                <p style={{ fontSize: '1.25rem', lineHeight: '1.6', color: 'var(--text-primary)', marginBottom: '2rem', textAlign: 'justify', fontStyle: 'italic', opacity: 0.9 }}>
                  {description}
                </p>
              </div>

              <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}>
                 <h3 style={{ marginBottom: '1.2rem', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Final Bench Count</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                     {coalitions.map(c => {
                       return (
                         <div key={c.id} className="flex-between" style={{ fontSize: '1.1rem', padding: '4px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                               <div style={{ 
                                 width: '12px', 
                                 height: '12px', 
                                 borderRadius: '50%', 
                                 backgroundColor: factionColors[c.id],
                                 boxShadow: `0 0 10px ${factionColors[c.id]}`
                               }} />
                               <span style={{ color: 'var(--text-primary)', fontWeight: c.id === myCoalition ? 'bold' : 'normal' }}>
                                 {factionNames[c.id]}
                               </span>
                            </div>
                            <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>{c.count}</span>
                         </div>
                       );
                     })}
                 </div>
              </div>
           </div>

           <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
              <button 
                className="glass-button active pulse-glow" 
                style={{ padding: '1rem 2rem', fontSize: '1rem', borderRadius: '50px', letterSpacing: '2px', fontWeight: 'bold' }}
                onClick={() => {
                  playClick();
                  resetGame();
                  window.location.reload();
                }}
              >
                RETURN TO TERMINAL
              </button>

              <button 
                className="glass-button" 
                style={{ padding: '1rem 2rem', fontSize: '1rem', borderRadius: '50px', letterSpacing: '2px', fontWeight: 'bold' }}
                onClick={() => {
                  playClick();
                  navigate('/credits');
                }}
              >
                CREDITS
              </button>
           </div>

        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
      `}</style>

    </div>
  );
}
