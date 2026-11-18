// Scope: Juno's walking, sprinting, interactions and safe vehicle entry/exit.
import * as THREE from '../vendor/three.min.js';
import { SPAWN, SPEEDS } from './config.js';
import { createFigure, animateFigure } from './pedestrians.js';
import { syncVehicleBlocker } from './vehicles.js';

export function createPlayer(scene, city) {
  const figure = createFigure('#ef946f', '#ce9978');
  scene.add(figure.mesh);
  const player = {
    name: 'Juno Reed', ...figure, position: figure.mesh.position, heading: Math.PI,
    vehicle: null, walkingSpeed: 0, phase: 0, radius: 3.2,
    state: { cash: 140, health: 100, armour: 0, weapon: 0, tank: 100, respect: { FIXER: 0, MECHANIC: 0, FENCE: 0 } },
    interaction: null,
  };
  function reset() {
    if (player.vehicle) { player.vehicle.occupied = false; player.vehicle.speed = 0; }
    player.vehicle = null;
    player.mesh.visible = true;
    player.position.set(SPAWN.x, 1.5, SPAWN.z);
    player.heading = Math.PI;
    player.mesh.rotation.y = player.heading;
    player.walkingSpeed = 0; player.phase = 0;
    player.state.cash = 140; player.state.health = 100; player.state.armour = 0;
    player.state.weapon = 0; player.state.tank = 100;
    player.state.respect = { FIXER: 0, MECHANIC: 0, FENCE: 0 };
  }
  function update(dt, keys, cameraYaw) {
    if (player.vehicle) {
      player.position.copy(player.vehicle.position);
      player.heading = player.vehicle.heading;
      player.walkingSpeed = 0;
      return;
    }
    const forward = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown'));
    const sideways = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
    const moving = forward !== 0 || sideways !== 0;
    player.walkingSpeed = moving ? keys.has('ShiftLeft') || keys.has('ShiftRight') ? SPEEDS.sprint : SPEEDS.walk : 0;
    if (moving) {
      const direction = new THREE.Vector2(Math.sin(cameraYaw) * forward - Math.cos(cameraYaw) * sideways, Math.cos(cameraYaw) * forward + Math.sin(cameraYaw) * sideways).normalize();
      city.move(player.position, direction.x * player.walkingSpeed * dt, direction.y * player.walkingSpeed * dt, player.radius);
      player.heading = Math.atan2(direction.x, direction.y);
      const delta = Math.atan2(Math.sin(player.heading - player.mesh.rotation.y), Math.cos(player.heading - player.mesh.rotation.y));
      player.mesh.rotation.y += delta * Math.min(1, dt * 12);
    }
    player.phase += dt * player.walkingSpeed * 1.5;
    animateFigure(player, player.phase, moving);
  }
  function findInteraction(contacts, vehicles) {
    if (player.vehicle) return player.interaction = { type: 'exit', label: 'E  /  EXIT VEHICLE' };
    const nearContact = contacts.find(c => player.position.distanceTo(c.position) < 24);
    if (nearContact) return player.interaction = { type: 'contact', target: nearContact, label: `E  /  TALK TO ${nearContact.name.toUpperCase()}` };
    const nearby = vehicles.filter(v => !v.occupied && Math.abs(v.speed) < 15 && player.position.distanceTo(v.position) < 31).sort((a, b) => player.position.distanceTo(a.position) - player.position.distanceTo(b.position));
    if (nearby.length) return player.interaction = { type: 'enter', target: nearby[0], label: `E  /  ENTER ${nearby[0].name.toUpperCase()}` };
    player.interaction = null;
    return null;
  }
  function interact(onContact) {
    const action = player.interaction;
    if (!action) return false;
    if (action.type === 'contact') { onContact?.(action.target); return true; }
    if (action.type === 'enter') {
      player.vehicle = action.target;
      action.target.occupied = true;
      action.target.traffic = false;
      action.target.speed = 0;
      player.mesh.visible = false;
      player.position.copy(action.target.position);
      return true;
    }
    const car = player.vehicle;
    if (Math.abs(car.speed) > 16) return false;
    syncVehicleBlocker(car);
    for (const [side, back] of [[-1, 0], [1, 0], [-1, -20], [1, -20], [0, -32], [0, 34]]) {
      const gap = car.model.width / 2 + 9;
      const x = car.position.x + Math.cos(car.heading) * side * gap + Math.sin(car.heading) * back;
      const z = car.position.z - Math.sin(car.heading) * side * gap + Math.cos(car.heading) * back;
      if (city.blocked(x, z, player.radius)) continue;
      player.position.set(x, 1.5, z);
      player.heading = car.heading;
      player.mesh.rotation.y = player.heading;
      player.vehicle = null;
      player.mesh.visible = true;
      car.occupied = false; car.speed = 0;
      return true;
    }
    return false;
  }
  reset();
  return Object.assign(player, { reset, update, findInteraction, interact });
}
