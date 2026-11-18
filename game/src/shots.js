// Each route settles on simulation frame 90 using the real city, actors and HUD.
import * as THREE from '../vendor/three.min.js';
import { syncVehicleBlocker } from './vehicles.js';
import { SERVICES, PALETTE } from './config.js';
import { box, label, material } from './city.js';
import { createRandom } from './random.js';
import { streetRoute } from './navigation.js';

export function stageShot(game) {
  const { shot, player, state, city, camera, missionDirector: director, police, freezerVan: van, crowd, traffic } = game;
  if (!['cover', 'market', 'garage', 'causeway'].includes(shot)) return null;
  game.staged = true; window.__shotReady = false; window.__shotFrame = 0;
  game.stagedAir = { x: 18, z: 5, height: 48 };
  state.elapsed = 0;
  player.vehicle = null; player.mesh.visible = true;
  player.state.upgrades = {}; player.state.spikeCharges = 0;
  game.showScreen('play');
  police.reset();
  player.state.cash = 1250; player.state.respect = { FIXER: 45, MECHANIC: 70, FENCE: 30 };
  player.state.armour = 62; player.state.health = 84; player.state.weapon = 2;
  player.lastVehicle = van;
  let frames = 0, ticks = 0;
  const rng = createRandom((state.seed ?? 17) + shot.length * 79);
  const set = new THREE.Group(); set.name = `Street dressing / ${shot}`; game.scene.add(set);
  function place(car, x, z, heading) { car.position.set(x, 1.4, z); car.heading = heading; car.mesh.rotation.y = heading; syncVehicleBlocker(car); }
  function view(x, y, z, tx, ty, tz, fov = 66) { camera.position.set(x, y, z); camera.lookAt(tx, ty, tz); camera.fov = fov; camera.updateProjectionMatrix(); }
  function unit(x, z, heading, tactic) {
    const u = police.spawn({ x, z, tactic }); place(u, x, z, heading); u.stagedTactic = tactic;
    u.mesh.children.filter(child => child.isSprite).forEach(sign => { sign.visible = false; });
    return u;
  }
  function driving(car, speed) {
    car.speed = speed / 1.8; car.occupied = true; player.vehicle = car; player.lastVehicle = car;
    player.mesh.visible = false; player.position.copy(car.position); player.heading = car.heading;
    // A seated Juno remains visible through the cab without changing the vehicle controls.
    const driver = player.mesh.clone(); driver.visible = true; driver.scale.setScalar(0.56);
    driver.position.set(-3, 5, 5); driver.rotation.y = 0; car.mesh.add(driver);
  }
  function pedestrian(index, x, z, panic = false) {
    const p = crowd.people[index]; p.position.set(x, 1.5, z); p.mesh.rotation.y = rng.range(-2, 2);
    p.legs[0].rotation.x = 0.55; p.legs[1].rotation.x = -0.55;
    p.arms[0].rotation.x = -0.6; p.arms[1].rotation.x = 0.6; p.state.panic = panic ? 100 : 0;
  }
  function crate(x, z, size = 8) {
    box(set, x, size / 2 + 1.5, z, size, size, size, '#a76037');
    for (const y of [3, size - 1]) box(set, x, y + 1.5, z, size + 0.3, 0.7, size + 0.3, '#e7b475');
    for (let i = 0; i < 5; i++) box(set, x + rng.range(-size * 0.35, size * 0.35), size + 2.5, z + rng.range(-size * 0.35, size * 0.35), 2, 2, 2, i % 2 ? '#ffc149' : '#f46c40');
  }
  function palm(x, z, height = 48) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 2, height, 6), material('#9c634b'));
    trunk.position.set(x, height / 2, z); trunk.castShadow = true; set.add(trunk);
    for (let i = 0; i < 7; i++) {
      const angle = i * Math.PI * 2 / 7;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(5, 25, 3), material(i % 2 ? '#167b69' : '#2c9a79'));
      leaf.position.set(x + Math.sin(angle) * 8, height, z + Math.cos(angle) * 8);
      leaf.rotation.set(Math.cos(angle) * 1.3, angle, -Math.sin(angle) * 1.3); leaf.castShadow = true; set.add(leaf);
    }
  }
  function neon(text, x, y, z, color, width = 40) {
    return label(set, text, x, y, z, width, color);
  }
  function parked(x, z, heading, index) {
    const car = traffic.cars[index % traffic.cars.length]; place(car, x, z, heading); car.speed = 0;
  }
  function trails(car, count = 22) {
    for (let i = 0; i < count; i++) {
      const behind = 10 + i * 3.8, drift = Math.sin(i * 0.15) * 4;
      const point = { x: car.position.x - Math.sin(car.heading) * behind + Math.cos(car.heading) * drift, z: car.position.z - Math.cos(car.heading) * behind - Math.sin(car.heading) * drift };
      game.effects.skid({ position: point, heading: car.heading + Math.sin(i * 0.1) * 0.08 });
      if (i % 3 === 0) {
        game.effects.puff({ ...point, y: 3 }, '#d6ab93', 2 + i * 0.12, 4, { x: 2, y: 0.8, z: -1 });
        game.effects.puff({ ...point, y: 10 }, '#8de4f5', 2, 4, { x: 0, y: 1, z: 0 });
      }
    }
  }
  if (shot === 'cover') {
    city.setTimeOfDay('golden'); state.clockMinutes = 1060;
    director.accept(director.definitions[0], true); director.setStage(2);
    place(van, 2440, 1620, -0.08); van.condition = 76; van.door.visible = false;
    driving(van, 138); game.stagedAir = { x: -16, z: 73, height: 58 };
    game.cargo.start(280, van); state.cooler.temperature = 5.8; state.cooler.integrity = 87;
    state.wanted.level = 4; state.wanted.heat = 88;
    unit(2414, 1636, 0.05, 'RAMMING'); unit(2426, 1598, 0.14, 'PURSUIT'); unit(2443, 1740, 1.4, 'ROADBLOCK');
    for (let i = 0; i < 6; i++) {
      parked(2440 + (i % 2 ? 47 : -47), 1655 + i * 35, i % 2 ? Math.PI : 0, i);
      pedestrian(i, 2440 + (i % 2 ? 58 : -58), 1640 + i * 17, true);
      crate(2440 + (i % 2 ? 61 : -61), 1690 + i * 24, 7);
    }
    for (let i = 0; i < 9; i++) for (const side of [-1, 1]) palm(2440 + side * 62, 1595 + i * 48, 43 + i % 3 * 5);
    neon('STRAND / 86', 2382, 30, 1680, PALETTE.pink, 42);
    neon('COLD DRINKS', 2500, 23, 1705, PALETTE.teal, 42);
    neon('SUNSPUR MOTEL', 2380, 44, 1810, PALETTE.orange, 65);
    trails(van);
    game.dialogue.say(crowd.contacts[0], ['Meet me at Tin Cup Pier. The shade is free; the favor pays.']);
    view(2468, 22, 1566, 2433, 24, 1680);
  }
  if (shot === 'market') {
    city.setTimeOfDay('midday'); state.clockMinutes = 745;
    state.mission.completed = [director.definitions[0].id];
    director.accept(director.definitions[1], true);
    director.talk(crowd.contacts[1]);
    game.dialogue.advance();
    player.position.set(1378, 1.5, 615); player.heading = -0.6; player.mesh.rotation.y = player.heading;
    place(van, 1482, 675, 1.57);
    crowd.contacts[1].position.set(1390, 1.5, 609); crowd.contacts[1].mesh.rotation.y = 2.5;
    crowd.contacts[1].mesh.children.filter(child => child.isSprite).forEach(sign => { sign.visible = false; });
    director.marker.scale.setScalar(0.55);
    state.navigation.target = crowd.contacts[1].position;
    for (const x of [1348, 1413]) for (const z of [554, 590, 626]) {
      box(set, x, 7, z, 24, 11, 15, PALETTE.teal);
      for (const side of [-1, 1]) box(set, x + side * 14, 13, z, 1, 25, 1, '#6f4939');
      for (let i = 0; i < 8; i++) box(set, x - 14 + i * 4, 26, z, 4, 1.5, 25, i % 2 ? '#ffe2a6' : PALETTE.orange);
      label(set, x < 1380 ? 'CITRUS / 3 FOR $2' : 'MARIGOLD / FRESH', x, 20, z + 8, 28);
      crate(x - 7, z + 13, 7); crate(x + 9, z - 11, 7);
    }
    for (let i = 0; i < 10; i++) pedestrian(i, 1365 + i % 3 * 13, 575 + Math.floor(i / 3) * 14);
    parked(1444, 603, 0, 0); parked(1321, 588, 0, 1);
    view(1357, 17, 649, 1380, 13, 602, 64);
  }
  if (shot === 'garage') {
    city.setTimeOfDay('golden'); state.clockMinutes = 1090;
    director.accept(director.definitions[3], true); director.setStage(1);
    city.setTimeOfDay('golden');
    state.mission.completed = director.definitions.slice(0, 3).map(j => j.id);
    player.state.bestTime = 137.4;
    player.position.set(1739, 1.5, 1470); player.heading = 0.3; player.mesh.rotation.y = 0.3;
    const car = game.vehicles.find(v => v.id === 'juno-solace');
    place(car, 1753, 1458, 0.4); car.condition = 42; player.lastVehicle = car;
    city.root.children.filter(child => child.isSprite && child.name === "TAVI'S WORKSHOP").forEach(sign => { sign.visible = false; });
    crowd.contacts[0].position.set(1763, 1.5, 1451);
    crowd.contacts[0].mesh.children.filter(child => child.isSprite).forEach(sign => { sign.visible = false; });
    box(set, 1780, 17, 1446, 84, 32, 1, '#142c39');
    box(set, 1780, 33, 1448, 85, 3, 5, '#e58b43');
    const workLight = new THREE.PointLight('#ffc078', 1800, 140, 2);
    workLight.position.set(1755, 26, 1482); set.add(workLight);
    for (const x of [1741, 1816]) {
      box(set, x, 15, 1454, 3, 28, 3, '#ee8551'); box(set, x, 10, 1460, 12, 2, 3, '#d1a76c');
      box(set, x, 12, 1449, 18, 14, 1, '#24565e');
      for (let i = 0; i < 6; i++) box(set, x - 6 + i * 2.4, 14, 1450, 0.6, 6 - i % 3, 1, '#c4d4c1');
    }
    for (let i = 0; i < 5; i++) {
      const tire = new THREE.Mesh(new THREE.TorusGeometry(3.2, 1.2, 5, 12), material('#243341'));
      tire.rotation.x = Math.PI / 2;
      tire.position.set(1734, 3 + i * 2.5, 1456); tire.castShadow = true; set.add(tire);
      crate(1823 + i % 2 * 9, 1459 + Math.floor(i / 2) * 9, 7);
    }
    neon("TAVI'S WORKSHOP", 1748, 35, 1465, '#ffac4f', 49);
    parked(1712, 1436, 0.4, 0); parked(1835, 1482, -0.3, 1);
    for (let i = 0; i < 4; i++) pedestrian(i, 1707 + i * 38, 1454 + i % 2 * 7);
    view(1723, 20, 1510, 1808, 20, 1445, 66);
    game.services.open(SERVICES.find(s => s.id === 'garage'));
  }
  if (shot === 'causeway') {
    game.stagedAir = { x: -95, z: -12, height: 64 };
    city.setTimeOfDay('dusk'); state.clockMinutes = 1160;
    director.accept(director.definitions[3], true); director.setStage(2);
    const car = game.vehicles.find(v => v.id === 'juno-solace');
    place(car, 1970, 2040, -1.38); car.condition = 67; driving(car, 160);
    game.cargo.start(380, car); state.cooler.temperature = 3.2; state.cooler.integrity = 94;
    state.wanted.level = 5; state.wanted.heat = 100;
    unit(1966, 2015, -1.57, 'BOXING IN'); unit(1964, 2064, -1.57, 'BOXING IN'); unit(1918, 2040, -1.4, 'BRAKING'); unit(2010, 2025, -1.57, 'BOXING IN');
    game.dialogue.say(crowd.contacts[0], ['Causeway’s narrow. Find daylight between the bumpers.']);
    trails(car, 28);
    for (let i = 0; i < 6; i++) {
      parked(1880 - i * 43, i % 2 ? 2084 : 1997, -1.57, i);
      pedestrian(i, 1890 - i * 29, i % 2 ? 2092 : 1989, true);
      box(set, 1900 - i * 32, 3.5, 2088, 12, 4, 3, i % 2 ? PALETTE.orange : PALETTE.cream);
    }
    neon('SUNSPUR / COAST ROAD', 1800, 32, 2014, PALETTE.pink, 80);
    view(2027, 20, 2065, 1924, 20, 2026, 68);
  }
  state.navigation.route = streetRoute(player.position, state.navigation.target);
  director.marker.position.set(state.navigation.target.x, 2, state.navigation.target.z);
  game.cargo.update(0); police.update(0); game.hud.update(state);
  return {
    advance() {
      if (ticks >= 90) return false;
      ticks++;
      return true;
    },
    afterRender() {
      game.hud.update(state);
      document.getElementById('notice').hidden = true;
      police.units.forEach(u => { if (u.stagedTactic) u.tactic = u.stagedTactic; });
      frames++; window.__shotFrame = ticks;
      const required = ['hud', 'mission-name', 'mission-next', 'stage-pips', 'wanted-stars', 'cash', 'clock', 'dispatch', 'police-units', 'weapon-options', 'health', 'armour', 'respect-meters', 'minimap', 'vehicle-panel', 'radio-station'];
      if (state.cooler.active) required.push('cooler-panel');
      if (state.dialogue.active) required.push('dialogue');
      if (shot === 'garage') required.push('service-menu', 'progression-summary');
      window.__shotReady = frames >= 2 && ticks === 90 && required.every(id => {
        const e = document.getElementById(id), r = e?.getBoundingClientRect();
        return r && r.width > 0 && r.height > 0 && r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight;
      });
    },
  };
}
