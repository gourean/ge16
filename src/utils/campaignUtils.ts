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

/**
 * Normalizes popularity values to ensure they sum to exactly 100% and stay within [0, 100].
 */
export const normalizePopularity = <T extends Record<string, number>>(tracker: T): T => {
  const categories = Object.keys(tracker) as (keyof T)[];
  const newTracker: any = {};
  
  // 1. Clamp all values to [0, 100]
  let sum = 0;
  categories.forEach(cat => {
    const val = Math.max(0, Math.min(100, tracker[cat]));
    newTracker[cat] = val;
    sum += val;
  });

  // 2. Normalize to sum = 100
  if (sum > 0) {
    const multiplier = 100 / sum;
    categories.forEach(cat => {
      newTracker[cat] = newTracker[cat] * multiplier;
    });
  } else {
    // Edge case: everything is zero (shouldn't happen)
    // Default to "Others" or Undecided if available
    const fallback = categories.includes('Others' as keyof T) ? 'Others' : categories[0];
    newTracker[fallback as keyof T] = 100;
  }

  return newTracker as T;
};

/**
 * Adjusts a color for UI visibility. If the color is too dark, it returns a lightened version.
 */
export const getAdjustedColor = (hex: string, minLightness = 45): string => {
  // Simple hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Convert to HSL
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
      case gNorm: h = (bNorm - rNorm) / d + 2; break;
      case bNorm: h = (rNorm - gNorm) / d + 4; break;
    }
    h /= 6;
  }

  const lightness = l * 100;
  if (lightness >= minLightness) return hex;

  // Bump lightness for display
  const newL = minLightness;
  
  // Convert HSL back to Hex (simplified)
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = newL < 50 ? (newL/100) * (1 + s) : (newL/100) + s - (newL/100) * s;
  const p = 2 * (newL/100) - q;
  const finalR = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const finalG = Math.round(hue2rgb(p, q, h) * 255);
  const finalB = Math.round(hue2rgb(p, q, h - 1/3) * 255);

  return `#${((1 << 24) + (finalR << 16) + (finalG << 8) + finalB).toString(16).slice(1)}`;
};
