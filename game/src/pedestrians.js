// Scope: low-poly people, stationary labeled contacts and collision-aware sidewalk walks.
import * as THREE from '../vendor/three.min.js';
import { STREETS, CONTACTS } from './config.js';
import { material, box, label, bakeMeshes } from './city.js';
import { createRandom } from './random.js';

const torsoGeometry = new THREE.CylinderGeometry(2.5, 2.1, 5.2, 6);
const headGeometry = new THREE.SphereGeometry(2.1, 7, 5);
export function createFigure(color = '#f4a872', skin = '#c99878') {
  const mesh = new THREE.Group();
  const torso = new THREE.Mesh(torsoGeometry, material(color));
  torso.position.y = 7;
  mesh.add(torso);
  const head = new THREE.Mesh(headGeometry, material(skin));
  head.position.y = 11;
  mesh.add(head);
  const legs = [-1.2, 1.2].map(x => box(mesh, x, 2.6, 0, 1.6, 5, 1.9, '#355366'));
  const arms = [-3, 3].map(x => box(mesh, x, 6.5, 0, 1.2, 5.5, 1.4, color));
  box(mesh, 0, 12.7, 0, 4, 1.2, 3.7, '#4e4547');
  box(mesh, 0, 10.8, 1.8, 2.8, 0.7, 0.6, '#2e4b55');
  bakeMeshes(mesh, [torso, ...legs, ...arms]);
  return { mesh, legs, arms, torso };
}

export function animateFigure(figure, phase, moving) {
  const swing = moving ? Math.sin(phase) * 0.6 : 0;
  figure.legs[0].rotation.x = swing; figure.legs[1].rotation.x = -swing;
  figure.arms[0].rotation.x = -swing; figure.arms[1].rotation.x = swing;
}

export function createPedestrians(scene, city, seed = 17) {
  const rng = createRandom(seed + 503), people = [];
  for (let i = 0; i < 40; i++) {
    const ix = i % 5, iz = Math.floor(i / 5) % 4;
    const left = STREETS.x[ix] + 72, right = STREETS.x[ix + 1] - 72;
    const top = STREETS.z[iz] + 72, bottom = STREETS.z[iz + 1] - 72;
    const route = [{ x: left, z: top }, { x: right, z: top }, { x: right, z: bottom }, { x: left, z: bottom }];
    const index = Math.floor(rng() * 4), a = route[index], b = route[(index + 1) % 4], t = rng();
    const figure = createFigure(rng.pick(['#ee9ca7', '#edc576', '#67b5a9', '#bb9fc0', '#f0ddba']), rng.pick(['#b77f63', '#e2b08a', '#94624f']));
    figure.mesh.position.set(a.x + (b.x - a.x) * t, 1.5, a.z + (b.z - a.z) * t);
    if (city.blocked(figure.mesh.position.x, figure.mesh.position.z, 3)) figure.mesh.position.set(a.x, 1.5, a.z);
    scene.add(figure.mesh);
    people.push({ id: `ped-${i}`, ...figure, position: figure.mesh.position, route, index: (index + 1) % 4, phase: rng() * 6, state: { mode: 'stroll', speed: rng.range(3, 5), panic: 0, target: null }, stalled: 0 });
  }
  const contacts = CONTACTS.map(contact => {
    const figure = createFigure(contact.color);
    figure.mesh.position.set(contact.x, 1.5, contact.z);
    scene.add(figure.mesh);
    label(figure.mesh, `${contact.name.toUpperCase()} / ${contact.faction}`, 0, 26, 0, 100, contact.color);
    const ring = new THREE.Mesh(new THREE.RingGeometry(6, 7.5, 24), new THREE.MeshBasicMaterial({ color: contact.color, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.05, 0);
    figure.mesh.add(ring);
    return { ...contact, ...figure, position: figure.mesh.position };
  });
  function update(dt) {
    for (const person of people) {
      person.state.panic = Math.max(0, person.state.panic - dt);
      if (person.state.panic > 0) {
        person.state.mode = Number(person.id.slice(4)) % 7 === 0 ? 'crouch' : 'flee';
        person.mesh.scale.y = person.state.mode === 'crouch' ? 0.55 : 1;
      } else { person.state.mode = 'stroll'; person.state.target = null; person.mesh.scale.y = 1; }
      const target = person.state.target ?? person.route[person.index];
      const dx = target.x - person.position.x, dz = target.z - person.position.z;
      const length = Math.hypot(dx, dz);
      let moving = false;
      if (length > 3 && !['idle', 'crouch'].includes(person.state.mode)) {
        const nx = dx / length, nz = dz / length, step = person.state.speed * (person.state.panic ? 3.8 : 1) * dt;
        const oldX = person.position.x, oldZ = person.position.z;
        city.move(person.position, nx * step, nz * step, 3);
        moving = Math.hypot(person.position.x - oldX, person.position.z - oldZ) > step * 0.1;
        if (!moving) {
          person.stalled += dt;
          city.move(person.position, -nz * step, nx * step, 3);
          if (person.stalled > 2) { person.index = (person.index + 1) % 4; person.stalled = 0; }
        } else person.stalled = 0;
        person.mesh.rotation.y = Math.atan2(nx, nz);
      } else person.index = (person.index + 1) % 4;
      person.phase += dt * person.state.speed * 1.5;
      animateFigure(person, person.phase, moving);
    }
  }
  function scare(point, radius = 95) {
    people.forEach(person => {
      const dx = person.position.x - point.x, dz = person.position.z - point.z, length = Math.hypot(dx, dz);
      if (length < radius) {
        person.state.panic = 5;
        person.state.target = { x: person.position.x + dx / (length || 1) * 100, z: person.position.z + dz / (length || 1) * 100 };
      }
    });
  }
  return { people, contacts, update, scare };
}
