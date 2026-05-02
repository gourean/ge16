import { type Party, historicalCoalitions, availableParties } from '../data/parties';
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
 * Calculates heuristic demographic "weights" for a seat.
 * 
 * These multipliers are used to estimate how different segments of the 
 * population in a seat respond to manifesto policies and campaign events.
 * 
 * @param seat The seat to calculate weights for
 * @returns An object containing weights for various demographic and ideological groups:
 * - urban/rural/borneo: Binary classification based on seat data.
 * - youth: Estimated engagement based on urbanization and ethnicity turnout trends.
 * - b40/m40: Rough estimates of income groups (B40 is higher in rural areas).
 * - nationalist/conservative/reformist: Ideological leanings derived from ethnicity 
 *   and geographic location (Urban/Rural splits).
 * - minority: Combined Chinese, Indian, and Borneo indigenous populations.
 * - heartland: Represents the rural Malay core in Peninsular Malaysia.
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
    // Youth engagement heuristic: Higher in urban and non-Malay majority areas
    youth: (urbanFactor * 0.4) + (chi * 0.005) + (mal * 0.002), 
    // B40: Estimated 60% in rural, 30% in urban
    b40: seat.isRural ? 0.6 : 0.3, 
    // M40: Estimated 50% in urban, 20% in rural
    m40: seat.isUrban ? 0.5 : 0.2,
    // Nationalist: Scaled by Malay population and rurality
    nationalist: (mal * 0.01) * (seat.isRural ? 1.2 : 0.8),
    // Reformist: Scaled by urban urbanization and minority populations
    reformist: (urbanFactor * 0.6) + (chi * 0.005) + (ind * 0.003),
    // Conservative: Highly concentrated in rural Malay areas
    conservative: (mal * 0.008) * (seat.isRural ? 1.5 : 0.5),
    // Minority: Total non-Malay/non-Muslim (including Borneo indigenous)
    minority: chi + ind + (seat.isBorneo ? bumiB : 0),
    // Heartland: Exclusively Rural Malay in Peninsular Malaysia
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
 * Simple seeded PRNG (mulberry32).
 * Returns a function that produces deterministic floats in [0, 1).
 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Perturbation range constant (±percentage points).
 * Each faction in each seat gets a random shift within this range.
 */
const PERTURBATION_RANGE = 3.0;

/**
 * Calculates a synergy multiplier for a given combination of parties.
 * Ranges roughly from 0.7 (severe clash) to 1.3 (great coverage).
 */
export function calculateSynergy(parties: Party[], isHistorical?: boolean): number {
  if (isHistorical || parties.length <= 1) return 1.0;

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
  
  const faction2: Party[] = [];
  const faction3: Party[] = [];

  if (opponentType === '1v1') {
    return {
      faction2: unselectedParties,
      faction3: []
    };
  }

  // Identify historical buckets
  const phBucket = unselectedParties.filter(p => historicalCoalitions[0].parties.includes(p.id));
  const pnBucket = unselectedParties.filter(p => historicalCoalitions[1].parties.includes(p.id));
  const bnBucket = unselectedParties.filter(p => historicalCoalitions[2].parties.includes(p.id));

  // Determine major alignments for F2/F3
  if (phBucket.length > 0 && pnBucket.length > 0) {
    // Case: Player is BN (or custom without major PN/PH overlap)
    faction2.push(...pnBucket);
    faction3.push(...phBucket);
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
  }

  // Catch-all: Any party in unselectedParties NOT yet assigned to F2 or F3 (including Custom Parties)
  const assignedIds = new Set([...faction2, ...faction3].map(p => p.id));
  const leftovers = unselectedParties.filter(p => !assignedIds.has(p.id));

  leftovers.forEach(party => {
    // Assign leftovers (Custom Parties, Independents) based on ideology
    if (['Conservative', 'Islamist', 'Nationalist'].includes(party.ideology)) {
      faction2.push(party);
    } else {
      faction3.push(party);
    }
  });
  
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
  explicitSwings: DemographicSwing[] = [],
  isHistorical?: boolean,
  perturbationSeed?: number
): any[] {

  const oppFactions = distributeOpponents(unselectedParties, opponentType);
  const faction1 = playerParties;
  const faction2 = oppFactions.faction2;
  const faction3 = oppFactions.faction3;
  
  const syn1 = calculateSynergy(faction1, isHistorical);
  const syn2 = calculateSynergy(faction2, isHistorical);
  const syn3 = calculateSynergy(faction3, isHistorical);

  const allParties = [...playerParties, ...unselectedParties];
  const f1Ids = new Set(playerParties.map(p => p.id));
  const f2Ids = new Set(oppFactions.faction2.map(p => p.id));
  const f3Ids = new Set(oppFactions.faction3.map(p => p.id));

  // Initialize seeded PRNG for perturbation
  const rng = perturbationSeed != null ? mulberry32(perturbationSeed) : null;

  return seats.map(seat => {
    const pp = seat.partyPopularity;
    
    if (!pp) {
      // Fallback for seats without partyPopularity
      console.warn(`Seat ${seat.id} missing partyPopularity`);
      return {
        ...seat,
        basePopularity: { Faction1: 33, Faction2: 33, Faction3: 33, Others: 1 },
        popularityTracker: { Faction1: 33, Faction2: 33, Faction3: 33, Others: 1 },
      };
    }

    // Sum party popularity for each faction with transfer logic
    let raw1 = 0, raw2 = 0, raw3 = 0, rawOthers = 0;

    for (const [partyId, pct] of Object.entries(pp)) {
      const val = pct as number;
      
      // 1. Calculate how much of this specific party's vote is drained by custom parties
      let totalDrain = 0;
      const isOthersPool = !availableParties.find(p => p.id === partyId);
      
      allParties.forEach(p => {
        if (p.voterTransfer) {
          const transferPct = isOthersPool ? (p.voterTransfer['__OTHERS__'] || 0) : (p.voterTransfer[partyId] || 0);
          if (transferPct > 0) {
            const amount = val * transferPct;
            totalDrain += amount;
            // Add this amount to the faction the custom party belongs to
            if (f1Ids.has(p.id)) raw1 += amount;
            else if (f2Ids.has(p.id)) raw2 += amount;
            else if (f3Ids.has(p.id)) raw3 += amount;
            else rawOthers += amount; // Safety net: Add to others if not in a major faction
          }
        }
      });

      // 2. Add remaining vote to the "Real" party's faction
      const remainingVal = Math.max(0, val - totalDrain);
      if (f1Ids.has(partyId)) {
        raw1 += remainingVal;
      } else if (f2Ids.has(partyId)) {
        raw2 += remainingVal;
      } else if (f3Ids.has(partyId)) {
        raw3 += remainingVal;
      } else {
        // Party not in any faction or it's an "Other" party
        rawOthers += remainingVal;
      }
    }

    // Helper to map legacy coalition names to faction IDs
    const coalitionToFaction = (coalKey: string): 'F1' | 'F2' | 'F3' | 'Others' | null => {
      if (coalKey === 'Others') return 'Others';
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

    // Helper to get weighting for a swing based on seat demographics/ethnicity
    const getSwingWeight = (seatObj: any, demographic: string): number => {
      const weights: any = getSeatDemographicWeights(seatObj);
      const eth = seatObj.ethnicity || {};
      
      switch (demographic) {
        case 'Malay': return (eth.malay || 0) / 100;
        case 'Chinese': return (eth.chinese || 0) / 100;
        case 'Indian': return (eth.indian || 0) / 100;
        case 'Bumi-Borneo': return ((eth.bumiSabah || 0) + (eth.bumiSarawak || 0)) / 100;
        case 'Urban': return seatObj.isUrban ? 1.0 : 0;
        case 'Rural': return seatObj.isRural ? 1.0 : 0;
        case 'Youth': return weights.youth || 0;
        case 'Nationwide': return 1.0;
        // Legacy support for the old labels
        case 'Malay-Majority': return seatObj.demographics === 'Malay-Majority' ? 1.0 : 0;
        case 'Chinese-Majority': return seatObj.demographics === 'Chinese-Majority' ? 1.0 : 0;
        case 'Mixed': return seatObj.demographics === 'Mixed' ? 1.0 : 0;
        case 'Bumiputera-Sabah/Sarawak': return seatObj.demographics === 'Bumiputera-Sabah/Sarawak' ? 1.0 : 0;
        default: return 0;
      }
    };

    // Apply demographic swings (shift percentage points between factions)
    for (const swing of explicitSwings) {
      const weight = getSwingWeight(seat, swing.demographic);
      if (weight <= 0) continue;

      const fromF = coalitionToFaction(swing.from);
      const toF = coalitionToFaction(swing.to);

      if (fromF && toF && fromF !== toF) {
        const refs: any = { F1: raw1, F2: raw2, F3: raw3, Others: rawOthers };
        const amountToShift = swing.amount * weight;
        const actualAmount = Math.min(refs[fromF], amountToShift);

        const newVals = { ...refs };
        newVals[fromF] -= actualAmount;
        newVals[toF] += actualAmount;

        raw1 = newVals.F1;
        raw2 = newVals.F2;
        raw3 = newVals.F3;
        rawOthers = newVals.Others;
      }
    }

    // Apply random perturbation (±PERTURBATION_RANGE% per faction)
    if (rng) {
      const p1 = (rng() * 2 - 1) * PERTURBATION_RANGE;
      const p2 = (rng() * 2 - 1) * PERTURBATION_RANGE;
      const p3 = (rng() * 2 - 1) * PERTURBATION_RANGE;
      raw1 = Math.max(0, raw1 + p1);
      raw2 = Math.max(0, raw2 + p2);
      raw3 = Math.max(0, raw3 + p3);
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
