// Small local particle pools for vapour, tyre smoke, sparks, water and skid trails.
import * as THREE from '../vendor/three.min.js';
import { createRandom } from './random.js';

export function createEffects(scene, seed) {
  const rng = createRandom(seed + 180), particles = [], marks = [];
  const geometry = new THREE.IcosahedronGeometry(1, 0);
  function puff(point, color, size = 2, life = 1.4, velocity = {}) {
    if (particles.length > 200) return;
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false }));
    mesh.position.set(point.x, point.y ?? 5, point.z);
    mesh.scale.setScalar(size);
    scene.add(mesh);
    particles.push({ mesh, life, max: life, vx: velocity.x ?? rng.range(-2, 2), vy: velocity.y ?? 4, vz: velocity.z ?? rng.range(-2, 2), grow: color !== '#ffc17b' });
  }
  function burst(point, power = 45) {
    for (let i = 0; i < 14; i++) puff(point, '#ffc17b', rng.range(0.3, 1), 0.6, { x: rng.range(-power, power), y: rng.range(5, 20), z: rng.range(-power, power) });
  }
  function skid(car) {
    for (const side of [-1, 1]) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 9), new THREE.MeshBasicMaterial({ color: '#253c42', transparent: true, opacity: 0.65, depthWrite: false }));
      mesh.rotation.set(-Math.PI / 2, 0, -car.heading);
      mesh.position.set(car.position.x + Math.cos(car.heading) * side * 6, 1.7, car.position.z - Math.sin(car.heading) * side * 6);
      scene.add(mesh); marks.push({ mesh, life: 14 });
    }
  }
  function update(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.life -= dt;
      p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.mesh.position.z += p.vz * dt;
      p.mesh.material.opacity = Math.max(0, p.life / p.max * 0.55);
      if (p.grow) p.mesh.scale.multiplyScalar(1 + dt * 0.45);
      if (p.life <= 0) { scene.remove(p.mesh); p.mesh.material.dispose(); particles.splice(i, 1); }
    }
    for (let i = marks.length - 1; i >= 0; i--) {
      const p = marks[i]; p.life -= dt; p.mesh.material.opacity = Math.max(0, p.life / 14 * 0.65);
      if (p.life <= 0 || marks.length > 220) { scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); marks.splice(i, 1); }
    }
  }
  return { puff, burst, skid, update, particles, marks };
}
