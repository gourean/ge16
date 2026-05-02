export type Ideology = 'Reformist' | 'Conservative' | 'Islamist' | 'Centrist' | 'Progressive' | 'Regional';
export type DemographicFocus = 'Urban Mixed' | 'Rural Malay' | 'Urban Non-Malay' | 'East Malaysia' | 'National';

export interface Party {
  id: string;
  name: string;
  color: string;
  ideology: Ideology;
  demographic: DemographicFocus;
  baseStrength: number; // General representation of strength out of 100 for calculating split percentages
  tags: string[];
  voterTransfer?: Record<string, number>; // Mapping of party ID to percentage (0-1) to transfer from
}

export const availableParties: Party[] = [
  { id: 'UMNO', name: 'UMNO', color: '#c00000', ideology: 'Conservative', demographic: 'Rural Malay', baseStrength: 30, tags: ['Conservative', 'Nationalist', 'Centralist'] },
  { id: 'PAS', name: 'PAS', color: '#008000', ideology: 'Islamist', demographic: 'Rural Malay', baseStrength: 25, tags: ['Conservative', 'Religious', 'Populist'] },
  { id: 'BERSATU', name: 'BERSATU', color: '#e4002b', ideology: 'Conservative', demographic: 'Rural Malay', baseStrength: 15, tags: ['Conservative', 'Nationalist'] },
  { id: 'PKR', name: 'PKR', color: '#00adef', ideology: 'Reformist', demographic: 'Urban Mixed', baseStrength: 25, tags: ['Reformist', 'Multicultural', 'Pragmatist'] },
  { id: 'DAP', name: 'DAP', color: '#ed1c24', ideology: 'Progressive', demographic: 'Urban Non-Malay', baseStrength: 25, tags: ['Progressive', 'Multicultural', 'Secular'] },
  { id: 'AMANAH', name: 'AMANAH', color: '#f37021', ideology: 'Progressive', demographic: 'Rural Malay', baseStrength: 10, tags: ['Progressive', 'Multicultural', 'Clean'] },
  { id: 'MCA', name: 'MCA', color: '#0033a0', ideology: 'Centrist', demographic: 'Urban Non-Malay', baseStrength: 5, tags: ['Centrist', 'Capitalist'] },
  { id: 'MIC', name: 'MIC', color: '#f7941d', ideology: 'Centrist', demographic: 'Urban Mixed', baseStrength: 3, tags: ['Centrist', 'Populist'] },
  { id: 'GPS', name: 'GPS', color: '#fb9a28', ideology: 'Regional', demographic: 'East Malaysia', baseStrength: 20, tags: ['Regional', 'Decentralist', 'Development'] },
  { id: 'GRS', name: 'GRS', color: '#00a3e0', ideology: 'Regional', demographic: 'East Malaysia', baseStrength: 10, tags: ['Regional', 'Decentralist'] },
  { id: 'WARISAN', name: 'WARISAN', color: '#17a2b8', ideology: 'Reformist', demographic: 'East Malaysia', baseStrength: 5, tags: ['Reformist', 'Regional', 'Multicultural'] },
  { id: 'MUDA', name: 'MUDA', color: '#181116', ideology: 'Progressive', demographic: 'Urban Mixed', baseStrength: 2, tags: ['Reformist', 'Progressive', 'Clean'] },
  { id: 'PEJUANG', name: 'PEJUANG', color: '#2b3086', ideology: 'Conservative', demographic: 'Rural Malay', baseStrength: 2, tags: ['Nationalist', 'Conservative'] },
  { id: 'KDM', name: 'KDM', color: '#2e8b57', ideology: 'Regional', demographic: 'East Malaysia', baseStrength: 2, tags: ['Regional', 'Decentralist'] },
  { id: 'GERAKAN', name: 'GERAKAN', color: '#9C27B0', ideology: 'Centrist', demographic: 'Urban Mixed', baseStrength: 4, tags: ['Centrist', 'Multicultural', 'Liberal'] },
];

export interface HistoricalCoalition {
  id: string;
  name: string;
  parties: string[];
  color: string; // Changed to Hex string
}

export const historicalCoalitions: HistoricalCoalition[] = [
  { id: 'PH', name: 'Pakatan Harapan', parties: ['PKR', 'DAP', 'AMANAH', 'MUDA'], color: '#ed1c24' },
  { id: 'PN', name: 'Perikatan Nasional', parties: ['PAS', 'BERSATU', 'GERAKAN'], color: '#003153' },
  { id: 'BN', name: 'Barisan Nasional', parties: ['UMNO', 'MCA', 'MIC', 'GPS', 'GRS'], color: '#0033a0' },
];

