/**
 * Generate party-level popularity data from GE15 results.
 * 
 * Each coalition fielded ONE candidate per seat in GE15.
 * The coalition's vote = the component party's vote.
 * 
 * Strategy:
 * 1. Excel col 7 (GE15 winner) → identifies winner's component party
 * 2. Excel col 5 (Incumbent) → identifies some non-winner components
 * 3. PH allocation: hardcoded from known GE15 seat allocation
 * 4. PN allocation: Winner/incumbent data + state heuristic for unknowns
 * 5. BN allocation: Winner/GE14 data + ethnicity heuristic for unknowns
 * 6. Sarawak: BN parties (PBB/PRS/SUPP/PDP) → GPS, not BN
 */

import XLSX from 'xlsx';
import fs from 'fs';

// ══════════════════════════════════════════════════════════════
// PH SEAT ALLOCATION (PKR, DAP, AMANAH)
// Source: Known GE15 candidate filings
// ══════════════════════════════════════════════════════════════
const PH_ALLOC = {
  'P.001': 'PKR', 'P.002': 'PKR', 'P.003': 'PKR',
  'P.004': 'PKR', 'P.005': 'PKR', 'P.006': 'PKR', 'P.007': 'PKR',
  'P.008': 'AMANAH', 'P.009': 'DAP', 'P.010': 'PKR', 'P.011': 'AMANAH',
  'P.012': 'PKR', 'P.013': 'PKR', 'P.014': 'PKR', 'P.015': 'PKR',
  'P.016': 'PKR', 'P.017': 'PKR', 'P.018': 'PKR',
  'P.019': 'AMANAH', 'P.020': 'PKR', 'P.021': 'PKR', 'P.022': 'PKR',
  'P.023': 'PKR', 'P.024': 'PKR', 'P.025': 'PKR', 'P.026': 'PKR',
  'P.027': 'PKR', 'P.028': 'PKR', 'P.029': 'PKR', 'P.030': 'PKR',
  'P.031': 'PKR', 'P.032': 'PKR',
  'P.033': 'AMANAH', 'P.034': 'AMANAH', 'P.035': 'AMANAH', 'P.036': 'PKR',
  'P.037': 'AMANAH', 'P.038': 'PKR', 'P.039': 'PKR', 'P.040': 'PKR',
  'P.041': 'AMANAH', 'P.042': 'PKR', 'P.043': 'DAP', 'P.044': 'PKR',
  'P.045': 'DAP', 'P.046': 'DAP', 'P.047': 'PKR', 'P.048': 'DAP',
  'P.049': 'DAP', 'P.050': 'DAP', 'P.051': 'DAP', 'P.052': 'DAP',
  'P.053': 'PKR',
  'P.054': 'PKR', 'P.055': 'PKR', 'P.056': 'AMANAH', 'P.057': 'AMANAH',
  'P.058': 'PKR', 'P.059': 'PKR', 'P.060': 'DAP', 'P.061': 'PKR',
  'P.062': 'PKR', 'P.063': 'PKR', 'P.064': 'DAP', 'P.065': 'DAP',
  'P.066': 'DAP', 'P.067': 'PKR', 'P.068': 'DAP', 'P.069': 'PKR',
  'P.070': 'DAP', 'P.071': 'DAP', 'P.072': 'PKR', 'P.073': 'PKR',
  'P.074': 'AMANAH', 'P.075': 'PKR', 'P.076': 'DAP', 'P.077': 'DAP',
  'P.078': 'DAP', 'P.079': 'PKR', 'P.080': 'DAP', 'P.081': 'PKR',
  'P.082': 'PKR', 'P.083': 'PKR', 'P.084': 'PKR', 'P.085': 'PKR',
  'P.086': 'PKR', 'P.087': 'PKR', 'P.088': 'PKR', 'P.089': 'PKR',
  'P.090': 'PKR', 'P.091': 'PKR',
  'P.092': 'PKR', 'P.093': 'PKR', 'P.094': 'PKR', 'P.095': 'AMANAH',
  'P.096': 'AMANAH', 'P.097': 'PKR', 'P.098': 'PKR', 'P.099': 'PKR',
  'P.100': 'PKR', 'P.101': 'PKR', 'P.102': 'PKR', 'P.103': 'DAP',
  'P.104': 'DAP', 'P.105': 'DAP', 'P.106': 'DAP', 'P.107': 'PKR',
  'P.108': 'PKR', 'P.109': 'PKR', 'P.110': 'DAP', 'P.111': 'PKR',
  'P.112': 'PKR', 'P.113': 'PKR',
  'P.114': 'DAP', 'P.115': 'PKR', 'P.116': 'PKR', 'P.117': 'DAP',
  'P.118': 'PKR', 'P.119': 'AMANAH', 'P.120': 'DAP', 'P.121': 'PKR',
  'P.122': 'DAP', 'P.123': 'DAP', 'P.124': 'PKR',
  'P.125': 'PKR',
  'P.126': 'PKR', 'P.127': 'PKR', 'P.128': 'DAP', 'P.129': 'PKR',
  'P.130': 'DAP', 'P.131': 'PKR', 'P.132': 'PKR', 'P.133': 'PKR',
  'P.134': 'AMANAH', 'P.135': 'AMANAH', 'P.136': 'PKR', 'P.137': 'PKR',
  'P.138': 'DAP', 'P.139': 'PKR',
  'P.140': 'PKR', 'P.141': 'PKR', 'P.142': 'DAP', 'P.143': 'PKR',
  'P.144': 'PKR', 'P.145': 'DAP', 'P.146': 'PKR', 'P.147': 'PKR',
  'P.148': 'PKR', 'P.149': 'AMANAH', 'P.150': 'PKR', 'P.151': 'PKR',
  'P.152': 'DAP', 'P.153': 'PKR', 'P.154': 'PKR', 'P.155': 'PKR',
  'P.156': 'PKR', 'P.157': 'PKR', 'P.158': 'DAP', 'P.159': 'PKR',
  'P.160': 'PKR', 'P.161': 'PKR', 'P.162': 'DAP', 'P.163': 'DAP',
  'P.164': 'PKR', 'P.165': 'DAP',
  'P.166': 'PKR',
  'P.167': 'PKR', 'P.168': 'PKR', 'P.169': 'PKR', 'P.170': 'PKR',
  'P.171': 'PKR', 'P.172': 'DAP', 'P.173': 'PKR', 'P.174': 'PKR',
  'P.175': 'PKR', 'P.176': 'PKR', 'P.177': 'PKR', 'P.178': 'PKR',
  'P.179': 'PKR', 'P.180': 'PKR', 'P.181': 'PKR', 'P.182': 'PKR',
  'P.183': 'PKR', 'P.184': 'PKR', 'P.185': 'PKR', 'P.186': 'PKR',
  'P.187': 'PKR', 'P.188': 'PKR', 'P.189': 'PKR', 'P.190': 'PKR',
  'P.191': 'PKR',
  'P.192': 'DAP', 'P.193': 'DAP', 'P.194': 'PKR', 'P.195': 'DAP',
  'P.196': 'DAP', 'P.197': 'PKR', 'P.198': 'PKR', 'P.199': 'PKR',
  'P.200': 'PKR', 'P.201': 'DAP', 'P.202': 'DAP', 'P.203': 'PKR',
  'P.204': 'PKR', 'P.205': 'PKR', 'P.206': 'PKR', 'P.207': 'DAP',
  'P.208': 'DAP', 'P.209': 'PKR', 'P.210': 'PKR', 'P.211': 'DAP',
  'P.212': 'DAP', 'P.213': 'PKR', 'P.214': 'PKR', 'P.215': 'PKR',
  'P.216': 'PKR', 'P.217': 'PKR', 'P.218': 'PKR', 'P.219': 'PKR',
  'P.220': 'PKR', 'P.221': 'PKR', 'P.222': 'PKR',
};

// ══════════════════════════════════════════════════════════════
// PN SEAT ALLOCATION (PAS, BERSATU)
// Hardcoded known allocations + heuristic for unknowns
// PAS contested ~120 seats, BERSATU ~100 seats
// In east coast, even BERSATU candidates used PAS logo
// ══════════════════════════════════════════════════════════════
const PN_KNOWN = {
  // Perlis — all PAS
  'P.001': 'PAS', 'P.002': 'PAS', 'P.003': 'PAS',
  // Kedah — mostly PAS, some BERSATU
  'P.004': 'BERSATU', 'P.005': 'PAS', 'P.006': 'BERSATU', 'P.007': 'PAS',
  'P.008': 'PAS', 'P.009': 'PAS', 'P.010': 'PAS', 'P.011': 'PAS',
  'P.012': 'PAS', 'P.013': 'PAS', 'P.014': 'BERSATU', 'P.015': 'BERSATU',
  'P.016': 'PAS', 'P.017': 'PAS', 'P.018': 'BERSATU',
  // Kelantan — all PAS (including some BERSATU candidates on PAS ticket)
  'P.019': 'PAS', 'P.020': 'PAS', 'P.021': 'PAS', 'P.022': 'PAS',
  'P.023': 'PAS', 'P.024': 'PAS', 'P.025': 'PAS', 'P.026': 'PAS',
  'P.027': 'PAS', 'P.028': 'PAS', 'P.029': 'PAS', 'P.030': 'PAS',
  'P.031': 'PAS', 'P.032': 'PAS',
  // Terengganu — all PAS
  'P.033': 'PAS', 'P.034': 'PAS', 'P.035': 'PAS', 'P.036': 'PAS',
  'P.037': 'PAS', 'P.038': 'PAS', 'P.039': 'PAS', 'P.040': 'PAS',
  // Penang — mixed
  'P.041': 'PAS', 'P.042': 'BERSATU', 'P.043': 'BERSATU', 'P.044': 'BERSATU',
  'P.045': 'BERSATU', 'P.046': 'BERSATU', 'P.047': 'PAS', 'P.048': 'BERSATU',
  'P.049': 'BERSATU', 'P.050': 'BERSATU', 'P.051': 'BERSATU', 'P.052': 'BERSATU',
  'P.053': 'PAS',
  // Perak — mixed PAS/BERSATU
  'P.054': 'PAS', 'P.055': 'PAS', 'P.056': 'BERSATU', 'P.057': 'PAS',
  'P.058': 'PAS', 'P.059': 'PAS', 'P.060': 'BERSATU', 'P.061': 'PAS',
  'P.062': 'BERSATU', 'P.063': 'BERSATU', 'P.064': 'BERSATU', 'P.065': 'BERSATU',
  'P.066': 'BERSATU', 'P.067': 'PAS', 'P.068': 'BERSATU', 'P.069': 'PAS',
  'P.070': 'BERSATU', 'P.071': 'BERSATU', 'P.072': 'BERSATU', 'P.073': 'PAS',
  'P.074': 'PAS', 'P.075': 'BERSATU', 'P.076': 'PAS', 'P.077': 'BERSATU',
  // Pahang — mixed
  'P.078': 'PAS', 'P.079': 'PAS', 'P.080': 'BERSATU', 'P.081': 'PAS',
  'P.082': 'BERSATU', 'P.083': 'PAS', 'P.084': 'PAS', 'P.085': 'PAS',
  'P.086': 'PAS', 'P.087': 'PAS', 'P.088': 'PAS', 'P.089': 'BERSATU',
  'P.090': 'BERSATU', 'P.091': 'PAS',
  // Selangor — mixed, more BERSATU
  'P.092': 'PAS', 'P.093': 'BERSATU', 'P.094': 'PAS', 'P.095': 'PAS',
  'P.096': 'PAS', 'P.097': 'BERSATU', 'P.098': 'BERSATU', 'P.099': 'BERSATU',
  'P.100': 'BERSATU', 'P.101': 'BERSATU', 'P.102': 'PAS', 'P.103': 'BERSATU',
  'P.104': 'BERSATU', 'P.105': 'BERSATU', 'P.106': 'BERSATU', 'P.107': 'BERSATU',
  'P.108': 'BERSATU', 'P.109': 'PAS', 'P.110': 'BERSATU', 'P.111': 'BERSATU',
  'P.112': 'PAS', 'P.113': 'BERSATU',
  // KL + Putrajaya
  'P.114': 'PAS', 'P.115': 'PAS', 'P.116': 'BERSATU', 'P.117': 'BERSATU',
  'P.118': 'BERSATU', 'P.119': 'BERSATU', 'P.120': 'BERSATU', 'P.121': 'PAS',
  'P.122': 'BERSATU', 'P.123': 'BERSATU', 'P.124': 'BERSATU',
  'P.125': 'BERSATU',
  // Negeri Sembilan
  'P.126': 'PAS', 'P.127': 'PAS', 'P.128': 'PAS', 'P.129': 'PAS',
  'P.130': 'BERSATU', 'P.131': 'PAS', 'P.132': 'PAS', 'P.133': 'PAS',
  // Melaka
  'P.134': 'BERSATU', 'P.135': 'BERSATU', 'P.136': 'PAS', 'P.137': 'BERSATU',
  'P.138': 'BERSATU', 'P.139': 'PAS',
  // Johor — more BERSATU
  'P.140': 'BERSATU', 'P.141': 'PAS', 'P.142': 'BERSATU', 'P.143': 'BERSATU',
  'P.144': 'PAS', 'P.145': 'BERSATU', 'P.146': 'PAS', 'P.147': 'PAS',
  'P.148': 'PAS', 'P.149': 'PAS', 'P.150': 'BERSATU', 'P.151': 'PAS',
  'P.152': 'BERSATU', 'P.153': 'BERSATU', 'P.154': 'PAS', 'P.155': 'PAS',
  'P.156': 'BERSATU', 'P.157': 'BERSATU', 'P.158': 'BERSATU', 'P.159': 'BERSATU',
  'P.160': 'BERSATU', 'P.161': 'BERSATU', 'P.162': 'BERSATU', 'P.163': 'BERSATU',
  'P.164': 'BERSATU', 'P.165': 'BERSATU',
  // Labuan
  'P.166': 'BERSATU',
  // Sabah — BERSATU
  'P.167': 'BERSATU', 'P.168': 'BERSATU', 'P.169': 'BERSATU', 'P.170': 'BERSATU',
  'P.171': 'BERSATU', 'P.172': 'BERSATU', 'P.173': 'BERSATU', 'P.174': 'BERSATU',
  'P.175': 'BERSATU', 'P.176': 'BERSATU', 'P.177': 'BERSATU', 'P.178': 'BERSATU',
  'P.179': 'BERSATU', 'P.180': 'BERSATU', 'P.181': 'BERSATU', 'P.182': 'BERSATU',
  'P.183': 'BERSATU', 'P.184': 'BERSATU', 'P.185': 'BERSATU', 'P.186': 'BERSATU',
  'P.187': 'BERSATU', 'P.188': 'BERSATU', 'P.189': 'BERSATU', 'P.190': 'BERSATU',
  'P.191': 'BERSATU',
  // Sarawak — BERSATU (minimal PN presence)
  'P.192': 'BERSATU', 'P.193': 'BERSATU', 'P.194': 'BERSATU', 'P.195': 'BERSATU',
  'P.196': 'BERSATU', 'P.197': 'BERSATU', 'P.198': 'BERSATU', 'P.199': 'BERSATU',
  'P.200': 'BERSATU', 'P.201': 'BERSATU', 'P.202': 'BERSATU', 'P.203': 'BERSATU',
  'P.204': 'BERSATU', 'P.205': 'BERSATU', 'P.206': 'BERSATU', 'P.207': 'BERSATU',
  'P.208': 'BERSATU', 'P.209': 'BERSATU', 'P.210': 'BERSATU', 'P.211': 'BERSATU',
  'P.212': 'BERSATU', 'P.213': 'BERSATU', 'P.214': 'BERSATU', 'P.215': 'BERSATU',
  'P.216': 'BERSATU', 'P.217': 'BERSATU', 'P.218': 'BERSATU', 'P.219': 'BERSATU',
  'P.220': 'BERSATU', 'P.221': 'BERSATU', 'P.222': 'BERSATU',
};

// ══════════════════════════════════════════════════════════════
// BN SEAT ALLOCATION (UMNO, MCA, MIC + Sabah/Sarawak BN parties)
// Key: Sarawak parties LEFT BN to form GPS before GE15
// In GE15, Sarawak has NO BN. Sabah still has some BN parties.
// ══════════════════════════════════════════════════════════════
const BN_ALLOC = {};
// Will be filled dynamically using Excel + ethnicity heuristic

// ─── Parse Excel ───────────────────────────────────────────

const wb = XLSX.readFile('../result by party.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

const parseVotes = (val) => {
  if (val === '–' || val === '-' || val === null || val === undefined || val === '') return 0;
  return Number(val) || 0;
};

function parseComponent(str) {
  if (!str || str === '–' || str === 'Ind' || str === 'BEBAS' || str === 'Vacant') return null;
  const m = String(str).match(/^([A-Za-z]+)\s*\(([^)]+)\)/);
  if (m) return { coalition: m[1].trim(), party: m[2].trim() };
  return { coalition: String(str).trim(), party: String(str).trim() };
}

const excelSeats = [];
for (let i = 4; i < rawData.length; i++) {
  const row = rawData[i];
  if (!row || !row[0]) continue;
  const match = String(row[0]).trim().match(/^P(\d{3})/);
  if (!match) continue;
  
  excelSeats.push({
    seatId: `P.${match[1]}`,
    state: row[1] ? String(row[1]).trim() : '',
    ge14Winner: parseComponent(row[3]),
    incumbent: parseComponent(row[5]),
    ge15Winner: parseComponent(row[7]),
    votes: {
      PH_MUDA: parseVotes(row[13]),
      PN: parseVotes(row[14]),
      BN: parseVotes(row[15]),
      GPS: parseVotes(row[16]),
      WARISAN: parseVotes(row[17]),
      GRS: parseVotes(row[18]),
      KDM: parseVotes(row[19]),
      PBM: parseVotes(row[20]),
      GTA: parseVotes(row[21]),
      Ind: parseVotes(row[22]),
      Other: parseVotes(row[23]),
      Total: parseVotes(row[24]),
    }
  });
}
console.log(`Parsed ${excelSeats.length} seats from Excel`);

// ─── Load initial_state.json ───────────────────────────────

const initialState = JSON.parse(fs.readFileSync('./public/assets/data/initial_state.json', 'utf-8'));
const seatMeta = {};
for (const s of initialState) seatMeta[s.id] = s;

// ─── Determine BN party per seat ───────────────────────────

function determineBNParty(seat) {
  // Sarawak: BN doesn't contest (parties formed GPS)
  if (seat.state === 'Sarawak') return 'UMNO'; // placeholder, BN has 0 votes anyway
  
  // Use GE15 winner if BN won
  if (seat.ge15Winner?.coalition === 'BN') {
    const p = seat.ge15Winner.party;
    // Map Sabah BN parties
    if (p === 'PBS' || p === 'PBRS' || p === 'UPKO') return p;
    if (p === 'MCA' || p === 'MIC') return p;
    return 'UMNO';
  }
  
  // Use incumbent info
  if (seat.incumbent?.coalition === 'BN') {
    const p = seat.incumbent.party;
    if (['MCA', 'MIC', 'PBS', 'PBRS', 'UPKO'].includes(p)) return p;
    return 'UMNO';
  }
  
  // Use GE14 winner — but EXCLUDE Sarawak parties (they moved to GPS)
  if (seat.ge14Winner?.coalition === 'BN') {
    const p = seat.ge14Winner.party;
    if (['PBB', 'PRS', 'SUPP', 'PDP'].includes(p)) return 'UMNO'; // DON'T use Sarawak parties
    if (['MCA', 'MIC', 'PBS', 'PBRS', 'UPKO'].includes(p)) return p;
    return 'UMNO';
  }
  
  // Ethnicity heuristic — MCA only contested ~25 seats, MIC ~7 seats
  // UMNO contests most seats including many with significant Chinese minority
  const meta = seatMeta[seat.seatId];
  if (meta?.ethnicity) {
    if (meta.ethnicity.chinese >= 45) return 'MCA';
    if (meta.ethnicity.indian >= 25) return 'MIC';
  }
  
  return 'UMNO';
}

// ─── Generate party-level data ─────────────────────────────

const results = [];
const stats = { PH: {}, PN: {}, BN: {} };

for (const seat of excelSeats) {
  const meta = seatMeta[seat.seatId];
  if (!meta) { console.warn(`No metadata for ${seat.seatId}`); continue; }
  
  // Determine component parties
  const phParty = PH_ALLOC[seat.seatId] || 'PKR';
  
  // PN: Use hardcoded if available, then Excel winner, then incumbent, then heuristic
  let pnParty = PN_KNOWN[seat.seatId];
  if (!pnParty) {
    if (seat.ge15Winner?.coalition === 'PN') pnParty = seat.ge15Winner.party;
    else if (seat.incumbent?.coalition === 'PN') pnParty = seat.incumbent.party;
    else pnParty = 'BERSATU'; // fallback
  }
  
  const bnParty = determineBNParty(seat);
  
  // Track stats
  stats.PH[phParty] = (stats.PH[phParty] || 0) + 1;
  stats.PN[pnParty] = (stats.PN[pnParty] || 0) + 1;
  stats.BN[bnParty] = (stats.BN[bnParty] || 0) + 1;
  
  const total = seat.votes.Total || 1;
  const pp = {};
  
  // PH+MUDA → component party
  pp[phParty] = (pp[phParty] || 0) + seat.votes.PH_MUDA;
  
  // PN → PAS or BERSATU
  pp[pnParty] = (pp[pnParty] || 0) + seat.votes.PN;
  
  // BN → UMNO, MCA, MIC, or Sabah parties
  pp[bnParty] = (pp[bnParty] || 0) + seat.votes.BN;
  
  // Direct party vote columns
  if (seat.votes.GPS > 0) pp['GPS'] = (pp['GPS'] || 0) + seat.votes.GPS;
  if (seat.votes.WARISAN > 0) pp['WARISAN'] = (pp['WARISAN'] || 0) + seat.votes.WARISAN;
  if (seat.votes.GRS > 0) pp['GRS'] = (pp['GRS'] || 0) + seat.votes.GRS;
  if (seat.votes.KDM > 0) pp['KDM'] = (pp['KDM'] || 0) + seat.votes.KDM;
  if (seat.votes.PBM > 0) pp['PBM'] = (pp['PBM'] || 0) + seat.votes.PBM;
  if (seat.votes.GTA > 0) pp['PEJUANG'] = (pp['PEJUANG'] || 0) + seat.votes.GTA;
  const othersVotes = seat.votes.Ind + seat.votes.Other;
  if (othersVotes > 0) pp['Others'] = (pp['Others'] || 0) + othersVotes;
  
  // Convert to percentages (round to 2 decimal places)
  const partyPopularity = {};
  for (const [party, votes] of Object.entries(pp)) {
    const pct = Math.round((votes / total) * 10000) / 100;
    if (pct > 0) partyPopularity[party] = pct;
  }
  
  results.push({
    id: seat.seatId,
    name: meta.name,
    state: meta.state,
    demographics: meta.demographics,
    ethnicity: meta.ethnicity,
    winnerGE15: meta.winnerGE15,
    candidates: meta.candidates,
    partyPopularity,
    ge15Allocation: { PH: phParty, PN: pnParty, BN: bnParty },
    popularityTracker: meta.popularityTracker,
    basePopularity: meta.basePopularity,
  });
}

// ─── Stats & Validation ────────────────────────────────────

console.log('\n═══ Allocation Statistics ═══');
console.log('PH:', JSON.stringify(stats.PH));
console.log('PN:', JSON.stringify(stats.PN));
console.log('BN:', JSON.stringify(stats.BN));
console.log(`Total: ${results.length} seats`);

const checks = [
  { id: 'P.001', e: { PH: 'PKR', PN: 'PAS', BN: 'UMNO' }, d: 'Padang Besar' },
  { id: 'P.043', e: { PH: 'DAP', PN: 'BERSATU', BN: 'UMNO' }, d: 'Bagan' },
  { id: 'P.104', e: { PH: 'DAP', PN: 'BERSATU', BN: 'UMNO' }, d: 'Subang' },
  { id: 'P.119', e: { PH: 'AMANAH', PN: 'BERSATU', BN: 'UMNO' }, d: 'Titiwangsa' },
  { id: 'P.021', e: { PH: 'PKR', PN: 'PAS', BN: 'UMNO' }, d: 'Kota Bharu' },
  { id: 'P.037', e: { PH: 'AMANAH', PN: 'PAS', BN: 'UMNO' }, d: 'Marang' },
  { id: 'P.148', e: { PH: 'PKR', PN: 'PAS', BN: 'MCA' }, d: 'Ayer Hitam' },
  { id: 'P.072', e: { PH: 'PKR', PN: 'BERSATU', BN: 'MIC' }, d: 'Tapah' },
  { id: 'P.193', e: { PH: 'DAP', PN: 'BERSATU', BN: 'UMNO' }, d: 'Santubong (Sarawak)' },
];

console.log('\n═══ Spot Checks ═══');
for (const c of checks) {
  const s = results.find(r => r.id === c.id);
  if (!s) { console.log(`❌ ${c.id} not found`); continue; }
  const a = s.ge15Allocation;
  const ok = a.PH === c.e.PH && a.PN === c.e.PN && a.BN === c.e.BN;
  const sorted = Object.entries(s.partyPopularity).sort((a, b) => b[1] - a[1]);
  console.log(`${ok ? '✅' : '❌'} ${c.id} ${c.d}: PH=${a.PH} PN=${a.PN} BN=${a.BN}`);
  if (!ok) console.log(`   Expected: PH=${c.e.PH} PN=${c.e.PN} BN=${c.e.BN}`);
  console.log(`   ${sorted.slice(0, 4).map(([p, v]) => `${p}=${v}%`).join(', ')}`);
}

// ─── Write output ──────────────────────────────────────────

fs.writeFileSync('./public/assets/data/initial_state_v2.json', JSON.stringify(results, null, 2));
console.log('\n✅ Written to public/assets/data/initial_state_v2.json');
