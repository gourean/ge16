import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { availableParties, historicalCoalitions } from '../data/parties';
import type { Party } from '../data/parties';
import { calculateSynergy, applyFactionsToSeats, distributeOpponents, type DemographicSwing } from '../utils/synergy';
import { Shield, Target, Users, Play, Plus, Trash2, Shuffle } from 'lucide-react';
import { playClick } from '../utils/sfx';

export default function PreCampaign() {
  const { selectCoalition, setGamePhase, seats, loadInitialSeats, pushNotification } = useGameStore();

  const [gameMode, setGameMode] = useState<'HISTORICAL' | 'CUSTOM'>('HISTORICAL');
  const [selectedParties, setSelectedParties] = useState<string[]>([]);
  const [allianceName, setAllianceName] = useState('Custom Alliance');
  const [opponentMode, setOpponentMode] = useState<'1v1' | '3-corner'>('1v1');
  const [explicitSwings, setExplicitSwings] = useState<DemographicSwing[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>(''); // For custom
  const [perturbationSeed, setPerturbationSeed] = useState<number>(Math.floor(Math.random() * 999999));
  const [perturbationEnabled, setPerturbationEnabled] = useState(true);

  // For Historical mode
  const [selectedHistorical, setSelectedHistorical] = useState<string | null>(null);

  // Historical coalitions are now imported from data/parties

  const toggleParty = (id: string) => {
    setSelectedParties(prev => {
      playClick();
      const isAdding = !prev.includes(id);
      const next = isAdding ? [...prev, id] : prev.filter(p => p !== id);

      // Auto-set color if none selected and adding first party
      if (isAdding && next.length === 1 && !selectedColor) {
        const party = availableParties.find(p => p.id === id);
        if (party) setSelectedColor(party.color);
      }
      return next;
    });
  };

  const handleStart = () => {
    let finalParties: Party[] = [];
    let customName = allianceName;
    let finalOpponentMode = opponentMode;

    if (gameMode === 'HISTORICAL') {
      if (!selectedHistorical) {
        pushNotification({
          title: "Selection Needed",
          message: "Please select a historical coalition to proceed.",
          type: "warning"
        });
        return;
      }
      const hc = historicalCoalitions.find(c => c.id === selectedHistorical);
      if (!hc) return;
      finalParties = availableParties.filter(p => hc.parties.includes(p.id));
      customName = hc.name;
      finalOpponentMode = '3-corner';
    } else {
      if (selectedParties.length === 0) {
        pushNotification({
          title: "Selection Needed",
          message: "Please select at least one party for your alliance.",
          type: "warning"
        });
        return;
      }
      finalParties = availableParties.filter(p => selectedParties.includes(p.id));
      if (!customName) customName = 'Custom Alliance';
    }

    const unselectedParties = availableParties.filter(p => !finalParties.find(fp => fp.id === p.id));

    // Refactor the seats to Faction1, 2, 3 based on initial_state.json numbers
    const modifiedSeats = applyFactionsToSeats(seats, finalParties, unselectedParties, finalOpponentMode, explicitSwings, gameMode === 'HISTORICAL', perturbationEnabled ? perturbationSeed : undefined);

    // Load the newly built seats into the store
    loadInitialSeats(modifiedSeats);

    // Compute opponent faction info
    const oppFactions = distributeOpponents(unselectedParties, finalOpponentMode);

    let faction2Name = 'Opposition A';
    let faction3Name = 'Opposition B';
    let f2Color = '#0ea5e9';
    let f3Color = '#2563eb';

    if (gameMode === 'HISTORICAL') {
      const hc = historicalCoalitions.find(c => c.id === selectedHistorical);
      if (!hc) return;

      const getCoalitionInfoForParties = (parties: any[]) => {
        const pIds = new Set(parties.map(p => p.id));
        for (const hc of historicalCoalitions) {
          const matchCount = hc.parties.filter(pid => pIds.has(pid)).length;
          if (matchCount > hc.parties.length / 2) return { name: hc.name, color: hc.color };
        }
        return null;
      };

      const f2Info = getCoalitionInfoForParties(oppFactions.faction2);
      const f3Info = getCoalitionInfoForParties(oppFactions.faction3);

      if (f2Info) {
        faction2Name = f2Info.name;
        f2Color = f2Info.color;
      } else if (oppFactions.faction2.length > 0) {
        // Random color from components
        f2Color = oppFactions.faction2[Math.floor(Math.random() * oppFactions.faction2.length)].color;
      }

      if (f3Info) {
        faction3Name = f3Info.name;
        f3Color = f3Info.color;
      } else if (oppFactions.faction3.length > 0) {
        f3Color = oppFactions.faction3[Math.floor(Math.random() * oppFactions.faction3.length)].color;
      }

      selectCoalition(customName, finalParties.map(p => p.id), {
        Faction1: hc.color,
        Faction2: f2Color,
        Faction3: f3Color,
      }, {
        faction2Name,
        faction2Parties: oppFactions.faction2.map(p => p.id),
        faction3Name,
        faction3Parties: oppFactions.faction3.map(p => p.id),
      });
    } else {
      // Custom mode
      const leadColor = selectedColor || (finalParties.length > 0 ? finalParties[0].color : '#ef4444');

      // Opponents in custom mode
      let f2Color = '#0ea5e9';
      let f3Color = '#2563eb';

      if (oppFactions.faction2.length > 0) {
        f2Color = oppFactions.faction2[Math.floor(Math.random() * oppFactions.faction2.length)].color;
      }
      if (oppFactions.faction3.length > 0) {
        f3Color = oppFactions.faction3[Math.floor(Math.random() * oppFactions.faction3.length)].color;
      }

      selectCoalition(customName, finalParties.map(p => p.id), {
        Faction1: leadColor,
        Faction2: f2Color,
        Faction3: f3Color,
      }, {
        faction2Name: '',
        faction2Parties: oppFactions.faction2.map(p => p.id),
        faction3Name: '',
        faction3Parties: oppFactions.faction3.map(p => p.id),
      });
    }

    playClick();
    setGamePhase('MANIFESTO');
  };

  // Metrics for custom
  const currentSelectedPartyObjs = availableParties.filter(p => selectedParties.includes(p.id));
  const synergyVal = calculateSynergy(currentSelectedPartyObjs);

  return (
    <div className="flex-column flex-center precampaign-container" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="glass-panel animate-fade-in content-card" style={{ padding: '3rem', maxWidth: '1000px', width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 className="main-title" style={{ fontSize: '3rem', marginBottom: '1rem', background: 'var(--grad-highlight)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            GE16: The Race to Putrajaya
          </h1>
          <p className="sub-title" style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Choose your game mode and build the alliance to lead Malaysia.
          </p>
        </div>

        <div className="flex-center mode-toggle" style={{ gap: '1rem', marginBottom: '2rem' }}>
          <button
            className={`glass-button ${gameMode === 'HISTORICAL' ? 'active' : ''}`}
            onClick={() => {
              setGameMode('HISTORICAL');
              playClick();
            }}
          >
            Historical <span className="desktop-only">Coalitions</span>
          </button>
          <button
            className={`glass-button ${gameMode === 'CUSTOM' ? 'active' : ''}`}
            onClick={() => {
              setGameMode('CUSTOM');
              playClick();
            }}
          >
            Custom <span className="desktop-only">Alliance</span>
          </button>
        </div>

        {/* HISTORICAL MODE */}
        {gameMode === 'HISTORICAL' && (
          <div className="historical-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {historicalCoalitions.map(c => {
              const isSelected = selectedHistorical === c.id;
              let Icon = Shield;
              let desc = '';
              if (c.id === 'PH') { Icon = Users; desc = 'Reformist, Multi-racial, Urban.'; }
              else if (c.id === 'PN') { Icon = Shield; desc = 'Conservative, Malay-centric, Rural.'; }
              else { Icon = Target; desc = 'Centrist, Establishment.'; }

              return (
                <div
                  key={c.id}
                  className={`glass-panel coalition-card cursor-pointer ${isSelected ? 'active pulse-glow' : ''}`}
                  style={{ padding: '2rem 1.5rem', cursor: 'pointer', textAlign: 'center', borderColor: isSelected ? 'var(--accent-blue)' : 'var(--border-glass)' }}
                  onClick={() => {
                    setSelectedHistorical(c.id);
                    playClick();
                  }}
                >
                  <div className="flex-center icon-container" style={{ marginBottom: '1rem' }}>
                    <Icon size={48} className="coalition-icon" />
                  </div>
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{c.name}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{desc}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* CUSTOM MODE */}
        {gameMode === 'CUSTOM' && (
          <div className="custom-mode-container" style={{ marginBottom: '3rem' }}>
            <div className="custom-config-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Alliance Name</label>
                <input
                  type="text"
                  value={allianceName}
                  onChange={e => setAllianceName(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'white' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Theme Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['#ed1c24', '#0033a0', '#003153', '#008000', '#00adef', '#f37021', '#8b5cf6'].map(c => (
                    <div
                      key={c}
                      onClick={() => {
                        setSelectedColor(c);
                        playClick();
                      }}
                      style={{
                        width: '32px', height: '32px', borderRadius: '4px', background: c, cursor: 'pointer',
                        border: selectedColor === c ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                        boxShadow: selectedColor === c ? '0 0 10px ' + c : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Opposition</label>
                <select
                  value={opponentMode}
                  onChange={e => {
                    setOpponentMode(e.target.value as any);
                    playClick();
                  }}
                  style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'white' }}
                >
                  <option value="1v1" style={{ color: 'black' }}>1v1 The Big Tent</option>
                  <option value="3-corner" style={{ color: 'black' }}>3-Cornered Fight</option>
                </select>
              </div>
            </div>

            <div className="synergy-panel" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>Synergy</h4>
                <div className="synergy-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: synergyVal >= 1 ? 'var(--accent-teal)' : 'var(--accent-red)' }}>
                  {(synergyVal * 100).toFixed(0)}%
                </div>
              </div>
              <div>
                <p className="synergy-desc" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Combine complementary parties (e.g. Reformist + Progressive) for bonuses.
                </p>
              </div>
            </div>

            <div className="party-selection-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
              {availableParties.map(p => {
                const isSelected = selectedParties.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleParty(p.id)}
                    className="glass-panel party-card"
                    style={{
                      padding: '1rem', cursor: 'pointer', textAlign: 'center',
                      background: isSelected ? p.color : 'rgba(255,255,255,0.02)',
                      borderColor: isSelected ? 'transparent' : 'var(--border-glass)'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{p.ideology}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="swings-section" style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border-glass)', marginBottom: '2rem' }}>
          <div className="flex-between swings-header" style={{ marginBottom: '1rem' }}>
            <h4>Post-GE15 Swings</h4>
            <button onClick={() => { setExplicitSwings([...explicitSwings, { id: Date.now().toString(), demographic: 'Nationwide', from: 'BN', to: 'PN', amount: 5 }]); playClick(); }} className="glass-button" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> <span className="desktop-only">Add Swing</span>
            </button>
          </div>

          {/* Political Climate Perturbation Indicator */}
          <div className="perturbation-indicator" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', background: perturbationEnabled ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${perturbationEnabled ? 'rgba(56, 189, 248, 0.2)' : 'var(--border-glass)'}`, borderRadius: '6px', marginBottom: '1rem', transition: 'all 0.3s' }}>
            <label className="toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '40px', minWidth: '40px', height: '22px', cursor: 'pointer' }}>
              <input type="checkbox" checked={perturbationEnabled} onChange={() => { setPerturbationEnabled(!perturbationEnabled); playClick(); }} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: perturbationEnabled ? '#38bdf8' : 'rgba(255,255,255,0.15)', borderRadius: '11px', transition: 'background-color 0.3s' }}>
                <span style={{ position: 'absolute', left: perturbationEnabled ? '20px' : '2px', top: '2px', width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%', transition: 'left 0.3s' }} />
              </span>
            </label>
            <div style={{ flex: 1, opacity: perturbationEnabled ? 1 : 0.5, transition: 'opacity 0.3s' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Political Climate</div>
              <div style={{ fontSize: '0.95rem', color: perturbationEnabled ? '#38bdf8' : 'var(--text-muted)' }}>
                {perturbationEnabled ? (<>Seed <strong>#{perturbationSeed}</strong> — ±3% random variance per seat</>) : 'Disabled — using exact GE15 data'}
              </div>
            </div>
            {perturbationEnabled && (
              <button
                onClick={() => { setPerturbationSeed(Math.floor(Math.random() * 999999)); playClick(); }}
                className="glass-button"
                style={{ padding: '0.5rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                title="Re-roll political climate"
              >
                <Shuffle size={14} /> Re-roll
              </button>
            )}
          </div>
          {explicitSwings.length > 0 && (
            <div className="swings-list">
              {explicitSwings.map((swing, idx) => (
                <div key={swing.id} className="swing-row" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <select value={swing.demographic} onChange={e => { const newS = [...explicitSwings]; newS[idx].demographic = e.target.value; setExplicitSwings(newS); }} className="swing-select" style={{ flex: 1 }}>
                    <optgroup label="Ethnicity (Weighted)">
                      <option value="Malay">Malay Voters</option>
                      <option value="Chinese">Chinese Voters</option>
                      <option value="Indian">Indian Voters</option>
                      <option value="Bumi-Borneo">Bumi Voters (Borneo)</option>
                    </optgroup>
                    <optgroup label="Geography">
                      <option value="Urban">Urban Seats</option>
                      <option value="Rural">Rural Seats</option>
                    </optgroup>
                    <optgroup label="Specialty">
                      <option value="Youth">Youth Voters</option>
                      <option value="Nationwide">Nationwide Swing</option>
                    </optgroup>
                    <optgroup label="Legacy (Flat)">
                      <option value="Malay-Majority">Malay-Majority Seats</option>
                      <option value="Chinese-Majority">Chinese-Majority Seats</option>
                      <option value="Mixed">Mixed Seats</option>
                      <option value="Bumiputera-Sabah/Sarawak">Bumi-Majority (Borneo) Seats</option>
                    </optgroup>
                  </select>
                  <div className="swing-controls" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="text" inputMode="numeric" pattern="[0-9]*" value={swing.amount || ''} onChange={e => { const newS = [...explicitSwings]; const raw = e.target.value.replace(/[^0-9]/g, ''); newS[idx].amount = raw === '' ? 0 : parseInt(raw, 10); setExplicitSwings(newS); }} className="swing-select" style={{ width: '60px', textAlign: 'center' }} />
                    <span style={{ color: 'var(--text-muted)' }}>%</span>
                  </div>
                  <div className="swing-shift" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select value={swing.from} onChange={e => { const newS = [...explicitSwings]; newS[idx].from = e.target.value; setExplicitSwings(newS); }} className="swing-select">
                      <option value="PH">PH</option>
                      <option value="PN">PN</option>
                      <option value="BN">BN</option>
                      <option value="Others">Others</option>
                    </select>
                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                    <select value={swing.to} onChange={e => { const newS = [...explicitSwings]; newS[idx].to = e.target.value; setExplicitSwings(newS); }} className="swing-select">
                      <option value="PH">PH</option>
                      <option value="PN">PN</option>
                      <option value="BN">BN</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <button onClick={() => {
                    setExplicitSwings(explicitSwings.filter(s => s.id !== swing.id))
                    playClick();
                  }} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '0.5rem' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-center start-action">
          <button
            className="glass-button start-btn"
            style={{ fontSize: '1.2rem', padding: '1rem 3rem', display: 'flex', alignItems: 'center', gap: '10px' }}
            onClick={handleStart}
          >
            <Play size={20} /> Begin Campaign
          </button>
        </div>

      </div>

      <style>{`
        @media (max-width: 768px) {
          .precampaign-container {
            padding: 1rem !important;
          }
          .content-card {
            padding: 1.5rem !important;
          }
          .main-title {
            font-size: 1.8rem !important;
          }
          .sub-title {
            font-size: 1rem !important;
            margin-bottom: 1.5rem !important;
          }
          .historical-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .coalition-card {
            padding: 1.2rem !important;
          }
          .coalition-icon {
            width: 32px !important;
            height: 32px !important;
          }
          .custom-config-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .synergy-panel {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
            padding: 1rem !important;
          }
          .synergy-value {
            font-size: 1.5rem !important;
          }
          .party-selection-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .party-card {
            padding: 0.8rem !important;
          }
          .party-card div:first-child {
            font-size: 0.9rem !important;
          }
          .swings-section {
            padding: 1rem !important;
          }
          .swing-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.8rem !important;
            padding: 1rem !important;
            background: rgba(255,255,255,0.03);
            border-radius: 8px;
          }
          .swing-select {
            width: 100% !important;
          }
          .swing-controls, .swing-shift {
            justify-content: space-between !important;
          }
          .start-btn {
            width: 100% !important;
            padding: 1rem !important;
            font-size: 1.1rem !important;
          }
        }

        .swing-select {
          padding: 0.6rem;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          border: 1px solid var(--border-glass);
          border-radius: 6px;
          font-size: 16px; /* Prevents iOS auto-zoom on focus */
          transition: border-color 0.2s;
        }
        .swing-select:focus {
          border-color: var(--accent-blue);
          outline: none;
        }
        .swing-select optgroup {
          color: #38bdf8; /* Brighter blue for high contrast */
          background: #111;
          font-weight: bold;
          font-style: normal;
        }
        .swing-select option {
          background: #1a1a1a;
          color: white;
        }
      `}</style>
    </div>
  );
}
