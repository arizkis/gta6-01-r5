// Repeatable scene arrangements use the same actors, jobs and HUD as free play.
import { syncVehicleBlocker } from './vehicles.js';
import { SERVICES } from './config.js';
import { streetRoute } from './navigation.js';

export function stageShot(game) {
  const { shot, player, state, city, camera, missionDirector: director, police, freezerVan: van, crowd, traffic } = game;
  if (!['cover', 'market', 'garage', 'causeway'].includes(shot)) return null;
  game.staged = true; window.__shotReady = false;
  game.showScreen('play');
  police.reset();
  player.state.cash = 1250; player.state.respect = { FIXER: 45, MECHANIC: 70, FENCE: 30 };
  player.state.armour = 62; player.state.health = 84; player.state.weapon = 2;
  player.lastVehicle = van;
  let frames = 0;
  function place(car, x, z, heading) { car.position.set(x, 1.4, z); car.heading = heading; car.mesh.rotation.y = heading; syncVehicleBlocker(car); }
  function view(x, y, z, tx, ty, tz, fov = 55) { camera.position.set(x, y, z); camera.lookAt(tx, ty, tz); camera.fov = fov; camera.updateProjectionMatrix(); }
  function unit(x, z, heading, tactic) { const u = police.spawn({ x, z, tactic }); place(u, x, z, heading); u.stagedTactic = tactic; return u; }
  if (shot === 'cover') {
    city.setTimeOfDay('golden'); state.clockMinutes = 1060;
    director.accept(director.definitions[0], true); director.setStage(2);
    place(van, 1968, 1595, 2.12); van.condition = 31; van.door.visible = true; van.door.rotation.y = -1.25;
    player.position.set(1988, 1.5, 1612); player.heading = -0.45; player.mesh.rotation.y = player.heading;
    game.cargo.start(280, van); state.cooler.temperature = 5.8; state.cooler.integrity = 87;
    state.wanted.level = 4; state.wanted.heat = 88;
    unit(1935, 1638, 2.05, 'PURSUIT'); unit(2033, 1577, 1.25, 'ROADBLOCK'); unit(2053, 1653, -2.5, 'RAMMING');
    traffic.cars.slice(0, 2).forEach((c, i) => { place(c, 1915 - i * 38, 1570, 1.57); c.speed = 0; });
    crowd.people.slice(0, 6).forEach((p, i) => { p.position.set(1955 + i * 16, 1.5, 1663 + i % 2 * 10); p.mesh.rotation.y = i * 0.9; p.state.panic = 100; p.mesh.scale.y = i === 3 ? 0.55 : 1; p.legs[0].rotation.x = 0.7; p.legs[1].rotation.x = -0.7; });
    game.dialogue.say(crowd.contacts[0], ['Juno, keep the lid shut. I’m waiting by the pier.']);
    view(2092, 76, 1750, 1985, 20, 1613, 54);
  }
  if (shot === 'market') {
    city.setTimeOfDay('midday'); state.clockMinutes = 745;
    director.accept(director.definitions[1], true); director.setStage(1);
    player.position.set(1382, 1.5, 611); player.heading = 2.5; player.mesh.rotation.y = player.heading;
    place(van, 1482, 675, 1.57);
    game.dialogue.say(crowd.contacts[1], ['These peaches crossed half the bay. Let’s make the last mile kind.']);
    view(1484, 78, 710, 1367, 14, 572, 55);
  }
  if (shot === 'garage') {
    city.setTimeOfDay('golden'); state.clockMinutes = 1090;
    director.accept(director.definitions[3], true); director.setStage(1);
    city.setTimeOfDay('golden');
    state.mission.completed = director.definitions.slice(0, 3).map(j => j.id);
    player.state.bestTime = 137.4;
    player.position.set(1734, 1.5, 1472); player.heading = 0.3; player.mesh.rotation.y = 0.3;
    const car = game.vehicles.find(v => v.id === 'juno-solace');
    place(car, 1709, 1474, 0.7); car.condition = 37; player.lastVehicle = car;
    view(1620, 66, 1586, 1815, 18, 1465, 58);
    game.services.open(SERVICES.find(s => s.id === 'garage'));
  }
  if (shot === 'causeway') {
    city.setTimeOfDay('dusk'); state.clockMinutes = 1160;
    director.accept(director.definitions[3], true); director.setStage(2);
    place(van, 1970, 2040, -Math.PI / 2); van.condition = 67; van.speed = 92; van.occupied = true;
    player.vehicle = van; player.mesh.visible = false; player.position.copy(van.position); player.heading = van.heading;
    game.cargo.start(380, van); state.cooler.temperature = 3.2; state.cooler.integrity = 94;
    state.wanted.level = 5; state.wanted.heat = 100;
    unit(1970, 2015, -1.57, 'BOXING IN'); unit(1970, 2065, -1.57, 'BOXING IN'); unit(1918, 2040, -1.4, 'ROADBLOCK'); unit(2023, 2040, -1.57, 'RAMMING');
    game.dialogue.say(crowd.contacts[0], ['Causeway’s narrow. Find daylight between the bumpers.']);
    for (let i = 0; i < 9; i++) game.effects.skid({ ...van, position: { x: 1980 + i * 8, z: 2040 + Math.sin(i) * 2 }, heading: -1.57 });
    view(2100, 80, 2170, 1950, 15, 2040, 57);
  }
  state.navigation.route = streetRoute(player.position, state.navigation.target);
  director.marker.position.set(state.navigation.target.x, 2, state.navigation.target.z);
  game.cargo.update(0.016); police.update(0.016); game.hud.update(state);
  return {
    afterRender() {
      game.hud.update(state);
      police.units.forEach(u => { if (u.stagedTactic) u.tactic = u.stagedTactic; });
      frames++;
      const required = ['hud', 'mission-name', 'dispatch', 'police-units', 'weapon-options', 'health', 'armour', 'respect-meters', 'minimap', 'vehicle-panel', 'radio-station'];
      if (state.cooler.active) required.push('cooler-panel');
      if (state.dialogue.active) required.push('dialogue');
      if (shot === 'garage') required.push('service-menu', 'progression-summary');
      window.__shotReady = frames >= 2 && required.every(id => { const e = document.getElementById(id); return e && e.getClientRects().length > 0; });
    },
  };
}
