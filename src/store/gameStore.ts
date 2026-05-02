import { create } from 'zustand';
import type { GameEvent } from '../data/events';
import { gameEvents } from '../data/events';
import { normalizePopularity } from '../utils/campaignUtils';
import type { Party } from '../data/parties';

export interface GameNotification {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  duration?: number; // ms to auto-dismiss
}

export type Seat = {
  id: string; // e.g. P.001
  name: string;
  state: string;
  demographics: string;
  isUrban?: boolean;
  isRural?: boolean;
  isBorneo?: boolean;
  ethnicity?: {
    malay: number;
    chinese: number;
    indian: number;
    orangAsli: number;
    bumiSabah: number;
    bumiSarawak: number;
    others: number;
  };
  popularityTracker: {
    Faction1: number;
    Faction2: number;
    Faction3: number;
    Others: number;
  };
  basePopularity: {
    Faction1: number;
    Faction2: number;
    Faction3: number;
    Others: number;
  };
  // Party-level popularity from GE15 (percentages)
  partyPopularity?: Record<string, number>;
  // Which party represented each coalition in GE15
  ge15Allocation?: {
    PH: string;
    PN: string;
    BN: string;
  };
  winnerGE15?: string;
  candidates: any[];
};

export interface PlayerState {
  funds: number;
  politicalCapital: number;
  stability: number; // 0-100, affected by "Contradiction Engine"
  stanceHistory: Record<string, number>; // topics: popularity impact
  currentCoalition: 'Faction1';
  coalitionName: string;
  componentParties: string[];
  manifestoChoices: Record<string, 'agree' | 'disagree' | 'neutral' | null>;
  manifestoTags: string[];
  flags: Record<string, boolean>;
}

export interface GameState {
  gamePhase: 'PRE_CAMPAIGN' | 'MANIFESTO' | 'CAMPAIGN' | 'POST_ELECTION' | 'OUTCOME';
  turn: number;
  seats: Seat[];
  playerState: PlayerState;
  
  // Settings & Audio
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  audioSettings: {
    volume: number;
    sfxVolume: number;
    isMuted: boolean;
  };
  setAudioSettings: (settings: Partial<{ volume: number; sfxVolume: number; isMuted: boolean }>) => void;

  // Actions
  actionsRemaining: number;
  setGamePhase: (phase: 'PRE_CAMPAIGN' | 'MANIFESTO' | 'CAMPAIGN' | 'POST_ELECTION' | 'OUTCOME') => void;
  resetGame: () => void;
  exitConfirmationOpen: boolean;
  setExitConfirmationOpen: (open: boolean) => void;
  selectCoalition: (coalitionName: string, componentParties: string[], colors: Record<string, string>, opponentNames?: { faction2Name: string; faction2Parties: string[]; faction3Name: string; faction3Parties: string[] }) => void;
  setManifestoChoice: (id: string, choice: 'agree' | 'disagree' | 'neutral') => void;
  finalizeManifesto: () => void;
  loadInitialSeats: (seatsData: Seat[]) => void;
  nextTurn: () => void;
  playAction: (costFunds: number, costPC: number, effect: (seats: Seat[]) => Seat[]) => boolean;
  
  // Event state
  activeEvent: GameEvent | null;
  hasTriggeredEventThisTurn: boolean;
  triggeredEventIds: string[];
  resolveEvent: (choiceIndex: number) => void;
  
  factionColors: Record<string, string>;
  factionNames: Record<string, string>;
  factionParties: Record<string, string[]>;
  
  // Notifications
  notificationQueue: GameNotification[];
  pushNotification: (notif: Omit<GameNotification, 'id'>) => void;
  dismissNotification: () => void;

  // Interaction (for Audio)
  hasInteractionStarted: boolean;
  setInteractionStarted: (started: boolean) => void;
  setElectionResults: (results: Record<string, any>) => void;
  electionResults: Record<string, any> | null;

  isCheatMode: boolean;
  setCheatMode: (enabled: boolean) => void;

  setFactionColor: (factionId: string, color: string) => void;
  startingFactionColors: Record<string, string>;
  resetFactionColors: () => void;

  customParties: Party[];
  addCustomParty: (party: Party) => void;
  updateCustomParty: (party: Party) => void;
  deleteCustomParty: (id: string) => void;
}

const getInitialPlayerState = (): PlayerState => ({
  funds: 15000000,
  politicalCapital: 100,
  stability: 100,
  stanceHistory: {},
  currentCoalition: 'Faction1',
  coalitionName: '',
  componentParties: [],
  manifestoChoices: {},
  manifestoTags: [],
  flags: {}
});

const STORAGE_KEY = 'ge16_audio_settings';

const loadSavedAudioSettings = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load audio settings', e);
  }
  return {
    volume: 50,
    sfxVolume: 50,
    isMuted: false
  };
};

export const useGameStore = create<GameState>((set, get) => ({
  gamePhase: 'PRE_CAMPAIGN',
  turn: 1,
  seats: [],
  playerState: getInitialPlayerState(),
  factionColors: {
    Faction1: '#ef4444',
    Faction2: '#0ea5e9',
    Faction3: '#2563eb',
    Others: '#8b5cf6',
    Undecided: '#6b7280'
  },
  factionNames: {
    Faction1: 'Faction 1',
    Faction2: 'Faction 2',
    Faction3: 'Faction 3',
    Others: 'Others',
    Undecided: 'Undecided'
  },
  factionParties: {
    Faction1: [],
    Faction2: [],
    Faction3: [],
  },
  customParties: [],
  addCustomParty: (party) => set((state) => ({
    customParties: [...state.customParties, party]
  })),
  updateCustomParty: (updatedParty) => set((state) => ({
    customParties: state.customParties.map(p => p.id === updatedParty.id ? updatedParty : p)
  })),
  deleteCustomParty: (id) => set((state) => ({
    customParties: state.customParties.filter(p => p.id !== id)
  })),
  activeEvent: null,
  hasTriggeredEventThisTurn: false,
  triggeredEventIds: [],
  exitConfirmationOpen: false,
  actionsRemaining: 3,
  startingFactionColors: {
    Faction1: '#ef4444',
    Faction2: '#0ea5e9',
    Faction3: '#2563eb',
    Others: '#8b5cf6',
    Undecided: '#6b7280'
  },
  
  isCheatMode: false,
  setCheatMode: (enabled) => set({ isCheatMode: enabled }),

  isSettingsOpen: false,
  audioSettings: loadSavedAudioSettings(),
  notificationQueue: [],
  hasInteractionStarted: false,
  electionResults: null,
  
  setGamePhase: (phase) => set({ gamePhase: phase }),
  setExitConfirmationOpen: (open) => set({ exitConfirmationOpen: open }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setAudioSettings: (settings) => set((state) => {
    const newSettings = { ...state.audioSettings, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    return { audioSettings: newSettings };
  }),
  
  pushNotification: (notif) => set((state) => ({
    notificationQueue: [...state.notificationQueue, { ...notif, id: Date.now().toString() }]
  })),

  dismissNotification: () => set((state) => ({
    notificationQueue: state.notificationQueue.slice(1)
  })),

  setInteractionStarted: (started) => set({ hasInteractionStarted: started }),

  resetGame: () => set({
    gamePhase: 'PRE_CAMPAIGN',
    turn: 1,
    playerState: getInitialPlayerState(),
    activeEvent: null,
    hasTriggeredEventThisTurn: false,
    triggeredEventIds: [],
    electionResults: null,
    exitConfirmationOpen: false,
    actionsRemaining: 3,
    factionColors: {
      Faction1: '#ef4444',
      Faction2: '#0ea5e9',
      Faction3: '#2563eb',
      Others: '#8b5cf6',
      Undecided: '#6b7280'
    },
    factionNames: {
      Faction1: 'Faction 1',
      Faction2: 'Faction 2',
      Faction3: 'Faction 3',
      Others: 'Others',
      Undecided: 'Undecided'
    },
    factionParties: {
      Faction1: [],
      Faction2: [],
      Faction3: [],
    },
    isCheatMode: false,
    startingFactionColors: {
      Faction1: '#ef4444',
      Faction2: '#0ea5e9',
      Faction3: '#2563eb',
      Others: '#8b5cf6',
      Undecided: '#6b7280'
    },
    customParties: []
  }),
  
  selectCoalition: (coalitionName, componentParties, colors, opponentNames) => set((state) => {
    let f2Name: string;
    let f3Name: string;
    let f2Parties: string[] = [];
    let f3Parties: string[] = [];

    if (opponentNames) {
      f2Parties = opponentNames.faction2Parties;
      f3Parties = opponentNames.faction3Parties;
    }

    if (opponentNames && opponentNames.faction2Name && opponentNames.faction3Name) {
      // Historical mode: use actual coalition names
      f2Name = opponentNames.faction2Name;
      f3Name = opponentNames.faction3Name;
    } else {
      // Custom mode: generate fictional opponent names
      const oppNames = ['National Alliance', 'Democratic Front', "People's Coalition", 'United Bloc', 'Liberty Union', 'Progressive Pact'];
      const shuffled = oppNames.sort(() => 0.5 - Math.random());
      f2Name = shuffled[0];
      f3Name = shuffled[1];
    }

    return {
      playerState: { ...state.playerState, currentCoalition: 'Faction1', coalitionName, componentParties },
      factionNames: {
        ...state.factionNames,
        Faction1: coalitionName,
        Faction2: f2Name,
        Faction3: f3Name,
      },
      factionParties: {
        Faction1: componentParties,
        Faction2: f2Parties,
        Faction3: f3Parties,
      },
      factionColors: {
        ...state.factionColors,
        ...colors
      },
      startingFactionColors: {
        ...state.factionColors,
        ...colors
      }
    };
  }),
  
  setManifestoChoice: (id, choice) => set((state) => ({
    playerState: {
      ...state.playerState,
      manifestoChoices: { ...state.playerState.manifestoChoices, [id]: choice }
    }
  })),

  finalizeManifesto: () => set(() => {
    // Logic for Contradiction Engine and applying modifiers will be called before this 
    // or inside a wrapper. For now, simple transition.
    return { gamePhase: 'CAMPAIGN' };
  }),

  loadInitialSeats: (seatsData) => set({ seats: seatsData }),
  
  nextTurn: () => set((state) => {
    // If turn matches 14, move to post-election
    if (state.turn >= 14) {
      return { gamePhase: 'POST_ELECTION' };
    }
    
    let newSeats = [...state.seats];
    let notifications = [...state.notificationQueue];
    const myCoal = state.playerState.currentCoalition;

    // --- STABILITY VOLATILITY LOGIC ---
    // If stability < 70, 20% chance of a "Gaffe/Friction" hit (Lowered threshold for more volatility)
    if (state.playerState.stability < 70 && Math.random() < 0.20) {
        const targetStates = Array.from(new Set(state.seats.map(s => s.state))).sort(() => 0.5 - Math.random()).slice(0, 3);
        newSeats = state.seats.map(s => {
            if (targetStates.includes(s.state)) {
                const newTracker = normalizePopularity({
                    ...s.popularityTracker,
                    [myCoal]: Math.max(0, s.popularityTracker[myCoal] - 2.0)
                } as typeof s.popularityTracker);
                return { ...s, popularityTracker: newTracker };
            }
            return s;
        });

        notifications.push({
            id: `stability_hit_${Date.now()}`,
            title: "Internal Friction",
            message: "Conflicting coalition messages have caused a slight drop in public trust in key states.",
            type: "warning"
        });
    }

    // --- TRIGGER EVENT LOGIC ---
    // 50% chance to trigger an event (Increased for more frequent dilemmas)
    let nextEvent = null;
    let willTrigger = false;
    if (Math.random() < 0.50) {
        // Filter available events based on their condition AND if they haven't been triggered yet
        const available = gameEvents.filter(ev => 
            (!ev.condition || ev.condition(state)) && 
            !state.triggeredEventIds.includes(ev.id)
        );
        
        if (available.length > 0) {
            willTrigger = true;
            const randomIdx = Math.floor(Math.random() * available.length);
            nextEvent = available[randomIdx];
        }
    }

    // --- PC REPLENISHMENT TIERS ---
    let totalPCGain = 0;
    if (state.playerState.stability > 85) {
        totalPCGain = 10;
    } else if (state.playerState.stability > 50) {
        totalPCGain = 5;
    }
    const finalPoliticalCapital = state.playerState.politicalCapital + totalPCGain;

    const dayCompleteMsg = `Day ${state.turn} strategy finalized. Actions replenished. +${totalPCGain} PC earned!`;

    notifications.push({
        id: `day_end_${state.turn}_${Date.now()}`,
        title: "Day Complete",
        message: dayCompleteMsg,
        type: "info",
        duration: 6000
    });

    return { 
        turn: state.turn + 1,
        seats: newSeats,
        activeEvent: nextEvent,
        hasTriggeredEventThisTurn: willTrigger,
        actionsRemaining: 3,
        playerState: {
            ...state.playerState,
            politicalCapital: finalPoliticalCapital
        },
        notificationQueue: notifications
    };
  }),
  
  playAction: (costFunds, costPC, effect) => {
    const state = get();
    // In cheat mode, we ignore funds and PC costs, but still respect actionsRemaining
    if ((!state.isCheatMode && (state.playerState.funds < costFunds || state.playerState.politicalCapital < costPC)) || state.actionsRemaining <= 0) {
      return false; // Not enough resources or no actions left
    }
    
    // Apply new popularities via effect function and normalize
    const newSeats = effect([...state.seats]).map(s => ({
      ...s,
      popularityTracker: normalizePopularity(s.popularityTracker as any) as any
    })) as Seat[];
    
    set({
      seats: newSeats,
      actionsRemaining: state.actionsRemaining - 1,
      playerState: {
        ...state.playerState,
        funds: state.isCheatMode ? state.playerState.funds : state.playerState.funds - costFunds,
        politicalCapital: state.isCheatMode ? state.playerState.politicalCapital : state.playerState.politicalCapital - costPC,
      }
    });
    return true;
  },

  resolveEvent: (choiceIndex: number) => {
      const state = get();
      const currentEvent = state.activeEvent;
      
      if (!currentEvent) return;

      if (choiceIndex === -1) {
          // Default penalty for inaction (softlock prevention)
          const penaltyPop = 3;
          const penaltyStability = 10;
          const myCoal = state.playerState.currentCoalition;
          
          const newSeats = state.seats.map(s => ({
              ...s,
              popularityTracker: normalizePopularity({
                  ...s.popularityTracker,
                  [myCoal]: Math.max(0, (s.popularityTracker as any)[myCoal] - penaltyPop)
              } as any) as any
          })) as Seat[];

          set({
              seats: newSeats,
              playerState: {
                  ...state.playerState,
                  stability: Math.max(0, state.playerState.stability - penaltyStability)
              },
              activeEvent: null,
              triggeredEventIds: [...state.triggeredEventIds, currentEvent.id]
          });
          return;
      }

      const choice = currentEvent.choices[choiceIndex];
      if (choice) {
          const costF = choice.costFunds || 0;
          const costPC = choice.costPC || 0;

          const wrappedSet = (update: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => {
              const actualUpdate = typeof update === 'function' ? update(get()) : update;
              if (actualUpdate.seats) {
                  actualUpdate.seats = actualUpdate.seats.map(s => ({
                      ...s,
                      popularityTracker: normalizePopularity(s.popularityTracker as any) as any
                  })) as Seat[];
              }
              set(actualUpdate);
          };

          // Deduct costs if any
          if (costF > 0 || costPC > 0) {
              set((s) => ({
                  playerState: {
                      ...s.playerState,
                      funds: s.playerState.funds - costF,
                      politicalCapital: s.playerState.politicalCapital - costPC
                  }
              }));
          }

          // Pass the FRESH state to the effect function
          choice.effect(get(), wrappedSet as any);
      }
      
      set({ 
          activeEvent: null, 
          triggeredEventIds: [...state.triggeredEventIds, currentEvent.id] 
      }); // clear the event and mark as triggered
  },

  setFactionColor: (factionId, color) => set((state) => ({
    factionColors: {
      ...state.factionColors,
      [factionId]: color
    }
  })),

  resetFactionColors: () => set((state) => ({
    factionColors: { ...state.startingFactionColors }
  })),

  setElectionResults: (results) => set({ electionResults: results })
}));
