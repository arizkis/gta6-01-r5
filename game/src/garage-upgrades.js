// Workshop, neighborhood shops, apartment shelter and versioned local saves.
import { material } from './city.js';
import { SERVICES, SAVE_KEY } from './config.js';
import { distance } from './navigation.js';

export const UPGRADES = [
  { id: 'armour', name: 'ARMOUR PLATING', price: 120, detail: '55% less vehicle damage · 20% heavier acceleration' },
  { id: 'insulation', name: 'COOLER INSULATION', price: 90, detail: 'Sun warms cargo three times more slowly' },
  { id: 'spikes', name: 'SPIKE STRIP', price: 80, detail: 'Three charges · X drops one · pursuing tyres slow for 6s' },
];
const SHIRTS = ['#ef946f', '#75c9ba', '#ed9bae', '#eac468', '#8eacd8'];
export function createServices(game) {
  const { player, state, hud } = game, p = player.state;
  const panel = document.getElementById('service-menu'), body = document.getElementById('service-body');
  let active = null, garageArmed = true;
  const car = () => player.vehicle ?? game.vehicles.filter(v => !v.police && distance(v.position, player.position) < 65).sort((a, b) => distance(a.position, player.position) - distance(b.position, player.position))[0];
  function paint(color) {
    p.shirt = SHIRTS.includes(color) ? color : SHIRTS[0];
    player.torso.material = material(p.shirt);
    player.arms.forEach(arm => { arm.material = material(p.shirt); });
  }
  function applyUpgrades() { game.vehicles.filter(v => !v.police).forEach(v => { v.upgrades = { ...p.upgrades }; }); }
  function save(announce = true) {
    if (game.shot) return false;
    const m = state.mission, c = state.cooler;
    const data = { version: 1, cash: p.cash, health: p.health, armour: p.armour, respect: p.respect, shirt: p.shirt, upgrades: p.upgrades, spikeCharges: p.spikeCharges, bestTime: p.bestTime, completed: m.completed,
      mission: m.active ? { jobId: m.jobId, stage: m.stage, timer: m.timer, runTime: m.runTime, lanterns: m.lanterns } : null,
      cooler: c.active ? { active: true, temperature: c.temperature, integrity: c.integrity, payout: c.payout, basePay: c.basePay } : null };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); if (announce) hud.notify('DAY SAVED / Your apartment keeps a light on.'); return true; }
    catch { hud.notify('This browser could not keep the save. The day is still playable.'); return false; }
  }
  function load() {
    if (game.shot) return false;
    try {
      const data = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null');
      if (!data || data.version !== 1) return false;
      const number = (value, fallback, max = 100) => Number.isFinite(value) ? Math.max(0, Math.min(max, value)) : fallback;
      p.cash = number(data.cash, 140, 1e7); p.health = number(data.health, 100); p.armour = number(data.armour, 0);
      for (const faction of ['FIXER', 'MECHANIC', 'FENCE']) p.respect[faction] = number(data.respect?.[faction], 0);
      p.upgrades = Object.fromEntries(UPGRADES.map(u => [u.id, data.upgrades?.[u.id] === true]));
      p.spikeCharges = number(data.spikeCharges, 0, 3); p.bestTime = Number.isFinite(data.bestTime) ? data.bestTime : null;
      paint(data.shirt); applyUpgrades();
      state.mission.completed = game.missionDirector.definitions.filter(job => data.completed?.includes(job.id)).map(job => job.id);
      const pending = data.mission, job = game.missionDirector.definitions.find(j => j.id === pending?.jobId);
      if (job && !state.mission.completed.includes(job.id)) {
        game.missionDirector.accept(job, true);
        game.missionDirector.setStage(Math.min(Math.max(0, pending.stage || 0), game.missionDirector.targets.length - 1));
        state.mission.timer = Number.isFinite(pending.timer) ? pending.timer : null;
        state.mission.runTime = number(pending.runTime, 0, 10000); state.mission.lanterns = !!pending.lanterns;
        state.mission.crates = job.id === 'market-dash' && state.mission.stage >= 2;
        if (data.cooler) Object.assign(state.cooler, { active: true, temperature: number(data.cooler.temperature, 2, 25), integrity: number(data.cooler.integrity, 100), basePay: job.pay, payout: number(data.cooler.payout, job.pay, job.pay) });
      }
      return true;
    } catch { return false; }
  }
  function spend(price, action, message) {
    if (p.cash < price) { hud.notify(`You need $${price}. A favor or two will cover it.`); return false; }
    p.cash -= price; action(); hud.notify(message); save(false); render(); return true;
  }
  function purchase(id) {
    const u = UPGRADES.find(item => item.id === id);
    if (u && !p.upgrades[id]) return spend(u.price, () => { p.upgrades[id] = true; if (id === 'spikes') p.spikeCharges = 3; applyUpgrades(); }, `${u.name} FITTED`);
    if (id === 'repair') {
      const vehicle = car(); if (!vehicle) return false;
      return spend(Math.ceil((100 - vehicle.condition) * 0.6), () => { vehicle.condition = 100; }, 'All straight again. Tavi says take the corners gently.');
    }
    if (id === 'reload') return spend(25, () => { p.spikeCharges = 3; }, 'Three fresh strips in the rack.');
    if (id === 'food') return spend(15, () => { p.health = 100; }, 'Hot bread. Cold limeade. Health restored.');
    if (id === 'vest') return spend(35, () => { p.armour = 100; }, 'Market work vest / armour restored.');
    if (id.startsWith('shirt:')) return spend(20, () => paint(id.slice(6)), 'A fresh shirt for the rest of the day.');
    return false;
  }
  function button(title, detail, id, disabled = false) {
    const b = document.createElement('button'); b.className = 'service-option'; b.disabled = disabled;
    const name = document.createElement('strong'); name.textContent = title;
    const description = document.createElement('span'); description.textContent = detail;
    b.append(name, description); b.dataset.purchase = id;
    b.addEventListener('click', () => id === 'save' ? save() : purchase(id)); body.append(b);
  }
  function render() {
    if (!active) return;
    body.replaceChildren(); document.getElementById('service-title').textContent = active.name;
    if (active.id === 'garage') {
      const vehicle = car(), price = vehicle ? Math.ceil((100 - vehicle.condition) * 0.6) : 0;
      button(`REPAIR / $${price}`, vehicle ? `${vehicle.name} · ${Math.round(vehicle.condition)}% condition` : 'Bring a vehicle into the workshop', 'repair', !vehicle || vehicle.condition >= 100);
      UPGRADES.forEach(u => button(`${u.name} / ${p.upgrades[u.id] ? 'FITTED' : `$${u.price}`}`, u.detail, u.id, !!p.upgrades[u.id]));
      if (p.upgrades.spikes) button('RELOAD STRIPS / $25', `${p.spikeCharges}/3 charges in the rack`, 'reload', p.spikeCharges === 3);
      const summary = document.createElement('div'); summary.className = 'progression'; summary.id = 'progression-summary';
      summary.textContent = `PROGRESSION SUMMARY\nCASH $${Math.round(p.cash)} · JOBS ${state.mission.completed.length} of 6\nFIXER ${p.respect.FIXER} · MECHANIC ${p.respect.MECHANIC} · FENCE ${p.respect.FENCE}\nBEST CHECKPOINT TIME ${p.bestTime === null ? 'NO TIME YET' : `${p.bestTime.toFixed(1)}s`}`;
      body.append(summary);
    }
    if (active.id === 'food') { button('LIMEADE & HOT BREAD / $15', 'Restore health to 100', 'food'); button('WORK VEST / $35', 'Restore armour to 100 · absorbs collision damage first', 'vest'); }
    if (active.id === 'clothes') SHIRTS.forEach((color, i) => button(`${['GUAVA', 'SEA GLASS', 'HIBISCUS', 'MARIGOLD', 'EVENING BLUE'][i]} / $20`, color === p.shirt ? 'Wearing this one' : 'A clean shirt, locally stitched', `shirt:${color}`, color === p.shirt));
    if (active.id === 'home') button('SAVE DAY', 'Keep cash, favors, clothes, upgrades and your best time', 'save');
  }
  function open(service) {
    active = service; game.showScreen('service'); panel.hidden = false; render();
    if (service.id === 'home') { game.police.reset(); hud.notify('HOME / Out of sight. Take a breath, Juno.'); }
  }
  function close() { active = null; panel.hidden = true; game.showScreen('play'); }
  function nearby() { return SERVICES.find(s => distance(player.position, s) < (s.id === 'garage' ? 46 : 28)); }
  function interact() {
    const service = nearby();
    if (service?.id === 'garage' && ['enter', 'exit'].includes(player.interaction?.type)) return false;
    if (service) { open(service); return true; }
    return false;
  }
  function update() {
    const garage = SERVICES.find(s => s.id === 'garage'), d = distance(player.position, garage);
    if (d > 75) garageArmed = true;
    if (d < 35 && garageArmed && !game.shot) { garageArmed = false; open(garage); }
    const service = nearby();
    if (service && !(service.id === 'garage' && ['enter', 'exit'].includes(player.interaction?.type))) player.interaction = { type: 'service', label: `E / ${service.name}` };
  }
  document.getElementById('service-close').addEventListener('click', close);
  return { open, close, render, purchase, save, load, paint, applyUpgrades, interact, update, get active() { return active; } };
}
