import { useState, useEffect, useMemo, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { playClick } from '../utils/sfx';
import { Newspaper, FastForward, Play, Pause, Zap } from 'lucide-react';

export default function PostElection() {
  const { seats, playerState, factionNames, factionColors, factionParties, setGamePhase } = useGameStore();
  
  const [activeView, setActiveView] = useState<'tally' | 'feed'>('tally');

  // Shuffled seats for random intake
  const shuffledSeats = useMemo(() => {
    return [...seats].sort(() => Math.random() - 0.5);
  }, [seats]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(1000); // Default Slow Speed
  const [isPaused, setIsPaused] = useState(false);
  const [headlines, setHeadlines] = useState<string[]>(["ELECTION 2026: DISPENSATION BEGINS...", "VOTES ARE BEING COUNTED ACROSS THE NATION..."]);

  // Ticker banner state — dynamic spawning system
  const [activeTickerItems, setActiveTickerItems] = useState<{ id: number, text: string }[]>([]);
  
  // Track queue and nextId in refs for instant access in the interval
  const queueRef = useRef<string[]>([]);
  const nextIdRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);


  const tickerRef = useRef<HTMLDivElement>(null);

  const displayedSeats = shuffledSeats.slice(0, currentIndex);

  // Simulation loop
  useEffect(() => {
    if (currentIndex < shuffledSeats.length && !isPaused) {
      const timer = setTimeout(() => {
        const nextSeat = shuffledSeats[currentIndex];
        const result = getSeatResult(nextSeat);
        
        const winnerName = factionNames[result.winner] || result.winner;
        let newHeadline = "";
        
        // Randomly pick reporting style to avoid uniformity
        const style = Math.floor(Math.random() * 5);
        
        // Stricter/Random "Unexpected" reporting as requested
        // Only report as "Unexpected" if it actually flipped AND a random 10% chance triggers
        const showUnexpected = result.isUnexpected && Math.random() < 0.15;
        const majStr = result.majorityVotes.toLocaleString();

        if (showUnexpected) {
           const variations = [
             `🚨 BREAKING: STUNNING UPSET in ${nextSeat.name}! ${winnerName} takes the seat by a majority of ${majStr} votes!`,
             `🔥 SHOCKWAVE: Safe seat of ${nextSeat.name} has been FLIPPED by ${winnerName}! Majority: ${majStr}.`,
             `😱 UNEXPECTED: Election maps rewritten as ${winnerName} claims ${nextSeat.name} with ${majStr} majority!`
           ];
           newHeadline = variations[Math.floor(Math.random() * variations.length)];
        } else if (result.isLandslide) {
           newHeadline = `🌟 LANDSLIDE: ${winnerName} sweeps ${nextSeat.name} with a massive majority of ${majStr} votes!`;
        } else if (result.isMarginal) {
           newHeadline = `⚖️ RAZOR THIN: ${winnerName} holds on in ${nextSeat.name} by a narrow majority of ${majStr}.`;
        } else {
           switch(style) {
             case 0: newHeadline = `✅ DECLARED: ${nextSeat.name} goes to ${winnerName} with a ${majStr} majority.`; break;
             case 1: newHeadline = `📊 RESULT: ${winnerName} secures ${nextSeat.name} by ${majStr} votes.`; break;
             case 2: newHeadline = `🏛️ SEAT WON: ${nextSeat.name} falls to ${winnerName} by a majority of ${majStr}.`; break;
             case 3: newHeadline = `🗞️ JUST IN: ${winnerName} claims ${nextSeat.name} with a comfortable ${majStr} majority.`; break;
             case 4: newHeadline = `💡 ${nextSeat.name} called for ${winnerName}. Majority established at ${majStr}.`; break;
           }
        }

        setHeadlines(prev => [newHeadline, ...prev.slice(0, 100)]);

        // ~25% chance to queue in the banner ticker (reduced frequency)
        if (Math.random() < 0.25) {
          queueRef.current.push(newHeadline);
          if (queueRef.current.length > 20) queueRef.current.shift();
        }

        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, shuffledSeats, speed, isPaused]);

  // Dynamic Ticker Spawning Logic: Runs in a stable interval
  useEffect(() => {
    // Initial banner item only at mount
    setActiveTickerItems([{ id: -1, text: "GE16 ELECTION NIGHT COVERAGE — LIVE RESULTS INCOMING..." }]);
    lastSpawnRef.current = Date.now();

    const spawnTimer = setInterval(() => {
      const now = Date.now();
      const minGapMs = 8000; // Strictly 8 seconds between spawns for less frequency
      
      if (queueRef.current.length > 0 && (now - lastSpawnRef.current > minGapMs)) {
        const nextText = queueRef.current.shift();
        
        const id = nextIdRef.current++;
        setActiveTickerItems(prev => [...prev, { id, text: nextText || "" }]);
        lastSpawnRef.current = now;
      }
    }, 500);
    return () => clearInterval(spawnTimer);
  }, []); // Run once on mount

  // Scroll newsfeed container to top when new headline arrives
  useEffect(() => {
    if (tickerRef.current) {
      tickerRef.current.scrollTop = 0;
    }
  }, [headlines]);

  // Aggregate stats
  const stats = useMemo(() => {
    const counts = { Faction1: 0, Faction2: 0, Faction3: 0, Others: 0 };
    const votes = { Faction1: 0, Faction2: 0, Faction3: 0, Others: 0 };
    let totalVotes = 0;

    displayedSeats.forEach(seat => {
      const result = getSeatResult(seat);
      counts[result.winner as keyof typeof counts]++;
      
      for (const [f, v] of Object.entries(seat.popularityTracker)) {
         votes[f as keyof typeof votes] += v;
         totalVotes += v;
      }
    });

    return { counts, votes, totalVotes };
  }, [displayedSeats]);

  function getSeatResult(seat: any) {
    let max = -1;
    let secondMax = -1;
    let winnerId = 'Others';

    for (const [faction, pop] of Object.entries(seat.popularityTracker)) {
      if ((pop as number) > max) {
        secondMax = max;
        max = pop as number;
        winnerId = faction;
      } else if ((pop as number) > secondMax) {
        secondMax = pop as number;
      }
    }

    const margin = max - secondMax;
    const isLandslide = max > 60 || margin > 20;
    const isMarginal = margin < 5;
    const isUnexpected = winnerId !== seat.winnerGE15 && seat.winnerGE15 !== 'Others' && !!seat.winnerGE15;

    // Calculate absolute majority votes
    // sum candidate votes to get total votes recorded in data
    const totalVotes = (seat.candidates || []).reduce((sum: number, c: any) => sum + (c.votes || 0), 0);
    const majorityVotes = Math.round((margin / 100) * (totalVotes > 0 ? totalVotes : 50000)); // fallback to 50k if data missing

    return { winner: winnerId, isLandslide, isMarginal, isUnexpected, max, margin, majorityVotes };
  }

  const generateFinalAnnouncement = () => {
     // Identify overall winner
     const results = Object.entries(stats.counts).sort((a,b) => b[1] - a[1]);
     const [winnerId, seatsWon] = results[0];
     const winnerName = factionNames[winnerId as keyof typeof factionNames];
     
     if (seatsWon >= 112) {
        return `SPR OFFICIAL: ${winnerName.toUpperCase()} DECLARED WINNER WITH ${seatsWon} SEATS. MAJORITY GOVERNMENT FORMED.`;
     } else {
        return `SPR OFFICIAL: HUNG PARLIAMENT DECLARED. ${winnerName.toUpperCase()} SECURES PLURALITY WITH ${seatsWon} SEATS.`;
     }
  };

  const handleSkip = () => {
    playClick();
    setCurrentIndex(shuffledSeats.length);
    // Determine winner for the skip announcement
    const finalCounts = { Faction1: 0, Faction2: 0, Faction3: 0, Others: 0 };
    shuffledSeats.forEach(s => {
       const w = getSeatResult(s).winner;
       finalCounts[w as keyof typeof finalCounts]++;
    });
    const sorted = Object.entries(finalCounts).sort((a,b) => b[1] - a[1]);
    console.log(`Final tally skipped. Leader: ${sorted[0][0]}, Seats: ${sorted[0][1]}`);
    
    // No setHeadlines here, wait for completion effect
  };

  const isComplete = currentIndex === shuffledSeats.length;

  useEffect(() => {
    if (isComplete) {
      const announcement = generateFinalAnnouncement();
      setHeadlines(prev => [announcement, "FINAL RESULTS DECLARED BY SPR. THE PEOPLE HAVE SPOKEN.", ...prev]);
      // Push SPR declaration to queue with priority
      queueRef.current.unshift(announcement);
    }
  }, [isComplete]);

  return (
    <div className="flex-column" style={{ height: '100dvh', overflow: 'hidden', background: '#0a0a0c', color: 'white' }}>
      
      <div className="glass-panel live-banner" style={{ margin: '1rem', border: 'none', background: 'var(--accent-red)', padding: '0.6rem 2rem', display: 'flex', alignItems: 'center', gap: '2rem', zIndex: 100, position: 'relative', borderRadius: '12px' }}>
        <div style={{ fontWeight: '900', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px', flexShrink: 0, zIndex: 10 }}>LIVE UPDATE</div>
        <div className="ticker-container" style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', position: 'relative', height: '1.5rem' }}>
           {activeTickerItems.map(item => (
             <div
               key={item.id}
               className="ticker-item-fly"
               onAnimationEnd={() => {
                 setActiveTickerItems(prev => prev.filter(i => i.id !== item.id));
               }}
               style={{ 
                 fontSize: '1rem', 
                 fontWeight: 'bold', 
                 position: 'absolute',
                 whiteSpace: 'nowrap',
                 fontFamily: 'var(--font-heading)'
               }}
             >
               {item.text}
             </div>
           ))}
        </div>
        <div className="glass-panel declared-badge" style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 12px', border: 'none', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0 }}>
          {currentIndex} / {seats.length} SEATS DECLARED
        </div>
      </div>

      <div className="glass-panel flex-between live-controls-panel" style={{ margin: '0 1rem 1rem 1rem', padding: '0.8rem 1.5rem', zIndex: 10 }}>
        <div className="speed-controls" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', marginRight: '5px' }}>SPEED:</span>
          <button 
            className={`glass-button ${speed === 1000 ? 'active' : ''}`} 
            style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold' }} 
            onClick={() => { playClick(); setSpeed(1000); }}
            title="Slow Speed"
          >
            1x
          </button>
          <button 
            className={`glass-button ${speed === 200 ? 'active' : ''}`} 
            style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold' }} 
            onClick={() => { playClick(); setSpeed(200); }}
            title="Fast Speed"
          >
            5x
          </button>
          <button 
            className={`glass-button ${speed === 20 ? 'active' : ''}`} 
            style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold' }} 
            onClick={() => { playClick(); setSpeed(20); }}
            title="Turbo Speed"
          >
            <Zap size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </button>
        </div>
        
        <div className="control-buttons" style={{ display: 'flex', gap: '0.8rem' }}>
          {!isComplete && (
            <>
              <button className="glass-button" style={{ padding: '6px 15px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => { playClick(); setIsPaused(!isPaused); }}>
                {isPaused ? <Play size={14} /> : <Pause size={14} />}
                <span className="desktop-only">{isPaused ? 'RESUME' : 'PAUSE'}</span>
              </button>
              <button className="glass-button" style={{ padding: '6px 15px', fontSize: '0.8rem', borderColor: 'rgba(255,255,255,0.2)' }} onClick={handleSkip}>
                <span className="desktop-only">SKIP ALL</span>
                <FastForward size={14} className="mobile-only" />
              </button>
            </>
          )}
          {isComplete && (
            <button 
              className="glass-button active pulse-glow" 
              style={{ padding: '0.6rem 2rem', fontWeight: 'bold', fontSize: '0.9rem' }}
              onClick={() => {
                playClick();
                setGamePhase('OUTCOME');
              }}
            >
              PROCEED
            </button>
          )}
        </div>
      </div>

      <div className="flex-row post-election-content" style={{ flex: 1, padding: '0 1rem 1rem 1rem', gap: '1rem', overflow: 'hidden', alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: Newsfeed (Scrollable) */}
        <div className={`newsfeed-col ${activeView !== 'feed' ? 'mobile-hidden' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden', height: '100%', minWidth: 0 }}>
          <div className="flex-between mobile-only" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.8rem' }}>
             <h2 style={{ letterSpacing: '1px', fontSize: '1rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Live News Feed</h2>
             <button 
               onClick={() => { playClick(); setActiveView('tally'); }} 
               className="glass-button"
               style={{ padding: '6px 12px', fontSize: '0.7rem' }}
             >
               Show Tally
             </button>
          </div>
          <div 
             className="glass-panel" 
             style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}
             ref={tickerRef}
          >
            {headlines.map((text, i) => {
              const isAlert = text.includes('BREAKING') || text.includes('🚨');
              const isLandslide = text.includes('🌟');
              return (
                <div 
                  key={i} 
                  className={`news-item animate-fade-in ${isAlert ? 'alert' : isLandslide ? 'landslide' : ''}`}
                >
                  <div className="news-tag" style={{ 
                      color: isAlert ? 'var(--accent-red)' : (isLandslide ? 'var(--accent-gold)' : 'var(--text-muted)')
                  }}>
                    { isAlert ? 'ALERT' : (isLandslide ? 'LANDSLIDE' : 'UPDATE') }
                  </div>
                  <div style={{ flex: 1, fontSize: '1rem', color: isAlert ? 'white' : 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                    {text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Election Result (Stats) */}
        <div className={`glass-panel tally-col ${activeView !== 'tally' ? 'mobile-hidden' : ''}`} style={{ width: '400px', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '1.5rem', height: '100%', minWidth: 0 }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.8rem' }}>
            <h2 style={{ letterSpacing: '1px', fontSize: '1.2rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Election Tally</h2>
            <button 
              onClick={() => { playClick(); setActiveView('feed'); }} 
              className="glass-button mobile-only"
              style={{ padding: '6px 12px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Newspaper size={14} /> Show Feed
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {Object.entries(factionNames).filter(([id]) => id !== 'Undecided' && (id !== 'Faction3' || factionParties.Faction3?.length > 0)).sort((a,b) => stats.counts[b[0] as keyof typeof stats.counts] - stats.counts[a[0] as keyof typeof stats.counts]).map(([id, name]) => {
              const count = stats.counts[id as keyof typeof stats.counts] || 0;
              const barWidth = Math.min(100, (count / 222) * 100);
              const color = factionColors[id];
              return (
                <div key={id} className="animate-fade-in">
                   <div className="flex-between" style={{ marginBottom: '6px' }}>
                     <span style={{ fontWeight: 'bold', color: color, fontSize: '0.9rem', letterSpacing: '0.5px' }}>{name}</span>
                     <span style={{ fontSize: '1.4rem', fontWeight: '900', fontFamily: 'var(--font-heading)' }}>{count}</span>
                   </div>
                   <div style={{ height: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div 
                        style={{ 
                          width: `${barWidth}%`, 
                          height: '100%', 
                          background: `linear-gradient(90deg, ${color}99, ${color})`,
                          transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          boxShadow: `0 0 15px ${color}44`,
                          borderRadius: '20px'
                        }} 
                      />
                      <div style={{ position: 'absolute', left: '50.45%', top: 0, width: '1px', height: '100%', background: 'rgba(255,255,255,0.2)', zIndex: 2 }} title="Majority (112)" />
                   </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '1.2rem', borderTop: '1px solid var(--border-glass)' }}>
             <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', border: 'none', borderRadius: '12px' }}>
               <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Popular Vote Share:</span>
                  <span style={{ fontWeight: 'bold', color: factionColors[playerState.currentCoalition], fontSize: '0.9rem' }}>{stats.totalVotes > 0 ? ((stats.votes[playerState.currentCoalition as keyof typeof stats.votes] / stats.totalVotes) * 100).toFixed(1) : '0.0'}%</span>
               </div>
               <div className="flex-between" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span>Required for Majority:</span>
                  <span style={{ fontWeight: 'bold', color: 'white' }}>112 SEATS</span>
               </div>
             </div>
          </div>
        </div>
      </div>

      <style>{`
        .ticker-item-fly {
          animation: ticker-item-fly 25s linear forwards;
          will-change: transform;
        }
        @keyframes ticker-item-fly {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-250vw); }
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        @media (max-width: 1024px) {
          .post-election-content {
            flex-direction: column !important;
            padding: 0.5rem !important;
          }
          .newsfeed-col, .tally-col {
            width: 100% !important;
            height: auto !important;
            flex: 1 !important;
            order: 2;
          }
          .mobile-hidden {
            display: none !important;
          }
          .live-banner {
            margin: 0.5rem !important;
            padding: 0.4rem 1rem !important;
            gap: 0.5rem !important;
          }
          .live-banner div:first-child {
            font-size: 0.8rem !important;
          }
          .live-banner .ticker-container {
            font-size: 0.8rem !important;
          }
          .live-banner .declared-badge {
            font-size: 0.6rem !important;
            padding: 2px 8px !important;
          }
          .speed-controls {
             display: flex !important;
             gap: 0.3rem !important;
          }
          .speed-controls button {
             padding: 4px 8px !important;
             min-width: 32px !important;
          }
          .control-buttons {
             gap: 0.4rem !important;
          }
          .control-buttons button {
             padding: 4px 10px !important;
          }
          .live-controls-panel {
            margin: 0 0.5rem 0.5rem 0.5rem !important;
            padding: 0.6rem !important;
          }
        }
      `}</style>

    </div>
  );
}
