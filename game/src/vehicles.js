// Scope: invented vehicle models, reusable car meshes and parked vehicle records.
import * as THREE from '../vendor/three.min.js';
import { box, material, label, bakeMeshes } from './city.js';
import { STREETS, PALETTE } from './config.js';
import { createRandom } from './random.js';

export const MODELS = [
  { name: 'Sunspur Solace', length: 23, width: 12, height: 7, maxSpeed: 145 },
  { name: 'Sunspur Flicker', length: 20, width: 11, height: 6, maxSpeed: 160 },
  { name: 'Sunspur Pelican', length: 27, width: 13, height: 8, maxSpeed: 130 },
];
export const FREEZER_MODEL = { name: 'FREEZER VAN', modelName: 'Sunspur Coldfin', length: 34, width: 16, height: 17, maxSpeed: 112, freezer: true };
const wheelGeometry = new THREE.CylinderGeometry(3.1, 3.1, 2.1, 10);
const carColors = ['#ef927c', '#71b6b1', '#efd19a', '#e597b3', '#b0bba3', '#c1a7c4'];

export function createVehicle(scene, options = {}) {
  const model = options.model ?? MODELS[0];
  const color = options.color ?? PALETTE.pink;
  const mesh = new THREE.Group();
  mesh.name = model.name;
  const { length: l, width: w, height: h } = model;
  box(mesh, 0, 4.5, 0, w, 6, l, color);
  box(mesh, 0, 8.8, -1, w - 2, h - 1, l * 0.47, color);
  box(mesh, 0, 9, l * 0.23, w - 2.6, 4, 0.8, '#365965');
  box(mesh, 0, 9, -l * 0.27, w - 2.6, 4, 0.8, '#365965');
  for (const side of [-1, 1]) {
    box(mesh, side * (w / 2 - 0.8), 9, -1, 0.5, 3.8, l * 0.37, '#365965');
    box(mesh, side * (w / 2 + 0.7), 8, l * 0.12, 2, 1.5, 2.5, color);
    box(mesh, side * w * 0.3, 5, l / 2 + 0.2, 3, 2, 0.7, '#ffeab6');
    box(mesh, side * w * 0.3, 5, -l / 2 - 0.2, 3, 2, 0.7, '#d26569');
  }
  box(mesh, 0, 2.5, l / 2, w + 0.5, 1.8, 1.5, '#c2c8b7');
  box(mesh, 0, 2.5, -l / 2, w + 0.5, 1.8, 1.5, '#c2c8b7');
  const wheels = [];
  for (const x of [-w / 2, w / 2]) for (const z of [-l * 0.32, l * 0.32]) {
    const wheel = new THREE.Mesh(wheelGeometry, material('#29434b'));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 3, z);
    mesh.add(wheel);
    wheels.push(wheel);
  }
  if (model.freezer) {
    box(mesh, 0, 12, -5, w + 1, 18, l * 0.7, '#f8e7bc');
    box(mesh, 0, 13, -l / 2 - 0.7, 1, 15, 0.6, '#a2bab1');
    box(mesh, 0, 24, 1, 11, 5, 9, '#78b7b1');
    for (const side of [-1, 1]) box(mesh, side * (w / 2 + 0.6), 13, -6, 0.5, 4, 18, '#71b6b1');
    label(mesh, 'COLD / HANDLE WITH CARE', 0, 24, -8, 38);
  }
  bakeMeshes(mesh);
  const vehicle = {
    id: options.id ?? `car-${options.x ?? 0}-${options.z ?? 0}`,
    name: model.name, model, mesh, wheels: [],
    position: mesh.position, heading: options.heading ?? 0, speed: 0, condition: 100,
    occupied: false, traffic: options.traffic ?? false, freezer: !!model.freezer,
    radius: Math.hypot(w / 2, l / 2) * 0.76,
    collisionCooldown: 0, upgrades: {},
  };
  mesh.position.set(options.x ?? 0, 1.4, options.z ?? 0);
  mesh.rotation.y = vehicle.heading;
  scene.add(mesh);
  return vehicle;
}

export function createParkedVehicles(scene, city, seed = 17) {
  const rng = createRandom(seed + 97);
  const vehicles = [];
  function park(options) {
    const vehicle = createVehicle(scene, options);
    vehicle.blocker = city.addBlocker(vehicle.position.x, vehicle.position.z, options.heading === Math.PI / 2 ? vehicle.model.length : vehicle.model.width, options.heading === Math.PI / 2 ? vehicle.model.width : vehicle.model.length, 'vehicle', vehicle);
    vehicles.push(vehicle);
    return vehicle;
  }
  park({ id: 'juno-solace', model: MODELS[0], color: '#df8da4', x: 480, z: 674, heading: Math.PI / 2 });
  for (const z of STREETS.z) for (let x = 380; x < 2580; x += 220) {
    if (z === 720 && Math.abs(x - 480) < 150) continue;
    if (city.blocked(x, z + 46, 17)) continue;
    if (rng() > 0.6) continue;
    park({ model: rng.pick(MODELS), color: rng.pick(carColors), x, z: z + 46, heading: Math.PI / 2 });
  }
  const freezerVan = park({ id: 'impound-freezer', model: FREEZER_MODEL, color: '#f8e7bc', x: 980, z: 1770, heading: Math.PI });
  return { vehicles, freezerVan };
}

export function syncVehicleBlocker(vehicle) {
  if (!vehicle.blocker) return;
  const b = vehicle.blocker, w = vehicle.model.width / 2, l = vehicle.model.length / 2;
  b.x = vehicle.position.x; b.z = vehicle.position.z;
  b.halfX = Math.abs(Math.cos(vehicle.heading)) * w + Math.abs(Math.sin(vehicle.heading)) * l;
  b.halfZ = Math.abs(Math.sin(vehicle.heading)) * w + Math.abs(Math.cos(vehicle.heading)) * l;
}
