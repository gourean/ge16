import { type Party, historicalCoalitions } from '../data/parties';
import type { Seat } from '../store/gameStore';
import { manifestoItems } from '../data/manifesto';
import { normalizePopularity } from './campaignUtils';

/**
 * Classifies seats based on state and demographics.
 */
export function classifySeats(seats: Seat[]): Seat[] {
  return seats.map(seat => {
    const isBorneo = ['Sabah', 'Sarawak', 'Wilayah Persekutuan Labuan'].includes(seat.state);
    
    // Simple classification logic (can be refined with actual CSV data later)
    // For now, using keywords from demographics or state
    const isUrban = seat.demographics.toLowerCase().includes('urban') || 
                  ['Kuala Lumpur', 'Putrajaya', 'Selangor', 'Pulau Pinang'].includes(seat.state);
    const isRural = seat.demographics.toLowerCase().includes('rural') || 
                  ['Kelantan', 'Terengganu', 'Perlis', 'Pahang'].includes(seat.state);

    return {
      ...seat,
      isBorneo,
      isUrban,
      isRural: !isUrban && isRural // Prioritize urban in mixed cases
    };
  });
}

/**
 * Calculates demographic "weights" for a seat to help with manifesto effects.
 * These are heuristics used when explicit demographic data (like "Reformist %") is missing.
 */
function getSeatDemographicWeights(seat: Seat) {
  const mal = seat.ethnicity?.malay || 0;
  const chi = seat.ethnicity?.chinese || 0;
  const ind = seat.ethnicity?.indian || 0;
  const bumiB = (seat.ethnicity?.bumiSabah || 0) + (seat.ethnicity?.bumiSarawak || 0);
  
  const urbanFactor = seat.isUrban ? 1.0 : (seat.isRural ? 0.3 : 0.6);
  
  return {
    urban: seat.isUrban ? 1 : 0,
    rural: seat.isRural ? 1 : 0,
    borneo: seat.isBorneo ? 1 : 0,
    youth: (urbanFactor * 0.4) + (chi * 0.005) + (mal * 0.002), // Heuristic: Urban/Chinese areas have higher youth engagement in GE15 data
    b40: seat.isRural ? 0.6 : 0.3, // Simple approximation
    m40: seat.isUrban ? 0.5 : 0.2,
    nationalist: (mal * 0.01) * (seat.isRural ? 1.2 : 0.8),
    reformist: (urbanFactor * 0.6) + (chi * 0.005) + (ind * 0.003),
    conservative: (mal * 0.008) * (seat.isRural ? 1.5 : 0.5),
    minority: chi + ind + (seat.isBorneo ? bumiB : 0),
    heartland: seat.isRural && !seat.isBorneo ? mal : 0
  };
}

/**
 * Applies manifesto effects to all seats.
 */
export function applyManifestoToSeats(
  seats: Seat[],
  choices: Record<string, 'agree' | 'disagree' | 'neutral' | null>
): Seat[] {
  return seats.map(seat => {
    const weights: any = getSeatDemographicWeights(seat);
    let f1Impact = 0;

    for (const item of manifestoItems) {
      const choice = choices[item.id];
      if (!choice || choice === 'neutral') {
        // Neutral effects are usually small global momentum hits, handled in player state
        continue;
      }

      const mods = item.responses[choice].demographics;
      
      // Calculate total impact on Faction 1 popularity for this seat
      for (const [demog, impact] of Object.entries(mods)) {
        const weight = weights[demog] || 0;
        // Impact is a percentage relative to the weight of that demographic in the seat
        // E.g., +10% impact on a 60% weight demographic = +6 absolute points
        f1Impact += (impact as number) * (weight / 100);
      }
    }

    const newTracker = normalizePopularity({
      Faction1: seat.basePopularity.Faction1 + f1Impact,
      Faction2: seat.popularityTracker.Faction2,
      Faction3: seat.popularityTracker.Faction3,
      Others: seat.popularityTracker.Others,
    });

    return {
      ...seat,
      basePopularity: {
        ...seat.basePopularity,
        Faction1: newTracker.Faction1,
        Faction2: newTracker.Faction2,
        Faction3: newTracker.Faction3,
        Others: newTracker.Others,
      },
      popularityTracker: {
        ...newTracker
      } as typeof seat.popularityTracker
    };
  });
}

/**
 * Calculates ideological cohesion and returns a stability debuff if clashing.
 */
export function calculateContradictionDebuff(tags: string[]): { debuff: number, tags: string[] } {
  const tagSet = new Set(tags);
  let debuff = 0;

  // Clashes
  if (tagSet.has('Capitalist') && tagSet.has('Socialist')) debuff += 10;
  if (tagSet.has('Secular') && tagSet.has('Religious')) debuff += 15;
  if (tagSet.has('Nationalist') && tagSet.has('Multicultural')) debuff += 10;
  if (tagSet.has('Centralist') && tagSet.has('Decentralist')) debuff += 10;

  return { debuff, tags };
}

export function calculateStartingPC(choices: Record<string, 'agree' | 'disagree' | 'neutral' | null>): number {
    let pc = 100;
    for (const item of manifestoItems) {
        const choice = choices[item.id];
        if (!choice) continue;
        // Note: Plan mentioned resources like Momentum hits for neutral, 
        // we start with 100 base and apply any flat PC modifiers here if added later.
    }
    return pc;
}

export function calculatePCCostMultiplier(choices: Record<string, 'agree' | 'disagree' | 'neutral' | null>): number {
    let mult = 1.0;
    for (const item of manifestoItems) {
        const choice = choices[item.id];
        if (!choice) continue;
        const res = item.responses[choice].resources;
        if (res.pcCostMultiplier) {
            mult *= res.pcCostMultiplier;
        }
    }
    return mult;
}

export interface DemographicSwing {
  id: string;
  demographic: string;
  from: string;
  to: string;
  amount: number;
}

/**
 * Calculates a synergy multiplier for a given combination of parties.
 * Ranges roughly from 0.7 (severe clash) to 1.3 (great coverage).
 */
export function calculateSynergy(parties: Party[]): number {
  if (parties.length <= 1) return 1.0;

  let multiplier = 1.0;
  const ideologies = parties.map(p => p.ideology);
  const demographics = parties.map(p => p.demographic);

  const hasIslamist = ideologies.includes('Islamist');
  const hasProgressive = ideologies.includes('Progressive');
  const hasReformist = ideologies.includes('Reformist');

  const hasRuralMalay = demographics.includes('Rural Malay');
  const hasUrbanNonMalay = demographics.includes('Urban Non-Malay');
  
  // Severe Ideological Clash
  if (hasIslamist && hasProgressive) {
    multiplier -= 0.20; // 1+1 < 2
  }

  // Cannibalization of same demographics
  const ruralMalayCount = demographics.filter(d => d === 'Rural Malay').length;
  if (ruralMalayCount > 1) {
    multiplier -= 0.05 * (ruralMalayCount - 1);
  }

  // Complementary demographics bonus
  if (hasRuralMalay && hasUrbanNonMalay) {
    multiplier += 0.15; // 1+1 > 2
  }

  // Synergistic ideologies
  if (hasReformist && hasProgressive) {
    multiplier += 0.05;
  }
  
  // Hard cap bounds
  return Math.max(0.6, Math.min(1.4, multiplier));
}

/**
 * Distributes the unselected parties into Opponent Factions.
 */
export function distributeOpponents(
  unselectedParties: Party[], 
  opponentType: '1v1' | '3-corner'
): { faction2: Party[], faction3: Party[] } {
  
  if (opponentType === '1v1') {
    return {
      faction2: unselectedParties,
      faction3: []
    };
  }

  // Pre-define buckets based on historical alignments
  const phBucket = unselectedParties.filter(p => historicalCoalitions[0].parties.includes(p.id));
  const pnBucket = unselectedParties.filter(p => historicalCoalitions[1].parties.includes(p.id));
  const bnBucket = unselectedParties.filter(p => historicalCoalitions[2].parties.includes(p.id));

  const faction2: Party[] = [];
  const faction3: Party[] = [];

  // Logic to keep historical groups together and assign them to F2/F3
  if (phBucket.length > 0 && pnBucket.length > 0) {
    // Case: Player is BN (or custom without major PN/PH overlap)
    faction2.push(...pnBucket);
    faction3.push(...phBucket);
    // BN parties remaining? (shouldn't happen if player is BN, but for custom...)
    faction2.push(...bnBucket); 
  } else if (phBucket.length > 0 && bnBucket.length > 0) {
    // Case: Player is PN
    faction2.push(...bnBucket);
    faction3.push(...phBucket);
    faction2.push(...pnBucket);
  } else if (pnBucket.length > 0 && bnBucket.length > 0) {
    // Case: Player is PH
    faction2.push(...pnBucket);
    faction3.push(...bnBucket);
    faction3.push(...phBucket);
  } else {
    // Custom/Edge case: Fallback to ideological split
    for (const party of unselectedParties) {
      if (['Conservative', 'Islamist'].includes(party.ideology)) faction2.push(party);
      else faction3.push(party);
    }
    return { faction2, faction3 };
  }

  // We no longer distribute 'othersBucket' into the major factions (like PEJUANG/GTA).
  // They will remain independent and contribute to the "Others" category in the dashboard.
  
  return { faction2, faction3 };

}

/**
 * Maps GE15 party-level popularities to the new Custom Alliance factions.
 * 
 * NEW APPROACH (v2): Uses partyPopularity per seat.
 * Each seat now stores per-party popularity percentages (e.g. PKR=15%, PAS=53%).
 * Faction popularity = sum of partyPopularity[p] for each party p in the faction.
 * 
 * This is dramatically simpler and more accurate than the old coalition-splitting approach.
 */
export function applyFactionsToSeats(
  seats: any[],
  playerParties: Party[],
  unselectedParties: Party[],
  opponentType: '1v1' | '3-corner',
  explicitSwings: DemographicSwing[] = []
): any[] {

  const oppFactions = distributeOpponents(unselectedParties, opponentType);
  const faction1 = playerParties;
  const faction2 = oppFactions.faction2;
  const faction3 = oppFactions.faction3;
  
  const syn1 = calculateSynergy(faction1);
  const syn2 = calculateSynergy(faction2);
  const syn3 = calculateSynergy(faction3);

  // Get party ID sets for fast lookup
  const f1Ids = new Set(faction1.map(p => p.id));
  const f2Ids = new Set(faction2.map(p => p.id));
  const f3Ids = new Set(faction3.map(p => p.id));

  return seats.map(seat => {
    const pp = seat.partyPopularity;
    
    if (!pp) {
      // Fallback for seats without partyPopularity (shouldn't happen with v2 data)
      console.warn(`Seat ${seat.id} missing partyPopularity, using legacy fallback`);
      return {
        ...seat,
        basePopularity: { Faction1: 33, Faction2: 33, Faction3: 33, Others: 1 },
        popularityTracker: { Faction1: 33, Faction2: 33, Faction3: 33, Others: 1 },
      };
    }

    // Sum party popularity for each faction
    let raw1 = 0, raw2 = 0, raw3 = 0, rawOthers = 0;

    for (const [partyId, pct] of Object.entries(pp)) {
      const val = pct as number;
      if (f1Ids.has(partyId)) {
        raw1 += val;
      } else if (f2Ids.has(partyId)) {
        raw2 += val;
      } else if (f3Ids.has(partyId)) {
        raw3 += val;
      } else {
        // Party not in any faction (minor parties, independents, etc.)
        rawOthers += val;
      }
    }

    // Apply demographic swings (shift percentage points between factions)
    // Swings operate on the "from" and "to" legacy coalition keys (PH/PN/BN)
    // We map them to factions by checking which faction contains parties from that coalition
    for (const swing of explicitSwings) {
      if (seat.demographics === swing.demographic) {
        // Map legacy coalition names to faction IDs
        const coalitionToFaction = (coalKey: string): 'F1' | 'F2' | 'F3' | null => {
          const hc = historicalCoalitions.find(c => c.id === coalKey);
          if (!hc) return null;
          const parties = hc.parties;
          for (const pid of parties) {
            if (f1Ids.has(pid)) return 'F1';
            if (f2Ids.has(pid)) return 'F2';
            if (f3Ids.has(pid)) return 'F3';
          }
          return null;
        };

        const fromF = coalitionToFaction(swing.from);
        const toF = coalitionToFaction(swing.to);

        if (fromF && toF && fromF !== toF) {
          const refs = { F1: raw1, F2: raw2, F3: raw3 };
          const setters: Record<string, (v: number) => void> = {
            F1: (v) => raw1 = v,
            F2: (v) => raw2 = v,
            F3: (v) => raw3 = v,
          };
          const actualAmount = Math.min(refs[fromF], swing.amount);
          setters[fromF](refs[fromF] - actualAmount);
          setters[toF](refs[toF] + actualAmount);
        }
      }
    }

    // Apply synergy multipliers
    const adj1 = raw1 * syn1;
    const adj2 = raw2 * syn2;
    const adj3 = raw3 * syn3;

    // Normalize so they sum to ~100
    const newBase = normalizePopularity({
      Faction1: adj1,
      Faction2: adj2,
      Faction3: adj3,
      Others: rawOthers,
    });

    return {
      ...seat,
      basePopularity: { ...newBase },
      popularityTracker: { ...newBase },
    };
  });
}
