// Scope: city dimensions, street grid, districts, palette and shared tuning.
export const WORLD = { width: 2860, depth: 2360, landX: 2720, landZ: 2200 };
export const STREETS = { x: [240, 680, 1120, 1560, 2000, 2440], z: [280, 720, 1160, 1600, 2040], width: 112, sidewalk: 22 };
export const DISTRICTS = [
  { name: 'SUNSPUR STRAND', color: '#efaa70', test: (x, z) => x > 2250 || z > 2060 },
  { name: 'TIDEWORKS', color: '#70b9b5', test: (x, z) => x >= 1500 && z >= 1200 },
  { name: 'OLD SALT QUARTER', color: '#db8ea7', test: (x, z) => x < 1500 && z >= 1100 },
  { name: 'MARIGOLD MARKET', color: '#efbd65', test: (x, z) => x >= 1000 },
  { name: 'CITRUS COMMONS', color: '#a6bd85', test: () => true },
];
export const PALETTE = { cream: '#ffe5b2', pink: '#ef8ca6', orange: '#f7a568', teal: '#358e91', road: '#526c73', pavement: '#ddcba5', sea: '#3ca9b3', grass: '#83a98b', ink: '#173e49' };
export const SPEEDS = { walk: 17, sprint: 28, carMax: 150, reverse: 38, acceleration: 42, braking: 80, traffic: 48 };
export const SAVE_KEY = 'sunspur.cooler-caper.v1';
export const SPAWN = { x: 472, z: 648, heading: 0 };
export const CONTACTS = [
  { id: 'tavi', name: 'Tavi Moss', faction: 'MECHANIC', x: 1838, z: 940, color: '#75d2be' },
  { id: 'niko', name: 'Niko Vale', faction: 'FIXER', x: 1390, z: 628, color: '#f6bf65' },
  { id: 'paz', name: 'Paz Sol', faction: 'FENCE', x: 2150, z: 2170, color: '#e99fba' },
];
export const PLACES = {
  park: { x: 460, z: 490, name: 'CITRUS GREEN' },
  festival: { x: 1780, z: 950, name: 'LANTERN FEST' },
  impound: { x: 910, z: 1810, name: 'SUNSPUR IMPOUND' },
  workshop: { x: 1780, z: 1470, name: "TAVI'S WORKSHOP" },
  safehouse: { x: 430, z: 631, name: "JUNO'S SAFEHOUSE" },
  market: { x: 1370, z: 570, name: 'MARIGOLD MARKET' },
  pier: { x: 2150, z: 2300, name: 'TIN CUP PIER' },
};
export const SERVICES = [
  { id: 'food', x: 1300, z: 551, name: 'SUNBASKET / FOOD & ARMOUR' },
  { id: 'clothes', x: 1430, z: 551, name: 'THREAD & TIDE' },
  { id: 'garage', ...PLACES.workshop },
  { id: 'home', ...PLACES.safehouse },
];
