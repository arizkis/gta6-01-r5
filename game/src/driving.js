// Scope: arcade acceleration, steering, collision damage and the chase camera.
import * as THREE from '../vendor/three.min.js';
import { SPEEDS } from './config.js';
import { syncVehicleBlocker } from './vehicles.js';

export function driveVehicle(car, dt, keys, city) {
  const accelerate = keys.has('KeyW') || keys.has('ArrowUp');
  const brake = keys.has('KeyS') || keys.has('ArrowDown');
  const steer = Number(keys.has('KeyA') || keys.has('ArrowLeft')) - Number(keys.has('KeyD') || keys.has('ArrowRight'));
  car.collisionCooldown = Math.max(0, car.collisionCooldown - dt);
  if (accelerate) car.speed += (car.speed < 0 ? SPEEDS.braking : SPEEDS.acceleration) * dt;
  else if (brake) car.speed -= (car.speed > 0 ? SPEEDS.braking : SPEEDS.acceleration * 0.6) * dt;
  else car.speed *= Math.exp(-dt * 0.65);
  if (keys.has('Space')) car.speed *= Math.exp(-dt * 3.8);
  const maxSpeed = (car.model.maxSpeed ?? SPEEDS.carMax) * (0.6 + car.condition * 0.004);
  car.speed = THREE.MathUtils.clamp(car.speed, -SPEEDS.reverse, maxSpeed);
  if (Math.abs(car.speed) < 0.25 && !accelerate && !brake) car.speed = 0;
  const steeringGrip = Math.min(1, Math.abs(car.speed) / 25) / (1 + Math.abs(car.speed) / 180);
  const beforeHeading = car.heading;
  car.heading += steer * steeringGrip * 1.7 * Math.sign(car.speed) * dt;
  const hit = city.move(car.position, Math.sin(car.heading) * car.speed * dt, Math.cos(car.heading) * car.speed * dt, car.radius, car);
  if (hit) {
    if (Math.abs(car.speed) > 18 && car.collisionCooldown === 0) {
      car.condition = Math.max(0, car.condition - Math.min(16, Math.abs(car.speed) * 0.13));
      car.collisionCooldown = 0.7;
    }
    car.speed *= 0.25;
    car.heading = beforeHeading;
  }
  car.mesh.rotation.y = car.heading;
  car.wheels.forEach(wheel => { wheel.rotation.x += car.speed * dt / 3; });
  syncVehicleBlocker(car);
}

export function createChaseCamera(camera, city) {
  const focus = new THREE.Vector3(), desired = new THREE.Vector3();
  const state = { yaw: Math.PI, ready: false, driving: false };
  function reset() { state.ready = false; state.yaw = Math.PI; state.driving = false; }
  function update(player, dt, immediate = false) {
    const car = player.vehicle;
    if (car) {
      const angle = Math.atan2(Math.sin(car.heading - state.yaw), Math.cos(car.heading - state.yaw));
      state.yaw += angle * (immediate ? 1 : 1 - Math.exp(-dt * 5));
    }
    state.driving = !!car;
    const speed = Math.abs(car?.speed ?? 0);
    const distance = car ? 73 + speed * 0.14 : 53;
    const height = car ? 40 + speed * 0.05 : 36;
    const source = car?.position ?? player.position;
    desired.set(source.x - Math.sin(state.yaw) * distance, height, source.z - Math.cos(state.yaw) * distance);
    for (const b of city.blockers) {
      if (b.kind === 'building' && Math.abs(desired.x - b.x) < b.halfX + 4 && Math.abs(desired.z - b.z) < b.halfZ + 4) {
        desired.x = source.x - Math.sin(state.yaw) * distance * 0.45;
        desired.z = source.z - Math.cos(state.yaw) * distance * 0.45;
        desired.y = height + 20;
        break;
      }
    }
    const blend = immediate || !state.ready ? 1 : 1 - Math.exp(-dt * 6);
    camera.position.lerp(desired, blend);
    focus.set(source.x + Math.sin(state.yaw) * 13, car ? 7 : 7.5, source.z + Math.cos(state.yaw) * 13);
    camera.lookAt(focus);
    camera.fov += (58 + speed * 0.09 - camera.fov) * blend;
    camera.updateProjectionMatrix();
    state.ready = true;
  }
  return { state, update, reset };
}
