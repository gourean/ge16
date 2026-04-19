const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

const csvPath = path.resolve(__dirname, '../public/assets/data/candidates_ge15.csv');
const svgPath = path.resolve(__dirname, '../public/assets/map/map_2022.svg');
const outJson = path.resolve(__dirname, '../public/assets/data/initial_state.json');
const outSvg = path.resolve(__dirname, '../public/assets/map/map_2022_processed.svg');

// 1. Read CSV and build Initial State
const csvFile = fs.readFileSync(csvPath, 'utf8');
const parsed = Papa.parse(csvFile, { header: true, dynamicTyping: true });

const seatsMap = {};

parsed.data.forEach(row => {
  if (!row.parlimen) return;
  const match = row.parlimen.match(/(P\.\d{3})\s+(.*)/);
  if (!match) return;
  const id = match[1];
  const name = match[2];

  if (!seatsMap[id]) {
    const demoType = ['Malay-Majority', 'Mixed', 'Chinese-Majority', 'Bumiputera-Sabah/Sarawak'][Math.floor(Math.random() * 4)];
    
    seatsMap[id] = {
      id,
      name,
      state: row.state,
      demographics: demoType,
      popularityTracker: {
        'PH': 25,
        'PN': 25,
        'BN': 25,
        'Others': 25
      },
      basePopularity: {},
      candidates: []
    };
  }

  let coalition = 'Others';
  if (row.party && row.party.includes('PAKATAN HARAPAN')) coalition = 'PH';
  else if (row.party && row.party.includes('PERIKATAN NASIONAL')) coalition = 'PN';
  else if (row.party && row.party.includes('BARISAN NASIONAL')) coalition = 'BN';

  if (row.result === 1) { 
    seatsMap[id].winnerGE15 = coalition;
    seatsMap[id].popularityTracker[coalition] = 55;
    seatsMap[id].popularityTracker['Others'] = 5;
  }
  
  seatsMap[id].candidates.push({
    name: row.name_display,
    party: row.party,
    coalition,
    votes: row.votes
  });
});

const seatsArray = Object.values(seatsMap).sort((a,b) => a.id.localeCompare(b.id));

seatsArray.forEach(seat => {
    let sum = 0;
    for(let k in seat.popularityTracker) sum+= seat.popularityTracker[k];
    for(let k in seat.popularityTracker) {
        seat.popularityTracker[k] = Math.round((seat.popularityTracker[k] / sum) * 100);
        seat.basePopularity[k] = seat.popularityTracker[k];
    }
});

fs.writeFileSync(outJson, JSON.stringify(seatsArray, null, 2));
console.log(`Wrote ${seatsArray.length} seats to ${outJson}`);

// 2. Parse SVG and sequentially inject IDs
let svgContent = fs.readFileSync(svgPath, 'utf8');

let count = 1;
// Replace any generic path ID with P.00X. Note: The SVG has generic ids like id="path1508"
svgContent = svgContent.replace(/id="path\d+"/g, (match) => {
  if (count <= 222) {
    const id = `P.${String(count).padStart(3, '0')}`;
    count++;
    return `id="${id}"`;
  }
  return match;
});

fs.writeFileSync(outSvg, svgContent);
console.log(`Replaced ${count-1} IDs in SVG. Wrote to ${outSvg}`);
