// Scope: render shared game state into instruments, prompts and the dialogue bar.
import { createMinimap } from './minimap.js';

export function createHUD(city) {
  const element = id => document.getElementById(id);
  const map = createMinimap(element('minimap'), city);
  const money = amount => `$${Math.round(amount).toLocaleString('en-US')}`;
  let noticeUntil = 0, pipsKey = '';
  function notify(text, seconds = 4) {
    element('notice').textContent = text;
    noticeUntil = performance.now() + seconds * 1000;
    element('notice').hidden = false;
  }
  function update(state) {
    const { player, mission, wanted, cooler, navigation, contacts } = state;
    const p = player.state, position = player.vehicle?.position ?? player.position;
    const district = city.districtAt(position.x, position.z);
    element('district').textContent = district;
    element('map-district').textContent = district;
    element('mission-name').textContent = mission.active ? mission.name : 'NO ACTIVE JOB';
    element('mission-objective').textContent = mission.active ? mission.objective : 'Three contacts. One very long summer.';
    element('mission-next').textContent = `NEXT / ${mission.active ? mission.next : 'FIND A CONTACT OR OPEN THE JOB BOARD'}`;
    const key = `${mission.active}-${mission.stage}-${mission.stageCount}`;
    if (key !== pipsKey) {
      pipsKey = key;
      element('stage-pips').replaceChildren();
      for (let i = 0; i < (mission.stageCount ?? 3); i++) {
        const pip = document.createElement('span');
        pip.className = mission.active && i <= mission.stage ? 'filled' : '';
        element('stage-pips').append(pip);
      }
    }
    const level = Math.max(0, Math.min(5, Math.floor(wanted.level)));
    element('wanted-stars').textContent = Array.from({ length: 5 }, (_, i) => i < level ? '★' : '☆').join(' ');
    element('wanted-stars').setAttribute('aria-label', `Wanted level ${level} of 5`);
    element('dispatch').textContent = `DISPATCH / ${wanted.dispatch || 'ALL QUIET'}`;
    element('cash').textContent = money(p.cash);
    const minutes = Math.floor(state.clockMinutes) % 1440;
    element('clock').textContent = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    element('time-preset').textContent = city.timeOfDay === 'golden' ? 'GOLDEN HOUR' : city.timeOfDay.toUpperCase();
    const units = (wanted.units ?? []).slice(0, 3);
    element('unit-count').textContent = String((wanted.units ?? []).length).padStart(2, '0');
    element('police-units').replaceChildren();
    if (!units.length) element('police-units').textContent = 'NO UNITS DISPATCHED';
    units.forEach(unit => {
      const row = document.createElement('div'); row.className = 'unit-row';
      const distance = unit.distance ?? Math.hypot((unit.position?.x ?? unit.x) - position.x, (unit.position?.z ?? unit.z) - position.z);
      row.textContent = `${unit.callsign} / ${Math.round(distance)}m / ${unit.tactic}`;
      element('police-units').append(row);
    });
    element('cooler-panel').hidden = !cooler.active;
    element('cooler-temp').textContent = `${Number(cooler.temperature ?? 0).toFixed(1)}°C`;
    element('cooler-integrity').textContent = `${Math.round(cooler.integrity ?? 100)}%`;
    element('cooler-payout').textContent = money(cooler.payout ?? 0);
    document.querySelectorAll('[data-weapon]').forEach(node => node.classList.toggle('selected', Number(node.dataset.weapon) === p.weapon));
    for (const name of ['health', 'armour', 'tank']) element(name).value = p[name];
    for (const name of ['health', 'armour']) element(`${name}-value`).textContent = Math.round(p[name]);
    for (const faction of ['FIXER', 'MECHANIC', 'FENCE']) element(`respect-${faction.toLowerCase()}`).value = p.respect[faction];
    const prompt = player.interaction;
    element('interaction').hidden = !prompt || !!state.dialogue.active;
    element('interaction').textContent = prompt?.label ?? '';
    element('vehicle-panel').hidden = !player.vehicle;
    if (player.vehicle) {
      element('vehicle-name').textContent = player.vehicle.name;
      element('speed').textContent = Math.round(Math.abs(player.vehicle.speed) * 1.8);
      element('condition').textContent = `${Math.round(player.vehicle.condition)}%`;
    }
    element('radio-station').textContent = `RADIO / ${state.radio.station || 'OFF'}`;
    element('dialogue').hidden = !state.dialogue.active;
    element('speaker').textContent = state.dialogue.speaker ?? '';
    element('dialogue-line').textContent = state.dialogue.line ?? '';
    element('portrait').textContent = state.dialogue.initials ?? 'JR';
    element('notice').hidden = performance.now() > noticeUntil;
    map.draw(player, contacts, navigation, wanted);
  }
  return { update, notify };
}
