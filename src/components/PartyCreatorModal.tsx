import React, { useState, useEffect } from 'react';
import { X, Save, Users, Palette, Info, Trash2 } from 'lucide-react';
import { availableParties, type Party, type Ideology, type DemographicFocus } from '../data/parties';
import { playClick } from '../utils/sfx';

interface PartyCreatorModalProps {
  onClose: () => void;
  onSave: (party: Party) => void;
  onDelete?: (id: string) => void;
  initialParty?: Party;
}

const IDEOLOGIES: Ideology[] = ['Reformist', 'Conservative', 'Islamist', 'Centrist', 'Progressive', 'Regional'];
const DEMOGRAPHICS: DemographicFocus[] = ['Urban Mixed', 'Rural Malay', 'Urban Non-Malay', 'East Malaysia', 'National'];
const PRESET_COLORS = [
  '#ed1c24', '#0033a0', '#003153', '#008000', '#00adef', '#f37021',
  '#ffcc00', '#14b8a6', '#ec4899', '#84cc16', '#8b5cf6', '#181116'
];

export default function PartyCreatorModal({ onClose, onSave, onDelete, initialParty }: PartyCreatorModalProps) {
  const [name, setName] = useState(initialParty?.name || '');
  const [color, setColor] = useState(initialParty?.color || PRESET_COLORS[0]);
  const [ideology, setIdeology] = useState<Ideology>(initialParty?.ideology || 'Centrist');
  const [demographic, setDemographic] = useState<DemographicFocus>(initialParty?.demographic || 'National');
  const [voterTransfer, setVoterTransfer] = useState<Record<string, number>>(initialParty?.voterTransfer || {});

  const handleTransferChange = (partyId: string, value: number) => {
    setVoterTransfer(prev => ({
      ...prev,
      [partyId]: value / 100
    }));
  };

  const handleSave = () => {
    if (!name.trim()) return;

    try {
      const partyData: Party = {
        id: initialParty?.id || `CUSTOM_${Date.now()}`,
        name: name.trim(),
        color,
        ideology,
        demographic,
        baseStrength: 10,
        tags: [ideology, demographic],
        voterTransfer
      };

      playClick();
      onSave(partyData);
      onClose();
    } catch (err) {
      console.error('Failed to save party:', err);
    }
  };

  const handleDelete = () => {
    if (initialParty && onDelete) {
      if (window.confirm(`Are you sure you want to delete ${initialParty.name}?`)) {
        playClick();
        onDelete(initialParty.id);
        onClose();
      }
    }
  };

  // Calculate projected strength (very simplified)
  const calculateStrength = () => {
    let total = 0;
    Object.entries(voterTransfer).forEach(([id, pct]) => {
      const party = availableParties.find(p => p.id === id);
      if (party) total += party.baseStrength * pct;
      else if (id === '__OTHERS__') total += 5 * pct;
    });
    return Math.round(total);
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 1000 }} onClick={onClose}>
      <div
        className="glass-panel modal-content animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Styled Close Button */}
        <button
          className="modal-close-btn"
          onClick={() => { playClick(); onClose(); }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex-between" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Users className="accent-blue" /> {initialParty ? 'Edit Party' : 'Create New Party'}
          </h2>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Party Name</label>
              <input
                type="text"
                placeholder="e.g. Parti Baru"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                style={{
                  width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-glass)', borderRadius: '12px', color: 'white',
                  fontSize: '1.1rem', transition: 'all 0.3s'
                }}
                className="input-focus-accent"
                autoFocus
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Ideology</label>
              <select
                value={ideology}
                onChange={e => setIdeology(e.target.value as Ideology)}
                style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'white' }}
              >
                {IDEOLOGIES.map(i => <option key={i} value={i} style={{ color: 'black' }}>{i}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Demographic Focus</label>
              <select
                value={demographic}
                onChange={e => setDemographic(e.target.value as DemographicFocus)}
                style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'white' }}
              >
                {DEMOGRAPHICS.map(d => <option key={d} value={d} style={{ color: 'black' }}>{d}</option>)}
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Theme Color</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {PRESET_COLORS.map(c => (
                  <div
                    key={c}
                    onClick={() => { setColor(c); playClick(); }}
                    style={{
                      width: '32px', height: '32px', borderRadius: '50%', background: c, cursor: 'pointer',
                      border: color === c ? '3px solid white' : '1px solid rgba(255,255,255,0.1)',
                      boxShadow: color === c ? `0 0 12px ${c}` : 'none',
                      transform: color === c ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  />
                ))}
                <div style={{ position: 'relative', width: '32px', height: '32px' }}>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{
                      position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2
                    }}
                  />
                  <div
                    style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                      border: !PRESET_COLORS.includes(color) ? '3px solid white' : '1px solid rgba(255,255,255,0.1)',
                      boxShadow: !PRESET_COLORS.includes(color) ? `0 0 12px ${color}` : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', fontWeight: 'bold', color: 'white', textShadow: '0 0 3px rgba(0,0,0,0.5)',
                      transform: !PRESET_COLORS.includes(color) ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.2s'
                    }}
                  >
                    +
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="voter-base-section" style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
              <Palette size={20} className="accent-gold" /> Voter Base Split
              <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                Capture votes from existing parties
              </span>
            </h3>

            <div className="voter-grid">
              {availableParties.map(p => (
                <div key={p.id} className="transfer-slider" style={{ marginBottom: '0.8rem' }}>
                  <div className="flex-between" style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: p.color, fontWeight: 700 }}>{p.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>{Math.round((voterTransfer[p.id] || 0) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={(voterTransfer[p.id] || 0) * 100}
                    onChange={e => handleTransferChange(p.id, parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: p.color, cursor: 'pointer' }}
                  />
                </div>
              ))}

              <div className="transfer-slider independents-row">
                <div className="flex-between" style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700 }}>Independents & Minor Parties</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', fontWeight: 800 }}>{Math.round((voterTransfer['__OTHERS__'] || 0) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={(voterTransfer['__OTHERS__'] || 0) * 100}
                  onChange={e => handleTransferChange('__OTHERS__', parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-teal)', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '1.5rem', borderTop: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}>
          <div className="strength-info">
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>Estimated Political Strength</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--accent-teal)' }}>{calculateStrength()} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>pts</span></div>
          </div>
          
          <div className="footer-actions">
            {initialParty && (
              <button
                className="glass-button"
                style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}
                onClick={handleDelete}
              >
                <Trash2 size={18} /> Delete
              </button>
            )}
            <button
              className={`glass-button ${name.trim() ? 'active' : ''}`}
              style={{
                fontWeight: 700,
                opacity: name.trim() ? 1 : 0.5,
                cursor: name.trim() ? 'pointer' : 'not-allowed'
              }}
              onClick={handleSave}
              disabled={!name.trim()}
            >
              <Save size={18} /> {initialParty ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100dvh;
          background: rgba(2, 4, 12, 0.85);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          z-index: 1000;
        }
        .modal-content {
          max-width: 700px;
          width: 100%;
          max-height: min(90dvh, 850px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.8);
          border-radius: 20px;
        }
        .modal-close-btn {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-muted);
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          z-index: 10;
        }
        .modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transform: rotate(90deg);
          border-color: rgba(255, 255, 255, 0.3);
        }
        .input-focus-accent:focus {
          outline: none;
          border-color: var(--accent-blue) !important;
          background: rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
        }
        input[type="range"] {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
          border: 2px solid currentColor;
          transition: transform 0.1s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        .voter-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem 2rem;
        }
        .transfer-slider {
          margin-bottom: 0.8rem;
          min-width: 0;
        }
        .independents-row {
          grid-column: span 2;
          padding: 1rem;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
          margin-top: 0.5rem;
        }
        @media (max-width: 600px) {
          .form-grid {
            grid-template-columns: 1fr !important;
          }
          .voter-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .independents-row {
            grid-column: span 1 !important;
          }
          .modal-footer {
            flex-direction: column;
            gap: 1.5rem;
            align-items: stretch !important;
            text-align: center;
          }
          .footer-actions {
            display: flex;
            gap: 10px;
          }
          .footer-actions .glass-button {
            flex: 1;
            padding: 0.8rem 0.5rem !important;
            justify-content: center;
            font-size: 0.9rem !important;
          }
        }
        .modal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }
        .footer-actions {
          display: flex;
          gap: 12px;
        }
        .footer-actions .glass-button {
          padding: 0.8rem 2rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
