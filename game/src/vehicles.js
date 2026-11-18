// Scope: invented vehicle models, reusable car meshes and parked vehicle records.
import * as THREE from '../vendor/three.min.js';
import { box, material, luminous, bakeMeshes } from './city.js';
import { STREETS, PALETTE } from './config.js';
import { createRandom } from './random.js';
import { headlightRig, lightGlow } from './effects.js';

export const MODELS = [
  { name: 'Sunspur Solace', length: 23, width: 12, height: 7, maxSpeed: 145 },
  { name: 'Sunspur Flicker', length: 20, width: 11, height: 6, maxSpeed: 160 },
  { name: 'Sunspur Pelican', length: 27, width: 13, height: 8, maxSpeed: 130 },
];
export const FREEZER_MODEL = { name: 'FREEZER VAN', modelName: 'Sunspur Coldfin', length: 34, width: 16, height: 17, maxSpeed: 112, freezer: true };
const wheelGeometry = new THREE.CylinderGeometry(3.1, 3.1, 2.1, 10);
const carColors = ['#ef927c', '#71b6b1', '#efd19a', '#e597b3', '#b0bba3', '#c1a7c4'];

function dressFreezer(mesh, width, length) {
  const detail = new THREE.Group(), decals = [];
  detail.name = 'Coldfin doors and refrigeration';
  const rear = -5 - length * 0.35;
  function paint(canvas, x, y, z, w, h, angle) {
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: texture, transparent: true, depthWrite: false }));
    decal.position.set(x, y, z); decal.rotation.y = angle;
    detail.add(decal); decals.push(decal);
  }
  const livery = document.createElement('canvas'); livery.width = 768; livery.height = 640;
  const ink = livery.getContext('2d');
  ink.textAlign = 'center'; ink.fillStyle = '#214d59';
  ink.font = 'bold 42px sans-serif'; ink.fillText('SUNSPUR', 384, 70);
  ink.font = 'bold 114px sans-serif'; ink.fillText('COLDFIN', 384, 184, 710);
  ink.font = 'bold 28px sans-serif'; ink.fillText('COLD FREIGHT / BAY TO BAY', 384, 234);
  for (const [offset, color] of [[0, '#267b88'], [50, '#71c9c3'], [100, '#d4f2de']]) {
    ink.fillStyle = color; ink.beginPath(); ink.moveTo(0, 355 + offset);
    ink.bezierCurveTo(200, 245 + offset, 490, 455 + offset, 768, 320 + offset);
    ink.lineTo(768, 520 + offset); ink.lineTo(0, 520 + offset); ink.fill();
  }
  ink.strokeStyle = '#eef8e4'; ink.lineWidth = 9;
  for (const [x, y, radius] of [[152, 346, 42], [620, 404, 28]]) {
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      ink.beginPath(); ink.moveTo(x, y); ink.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius); ink.stroke();
    }
  }
  ink.fillStyle = '#214d59'; ink.font = 'bold 28px sans-serif'; ink.fillText('KEEP IT COLD. KEEP IT COASTAL.', 384, 610);
  box(detail, 0, 13, rear - 0.12, width + 0.4, 16, 0.24, '#46646a');
  for (const side of [-1, 1]) {
    box(detail, side * 4.05, 13, rear - 0.3, 7.7, 15.3, 0.22, '#f8e7bc');
    for (const y of [7.8, 17.8]) {
      box(detail, side * 7.35, y, rear - 0.58, 1.3, 0.65, 0.45, '#a5b8af');
      box(detail, side * 7.7, y, rear - 0.83, 0.35, 1.05, 0.35, '#3a555d');
    }
    box(detail, side * 0.85, 9.3, rear - 0.62, 0.5, 2.4, 0.4, '#284d59');
    box(detail, side * 1.1, 9.6, rear - 0.9, 0.9, 0.35, 0.3, '#d5ded0');
    box(detail, side * 7.15, 4.8, rear - 0.35, 2.3, 2.7, 0.65, '#28434d');
    const lamp = box(detail, side * 7.15, 5.2, rear - 0.75, 1.7, 1.45, 0.3, '#ef3651');
    lamp.material = luminous('#ef3651', 1.8);
    const glow = lightGlow('#ff3150', 4.5); glow.position.set(side * 7.15, 5.2, rear - 1); detail.add(glow);
    box(detail, side * 7.15, 4.05, rear - 0.75, 1.7, 0.45, 0.3, '#f8d29b');
    box(detail, side * (width / 2 - 0.6), 1.5, -length * 0.32 - 2, 3, 3, 0.5, '#243e48');
    paint(livery, side * (width / 2 + 0.56), 13, -5, 19, 8, side * Math.PI / 2);
  }
  paint(livery, 0, 13.6, rear - 0.44, 14.8, 12.5, Math.PI);
  box(detail, 0, 13, rear - 0.55, 0.16, 15.3, 0.2, '#3a555d');
  box(detail, 0, 2.6, rear - 1, width + 0.5, 1.3, 1.3, '#59727a');
  box(detail, 0, 3.25, rear - 1.15, 11, 0.2, 1.5, '#b9c9bb');
  box(detail, 0, 4.5, rear - 0.45, 5.2, 1.9, 0.3, '#28434d');
  const plate = document.createElement('canvas'); plate.width = 384; plate.height = 128;
  const plateInk = plate.getContext('2d'); plateInk.fillStyle = '#fff1c9'; plateInk.fillRect(0, 0, 384, 128);
  plateInk.fillStyle = '#234d5b'; plateInk.textAlign = 'center';
  plateInk.font = 'bold 22px sans-serif'; plateInk.fillText('SUNSPUR BAY', 192, 28);
  plateInk.font = 'bold 67px monospace'; plateInk.fillText('CFN 017', 192, 97);
  paint(plate, 0, 4.5, rear - 0.63, 4.8, 1.6, Math.PI);
  box(detail, 0, 24, -3.65, 9.4, 3.5, 0.4, '#284d59');
  for (let x = -3.5; x <= 3.5; x++) box(detail, x, 24, -3.95, 0.35, 2.7, 0.3, '#a9cfc3');
  for (const side of [-1, 1]) box(detail, side * 4.9, 24, 0.7, 0.35, 2.6, 6.8, '#d3e5ce');
  bakeMeshes(detail, decals); mesh.add(detail);
}

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
    if (!model.freezer) box(mesh, side * w * 0.3, 5, -l / 2 - 0.2, 3, 2, 0.7, '#d26569');
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
    box(mesh, 0, 24, 1, 11, 5, 9, '#78b7b1');
    dressFreezer(mesh, w, l);
  }
  bakeMeshes(mesh);
  const headlights = headlightRig(w, l);
  mesh.add(headlights);
  const door = new THREE.Group();
  if (model.freezer) {
    door.position.set(-w / 2, 8, l * 0.25);
    box(door, -0.5, 0, -4, 1.2, 10, 9, color);
    box(door, -0.7, 3, -4, 1.4, 4, 7, '#365965');
    door.visible = false; mesh.add(door);
  }
  const vehicle = {
    id: options.id ?? `car-${options.x ?? 0}-${options.z ?? 0}`,
    name: model.name, model, mesh, wheels: [],
    position: mesh.position, heading: options.heading ?? 0, speed: 0, condition: 100,
    occupied: false, traffic: options.traffic ?? false, freezer: !!model.freezer,
    radius: Math.hypot(w / 2, l / 2) * 0.76,
    collisionCooldown: 0, upgrades: {}, door, headlights,
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
