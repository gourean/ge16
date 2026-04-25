import type { GameState } from '../store/gameStore';

export interface EventChoice {
  text: string;
  costFunds?: number;
  costPC?: number;
  effect: (state: GameState, set: (partial: Partial<GameState>) => void) => void;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  type: 'EVENT' | 'QUESTION' | 'BLACK_SWAN';
  choices: EventChoice[];
  condition?: (state: GameState) => boolean;
}

export const gameEvents: GameEvent[] = [
  {
    id: 'scandal_1',
    title: 'Corruption Scandal Breaks',
    description: 'A major infrastructure project linked to your coalition is under investigation by the MACC. The public is outraged and awaiting your response.',
    type: 'EVENT',
    choices: [
      {
        text: 'This is a baseless political witch hunt! We deny all allegations of wrongdoing. (+ Risk, 0 Cost)',
        effect: (state, set) => {
            // Lose 2 Popularity nationwide, 0 PC cost
            const penalty = 2;
            const myCoal = state.playerState.currentCoalition;
            
            if (!myCoal) return;
            
            const newSeats = state.seats.map(s => {
                const newTracker = { ...s.popularityTracker };
                newTracker[myCoal] = Math.max(0, newTracker[myCoal] - penalty);
                return { ...s, popularityTracker: newTracker };
            });
            
            set({
                seats: newSeats,
                playerState: { ...state.playerState, stability: Math.max(0, state.playerState.stability - 12) }
            });
        }
      },
      {
         text: 'We have nothing to hide. I am calling for an immediate and independent inquiry. (Costs 20 PC)',
         costPC: 20,
         effect: (state, set) => {
             // Costs 20 PC, no popularity hit (Auto-deducted in store)
             // Fallback penalty if store somehow misses it (though UI should prevent)
             if (state.playerState.politicalCapital < 20) {
                 const penalty = 4;
                 const myCoal = state.playerState.currentCoalition;
                 if (!myCoal) return;
                 const newSeats = state.seats.map(s => {
                    const newTracker = { ...s.popularityTracker };
                    newTracker[myCoal] = Math.max(0, newTracker[myCoal] - penalty);
                    return { ...s, popularityTracker: newTracker };
                });
                set({ seats: newSeats, playerState: {...state.playerState, politicalCapital: 0} });
             }
         }
      }
    ]
  },
  {
      id: 'journalist_economy',
      title: 'Press Conference Probe',
      description: 'A persistent journalist asks about your plans to tackle the rising cost of living and inflation.',
      type: 'QUESTION',
      choices: [
          {
              text: 'We will ensure targeted subsidies reach those who need them most—no Malaysian will be left behind! (Costs 1M)',
              costFunds: 1000000,
              effect: (state, set) => {
                 // Gain 1 popularity nationwide
                 const myCoal = state.playerState.currentCoalition;
                 if (!myCoal) return;
                 const newSeats = state.seats.map(s => {
                    const newTracker = { ...s.popularityTracker };
                    newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 1);
                    return { ...s, popularityTracker: newTracker };
                 });
                 set({ seats: newSeats });
              }
          },
          {
              text: 'Global winds are shifting; we must be resilient and face these economic realities honestly. (No Cost)',
              effect: (state, set) => {
                  // Small popularity penalty
                  const penalty = 1;
                  const myCoal = state.playerState.currentCoalition;
                  if (!myCoal) return;
                  const newSeats = state.seats.map(s => {
                    const newTracker = { ...s.popularityTracker };
                    newTracker[myCoal] = Math.max(0, newTracker[myCoal] - penalty);
                    return { ...s, popularityTracker: newTracker };
                  });
                  set({ seats: newSeats });
              }
          }
      ]
  },
  // --- PARTY-SPECIFIC TOUGH QUESTIONS ---
  {
      id: 'q_pkr_reformasi_sincerity',
      title: 'The Reformasi Clock',
      description: 'A journalist asks: "You have campaigned on Reformasi for decades. Now that you are in the heat of the campaign, why should voters believe your timeline for institutional reform is any different from previous empty promises?"',
      type: 'QUESTION',
      condition: (s) => s.playerState.componentParties.includes('PKR'),
      choices: [
          {
              text: 'Watch us. Our first 100 days will see a legislative blitz that ends the era of empty talk! (+5 Reformist Pop, -15 Stability)',
              effect: (state, set) => {
                  const myCoal = state.playerState.currentCoalition;
                  const newSeats = state.seats.map(s => {
                      const newTracker = { ...s.popularityTracker };
                      if (s.demographics.includes('Urban')) newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 2);
                      return { ...s, popularityTracker: newTracker };
                  });
                  set({ 
                      seats: newSeats,
                      playerState: { ...state.playerState, stability: Math.max(0, state.playerState.stability - 15) } 
                  });
              }
          },
          {
              text: 'True reform cannot be rushed. We value stability and a sustainable path to progress. (+6 Stability, -3 Reformist Pop)',
              effect: (state, set) => {
                  set({ playerState: { ...state.playerState, stability: Math.min(100, state.playerState.stability + 6) } });
              }
          }
      ]
  },
  {
    id: 'q_dap_malay_anxiety',
    title: 'The "Malaysian Malaysia" Probe',
    description: 'A reporter from a Malay-language daily asks how you can guarantee that DAP’s presence in your coalition won’t erode the special position of the Malays and Islam.',
    type: 'QUESTION',
    condition: (s) => s.playerState.componentParties.includes('DAP'),
    choices: [
        {
            text: 'The Federal Constitution is our guide. The rights of all communities are fully protected. (+5 Heartland Trust, +3 Stability)',
            effect: (state, set) => {
                const myCoal = state.playerState.currentCoalition;
                const newSeats = state.seats.map(s => {
                    const newTracker = { ...s.popularityTracker };
                    if (s.isRural && !s.isBorneo) newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 3);
                    if (s.isUrban) newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 2);
                    return { ...s, popularityTracker: newTracker };
                });
                set({ 
                    seats: newSeats,
                    playerState: { ...state.playerState, stability: Math.min(100, state.playerState.stability + 3) }
                });
            }
        },
        {
            text: 'We must move towards a needs-based narrative that helps ALL Malaysians, regardless of race! (+5 Urban Pop, -15 Stability)',
            effect: (state, set) => {
                const myCoal = state.playerState.currentCoalition;
                const newSeats = state.seats.map(s => {
                    const newTracker = { ...s.popularityTracker };
                    if (s.isUrban) newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 3);
                    if (s.isRural && !s.isBorneo) newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 5);
                    return { ...s, popularityTracker: newTracker };
                });
                set({ 
                    seats: newSeats,
                    playerState: { ...state.playerState, stability: Math.max(0, state.playerState.stability - 15) }
                });
            }
        }
    ]
  },
  {
    id: 'q_umno_integrity',
    title: 'The Ghost of Corruption',
    description: 'The press grills you on the inclusion of leaders with ongoing court cases in your coalition. "How can a clean government be built with the Court Cluster?"',
    type: 'QUESTION',
    condition: (s) => s.playerState.componentParties.includes('UMNO'),
    choices: [
        {
            text: 'Everyone is innocent until proven guilty in a court of law. We respect the judicial process. (-15 PC)',
            costPC: 15,
            effect: (_state, _set) => {
                // Cost deducted in store
            }
        },
        {
            text: 'Our focus is on building a new systemic framework that ensures absolute transparency for the future! (-15 Stability, +5 Urban Pop)',
            effect: (state, set) => {
                const myCoal = state.playerState.currentCoalition;
                const newSeats = state.seats.map(s => {
                    const newTracker = { ...s.popularityTracker };
                    if (s.isUrban) newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 2);
                    return { ...s, popularityTracker: newTracker };
                });
                set({ 
                    seats: newSeats,
                    playerState: { ...state.playerState, stability: Math.max(0, state.playerState.stability - 15) }
                });
            }
        }
    ]
  },
  {
    id: 'q_pas_green_wave',
    title: 'The Secular-Religious Divide',
    description: 'Journalists ask if your coalition will eventually allow the implementation of RUU355 and more conservative religious laws nationwide.',
    type: 'QUESTION',
    condition: (s) => s.playerState.componentParties.includes('PAS') && s.playerState.manifestoChoices['ruu355'] === 'neutral',
    choices: [
        {
            text: 'We must acknowledge the aspirations of the people for a more moral and religious society. (+10 Rural Pop, -10 Urban Pop)',
            effect: (state, set) => {
                const myCoal = state.playerState.currentCoalition;
                const newSeats = state.seats.map(s => {
                    const newTracker = { ...s.popularityTracker };
                    if (s.isRural) newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 5);
                    if (s.isUrban) newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 5);
                    return { ...s, popularityTracker: newTracker };
                });
                set({ seats: newSeats });
            }
        },
        {
            text: 'Modesty and moderation are our path. We will maintain the status quo as protected by the law. (-5 Rural Pop, +3 Stability)',
            effect: (state, set) => {
                set({ playerState: { ...state.playerState, stability: Math.min(100, state.playerState.stability + 3) } });
            }
        }
    ]
  },
  {
    id: 'q_pas_moderation',
    title: 'Identity Crisis',
    description: 'Since you have already taken a clear stance on RUU355, a journalist asks if you are alienating your own base or being too radical for the center.',
    type: 'QUESTION',
    condition: (s) => s.playerState.componentParties.includes('PAS') && s.playerState.manifestoChoices['ruu355'] !== 'neutral',
    choices: [
        {
            text: 'Principles are not for sale! We stand by our decision, regardless of political cost! (+5 Heartland Pop, -5 Urban Pop)',
            effect: (state, set) => {
                const myCoal = state.playerState.currentCoalition;
                 const newSeats = state.seats.map(s => {
                    const newTracker = { ...s.popularityTracker };
                    if (s.isRural) newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 3);
                    if (s.isUrban) newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 3);
                    return { ...s, popularityTracker: newTracker };
                });
                set({ seats: newSeats });
            }
        },
        {
            text: 'What we need now is mutual respect and dialogue between all Malaysians. Let us move forward together. (+3 Stability)',
            effect: (state, set) => {
                set({ playerState: { ...state.playerState, stability: Math.min(100, state.playerState.stability + 3) } });
            }
        }
    ]
  },
  {
    id: 'q_bersatu_loyalty',
    title: 'The "Frogs" Question',
    description: 'A persistent reporter points out that many of your candidates have switched parties multiple times. "Why should voters trust political frogs?"',
    type: 'QUESTION',
    condition: (s) => s.playerState.componentParties.includes('BERSATU'),
    choices: [
        {
            text: 'Our members left for principle, choosing the people over corrupt party machinery! (-12 Stability, +5 PC)',
            effect: (state, set) => {
                set({ 
                    playerState: { 
                        ...state.playerState, 
                        stability: Math.max(0, state.playerState.stability - 12),
                        politicalCapital: state.playerState.politicalCapital + 5 
                    } 
                });
            }
        },
        {
            text: 'We are a united coalition now. Past affiliations matter less than our shared vision for the nation. (+3 Stability, -5 PC)',
            effect: (state, set) => {
                set({ 
                    playerState: { 
                        ...state.playerState, 
                        stability: Math.min(100, state.playerState.stability + 3),
                        politicalCapital: Math.max(0, state.playerState.politicalCapital - 5) 
                    } 
                });
            }
        }
    ]
  },
  {
    id: 'q_borneo_ma63_sincerity',
    title: 'The Stepchildren Narrative',
    description: 'A Borneo-based journalist asks why you haven’t made a definitive commitment on MA63 yet. "Are Sarawak and Sabah just vote-banks to you?"',
    type: 'QUESTION',
    condition: (s) => (s.playerState.componentParties.includes('GPS') || s.playerState.componentParties.includes('GRS')) && s.playerState.manifestoChoices['ma63'] === 'neutral',
    choices: [
        {
            text: 'Borneo is a priority. We will launch an immediate high-level review to fulfill all MA63 obligations! (+10 Borneo Pop, -1M Funds)',
            costFunds: 1000000,
            effect: (state, set) => {
                const myCoal = state.playerState.currentCoalition;
                const newSeats = state.seats.map(s => {
                    const newTracker = { ...s.popularityTracker };
                    if (s.isBorneo) newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 5);
                    return { ...s, popularityTracker: newTracker };
                });
                set({ seats: newSeats });
            }
        },
        {
            text: 'We must look at the nation as one. True integration means moving forward as a single, strong Federation. (-5 Borneo Pop, +6 Stability)',
            effect: (state, set) => {
                const myCoal = state.playerState.currentCoalition;
                const newSeats = state.seats.map(s => {
                    const newTracker = { ...s.popularityTracker };
                    if (s.isBorneo) newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 5);
                    return { ...s, popularityTracker: newTracker };
                });
                set({ 
                    seats: newSeats,
                    playerState: { ...state.playerState, stability: Math.min(100, state.playerState.stability + 6) } 
                });
            }
        }
    ]
  },
  {
    id: 'q_borneo_revenue_claim',
    title: 'The 40% Ultimatum',
    description: 'Since you’ve committed to MA63, a journalist asks: "Will you allow Sabah to claim its full 40% revenue share, even if it disrupts the Federal budget?"',
    type: 'QUESTION',
    condition: (s) => (s.playerState.componentParties.includes('GPS') || s.playerState.componentParties.includes('GRS')) && s.playerState.manifestoChoices['ma63'] !== 'neutral',
    choices: [
        {
            text: 'We will find the budget. Sabah and Sarawak are not just states; they are equal partners! (Costs 5M)',
            costFunds: 5000000,
            effect: (state, set) => {
                const myCoal = state.playerState.currentCoalition;
                const newSeats = state.seats.map(s => {
                    const newTracker = { ...s.popularityTracker };
                    if (s.isBorneo) newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 8);
                    return { ...s, popularityTracker: newTracker };
                });
                set({ seats: newSeats });
            }
        },
        {
            text: 'We are committed, but we must protect national solvency with a staggered timeline. (+3 Stability)',
            effect: (state, set) => {
                const myCoal = state.playerState.currentCoalition;
                const newSeats = state.seats.map(s => {
                    const newTracker = { ...s.popularityTracker };
                    if (s.isBorneo) newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 2);
                    return { ...s, popularityTracker: newTracker };
                });
                set({ 
                    seats: newSeats,
                    playerState: { ...state.playerState, stability: Math.min(100, state.playerState.stability + 3) } 
                });
            }
        }
    ]
  },

  // --- BLACK SWAN EVENTS ---
  {
      id: 'bs_monsoon_floods',
      title: 'The Great Monsoon Floods',
      description: 'Unprecedented flooding has hit 5 states. The campaign is paralyzed as the nation looks for leadership.',
      type: 'BLACK_SWAN',
      choices: [
        {
            text: 'Politics stops at the water’s edge. Every sen we have will go to helping those in need! (Costs 3M)',
            costFunds: 3000000,
            effect: (state, set) => {
                const myCoal = state.playerState.currentCoalition;
                const newSeats = state.seats.map(s => {
                    const newTracker = { ...s.popularityTracker };
                    if (s.isRural) newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 6);
                    return { ...s, popularityTracker: newTracker };
                });
                set({ seats: newSeats });
            }
        },
        {
            text: 'This is the cost of years of neglect. We need change to build better dams and drains! (-10 PC)',
            effect: (state, set) => {
                const myCoal = state.playerState.currentCoalition;
                // Affected states: Kelantan, Terengganu, Pahang, Johor, Selangor
                const floodStates = ['Kelantan', 'Terengganu', 'Pahang', 'Johor', 'Selangor'];
                const newSeats = state.seats.map(s => {
                    const newTracker = { ...s.popularityTracker };
                    if (floodStates.includes(s.state)) {
                        newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 4);
                    }
                    return { ...s, popularityTracker: newTracker };
                });
                set({ 
                    seats: newSeats,
                    playerState: { ...state.playerState, politicalCapital: Math.max(0, state.playerState.politicalCapital - 10) } 
                });
            }
        }
    ]
  },
  {
      id: 'bs_ma63_neutral_backlash',
      title: 'The Borneo Ultimatum',
      description: 'Voters in Borneo are frustrated by your "wait-and-see" approach to MA63. They demand a final commitment now.',
      type: 'BLACK_SWAN',
      condition: (s) => s.playerState.manifestoChoices['ma63'] === 'neutral',
      choices: [
        {
            text: 'Commit to full MA63 terms (+15% Borneo Pop, -35 Stability)',
            effect: (state, set) => {
                const myCoal = state.playerState.currentCoalition;
                const newSeats = state.seats.map(s => {
                    const newTracker = { ...s.popularityTracker };
                    if (s.isBorneo) newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 15);
                    return { ...s, popularityTracker: newTracker };
                });
                set({ 
                    seats: newSeats,
                    playerState: { ...state.playerState, stability: Math.max(0, state.playerState.stability - 35) } 
                });
            }
        },
        {
            text: 'Stay Neutral (-15% Borneo Pop, -20 Stability)',
            effect: (state, set) => {
                const myCoal = state.playerState.currentCoalition;
                const newSeats = state.seats.map(s => {
                    const newTracker = { ...s.popularityTracker };
                    if (s.isBorneo) newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 15);
                    return { ...s, popularityTracker: newTracker };
                });
                set({ 
                    seats: newSeats,
                    playerState: { ...state.playerState, stability: Math.max(0, state.playerState.stability - 20) } 
                });
            }
        }
      ]
  },
  {
      id: 'bs_deepfake_viral',
      title: 'The Deepfake Scandal',
      description: 'A highly convincing AI video showing you taking a bribe from a foreign tycoon goes viral 48 hours before the vote.',
      type: 'BLACK_SWAN',
      choices: [
          {
              text: 'Aggressive Takedown Request (-1M Funds, -15 PC)',
              costFunds: 1000000,
              costPC: 15,
              effect: (_state, _set) => {
                  // Costs deducted in store
              }
          },
        {
            text: 'Emotional Public Appeal (-5 Popularity, +3 Stability)',
            effect: (state, set) => {
                const myCoal = state.playerState.currentCoalition;
                const newSeats = state.seats.map(s => {
                    const newTracker = { ...s.popularityTracker };
                    newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 5);
                    return { ...s, popularityTracker: newTracker };
                });
                set({ 
                    seats: newSeats,
                    playerState: { ...state.playerState, stability: Math.min(100, state.playerState.stability + 3) } 
                });
            }
        }
      ]
  }
];
