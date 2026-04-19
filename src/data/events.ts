import type { GameState } from '../store/gameStore';

export interface EventChoice {
  text: string;
  effect: (state: GameState, set: (partial: Partial<GameState>) => void) => void;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  type: 'EVENT' | 'QUESTION';
  choices: EventChoice[];
}

export const gameEvents: GameEvent[] = [
  {
    id: 'scandal_1',
    title: 'Corruption Scandal Breaks',
    description: 'A major infrastructure project linked to your coalition is under investigation by the MACC. The public is outraged and awaiting your response.',
    type: 'EVENT',
    choices: [
      {
        text: 'Deny all wrongdoing (Low Cost, High Risk)',
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

           set({ seats: newSeats });
        }
      },
      {
         text: 'Launch an independent inquiry (Costs 20 PC)',
         effect: (state, set) => {
             // Costs 20 PC, no popularity hit
             if (state.playerState.politicalCapital >= 20) {
                set({ 
                    playerState: { 
                        ...state.playerState, 
                        politicalCapital: state.playerState.politicalCapital - 20 
                    } 
                });
             } else {
                 // If not enough PC, penalty is worse
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
              text: 'Promise targeted subsidies (Costs 1M Funds)',
              effect: (state, set) => {
                 set({
                     playerState: {
                         ...state.playerState,
                         funds: Math.max(0, state.playerState.funds - 1000000)
                     }
                 });
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
              text: 'Blame global economic factors (No Cost)',
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
  {
    id: 'rally_momentum',
    title: 'Viral Campaign Song',
    description: 'Your coalition’s new campaign song has gone viral on TikTok! You have unexpected momentum.',
    type: 'EVENT',
    choices: [
        {
            text: 'Capitalize with a new digital ad blitz (Costs 500k, Boost Popularity)',
            effect: (state, set) => {
                const myCoal = state.playerState.currentCoalition;
                 if (!myCoal) return;
                 
                 const cost = 500000;
                 if (state.playerState.funds >= cost) {
                    const newSeats = state.seats.map(s => {
                        const newTracker = { ...s.popularityTracker };
                        newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 2);
                        return { ...s, popularityTracker: newTracker };
                     });
                     set({ 
                         seats: newSeats,
                         playerState: {
                             ...state.playerState,
                             funds: state.playerState.funds - cost
                         }
                     });
                 }
            }
        },
        {
            text: 'Just enjoy the organic reach (Slight Boost)',
            effect: (state, set) => {
                 const myCoal = state.playerState.currentCoalition;
                 if (!myCoal) return;
                 const newSeats = state.seats.map(s => {
                    const newTracker = { ...s.popularityTracker };
                    newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 1);
                    return { ...s, popularityTracker: newTracker };
                 });
                 set({ seats: newSeats });
            }
        }
    ]
  }
];
