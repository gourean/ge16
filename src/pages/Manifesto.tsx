import { useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { playClick, playPopup } from '../utils/sfx';
import { manifestoItems } from '../data/manifesto';
import {
  classifySeats,
  applyManifestoToSeats,
  calculateContradictionDebuff
} from '../utils/synergy';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { ChevronRight, AlertCircle, LogOut } from 'lucide-react';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function Manifesto() {
  const { playerState, seats, loadInitialSeats, setGamePhase, setManifestoChoice, setExitConfirmationOpen, pushNotification } = useGameStore();
  const [isSkipConfirmOpen, setIsSkipConfirmOpen] = useState(false);
  const choices = playerState.manifestoChoices;

  const handleExit = () => {
    playClick();
    setExitConfirmationOpen(true);
  };

  // Calculate radar data
  const radarData = useMemo(() => {
    const axes = ['urban', 'rural', 'youth', 'borneo', 'conservative', 'progressive', 'reformist', 'minority'];
    const results: Record<string, number> = {
      urban: 50, rural: 50, youth: 50, borneo: 50,
      conservative: 50, progressive: 50, reformist: 50, minority: 50
    };

    manifestoItems.forEach(item => {
      const choice = choices[item.id];
      if (choice && choice !== 'neutral') {
        const mods = item.responses[choice].demographics;
        Object.entries(mods).forEach(([key, val]) => {
          if (results[key] !== undefined) {
            results[key] += (val as number);
          }
          if (key === 'nationalist') results.conservative += (val as number) * 0.5;
        });
      }
    });

    return {
      labels: axes.map(a => a.charAt(0).toUpperCase() + a.slice(1)),
      datasets: [
        {
          label: 'Sentiment Impact',
          data: axes.map(a => Math.max(0, Math.min(100, results[a]))),
          backgroundColor: 'rgba(0, 230, 118, 0.2)',
          borderColor: 'rgba(0, 230, 118, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(0, 230, 118, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(0, 230, 118, 0.2)',
        },
      ],
    };
  }, [choices]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof manifestoItems> = {};
    manifestoItems.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, []);

  const radarOptions = {
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        pointLabels: { color: '#aaa', font: { size: 12 } },
        ticks: { display: false, stepSize: 20 },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    plugins: {
      legend: { display: false },
    },
    maintainAspectRatio: false,
  };

  const isComplete = manifestoItems.every(item => choices[item.id]);

  const handleFinalize = () => {
    if (!isComplete) {
      pushNotification({
        title: "Manifesto Incomplete",
        message: "Please set your stance on all 10 policies before finalizing.",
        type: "warning"
      });
      return;
    }

    let updatedSeats = classifySeats(seats);
    updatedSeats = applyManifestoToSeats(updatedSeats, choices);

    const allTags: string[] = [];
    manifestoItems.forEach(item => {
      const choice = choices[item.id];
      if (choice && choice !== 'neutral') {
        allTags.push(...item.responses[choice].tags);
      }
    });
    const { debuff } = calculateContradictionDebuff(allTags);

    loadInitialSeats(updatedSeats);
    playPopup();

    useGameStore.setState((state) => ({
      playerState: {
        ...state.playerState,
        manifestoTags: allTags,
        stability: Math.max(0, 100 - debuff),
      }
    }));

    setGamePhase('CAMPAIGN');
  };

  const handleSkipManifesto = () => {
    playClick();
    setIsSkipConfirmOpen(true);
  };

  const executeSkipManifesto = () => {
    setIsSkipConfirmOpen(false);
    const neutralChoices: Record<string, 'neutral'> = {};
    manifestoItems.forEach(item => {
      neutralChoices[item.id] = 'neutral';
      setManifestoChoice(item.id, 'neutral'); // Also update the store
    });

    let updatedSeats = classifySeats(seats);
    updatedSeats = applyManifestoToSeats(updatedSeats, neutralChoices);

    // For neutral choices, tags are normally empty as per manifesto.ts
    const allTags: string[] = [];
    const { debuff } = calculateContradictionDebuff(allTags);

    loadInitialSeats(updatedSeats);
    playPopup();

    useGameStore.setState((state) => ({
      playerState: {
        ...state.playerState,
        manifestoTags: allTags,
        stability: Math.max(0, 100 - debuff),
      }
    }));

    setGamePhase('CAMPAIGN');
  };

  return (
    <div className="flex-column" style={{ height: '100vh', padding: '0.75rem 2rem', background: '#0a0a0c', color: 'white', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div className="flex-between" style={{ marginBottom: '1rem', width: '100%', maxWidth: '1400px', margin: '0 auto 1rem' }}>
        <button
          onClick={handleExit}
          className="glass-button"
          style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', borderColor: 'rgba(255, 82, 82, 0.3)', color: '#ff5252' }}
        >
          <LogOut size={16} /> Exit Game
        </button>

        <h1 style={{ fontSize: '2rem', background: 'var(--grad-highlight)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          Manifesto
        </h1>

        <div style={{ width: '120px' }}></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 480px', gap: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>

        {/* LEFT: Policy List */}
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
          <div className="flex-column" style={{ gap: '0rem' }}>
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', opacity: 0.6, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em', paddingLeft: '0.5rem' }}>
                  {category}
                </div>
                <div className="flex-column" style={{ gap: '0.6rem' }}>
                  {items.map((item) => (
                    <div key={item.id} className="policy-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                      <div style={{ flex: 1, paddingRight: '2rem' }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: '500' }}>{item.topic}</div>
                      </div>

                      <div className="segmented-control">
                        <button
                          className={`segment-btn disagree ${choices[item.id] === 'disagree' ? 'active' : ''}`}
                          onClick={() => {
                            setManifestoChoice(item.id, 'disagree');
                            playClick();
                          }}
                        >
                          Disagree
                        </button>
                        <button
                          className={`segment-btn neutral ${choices[item.id] === 'neutral' ? 'active' : ''}`}
                          onClick={() => {
                            setManifestoChoice(item.id, 'neutral');
                            playClick();
                          }}
                        >
                          Neutral
                        </button>
                        <button
                          className={`segment-btn agree ${choices[item.id] === 'agree' ? 'active' : ''}`}
                          onClick={() => {
                            setManifestoChoice(item.id, 'agree');
                            playClick();
                          }}
                        >
                          Agree
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Radar & Lock-in */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'hidden', height: 'calc(100vh - 120px)' }}>
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '1rem' }}>Sentiment Impact</h3>
            <div style={{ height: '350px', width: '100%' }}>
              <Radar data={radarData} options={radarOptions} />
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="glass-panel" style={{ padding: '0.75rem', background: 'rgba(255, 193, 7, 0.05)', borderColor: 'rgba(255, 193, 7, 0.2)' }}>
              <p style={{ fontSize: '0.8rem', color: '#ffc107', display: 'flex', gap: '8px', lineHeight: '1.3', margin: 0 }}>
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                Finalize your manifesto to begin the campaign. Your stances will alter popularity and set ideological tags.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleSkipManifesto}
                className="glass-button"
                style={{ flex: 1, padding: '0.75rem', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.85rem' }}
              >
                Skip Manifesto
              </button>

              <button
                disabled={!isComplete}
                onClick={() => {
                  handleFinalize();
                  playClick();
                }}
                className={`glass-button ${isComplete ? 'active pulse-glow' : 'disabled'}`}
                style={{ flex: 1.5, fontSize: '1rem', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                Finalize <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Skip Confirmation Modal */}
      {isSkipConfirmOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '500px',
            width: '90%',
            padding: '2.5rem',
            textAlign: 'center',
            border: '1px solid var(--border-glass)',
            boxShadow: '0 0 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              margin: '0 auto 1.5rem',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255, 193, 7, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertCircle size={32} color="#ffc107" />
            </div>

            <h2 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.4rem', fontWeight: 'bold' }}>
              Skip Manifesto?
            </h2>

            <p style={{ marginBottom: '2.5rem', lineHeight: '1.6', color: 'var(--text-muted)', fontSize: '1rem' }}>
              A manifesto isn't a bible, but are you sure you want to campaign without one?
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="glass-button"
                onClick={() => { playClick(); setIsSkipConfirmOpen(false); }}
                style={{ flex: 1, padding: '1rem' }}
              >
                Back
              </button>
              <button
                className="glass-button"
                onClick={executeSkipManifesto}
                style={{
                  flex: 1.5,
                  padding: '1rem',
                  background: 'var(--grad-highlight)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 'bold'
                }}
              >
                I am Politikus
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .policy-row { transition: background 0.2s; }
        .policy-row:hover { background: rgba(255,255,255,0.05) !important; }

        .segmented-control {
          display: flex;
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
          padding: 4px;
          border: 1px solid var(--border-glass);
        }
        
        .segment-btn {
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .segment-btn:hover { color: white; }
        .segment-btn.active { color: white; }

        .segment-btn.agree.active { background: rgba(0, 230, 118, 0.2); color: #00e676; }
        .segment-btn.disagree.active { background: rgba(255, 82, 82, 0.2); color: #ff5252; }
        .segment-btn.neutral.active { background: rgba(255,255,255,0.1); color: white; }

        .glass-button.disabled {
          opacity: 0.3;
          cursor: not-allowed;
          filter: grayscale(1);
        }

        /* Hide scrollbar but allow scrolling */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border-glass); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
