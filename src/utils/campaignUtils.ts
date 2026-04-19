import type { Seat } from '../store/gameStore';
import { manifestoItems } from '../data/manifesto';

/**
 * Gets all seats in the same state as the target seat.
 */
export const getSeatsInSameState = (seats: Seat[], targetSeatId: string): Seat[] => {
  const targetSeat = seats.find(s => s.id === targetSeatId || s.id.replace('.', '') === targetSeatId);
  if (!targetSeat) return [];
  return seats.filter(s => s.state === targetSeat.state);
};

/**
 * Calculates the demographic impact of a thematic manifesto launch.
 * Returns a multiplier for each demographic based on player's choices in that category.
 */
export const getThematicManifestoEffect = (
  category: "Economy" | "Identity" | "Institutional" | "Infrastructure" | "Labor",
  choices: Record<string, 'agree' | 'disagree' | 'neutral' | null>
) => {
  const relevantItems = manifestoItems.filter(item => item.category === category);
  const aggregateMods: Record<string, number> = {};

  relevantItems.forEach(item => {
    const choice = choices[item.id];
    if (choice && choice !== 'neutral') {
      const mods = item.responses[choice].demographics;
      Object.entries(mods).forEach(([dem, val]) => {
        aggregateMods[dem] = (aggregateMods[dem] || 0) + (val as number);
      });
    }
  });

  return aggregateMods;
};

/**
 * Checks if a seat matches a demographic profile.
 */
export const seatMatchesDemographic = (seat: Seat, demo: string): boolean => {
  if (demo === 'urban') return !!seat.isUrban;
  if (demo === 'rural') return !!seat.isRural;
  if (demo === 'borneo') return !!seat.isBorneo;
  // Others like youth/b40/m40 are handled as general boosts if 
  // we don't have granular per-seat data for them yet.
  return false;
};
