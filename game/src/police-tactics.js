// Street patrols, witnessed heat, sight-based searching, arrest and air support.
import * as THREE from '../vendor/three.min.js';
import { box, label } from './city.js';
import { createVehicle, MODELS, syncVehicleBlocker } from './vehicles.js';
import { STREETS, PLACES } from './config.js';
import { distance, streetRoute } from './navigation.js';

export function createPolice(game) {
  const { scene, city, state, player, vehicles, effects, hud } = game;
  const w = state.wanted, units = [], strips = [];
  Object.assign(w, { heat: 0, los: 'LOST', witness: 0, arrest: 0 });
  let cooldown = 0, decay = 0, serial = 0, bustedTime = 0, lastKnown = { x: 0, z: 0 };
  const helicopter = new THREE.Group();
  box(helicopter, 0, 0, 0, 13, 10, 24, '#eff0d7');
  box(helicopter, 0, 0, 10, 11, 7, 3, '#2e6673');
  box(helicopter, 0, 0, -20, 3, 3, 24, '#388d91');
  box(helicopter, 0, 5, -30, 3, 12, 8, '#388d91');
  const rotor = new THREE.Group();
  box(rotor, 0, 8, 0, 57, 0.7, 3, '#344d57');
  box(rotor, 0, 8, 0, 3, 0.7, 57, '#344d57');
  helicopter.add(rotor);
  for (const side of [-1, 1]) box(helicopter, side * 8, -8, 0, 2, 2, 29, '#344d57');
  scene.add(helicopter);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(32, 1, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#fff4bf', transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false }));
  const spot = new THREE.Mesh(new THREE.CircleGeometry(31, 40), new THREE.MeshBasicMaterial({ color: '#fff1b8', transparent: true, opacity: 0.25, depthWrite: false }));
  spot.rotation.x = -Math.PI / 2;
  const ring = new THREE.Mesh(new THREE.RingGeometry(30, 32, 40), new THREE.MeshBasicMaterial({ color: '#fff2c6', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  scene.add(beam, spot, ring);
  function clearRay(a, b) {
    const length = distance(a, b), steps = Math.ceil(length / 10);
    for (let i = 1; i < steps; i++) {
      const x = a.x + (b.x - a.x) * i / steps, z = a.z + (b.z - a.z) * i / steps;
      if (city.blockers.some(v => v.kind === 'building' && Math.abs(v.x - x) < v.halfX && Math.abs(v.z - z) < v.halfZ)) return false;
    }
    return true;
  }
  function crime(level = 1, reason = 'WITNESS REPORT', force = false) {
    if (cooldown > 0 && !force) return false;
    const witnessed = force || units.some(u => distance(u.position, player.position) < 260 && clearRay(u.position, player.position)) || game.crowd.people.some(p => distance(p.position, player.position) < 110 && clearRay(p.position, player.position));
    if (!witnessed) return false;
    w.level = Math.min(5, Math.max(w.level + (force ? 0 : 1), level));
    w.heat = 90; w.witness = 4; cooldown = 7;
    lastKnown = { x: player.position.x, z: player.position.z };
    hud.notify(`◉ WITNESS / ${reason}`, 3);
    return true;
  }
  function spawn(options = {}) {
    const p = player.position, i = units.length;
    const offsets = [[-180, 90], [160, -130], [60, 230], [-220, -80], [230, 110], [-60, -260]];
    let x = options.x ?? p.x + offsets[i % 6][0], z = options.z ?? p.z + offsets[i % 6][1];
    if (options.x === undefined) {
      const nearX = STREETS.x.reduce((a, b) => Math.abs(b - x) < Math.abs(a - x) ? b : a);
      const nearZ = STREETS.z.reduce((a, b) => Math.abs(b - z) < Math.abs(a - z) ? b : a);
      if (Math.abs(nearX - x) < Math.abs(nearZ - z)) x = nearX + (i % 2 ? 22 : -22);
      else z = nearZ + (i % 2 ? 22 : -22);
      x = THREE.MathUtils.clamp(x, 70, 2660); z = THREE.MathUtils.clamp(z, 70, 2130);
    }
    const car = createVehicle(scene, { id: `pd-${++serial}`, model: MODELS[0], color: '#eef0dc', x, z });
    car.police = true; car.callsign = `UNIT ${serial + 3}-${['ALPHA', 'BRAVO', 'DELTA', 'ECHO'][i % 4]}`;
    car.tactic = options.tactic ?? 'PURSUIT'; car.slowed = 0; car.age = 0; car.routeAge = 0; car.route = [];
    car.visionRange = 250; car.visionSpread = 0.85;
    for (const side of [-1, 1]) box(car.mesh, side * 6.1, 6, 0, 0.5, 3, 20, '#247f87');
    box(car.mesh, 0, 13, -1, 12, 1.6, 4, '#36545c');
    car.flash = [-1, 1].map(side => {
      const light = new THREE.Mesh(new THREE.BoxGeometry(5, 2.5, 4), new THREE.MeshBasicMaterial({ color: side < 0 ? '#ff5275' : '#69c8ff' }));
      light.position.set(side * 3, 15, -1); car.mesh.add(light); return light;
    });
    label(car.mesh, 'SUNSPUR PD', 0, 18, -8, 27, '#a0e5da');
    car.blocker = city.addBlocker(x, z, 12, 23, 'police', car);
    units.push(car); vehicles.push(car);
    return car;
  }
  function reset() {
    units.splice(0).forEach(u => {
      scene.remove(u.mesh); const i = vehicles.indexOf(u); if (i >= 0) vehicles.splice(i, 1);
      const b = city.blockers.indexOf(u.blocker); if (b >= 0) city.blockers.splice(b, 1);
    });
    strips.splice(0).forEach(s => scene.remove(s.mesh));
    Object.assign(w, { level: 0, heat: 0, units: [], search: null, arrest: 0, los: 'LOST', dispatch: 'ALL QUIET' });
    cooldown = 0; decay = 0; bustedTime = 0;
    document.getElementById('busted').hidden = true;
    helicopter.visible = beam.visible = spot.visible = ring.visible = false;
  }
  function dropStrip() {
    const car = player.vehicle;
    if (!car || !player.state.upgrades.spikes || player.state.spikeCharges < 1) { hud.notify('Fit a spike strip rack at Tavi’s Workshop first.'); return false; }
    player.state.spikeCharges--;
    const mesh = new THREE.Group();
    box(mesh, 0, 0, 0, 38, 0.8, 4, '#2d454b');
    for (let i = -16; i <= 16; i += 4) box(mesh, i, 1.5, 0, 1, 3, 1, '#d9d9c2');
    mesh.position.set(car.position.x - Math.sin(car.heading) * 32, 2, car.position.z - Math.cos(car.heading) * 32);
    mesh.rotation.y = car.heading; scene.add(mesh);
    strips.push({ mesh, position: mesh.position, life: 30, used: false });
    hud.notify('SPIKE STRIP DEPLOYED / Keep moving.');
    return true;
  }
  function bust() {
    if (bustedTime) return;
    const fine = Math.min(player.state.cash, 45 + w.level * 15);
    player.state.cash -= fine;
    if (player.vehicle) { player.vehicle.occupied = false; player.vehicle.speed = 0; }
    player.vehicle = null; player.mesh.visible = true;
    player.position.set(PLACES.safehouse.x, 1.5, PLACES.safehouse.z + 6);
    player.state.health = 100; player.carrying = false;
    const van = game.freezerVan;
    van.position.copy(van.start.position); van.heading = van.start.heading; van.mesh.rotation.y = van.heading;
    van.speed = 0; van.condition = 100; van.occupied = false; van.door.visible = false; syncVehicleBlocker(van);
    game.missionDirector.fail('The cargo is back in impound. Try the board again.');
    reset(); bustedTime = 3;
    document.getElementById('busted').hidden = false;
    document.getElementById('busted-fine').textContent = `$${fine} fine · Back at Citrus Commons`;
    game.chase.reset();
  }
  function update(dt) {
    cooldown = Math.max(0, cooldown - dt); w.witness = Math.max(0, w.witness - dt);
    if (bustedTime > 0) { bustedTime -= dt; if (bustedTime <= 0) { bustedTime = 0; document.getElementById('busted').hidden = true; } }
    if (!game.staged && w.level && units.length < Math.min(6, w.level + 1)) spawn();
    const p = player.position, car = player.vehicle, h = player.heading, fx = Math.sin(h), fz = Math.cos(h);
    let visual = false;
    for (let i = 0; i < units.length; i++) {
      const u = units[i]; u.age += dt; u.slowed = Math.max(0, u.slowed - dt);
      u.distance = distance(p, u.position);
      const angle = Math.atan2(p.x - u.position.x, p.z - u.position.z);
      const bearing = Math.abs(Math.atan2(Math.sin(angle - u.heading), Math.cos(angle - u.heading)));
      u.sees = w.level > 0 && u.distance < u.visionRange && (u.distance < 60 || bearing < u.visionSpread) && clearRay(u.position, p);
      visual ||= u.sees;
      const target = { ...(u.sees ? p : lastKnown) };
      u.tactic = 'PURSUIT';
      if (car && w.level >= 5 && i < 4) {
        u.tactic = 'BOXING IN';
        const side = i < 2 ? (i ? 1 : -1) * 23 : 0, along = i === 2 ? 39 : i === 3 ? -37 : 0;
        target.x += Math.cos(h) * side + fx * along; target.z += -Math.sin(h) * side + fz * along;
      } else if (car && w.level >= 4 && i < 2) {
        u.tactic = 'BOXING IN'; const side = i ? 1 : -1;
        target.x += Math.cos(h) * side * 23; target.z -= Math.sin(h) * side * 23;
      } else if (w.level >= 3 && (i === 2 || i === 3)) {
        u.tactic = 'ROADBLOCK';
        if (!u.blockTarget || distance(p, u.blockTarget) > 650) {
          const horizontal = Math.abs(fx) > Math.abs(fz);
          const nx = STREETS.x.reduce((a, b) => Math.abs(b - p.x) < Math.abs(a - p.x) ? b : a);
          const nz = STREETS.z.reduce((a, b) => Math.abs(b - p.z) < Math.abs(a - p.z) ? b : a);
          u.blockTarget = horizontal ? { x: THREE.MathUtils.clamp(p.x + Math.sign(fx || 1) * 150, 70, 2650), z: nz + (i === 2 ? -20 : 20) } : { x: nx + (i === 2 ? -20 : 20), z: THREE.MathUtils.clamp(p.z + Math.sign(fz || 1) * 150, 70, 2130) };
          u.blockHeading = horizontal ? 0 : Math.PI / 2;
        }
        Object.assign(target, u.blockTarget);
      } else if (car && i % 3 === 0 && u.distance < 100) {
        u.tactic = 'PIT MANEUVER'; target.x += Math.cos(h) * 15 - fx * 9; target.z -= Math.sin(h) * 15 + fz * 9;
      } else if (i % 3 === 1 && w.level >= 2) u.tactic = 'RAMMING';
      u.routeAge -= dt;
      if (!clearRay(u.position, target)) {
        if (u.routeAge <= 0) { u.route = streetRoute(u.position, target).slice(1); u.routeAge = 2; }
        while (u.route.length > 1 && distance(u.position, u.route[0]) < 20) u.route.shift();
        if (u.route.length) Object.assign(target, u.route[0]);
      }
      if (u.stagedTactic) u.tactic = u.stagedTactic;
      const gap = distance(target, u.position), desiredHeading = Math.atan2(target.x - u.position.x, target.z - u.position.z);
      const turn = Math.atan2(Math.sin(desiredHeading - u.heading), Math.cos(desiredHeading - u.heading));
      u.heading += THREE.MathUtils.clamp(turn, -dt * 2.4, dt * 2.4);
      const desiredSpeed = !w.level ? 0 : u.slowed ? 8 : Math.min(car ? 145 : 30, Math.max(0, gap * 1.2 + (car && gap < 65 ? Math.abs(car.speed) * 0.8 : 0)));
      u.speed += (desiredSpeed - u.speed) * Math.min(1, dt * 2.8);
      if (!game.staged && city.move(u.position, Math.sin(u.heading) * u.speed * dt, Math.cos(u.heading) * u.speed * dt, 9, u)) {
        u.speed *= 0.6;
        city.move(u.position, Math.cos(u.heading) * dt * 20, -Math.sin(u.heading) * dt * 20, 8, u);
      }
      if (u.tactic === 'ROADBLOCK' && gap < 24) { u.speed = 0; u.heading = u.blockHeading ?? h + Math.PI / 2; }
      if (!game.staged) u.mesh.rotation.y = u.heading;
      syncVehicleBlocker(u);
      u.flash.forEach((light, k) => { light.visible = Math.floor(state.elapsed * 8 + k) % 2 === 0; });
      if (car && u.distance < car.radius + 10 && u.speed > 20 && car.collisionCooldown <= 0) {
        game.impact(Math.min(65, u.speed * 0.6)); car.speed *= 0.72; car.heading += (i % 2 ? 1 : -1) * 0.08; car.collisionCooldown = 0.7;
      }
      for (const strip of strips) if (!strip.used && distance(u.position, strip.position) < 24) {
        strip.used = true; u.slowed = 6; u.speed = 5; effects.burst(u.position, 12); hud.notify(`${u.callsign} / TYRES OUT · 6 seconds`);
      }
    }
    helicopter.visible = beam.visible = spot.visible = ring.visible = w.level >= 4;
    if (helicopter.visible) {
      helicopter.position.set(p.x + 48, (game.staged ? 70 : 120) + Math.sin(state.elapsed) * 3, p.z + 50);
      helicopter.rotation.y = h; rotor.rotation.y += dt * 25;
      const ground = new THREE.Vector3(p.x, 1.9, p.z), top = helicopter.position;
      const vector = new THREE.Vector3().subVectors(top, ground);
      beam.position.copy(top).add(ground).multiplyScalar(0.5);
      beam.scale.y = vector.length(); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vector.normalize());
      spot.position.copy(ground); ring.position.copy(ground); ring.position.y += 0.05;
      if (!city.isShaded(p.x, p.z) && clearRay(top, p)) visual = true;
    }
    if (game.staged) visual = true;
    if (w.level > 0) {
      if (visual) { w.heat = Math.min(100, w.heat + dt * 14); lastKnown = { x: p.x, z: p.z }; decay = 0; }
      else {
        w.heat = Math.max(0, w.heat - dt * 9);
        if (w.heat === 0) { decay += dt; if (decay > 2.5) { w.level--; decay = 0; if (w.level === 0) reset(); } }
      }
      w.los = visual ? 'VISUAL' : w.heat > 0 ? 'SEARCHING' : 'LOST';
      w.search = visual ? null : { center: lastKnown, radius: 280 + w.heat * 2 };
      const close = units.filter(u => u.distance < (car ? 35 : 20));
      const detained = car ? Math.abs(car.speed) < 3 && close.length >= 2 : close.length > 0;
      w.arrest = detained && !game.staged ? w.arrest + dt : Math.max(0, w.arrest - dt * 2);
      if (w.arrest > 4) bust();
    } else { w.los = 'LOST'; w.heat = 0; w.search = null; }
    w.units = [...units].sort((a, b) => a.distance - b.distance);
    const lead = w.units[0];
    w.dispatch = w.level && lead ? `${lead.callsign} → ${lead.tactic} · LOS: ${w.los}${helicopter.visible ? ' · AIR: SPOTLIGHT' : ''}` : 'ALL QUIET · LOS: LOST';
    for (let i = strips.length - 1; i >= 0; i--) {
      strips[i].life -= dt;
      if (strips[i].life <= 0) { scene.remove(strips[i].mesh); strips.splice(i, 1); }
    }
  }
  return { update, reset, crime, spawn, bust, dropStrip, units, strips, helicopter, beam, spot, clearRay };
}
