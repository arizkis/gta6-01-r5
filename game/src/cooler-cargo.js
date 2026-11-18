// Cargo remains owned by the job when Juno changes vehicles or carries it on foot.
import * as THREE from '../vendor/three.min.js';
import { box } from './city.js';

export function createCoolerCargo(game) {
  const { scene, state, player, city, effects } = game;
  const prop = new THREE.Group();
  box(prop, 0, 0, 0, 8, 5, 5, '#b8e4e0');
  box(prop, 0, 2.8, 0, 9, 1, 6, '#eff6de');
  box(prop, 0, 0, 2.7, 3, 2, 0.6, '#367f8a');
  scene.add(prop);
  const lantern = new THREE.Group();
  box(lantern, 0, 0, 0, 5, 8, 5, '#ffb75f');
  box(lantern, 0, 4.5, 0, 6, 1, 6, '#e2737c');
  lantern.add(new THREE.PointLight('#ffbd68', 70, 45, 1));
  scene.add(lantern);
  const crates = new THREE.Group();
  box(crates, 0, 0, 0, 9, 6, 6, '#b78454');
  for (let i = -3; i <= 3; i += 3) box(crates, i, 3.5, 0, 2, 2, 4, '#e9b859');
  scene.add(crates);
  let mistAge = 0;
  function start(basePay, carrier) {
    Object.assign(state.cooler, { active: true, temperature: 2, integrity: 100, payout: basePay, basePay, carrier: carrier ?? null });
  }
  function collision(power) {
    const c = state.cooler;
    if (!c.active) return;
    c.integrity = Math.max(5, c.integrity - power * 0.12);
    c.temperature = Math.min(25, c.temperature + power * 0.016);
  }
  function update(dt) {
    const c = state.cooler, active = c.active || state.mission.lanterns || state.mission.crates;
    player.carrying = active && !player.vehicle;
    prop.visible = c.active && player.carrying;
    lantern.visible = !!state.mission.lanterns;
    crates.visible = !!state.mission.crates;
    const car = player.vehicle;
    if (active && car) c.carrier = car;
    const p = player.position, h = player.heading;
    prop.position.set(p.x + Math.sin(h) * 5, 8, p.z + Math.cos(h) * 5);
    prop.rotation.y = h;
    lantern.position.set(p.x + Math.cos(h) * 5, car ? 21 : 8, p.z - Math.sin(h) * 5);
    crates.position.set(p.x + Math.sin(h) * 5, car ? 22 : 8, p.z + Math.cos(h) * 5); crates.rotation.y = h;
    if (player.carrying) player.arms.forEach(arm => { arm.rotation.x = -1.2; });
    if (!c.active) return;
    const cool = city.isShaded(p.x, p.z) || city.timeOfDay === 'night' || city.timeOfDay === 'dusk';
    c.temperature = THREE.MathUtils.clamp(c.temperature + dt * (cool ? -0.06 : 0.022 / (player.state.upgrades.insulation ? 3 : 1)), -2, 25);
    if (c.temperature > 8) c.integrity = Math.max(5, c.integrity - dt * (c.temperature - 8) * 0.025);
    c.payout = Math.round(c.basePay * c.integrity / 100);
    mistAge += dt;
    if (mistAge > 0.08 && (player.carrying || Math.abs(car?.speed ?? 0) > 2)) {
      mistAge = 0;
      effects.puff(car ? { x: p.x - Math.sin(h) * 19, y: 8, z: p.z - Math.cos(h) * 19 } : prop.position, '#b4eff5', 1.5, 1.6);
    }
  }
  return { start, collision, update, prop, lantern, crates };
}
