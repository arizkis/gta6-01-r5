// Deterministic state checks complement the required real-browser play session.
import assert from 'node:assert/strict';
import * as THREE from '../game/vendor/three.min.js';
import { buildCity } from '../game/src/city.js';
import { createPlayer } from '../game/src/player.js';
import { createParkedVehicles } from '../game/src/vehicles.js';
import { createPedestrians } from '../game/src/pedestrians.js';
import { createMissionDirector } from '../game/src/mission-director.js';
import { createPolice } from '../game/src/police-tactics.js';
import { createCoolerCargo } from '../game/src/cooler-cargo.js';
import { createEffects } from '../game/src/effects.js';
import { createServices } from '../game/src/garage-upgrades.js';
import { createWeapons } from '../game/src/weapons.js';
import { driveVehicle } from '../game/src/driving.js';
import { stageShot } from '../game/src/shots.js';

const elements = new Map(), saves = new Map();
function element() {
  return { hidden: true, style: {}, dataset: {}, children: [], className: '', textContent: '',
    append(...nodes) { this.children.push(...nodes); }, replaceChildren() { this.children = []; }, addEventListener() {},
    getBoundingClientRect() { return { left: 0, top: 0, right: 1280, bottom: 960, width: 1280, height: 960 }; },
    getContext() { return new Proxy({}, { get: (_, key) => key === 'measureText' ? () => ({ width: 20 }) : () => {} }); },
  };
}
globalThis.document = { createElement: element, getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); } };
globalThis.localStorage = { setItem: (k, v) => saves.set(k, v), getItem: k => saves.get(k) ?? null };
const scene = new THREE.Scene(), city = buildCity(scene, 17), parked = createParkedVehicles(scene, city, 17);
const crowd = createPedestrians(scene, city, 17), player = createPlayer(scene, city), notifications = [];
const director = createMissionDirector(element());
const state = { screen: 'play', elapsed: 0, player, mission: director.state, wanted: { level: 0 }, cooler: { active: false }, navigation: {}, dialogue: {} };
const game = { scene, city, crowd, player, state, vehicles: [...parked.vehicles], freezerVan: parked.freezerVan, missionDirector: director, keys: new Set(),
  hud: { notify: text => notifications.push(text) }, dialogue: {
    say(c, lines) { state.dialogue = { speaker: c.name, lines: [...lines], line: lines[0], active: true }; },
    advance() { state.dialogue.lines.shift(); state.dialogue.line = state.dialogue.lines[0]; },
  },
  showScreen(name) { state.screen = name; }, chase: { reset() {} }, impact() {},
};
game.vehicles.forEach(v => { v.start = { position: v.position.clone(), heading: v.heading }; });
game.effects = createEffects(scene, 17); game.cargo = createCoolerCargo(game); game.police = createPolice(game);
game.services = createServices(game); game.weapons = createWeapons(game); director.bind(game);
function at(point) { player.position.set(point.x, 1.5, point.z); }
function tick(seconds, systems = [game.police]) {
  for (let i = 0; i < seconds * 60; i++) { state.elapsed += 1 / 60; systems.forEach(s => s.update(1 / 60)); }
}

assert.equal(director.accept(director.definitions[1]), false, 'later jobs must remain locked');
assert.equal(director.accept(director.definitions[0]), true);
director.talk(crowd.contacts[0]); assert.equal(state.mission.stage, 1);
player.vehicle = parked.freezerVan; player.lastVehicle = player.vehicle; player.vehicle.occupied = true; at(player.vehicle.position);
director.update(1 / 60); assert.equal(state.mission.stage, 2); assert.equal(state.wanted.level, 2); assert.equal(state.cooler.active, true);
player.vehicle = null; player.mesh.visible = true; game.cargo.update(1 / 60);
assert.equal(player.carrying, true); assert.equal(game.cargo.prop.visible, true);
const originalPay = state.cooler.payout; game.cargo.collision(60); game.cargo.update(0);
assert.ok(state.cooler.payout < originalPay, 'impact must reduce the offered payout');
const reducedPay = state.cooler.payout;
// A distant hiding place leaves the patrols pursuing their last sighting.
tick(0.1);
at({ x: 410, z: 650 }); tick(25);
assert.equal(state.wanted.level, 0, 'unseen heat and stars must drain');
director.update(0.01); assert.equal(state.mission.stage, 3);
at(director.targets[3].point); director.update(0.01);
assert.equal(state.mission.completed.length, 1); assert.equal(player.state.cash, 140 + reducedPay);
assert.equal(player.state.respect.MECHANIC, 45);

for (let index = 1; index < 6; index++) {
  game.police.reset(); player.vehicle = null;
  assert.equal(director.accept(director.definitions[index]), true);
  director.talk(crowd.contacts.find(c => c.id === director.definitions[index].contactId));
  assert.equal(state.mission.stage, 1);
  let guard = 0;
  while (state.mission.active && guard++ < 10) {
    at(director.targets[state.mission.stage].point); director.update(1); game.cargo.update(1 / 60);
    if (index === 2 && state.mission.stage === 2 && state.mission.active) {
      assert.equal(city.swimAllowed, true, 'the return leg must allow swimming back to shore');
      city.move(player.position, -70, 0, player.radius); assert.ok(player.position.x < 2720);
    }
  }
  assert.equal(state.mission.active, false, `job ${index + 1} should reach its hand-in`);
}
assert.equal(state.mission.completed.length, 6); assert.ok(player.state.bestTime > 0);
director.renderBoard(); assert.ok(player.state.respect.FIXER > 0 && player.state.respect.FENCE > 0);

player.state.cash = 1000;
at({ x: 480, z: 674 }); player.lastVehicle = game.vehicles[0]; game.vehicles[0].condition = 37;
for (const upgrade of ['armour', 'insulation', 'spikes']) assert.equal(game.services.purchase(upgrade), true);
assert.equal(game.services.purchase('repair'), true); assert.equal(game.vehicles[0].condition, 100);
assert.equal(player.state.spikeCharges, 3);
// Closing the workshop must leave its nearby car available to enter and exit.
game.vehicles[0].position.set(1780, 1.4, 1470); at({ x: 1755, z: 1470 });
player.findInteraction(crowd.contacts, game.vehicles);
assert.equal(player.interaction.type, 'enter'); assert.equal(game.services.interact(), false);
assert.equal(player.interact(), true);
player.findInteraction(crowd.contacts, game.vehicles);
assert.equal(game.services.interact(), false); assert.equal(player.interact(), true);
player.vehicle = game.vehicles[0]; player.position.copy(player.vehicle.position);
assert.equal(game.police.dropStrip(), true); assert.equal(player.state.spikeCharges, 2);
const strip = game.police.strips[0]; state.wanted.level = 2;
const unit = game.police.spawn({ x: strip.position.x, z: strip.position.z });
game.police.update(1 / 60); assert.ok(unit.slowed > 5.9);
game.police.reset();

player.vehicle = null; player.state.health = 25;
assert.equal(game.services.purchase('food'), true); assert.equal(player.state.health, 100);
assert.equal(game.services.purchase('vest'), true); assert.equal(player.state.armour, 100);
assert.equal(game.services.purchase('shirt:#75c9ba'), true);
game.services.save(false); const savedCash = player.state.cash;
player.state.cash = 0; player.state.respect.FIXER = 0; game.services.paint('#ef946f');
assert.equal(game.services.load(), true); assert.equal(player.state.cash, savedCash); assert.equal(player.state.shirt, '#75c9ba');
assert.equal(state.mission.completed.length, 6); assert.ok(player.state.respect.FIXER > 0);

player.state.weapon = 2; player.state.tank = 100; game.weapons.use(); assert.equal(player.state.tank, 98);
at(game.weapons.taps[0]); game.weapons.update(1); assert.equal(player.state.tank, 100);
crowd.people[0].position.copy(player.position); crowd.scare(player.position); crowd.update(0.1); assert.ok(crowd.people[0].state.panic > 0);

// Arrest must restore the apartment position and make the next van attempt possible.
game.police.crime(3, 'CHECK', true); at({ x: 1100, z: 1160 });
game.police.spawn({ x: 1110, z: 1160 }); tick(4.2);
assert.equal(state.wanted.level, 0); assert.equal(player.position.x, 430); assert.equal(document.getElementById('busted').hidden, false);
assert.ok(parked.freezerVan.position.equals(parked.freezerVan.start.position));

// Weight changes acceleration; a ruined steering rack reduces a turn at equal speed.
const vehicle = game.vehicles[0]; vehicle.position.set(700, 1.5, 720); vehicle.condition = 100; vehicle.speed = 0;
vehicle.upgrades = {}; driveVehicle(vehicle, 0.1, new Set(['KeyW']), city); const normalAcceleration = vehicle.speed;
vehicle.speed = 0; vehicle.upgrades.armour = true; driveVehicle(vehicle, 0.1, new Set(['KeyW']), city);
assert.ok(vehicle.speed < normalAcceleration);
globalThis.window = {};
globalThis.innerWidth = 1280; globalThis.innerHeight = 960;
game.camera = new THREE.PerspectiveCamera(58, 1280 / 720, 0.5, 6500);
game.traffic = { cars: game.vehicles.slice(2, 4) }; game.hud.update = () => {};
for (const [shot, light] of [['cover', 'golden'], ['market', 'midday'], ['garage', 'golden'], ['causeway', 'dusk']]) {
  game.shot = shot; player.vehicle = null; player.mesh.visible = true;
  const staging = stageShot(game);
  assert.ok(staging); assert.equal(city.timeOfDay, light); assert.equal(window.__shotReady, false);
  if (shot === 'cover') { assert.equal(player.carrying, true); assert.ok(game.cargo.prop.visible); assert.equal(state.wanted.level, 4); }
  if (shot === 'garage') assert.equal(game.services.active.id, 'garage');
  if (shot === 'causeway') { assert.equal(state.wanted.level, 5); assert.equal(game.police.units.length, 4); assert.ok(player.vehicle.speed > 80); }
  if (shot === 'market') {
    assert.equal(state.dialogue.line, 'Keep the crates level, Juno. Bruised peaches start arguments.');
    assert.ok(state.navigation.target.equals(crowd.contacts[1].position));
  }
  const poses = game.police.units.map(u => [u.position.clone(), u.heading]);
  let ticks = 0;
  for (let frame = 0; frame < 16; frame++) {
    for (let batch = 0; batch < 6 && staging.advance(); batch++) {
      ticks++; state.elapsed += 1 / 60;
      game.police.update(1 / 60); game.cargo.update(1 / 60); game.effects.update(1 / 60);
    }
    staging.afterRender();
  }
  assert.equal(ticks, 90); assert.equal(staging.advance(), false);
  assert.equal(window.__shotFrame, 90); assert.equal(window.__shotReady, true);
  game.police.units.forEach((u, i) => {
    assert.ok(u.position.equals(poses[i][0])); assert.equal(u.heading, poses[i][1]);
    assert.equal(u.mesh.rotation.y, u.heading, 'map cones and photographed patrols must face the same way');
  });
}
console.log('PASS: six job state paths, scaled pay, carrying, sight decay, upgrades, strip hit, repair, shops, saves, water refill, panic, arrest, weight, job dialogue and four staging drivers that settle after exactly 90 ticks. Browser rendering remains a separate check.');
