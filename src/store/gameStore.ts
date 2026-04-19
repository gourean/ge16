import { create } from 'zustand';
import type { GameEvent } from '../data/events';
import { gameEvents } from '../data/events';

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
}

const initialPlayerState = {
  funds: 10000000, // 10 million base
  politicalCapital: 100, // starting PC
  stability: 100,
  stanceHistory: {},
  currentCoalition: 'Faction1',
  coalitionName: '',
  componentParties: [],
  manifestoChoices: {},
  manifestoTags: []
} as PlayerState;

export const useGameStore = create<GameState>((set, get) => ({
  gamePhase: 'PRE_CAMPAIGN',
  turn: 1,
  seats: [],
  playerState: initialPlayerState,
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
  activeEvent: null,
  hasTriggeredEventThisTurn: false,
  exitConfirmationOpen: false,
  actionsRemaining: 3,
  
  isSettingsOpen: false,
  audioSettings: {
    volume: 50,
    sfxVolume: 50,
    isMuted: false
  },
  notificationQueue: [],
  hasInteractionStarted: false,
  
  setGamePhase: (phase) => set({ gamePhase: phase }),
  setExitConfirmationOpen: (open) => set({ exitConfirmationOpen: open }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setAudioSettings: (settings) => set((state) => ({
    audioSettings: { ...state.audioSettings, ...settings }
  })),
  
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
    playerState: initialPlayerState,
    activeEvent: null,
    hasTriggeredEventThisTurn: false,
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
    }
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
    
    // 30% chance to trigger an event if one hasn't triggered this turn
    let nextEvent = null;
    let willTrigger = false;
    if (Math.random() < 0.3) {
        willTrigger = true;
        const randomIdx = Math.floor(Math.random() * gameEvents.length);
        nextEvent = gameEvents[randomIdx];
    }

    return { 
        turn: state.turn + 1,
        activeEvent: nextEvent,
        hasTriggeredEventThisTurn: willTrigger,
        actionsRemaining: 3
    };
  }),
  
  playAction: (costFunds, costPC, effect) => {
    const state = get();
    if (state.playerState.funds < costFunds || state.playerState.politicalCapital < costPC || state.actionsRemaining <= 0) {
      return false; // Not enough resources or no actions left
    }
    
    // Apply new popularities via effect function
    const newSeats = effect([...state.seats]);
    
    set({
      seats: newSeats,
      actionsRemaining: state.actionsRemaining - 1,
      playerState: {
        ...state.playerState,
        funds: state.playerState.funds - costFunds,
        politicalCapital: state.playerState.politicalCapital - costPC,
      }
    });
    return true;
  },

  resolveEvent: (choiceIndex: number) => {
      const state = get();
      const currentEvent = state.activeEvent;
      
      if (!currentEvent) return;

      const choice = currentEvent.choices[choiceIndex];
      if (choice) {
          choice.effect(state, set);
      }
      
      set({ activeEvent: null }); // clear the event after resolution
  }
}));
