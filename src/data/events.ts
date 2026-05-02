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
                text: 'This is a baseless political witch hunt! We deny all allegations of wrongdoing. (+5 Stability, -3% Popularity)',
                effect: (state, set) => {
                    const penalty = 3;
                    const myCoal = state.playerState.currentCoalition;
                    if (!myCoal) return;

                    const newSeats = state.seats.map(s => {
                        const newTracker = { ...s.popularityTracker };
                        newTracker[myCoal] = Math.max(0, newTracker[myCoal] - penalty);
                        return { ...s, popularityTracker: newTracker };
                    });

                    set({
                        seats: newSeats,
                        playerState: { ...state.playerState, stability: Math.min(100, state.playerState.stability + 5) }
                    });
                }
            },
            {
                text: 'We have nothing to hide. I am calling for an immediate and independent inquiry. (-5 Stability, Costs 10 PC)',
                costPC: 10,
                effect: (state, set) => {
                    set({ 
                        playerState: { 
                            ...state.playerState, 
                            stability: Math.max(0, state.playerState.stability - 5) 
                        } 
                    });
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
                text: 'Launch a "Cost of Living" relief fund! (+5% National Pop, Costs RM 2M)',
                costFunds: 2000000,
                effect: (state, set) => {
                    const myCoal = state.playerState.currentCoalition;
                    if (!myCoal) return;
                    const newSeats = state.seats.map(s => {
                        const newTracker = { ...s.popularityTracker };
                        newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 5);
                        return { ...s, popularityTracker: newTracker };
                    });
                    set({ seats: newSeats });
                }
            },
            {
                text: 'Issue a media statement on economic resilience. (-2% National Popularity)',
                effect: (state, set) => {
                    const myCoal = state.playerState.currentCoalition;
                    if (!myCoal) return;
                    const newSeats = state.seats.map(s => {
                        const newTracker = { ...s.popularityTracker };
                        newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 2);
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
                text: 'Watch us. Our first 100 days will see a legislative blitz that ends the era of empty talk! (+2% Urban Pop, -8 Stability)',
                effect: (state, set) => {
                    const myCoal = state.playerState.currentCoalition;
                    const newSeats = state.seats.map(s => {
                        const newTracker = { ...s.popularityTracker };
                        if (s.isUrban) newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 2);
                        return { ...s, popularityTracker: newTracker };
                    });
                    set({
                        seats: newSeats,
                        playerState: { ...state.playerState, stability: Math.max(0, state.playerState.stability - 8) }
                    });
                }
            },
            {
                text: 'True reform cannot be rushed. We value stability and a sustainable path to progress. (+6 Stability, -3 Reformist Popularity)',
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
                text: 'We must move towards a needs-based narrative that helps ALL Malaysians, regardless of race! (+5% Urban Popularity, -15 Stability)',
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
                text: 'Everyone is innocent until proven guilty. We respect the judicial process. (+5 Stability, -15 PC)',
                costPC: 15,
                effect: (state, set) => {
                    set({ playerState: { ...state.playerState, stability: Math.min(100, state.playerState.stability + 5) } });
                }
            },
            {
                text: 'Our focus is on building a new systemic framework that ensures absolute transparency for the future! (-15 Stability, +5% Urban Popularity)',
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
                text: 'We must acknowledge the aspirations of the people for a more moral and religious society. (+10% Rural Popularity, -10% Urban Popularity)',
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
                text: 'Modesty and moderation are our path. We will maintain the status quo as protected by the law. (-5 Rural Pop, +8 Stability)',
                effect: (state, set) => {
                    set({ playerState: { ...state.playerState, stability: Math.min(100, state.playerState.stability + 8) } });
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
                text: 'Principles are not for sale! We stand by our decision, regardless of political cost! (+5% Heartland Popularity, -5% Urban Popularity)',
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
                costPC: 5,
                effect: (state, set) => {
                    set({
                        playerState: {
                            ...state.playerState,
                            stability: Math.min(100, state.playerState.stability + 3)
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
                text: 'Borneo is a priority. We will launch an immediate high-level review to fulfill all MA63 obligations! (+10% Borneo Popularity, -5 PC)',
                costPC: 5,
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
                text: 'We must look at the nation as one. True integration means moving forward as a single, strong Federation. (-5% Borneo Popularity, +6 Stability)',
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
                text: 'We will find the budget. Sabah and Sarawak are not just states; they are equal partners! (+8% Borneo Popularity, Costs 5M)',
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
                text: 'We are committed, but we must protect national solvency with a staggered timeline. (+2% Borneo Popularity, +3 Stability)',
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
                costPC: 10,
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
                        seats: newSeats
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
                text: 'Commit to full MA63 terms (+15% Borneo Popularity, -15 Stability)',
                effect: (state, set) => {
                    const myCoal = state.playerState.currentCoalition;
                    const newSeats = state.seats.map(s => {
                        const newTracker = { ...s.popularityTracker };
                        if (s.isBorneo) newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 15);
                        return { ...s, popularityTracker: newTracker };
                    });
                    set({
                        seats: newSeats,
                        playerState: { ...state.playerState, stability: Math.max(0, state.playerState.stability - 15) }
                    });
                }
            },
            {
                text: 'Stay Neutral (-15% Borneo Popularity, -10 Stability)',
                effect: (state, set) => {
                    const myCoal = state.playerState.currentCoalition;
                    const newSeats = state.seats.map(s => {
                        const newTracker = { ...s.popularityTracker };
                        if (s.isBorneo) newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 15);
                        return { ...s, popularityTracker: newTracker };
                    });
                    set({
                        seats: newSeats,
                        playerState: { ...state.playerState, stability: Math.max(0, state.playerState.stability - 10) }
                    });
                }
            }
        ]
    },
    {
        id: 'bs_deepfake_viral',
        title: 'The Deepfake Scandal',
        description: 'A highly convincing AI video showing you taking a bribe from a foreign tycoon goes viral.',
        type: 'BLACK_SWAN',
        choices: [
            {
                text: 'Order an immediate legal takedown and sue the platforms for hosting the fake video. (-1M Funds, -15 PC)',
                costFunds: 1000000,
                costPC: 15,
                effect: (_state, _set) => {
                    // Legal action effects
                }
            },
            {
                text: 'Record a live video message to voters debunking the deepfake as a malicious attack. (-5 Popularity, +3 Stability)',
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
    },
    {
        id: 'event_tycoon_wage',
        title: 'The Wage Compromise',
        description: 'A powerful business tycoon offers a massive "campaign contribution" if your coalition promises to scrap the proposed Minimum Wage hike after the election.',
        type: 'EVENT',
        choices: [
            {
                text: 'Accept the contribution. We need the war chest. (+5M Funds, -5% Popularity, Scandal Risk)',
                effect: (state, set) => {
                    const myCoal = state.playerState.currentCoalition;
                    const newSeats = state.seats.map(s => {
                        const newTracker = { ...s.popularityTracker };
                        newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 5);
                        return { ...s, popularityTracker: newTracker };
                    });
                    set({
                        seats: newSeats,
                        playerState: { 
                            ...state.playerState, 
                            funds: state.playerState.funds + 5000000,
                            flags: { ...state.playerState.flags, acceptedTycoonBribe_Wage: true }
                        }
                    });
                }
            },
            {
                text: 'Our workers come first. Reject the offer.',
                effect: (state, set) => {
                    // No bonus for rejecting
                }
            }
        ]
    },
    {
        id: 'event_tycoon_land',
        title: 'The Reclamation Deal',
        description: 'A property developer offers a significant donation in exchange for "fast-tracking" environmental approvals for a controversial coastal land reclamation project.',
        type: 'EVENT',
        choices: [
            {
                text: 'Development is progress. Accept the deal. (+5M Funds, -5% Popularity, Scandal Risk)',
                effect: (state, set) => {
                    const myCoal = state.playerState.currentCoalition;
                    const newSeats = state.seats.map(s => {
                        const newTracker = { ...s.popularityTracker };
                        newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 5);
                        return { ...s, popularityTracker: newTracker };
                    });
                    set({
                        seats: newSeats,
                        playerState: { 
                            ...state.playerState, 
                            funds: state.playerState.funds + 5000000,
                            flags: { ...state.playerState.flags, acceptedTycoonBribe_Land: true }
                        }
                    });
                }
            },
            {
                text: 'We must protect our coastlines. Reject the offer.',
                effect: (state, set) => {
                    // No bonus for rejecting
                }
            }
        ]
    },
    {
        id: 'event_tycoon_scandal',
        title: 'Corruption Scandal Erupts',
        description: 'Investigative journalists have leaked documents linking your campaign funds to a secret deal with business tycoons.',
        type: 'EVENT',
        condition: (s) => (s.playerState.flags['acceptedTycoonBribe_Wage'] || s.playerState.flags['acceptedTycoonBribe_Land']) && Math.random() < 0.50,
        choices: [
            {
                text: 'It was a standard donation! Deny all specific policy links. (-15 Stability, -5% Popularity)',
                effect: (state, set) => {
                    const myCoal = state.playerState.currentCoalition;
                    const newSeats = state.seats.map(s => {
                        const newTracker = { ...s.popularityTracker };
                        newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 5);
                        return { ...s, popularityTracker: newTracker };
                    });
                    set({
                        seats: newSeats,
                        playerState: { ...state.playerState, stability: Math.max(0, state.playerState.stability - 15) }
                    });
                }
            },
            {
                text: 'Launch a full internal audit and return the contested funds. (-10 PC, -10 Stability)',
                costPC: 10,
                effect: (state, set) => {
                    set({
                        playerState: {
                            ...state.playerState,
                            stability: Math.max(0, state.playerState.stability - 10)
                        }
                    });
                }
            }
        ]
    },
    {
        id: 'event_controversy_3r_race',
        title: '3R Controversy: Racial Remark',
        description: 'A senior leader from your coalition has made a "3R" remark concerning racial rights that has sparked massive outcry from minority communities.',
        type: 'EVENT',
        choices: [
            {
                text: 'Defend your teammate. (+5 Stability, -10% Popularity in minority-heavy areas)',
                effect: (state, set) => {
                    const myCoal = state.playerState.currentCoalition;
                    const newSeats = state.seats.map(s => {
                        const newTracker = { ...s.popularityTracker };
                        const minorityWeight = (s.ethnicity?.chinese || 0) + (s.ethnicity?.indian || 0);
                        if (minorityWeight > 30) {
                            newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 10);
                        }
                        return { ...s, popularityTracker: newTracker };
                    });
                    set({
                        seats: newSeats,
                        playerState: { ...state.playerState, stability: Math.min(100, state.playerState.stability + 5) }
                    });
                }
            },
            {
                text: 'Alienate and reprimand the leader. (-10 Stability, -1% Minority Popularity)',
                effect: (state, set) => {
                    const myCoal = state.playerState.currentCoalition;
                    const newSeats = state.seats.map(s => {
                        const newTracker = { ...s.popularityTracker };
                        const minorityWeight = (s.ethnicity?.chinese || 0) + (s.ethnicity?.indian || 0);
                        if (minorityWeight > 30) {
                            newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 1);
                        }
                        return { ...s, popularityTracker: newTracker };
                    });
                    set({
                        seats: newSeats,
                        playerState: { ...state.playerState, stability: Math.max(0, state.playerState.stability - 10) }
                    });
                }
            }
        ]
    },
    {
        id: 'event_controversy_3r_religion',
        title: '3R Controversy: Religious Debate',
        description: 'A coalition partner from your alliance has triggered a "3R" controversy regarding religious implementation, upsetting the rural heartlands.',
        type: 'EVENT',
        choices: [
            {
                text: 'Support your coalition partner. (+5 Stability, -10% Rural Popularity)',
                effect: (state, set) => {
                    const myCoal = state.playerState.currentCoalition;
                    const newSeats = state.seats.map(s => {
                        const newTracker = { ...s.popularityTracker };
                        if (s.isRural) newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 10);
                        return { ...s, popularityTracker: newTracker };
                    });
                    set({
                        seats: newSeats,
                        playerState: { ...state.playerState, stability: Math.min(100, state.playerState.stability + 5) }
                    });
                }
            },
            {
                text: 'Clarify and distance. (-10 Stability, -1% Rural Popularity)',
                effect: (state, set) => {
                    const myCoal = state.playerState.currentCoalition;
                    const newSeats = state.seats.map(s => {
                        const newTracker = { ...s.popularityTracker };
                        if (s.isRural) newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 1);
                        return { ...s, popularityTracker: newTracker };
                    });
                    set({
                        seats: newSeats,
                        playerState: { ...state.playerState, stability: Math.max(0, state.playerState.stability - 10) }
                    });
                }
            }
        ]
    },
    {
        id: 'event_controversy_borneo',
        title: 'Loose Cannon: MA63 Gaffe',
        description: 'A prominent leader from your coalition suggested that Borneo states should "be more patient" regarding MA63 implementations and petroleum royalty issues.',
        type: 'EVENT',
        choices: [
            {
                text: 'Back your coalition leader. (+6 Stability, -10% Borneo Popularity)',
                effect: (state, set) => {
                    const myCoal = state.playerState.currentCoalition;
                    const newSeats = state.seats.map(s => {
                        const newTracker = { ...s.popularityTracker };
                        if (s.isBorneo) newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 10);
                        return { ...s, popularityTracker: newTracker };
                    });
                    set({
                        seats: newSeats,
                        playerState: { ...state.playerState, stability: Math.min(100, state.playerState.stability + 6) }
                    });
                }
            },
            {
                text: 'Immediate apology and reprimand. (-10 Stability, -1% Borneo Popularity)',
                effect: (state, set) => {
                    const myCoal = state.playerState.currentCoalition;
                    const newSeats = state.seats.map(s => {
                        const newTracker = { ...s.popularityTracker };
                        if (s.isBorneo) newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 1);
                        return { ...s, popularityTracker: newTracker };
                    });
                    set({
                        seats: newSeats,
                        playerState: { ...state.playerState, stability: Math.max(0, state.playerState.stability - 10) }
                    });
                }
            }
        ]
    },
    {
        id: 'custom_spoiler_allegation',
        title: '"The Spoiler" Allegation',
        description: 'A viral tweet claims your custom party is a "proxy" funded by the establishment to split the opposition vote. The narrative is gaining traction among urban skeptics.',
        type: 'QUESTION',
        condition: (s) => s.playerState.componentParties.some(id => id.startsWith('CUSTOM_')),
        choices: [
            {
                text: 'Deny and release audited accounts. (+5% Urban Popularity, Costs RM 1.0M, 5 PC)',
                costFunds: 1000000,
                costPC: 5,
                effect: (state, set) => {
                    const myCoal = state.playerState.currentCoalition;
                    const newSeats = state.seats.map(s => {
                        const newTracker = { ...s.popularityTracker };
                        if (s.isUrban) newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 5);
                        return { ...s, popularityTracker: newTracker };
                    });
                    set({ seats: newSeats });
                }
            },
            {
                text: 'Attack the source as a "desperate smear campaign". (+5 Stability, -2% National Popularity)',
                effect: (state, set) => {
                    const myCoal = state.playerState.currentCoalition;
                    const newSeats = state.seats.map(s => {
                        const newTracker = { ...s.popularityTracker };
                        newTracker[myCoal] = Math.max(0, newTracker[myCoal] - 2);
                        return { ...s, popularityTracker: newTracker };
                    });
                    set({
                        seats: newSeats,
                        playerState: { ...state.playerState, stability: Math.min(100, state.playerState.stability + 5) }
                    });
                }
            }
        ]
    },
    {
        id: 'custom_celebrity_endorsement',
        title: 'Celebrity Endorsement',
        description: 'A popular local influencer with millions of followers offers to join your campaign trail. However, their past "divisive" comments might upset your core stability and alienate conservative voters.',
        type: 'EVENT',
        condition: (s) => s.playerState.componentParties.some(id => id.startsWith('CUSTOM_')),
        choices: [
            {
                text: 'Accept: "Let\'s reach the youth!" (+5% Urban Popularity, -10 Stability, -5% Conservative Popularity)',
                effect: (state, set) => {
                    const myCoal = state.playerState.currentCoalition;
                    const newSeats = state.seats.map(s => {
                        const newTracker = { ...s.popularityTracker };
                        
                        // Urban Boost
                        if (s.isUrban) {
                            newTracker[myCoal] = Math.min(100, newTracker[myCoal] + 5);
                        }
                        
                        // Conservative Penalty (Proxy: Malay % and Rurality)
                        const mal = s.ethnicity?.malay || 0;
                        const conservativeFactor = (mal * 0.008) * (s.isRural ? 1.5 : 0.5);
                        newTracker[myCoal] = Math.max(0, newTracker[myCoal] - (5 * conservativeFactor));
                        
                        return { ...s, popularityTracker: newTracker };
                    });
                    set({
                        seats: newSeats,
                        playerState: { ...state.playerState, stability: Math.max(0, state.playerState.stability - 10) }
                    });
                }
            },
            {
                text: 'Reject: "We focus on policy, not personalities." (+5 Stability)',
                effect: (state, set) => {
                    set({
                        playerState: { ...state.playerState, stability: Math.min(100, state.playerState.stability + 5) }
                    });
                }
            }
        ]
    }
];
