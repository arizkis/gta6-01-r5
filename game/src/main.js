// Sunspur has five districts, walking, carrying, driving, traffic and reactive people.
// Six contact jobs use dialogue, timers, checkpoints, routes, cargo and cash payouts.
// Patrol cars pursue, ram, attempt PITs, block roads and box cars; an air unit searches.
// Witnesses raise wanted stars; sight drives heat, escapes and arrests at the safehouse.
// Cooler temperature, shade, insulation and collision integrity change delivery pay.
// Workshops repair cars and fit armour, insulation and usable spike strips.
// Food, armour, clothes, faction respect, apartment saves and checkpoint records persist.
// Fists, a wrench and a refillable water toy affect cars and nearby people.
// Synth radio, skid trails, smoke, sparks, vapour, a live HUD and four staged routes run locally.
// Scope: boot, shared state, input, menus and the fixed-step simulation loop.
import * as THREE from '../vendor/three.min.js';
import { buildCity } from './city.js';
import { createParkedVehicles, syncVehicleBlocker } from './vehicles.js';
import { createTraffic } from './traffic.js';
import { createPedestrians } from './pedestrians.js';
import { createPlayer } from './player.js';
import { driveVehicle, createChaseCamera } from './driving.js';
import { createHUD } from './hud.js';
import { createMissionDirector } from './mission-director.js';
import { createPolice } from './police-tactics.js';
import { createCoolerCargo } from './cooler-cargo.js';
import { createEffects } from './effects.js';
import { createServices } from './garage-upgrades.js';
import { createWeapons } from './weapons.js';
import { createRadio } from './radio.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(location.search);
const requestedSeed = Number.parseInt(params.get('seed') ?? '17', 10);
const seed = Number.isFinite(requestedSeed) ? requestedSeed : 17;
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game'), antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.5, 6500);
const city = buildCity(scene, seed);
const parked = createParkedVehicles(scene, city, seed);
const traffic = createTraffic(scene, city, seed);
const crowd = createPedestrians(scene, city, seed);
const vehicles = [...parked.vehicles, ...traffic.cars];
const player = createPlayer(scene, city);
const chase = createChaseCamera(camera, city);
const hud = createHUD(city);
const keys = new Set(), events = new EventTarget(), systems = new Set();
let boardReturn = 'title';
const missionDirector = createMissionDirector(document.getElementById('job-list'), job => {
  if (boardReturn === 'title') restartDay();
  else showScreen('play');
  missionDirector.accept(job);
  events.dispatchEvent(new CustomEvent('jobrequested', { detail: job }));
  const contact = crowd.contacts.find(c => c.id === job.contactId);
  hud.notify(`${contact.name} / ${contact.faction} · Find their initial on the map.`, 6);
});
const state = {
  seed, screen: 'title', player, contacts: crowd.contacts, mission: missionDirector.state,
  wanted: { level: 0, dispatch: '', units: [], search: null },
  cooler: { active: false, temperature: 2, integrity: 100, payout: 0 },
  navigation: { target: null, route: [], search: null },
  dialogue: { active: false, speaker: '', initials: '', line: '' },
  radio: { station: '' }, clockMinutes: 1030, elapsed: 0,
};
vehicles.forEach(car => { car.start = { position: car.position.clone(), heading: car.heading, traffic: car.traffic, routeIndex: car.routeIndex }; });
crowd.people.forEach(ped => { ped.start = { position: ped.position.clone(), index: ped.index }; });

function showScreen(name) {
  state.screen = name;
  keys.clear();
  document.getElementById('hud').hidden = name === 'title';
  document.getElementById('title-menu').hidden = name !== 'title';
  document.getElementById('pause-menu').hidden = name !== 'paused';
  document.getElementById('board-menu').hidden = name !== 'board';
  document.getElementById('status').textContent = name === 'play' ? 'Playing as Juno Reed in Sunspur Bay.' : name === 'title' ? 'Sunspur Bay. Press Enter to start.' : name === 'board' ? 'Job board. Six jobs in unlock order.' : 'Paused.';
  if (name === 'paused') document.getElementById('resume-button').focus();
  if (name === 'board') document.getElementById('board-back-button').focus();
}

function restartDay() {
  game.police.reset();
  player.reset();
  vehicles.forEach(car => {
    car.position.copy(car.start.position); car.heading = car.start.heading;
    car.mesh.rotation.y = car.heading; car.speed = 0; car.condition = 100;
    car.occupied = false; car.traffic = car.start.traffic; car.routeIndex = car.start.routeIndex;
    car.collisionCooldown = 0;
    car.door.visible = false;
    syncVehicleBlocker(car);
  });
  crowd.people.forEach(ped => {
    ped.position.copy(ped.start.position); ped.index = ped.start.index;
    ped.state.mode = 'stroll'; ped.state.panic = 0; ped.state.target = null;
  });
  Object.assign(state.mission, { active: false, jobId: null, requestedJobId: null, name: '', objective: '', stage: 0, next: '', completed: [], timer: null, lanterns: false, crates: false });
  Object.assign(state.wanted, { level: 0, dispatch: '', units: [], search: null });
  Object.assign(state.cooler, { active: false, temperature: 2, integrity: 100, payout: 0 });
  Object.assign(state.navigation, { target: null, route: [], search: null });
  state.dialogue.active = false; state.radio.station = '';
  state.clockMinutes = 1030; state.elapsed = 0; player.lastVehicle = null;
  city.setTimeOfDay('golden'); chase.reset();
  systems.forEach(system => system.reset?.(state));
  game.services.load(); game.radio.unlock();
  game.services.paint(player.state.shirt); game.services.applyUpgrades();
  player.findInteraction(crowd.contacts, vehicles);
  chase.update(player, 1 / 60, true);
  showScreen('play');
  hud.notify('JUNO REED / Citrus Commons · Your ride is by the curb.', 5);
}

function openBoard() {
  boardReturn = state.screen === 'title' ? 'title' : 'paused';
  missionDirector.renderBoard();
  showScreen('board');
}
function closeBoard() { showScreen(boardReturn); }
document.getElementById('start-button').addEventListener('click', restartDay);
document.getElementById('resume-button').addEventListener('click', () => showScreen('play'));
document.getElementById('restart-button').addEventListener('click', restartDay);
document.getElementById('title-board-button').addEventListener('click', openBoard);
document.getElementById('pause-board-button').addEventListener('click', openBoard);
document.getElementById('board-back-button').addEventListener('click', closeBoard);

window.addEventListener('keydown', event => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
  if (event.repeat) return;
  if (event.code === 'Enter' && state.screen === 'title') { restartDay(); return; }
  if (event.code === 'Escape' || event.code === 'KeyP') {
    if (state.screen === 'service') game.services.close();
    else if (state.screen === 'board') closeBoard();
    else if (state.screen === 'play') showScreen('paused');
    else if (state.screen === 'paused') showScreen('play');
    return;
  }
  if (state.screen !== 'play') return;
  game.radio.unlock();
  keys.add(event.code);
  if (event.code === 'KeyB') { openBoard(); return; }
  if (event.code === 'KeyE') {
    if (game.dialogue.advance()) return;
    player.findInteraction(crowd.contacts, vehicles);
    if (game.services.interact()) return;
    const previous = player.vehicle;
    if (!player.interact(contact => {
      events.dispatchEvent(new CustomEvent('contact', { detail: contact }));
      missionDirector.talk(contact);
    }) && player.vehicle) hud.notify('Slow down and leave a little room to step out.');
    if (!previous && player.vehicle && player.vehicle.id !== 'juno-solace') game.police.crime(1, 'VEHICLE TAKEN');
    if (previous?.freezer) { previous.door.visible = !player.vehicle; previous.door.rotation.y = -1.15; }
  }
  if (['Digit1', 'Digit2', 'Digit3'].includes(event.code)) player.state.weapon = Number(event.code.slice(-1)) - 1;
  if (event.code === 'KeyQ') player.state.weapon = (player.state.weapon + 1) % 3;
  if (event.code === 'KeyF') game.radio.cycle();
  if (event.code === 'KeyX') game.police.dropStrip();
  events.dispatchEvent(new CustomEvent('key', { detail: event.code }));
});
window.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('pointerdown', event => { if (event.target.id === 'game' && state.screen === 'play') keys.add('Mouse0'); game.radio.unlock(); });
window.addEventListener('pointerup', () => keys.delete('Mouse0'));
window.addEventListener('blur', () => { keys.clear(); if (state.screen === 'play') showScreen('paused'); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state.screen === 'play') showScreen('paused'); });
window.addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  if (game.staged && window.__shotReady) requestAnimationFrame(frame);
});
renderer.setSize(innerWidth, innerHeight);

function step(dt) {
  state.elapsed += dt;
  state.clockMinutes += dt * 2;
  if (!game.staged) {
    if (player.vehicle) driveVehicle(player.vehicle, dt, keys, city);
    player.update(dt, keys, chase.state.yaw);
    traffic.update(dt, vehicles, player);
    crowd.update(dt);
    missionDirector.update(dt);
    game.weapons.update(dt);
    if (player.vehicle?.impact) { game.impact(player.vehicle.impact, false); player.vehicle.impact = 0; }
    if (player.position.x > 794 && player.position.x < 1026 && player.position.z > 1695 && player.position.z < 1935 && state.wanted.level < 2) game.police.crime(2, 'IMPOUND TRESPASS', true);
    if (player.vehicle && Math.abs(player.vehicle.speed) > 105 && game.police.units.some(u => u.distance < 200)) game.police.crime(1, 'RECKLESS DRIVING');
  }
  game.police.update(dt); game.cargo.update(dt); game.effects.update(dt); game.radio.update(); game.dialogue.update(dt);
  game.motionAge += dt;
  if (game.motionAge > 0.09) {
    game.motionAge = 0;
    const car = player.vehicle;
    if (car && Math.abs(car.speed) > 35) {
      crowd.scare(car.position, 110);
      if (['Space', 'KeyA', 'KeyD', 'KeyS', 'ArrowLeft', 'ArrowRight', 'ArrowDown'].some(key => keys.has(key)) || game.shot === 'causeway') {
        game.effects.skid(car);
        for (const side of [-1, 1]) game.effects.puff({ x: car.position.x - Math.sin(car.heading) * 10 + Math.cos(car.heading) * side * 7, y: 3, z: car.position.z - Math.cos(car.heading) * 10 - Math.sin(car.heading) * side * 7 }, '#9caeac', 3.6, 2.4);
      }
    }
    vehicles.filter(v => v.condition < 40 && v.position.distanceTo(player.position) < 200).forEach(v => game.effects.puff({ x: v.position.x, y: 15, z: v.position.z + 8 }, '#6b7d82', 4.5, 3.2, { x: -2, y: 7, z: 1 }));
    game.police.units.filter(u => u.distance < 150 && state.wanted.level).forEach(u => crowd.scare(u.position, 100));
  }
  systems.forEach(system => system.update?.(dt, state));
  player.findInteraction(crowd.contacts, vehicles);
  if (!game.staged) game.services.update();
}

let last = performance.now(), accumulator = 0, hudAge = 0;
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (game.staged) {
    // Staging advances exactly ninety simulation ticks, regardless of browser speed.
    for (let i = 0; i < 6 && game.shots.advance(); i++) step(1 / 60);
  } else if (state.screen === 'play') {
    accumulator += dt;
    while (accumulator >= 1 / 60) { step(1 / 60); accumulator -= 1 / 60; }
    if (!game.staged) chase.update(player, dt);
  } else {
    accumulator = 0;
    if (state.screen === 'title' || state.screen === 'board' && boardReturn === 'title') {
      const angle = now * 0.000012;
      camera.position.set(2130 + Math.sin(angle) * 170, 310, 2350 + Math.cos(angle) * 140);
      camera.lookAt(1730, 35, 1510);
      camera.fov = 58; camera.updateProjectionMatrix();
    }
  }
  hudAge += dt;
  game.radio.update();
  if (hudAge >= 0.08) { hud.update(state); hudAge = 0; }
  city.updateLighting(player.position);
  vehicles.forEach(car => { car.headlights.visible = city.timeOfDay !== 'midday'; });
  renderer.render(scene, camera);
  if (game.staged) renderer.shadowMap.autoUpdate = false;
  game.shots?.afterRender();
  if (!game.staged || !window.__shotReady) requestAnimationFrame(frame);
}

// A shared integration surface for the next gameplay modules and browser inspection.
const game = window.sunspur = {
  state, scene, renderer, camera, city, vehicles, traffic, crowd, player, chase,
  hud, missionDirector, events, keys, restartDay, showScreen,
  registerSystem(system) { systems.add(system); return () => systems.delete(system); },
  freezerVan: parked.freezerVan, shot: params.get('shot'), staged: false, motionAge: 0,
};
game.effects = createEffects(scene, seed);
game.cargo = createCoolerCargo(game);
game.police = createPolice(game);
game.services = createServices(game);
game.weapons = createWeapons(game);
game.radio = createRadio(game);
game.dialogue = (() => {
  let lines = [], age = 0;
  function advance() {
    if (!state.dialogue.active) return false;
    if (lines.length > 1) { lines.shift(); state.dialogue.line = lines[0]; age = 0; }
    else { lines = []; state.dialogue.active = false; }
    return true;
  }
  return {
    say(contact, text) {
      lines = [...text]; age = 0;
      Object.assign(state.dialogue, { active: true, speaker: `${contact.name} / ${contact.faction}`, initials: contact.name.split(' ').map(n => n[0]).join(''), color: contact.color, line: lines[0] });
    }, advance,
    update(dt) { if (state.dialogue.active && !game.staged) { age += dt; if (age > 5) advance(); } },
  };
})();
game.impact = (power, damageVehicle = true) => {
  if (game.staged) return;
  const car = player.vehicle, p = player.state;
  if (car && damageVehicle) car.condition = Math.max(0, car.condition - power * 0.12 * (p.upgrades.armour ? 0.45 : 1));
  let damage = Math.max(0, power - 18) * 0.16;
  const absorbed = Math.min(p.armour, damage); p.armour -= absorbed; damage -= absorbed; p.health = Math.max(0, p.health - damage);
  game.cargo.collision(power); game.effects.burst(player.position); game.police.crime(1, 'HARD COLLISION');
  if (p.health <= 0) game.police.bust();
};
missionDirector.bind(game);
game.registerSystem({ reset() { game.police.reset(); } });
game.services.load();
player.findInteraction(crowd.contacts, vehicles);
hud.update(state);
showScreen('title');
if (game.shot) game.shots = stageShot(game, game.shot);
requestAnimationFrame(frame);
