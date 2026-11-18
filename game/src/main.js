// Sunspur foundation: a 3D city, parked cars, traffic, pedestrians, walking,
// driving, a chase camera, contact prompts, HUD instruments and a six-job board.
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

const params = new URLSearchParams(location.search);
const requestedSeed = Number.parseInt(params.get('seed') ?? '17', 10);
const seed = Number.isFinite(requestedSeed) ? requestedSeed : 17;
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game'), antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
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
  missionDirector.state.requestedJobId = job.id;
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
  player.reset();
  vehicles.forEach(car => {
    car.position.copy(car.start.position); car.heading = car.start.heading;
    car.mesh.rotation.y = car.heading; car.speed = 0; car.condition = 100;
    car.occupied = false; car.traffic = car.start.traffic; car.routeIndex = car.start.routeIndex;
    car.collisionCooldown = 0;
    syncVehicleBlocker(car);
  });
  crowd.people.forEach(ped => {
    ped.position.copy(ped.start.position); ped.index = ped.start.index;
    ped.state.mode = 'stroll'; ped.state.panic = 0; ped.state.target = null;
  });
  Object.assign(state.mission, { active: false, jobId: null, requestedJobId: null, name: '', objective: '', stage: 0, next: '', completed: [] });
  Object.assign(state.wanted, { level: 0, dispatch: '', units: [], search: null });
  Object.assign(state.cooler, { active: false, temperature: 2, integrity: 100, payout: 0 });
  Object.assign(state.navigation, { target: null, route: [], search: null });
  state.dialogue.active = false; state.radio.station = '';
  state.clockMinutes = 1030; state.elapsed = 0;
  city.setTimeOfDay('golden'); chase.reset();
  systems.forEach(system => system.reset?.(state));
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
    if (state.screen === 'board') closeBoard();
    else if (state.screen === 'play') showScreen('paused');
    else if (state.screen === 'paused') showScreen('play');
    return;
  }
  if (state.screen !== 'play') return;
  keys.add(event.code);
  if (event.code === 'KeyE') {
    player.findInteraction(crowd.contacts, vehicles);
    if (!player.interact(contact => {
      events.dispatchEvent(new CustomEvent('contact', { detail: contact }));
      hud.notify(`${contact.name} / ${contact.faction}`, 3);
    }) && player.vehicle) hud.notify('Slow down and leave a little room to step out.');
  }
  if (['Digit1', 'Digit2', 'Digit3'].includes(event.code)) player.state.weapon = Number(event.code.slice(-1)) - 1;
  events.dispatchEvent(new CustomEvent('key', { detail: event.code }));
});
window.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('blur', () => { keys.clear(); if (state.screen === 'play') showScreen('paused'); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state.screen === 'play') showScreen('paused'); });
window.addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
});
renderer.setSize(innerWidth, innerHeight);

function step(dt) {
  state.elapsed += dt;
  state.clockMinutes += dt * 2;
  if (player.vehicle) driveVehicle(player.vehicle, dt, keys, city);
  player.update(dt, keys, chase.state.yaw);
  traffic.update(dt, vehicles, player);
  crowd.update(dt);
  systems.forEach(system => system.update?.(dt, state));
  player.findInteraction(crowd.contacts, vehicles);
}

let last = performance.now(), accumulator = 0, hudAge = 0;
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (state.screen === 'play') {
    accumulator += dt;
    while (accumulator >= 1 / 60) { step(1 / 60); accumulator -= 1 / 60; }
    chase.update(player, dt);
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
  if (hudAge >= 0.08) { hud.update(state); hudAge = 0; }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// A shared integration surface for the next gameplay modules and browser inspection.
window.sunspur = {
  state, scene, renderer, camera, city, vehicles, traffic, crowd, player, chase,
  hud, missionDirector, events, keys, restartDay, showScreen,
  registerSystem(system) { systems.add(system); return () => systems.delete(system); },
};
player.findInteraction(crowd.contacts, vehicles);
hud.update(state);
showScreen('title');
requestAnimationFrame(frame);
