// Scope: low-poly city geometry, named places, light presets and spatial queries.
import * as THREE from '../vendor/three.min.js';
import { WORLD, STREETS, PALETTE, DISTRICTS, PLACES } from './config.js';
import { createRandom } from './random.js';

const materials = new Map();
const cube = new THREE.BoxGeometry(1, 1, 1);
export function material(color) {
  if (!materials.has(color)) materials.set(color, new THREE.MeshLambertMaterial({ color, flatShading: true }));
  return materials.get(color);
}
export function luminous(color, intensity = 1.2) {
  const key = `${color}/${intensity}`;
  if (!materials.has(key)) materials.set(key, new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: intensity, flatShading: true }));
  return materials.get(key);
}
export function box(parent, x, y, z, w, h, d, color) {
  const mesh = new THREE.Mesh(cube, material(color));
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  mesh.castShadow = h > 3;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
const vertexMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
export function bakeMeshes(group, keep = []) {
  const positions = [], normals = [], colors = [];
  for (const child of [...group.children]) {
    if (!child.isMesh || keep.includes(child) || child.material.emissive?.getHex()) continue;
    child.updateMatrix();
    const source = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
    source.applyMatrix4(child.matrix);
    const p = source.getAttribute('position'), n = source.getAttribute('normal'), c = child.material.color;
    for (let i = 0; i < p.count; i++) {
      positions.push(p.getX(i), p.getY(i), p.getZ(i));
      normals.push(n.getX(i), n.getY(i), n.getZ(i));
      colors.push(c.r, c.g, c.b);
    }
    source.dispose();
    group.remove(child);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  const combined = new THREE.Mesh(geometry, vertexMaterial);
  combined.castShadow = combined.receiveShadow = true;
  group.add(combined);
  return combined;
}
export function label(parent, text, x, y, z, width = 85, color = '#ffe5b2') {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#173e49';
  ctx.fillRect(0, 0, 768, 128);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillRect(0, 114, 768, 14);
  ctx.font = 'bold 43px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 384, 59, 740);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: true, toneMapped: false }));
  sprite.name = text;
  sprite.position.set(x, y, z);
  sprite.scale.set(width, width / 6, 1);
  // Nearby place signs stay readable without covering the people or road below.
  const worldPosition = new THREE.Vector3();
  sprite.onBeforeRender = (renderer, scene, camera) => {
    sprite.getWorldPosition(worldPosition).applyMatrix4(camera.matrixWorldInverse);
    const depth = Math.max(1, -worldPosition.z);
    const pixelCap = width < 50 ? 180 : 320;
    const visibleWidth = Math.min(width, depth * 2 * Math.tan(camera.fov * Math.PI / 360) * pixelCap / renderer.domElement.clientHeight);
    sprite.scale.set(visibleWidth, visibleWidth / 6, 1);
    sprite.updateMatrixWorld();
  };
  parent.add(sprite);
  return sprite;
}

export const TIME_PRESETS = {
  golden: { sky: '#655b99', fog: '#ed8979', sun: '#ff9c47', power: 2.8, ambient: 1.2, angle: [-120, 105, 1000], lamps: true },
  midday: { sky: '#258bab', fog: '#9dcbd0', sun: '#ffd49a', power: 2.6, ambient: 1.1, angle: [200, 1100, 300], lamps: false },
  dusk: { sky: '#353476', fog: '#d9698e', sun: '#ff7742', power: 1.9, ambient: 1.0, angle: [-1000, 80, -120], lamps: true },
  night: { sky: '#18284e', fog: '#34475f', sun: '#97b8d9', power: 0.65, ambient: 0.7, angle: [300, 600, -500], lamps: true },
};

export function buildCity(scene, seed = 17) {
  const rng = createRandom(seed);
  const root = new THREE.Group();
  root.name = 'Sunspur Bay';
  scene.add(root);
  const blockers = [], shadeZones = [], lamps = [];
  let swimming = false;
  const addBlocker = (x, z, w, d, kind = 'building', owner = null) => {
    const value = { x, z, halfX: w / 2, halfZ: d / 2, kind, owner };
    blockers.push(value);
    return value;
  };
  const districtAt = (x, z) => DISTRICTS.find(d => d.test(x, z)).name;
  const withinLand = (x, z, radius = 0) => {
    const mainland = x >= radius && z >= radius && x <= WORLD.landX - radius && z <= WORLD.landZ - radius;
    const pier = x > 2118 + radius && x < 2182 - radius && z >= 2170 && z < 2535 - radius;
    return mainland || pier;
  };
  function blocked(x, z, radius = 3, ignore = null) {
    const swim = radius < 5 && swimming && x > 2680 && x < 2790 && Math.abs(z - 1840) < 70;
    if (!withinLand(x, z, radius) && !swim) return true;
    return blockers.some(b => b !== ignore && (ignore === null || b.owner !== ignore) && Math.abs(x - b.x) < b.halfX + radius && Math.abs(z - b.z) < b.halfZ + radius);
  }
  function move(position, dx, dz, radius = 3, ignore = null) {
    let hit = false;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / Math.max(radius, 2)));
    for (let i = 0; i < steps; i++) {
      if (!blocked(position.x + dx / steps, position.z, radius, ignore)) position.x += dx / steps;
      else hit = true;
      if (!blocked(position.x, position.z + dz / steps, radius, ignore)) position.z += dz / steps;
      else hit = true;
    }
    return hit;
  }
  box(root, 1400, -6, 1250, 7200, 8, 6500, PALETTE.sea);
  box(root, WORLD.landX / 2, -1, WORLD.landZ / 2, WORLD.landX, 2, WORLD.landZ, PALETTE.grass);
  box(root, 2650, 0.1, 1100, 140, 1, 2200, '#f3d39f');
  box(root, 1360, 0.1, 2150, 2720, 1, 100, '#f3d39f');
  for (let i = 0; i < 40; i++) {
    box(root, 2750 + i % 3 * 20, -0.8, i * 62, 3, 0.2, 32, '#a4ddd2');
    box(root, i * 73, -0.8, 2225 + i % 3 * 24, 38, 0.2, 3, '#a4ddd2');
  }
  function road(x, z, w, d) {
    box(root, x, 0.6, z, w + 44, 1, d + 44, PALETTE.pavement);
    box(root, x, 1.25, z, w, 0.3, d, PALETTE.road);
  }
  STREETS.x.forEach(x => road(x, 1100, STREETS.width, 2200));
  STREETS.z.forEach(z => road(1360, z, 2720, STREETS.width));
  for (const x of STREETS.x) for (let z = 30; z < 2200; z += 42) {
    if (!STREETS.z.some(v => Math.abs(v - z) < 74)) box(root, x, 1.48, z, 2, 0.1, 20, PALETTE.cream);
  }
  for (const z of STREETS.z) for (let x = 25; x < 2720; x += 42) {
    if (!STREETS.x.some(v => Math.abs(v - x) < 74)) box(root, x, 1.5, z, 20, 0.1, 2, PALETTE.cream);
  }
  for (const x of STREETS.x) for (const z of STREETS.z) {
    for (let i = -42; i <= 42; i += 14) {
      for (const offset of [-68, 68]) {
        box(root, x + i, 1.52, z + offset, 8, 0.1, 13, '#f7e4bb');
        box(root, x + offset, 1.52, z + i, 13, 0.1, 8, '#f7e4bb');
      }
    }
  }
  function building(x, z, w, d, h, color) {
    box(root, x, h / 2, z, w, h, d, color);
    box(root, x, h + 2, z, w + 5, 4, d + 5, rng.pick([PALETTE.pink, PALETTE.teal, PALETTE.orange, PALETTE.cream]));
    box(root, x, 5, z, w + 3, 9, d + 3, '#e8c69e');
    for (let y = 18; y < h - 4; y += 18) {
      for (let xx = -w / 2 + 10; xx < w / 2 - 3; xx += 18) {
        for (const face of [-1, 1]) {
          const window = box(root, x + xx, y, z + face * (d / 2 + 0.2), 8, 9, 0.6, '#164852');
          if ((Math.round(xx + y) + face + 600) % 5 < 2) window.material = luminous('#ffbd69', 0.8);
        }
      }
      for (let zz = -d / 2 + 10; zz < d / 2 - 3; zz += 22) {
        for (const face of [-1, 1]) {
          const window = box(root, x + face * (w / 2 + 0.2), y, z + zz, 0.6, 9, 9, '#164852');
          if ((Math.round(zz + y) + face + 600) % 5 < 2) window.material = luminous('#ffb864', 0.8);
        }
      }
    }
    addBlocker(x, z, w + 5, d + 5);
  }
  const reserved = new Set(['0,0', '2,0', '3,1', '1,3', '3,2']);
  for (let ix = 0; ix < 5; ix++) for (let iz = 0; iz < 4; iz++) {
    if (reserved.has(`${ix},${iz}`)) continue;
    const cx = (STREETS.x[ix] + STREETS.x[ix + 1]) / 2;
    const cz = (STREETS.z[iz] + STREETS.z[iz + 1]) / 2;
    for (const ox of [-73, 73]) for (const oz of [-73, 73]) {
      building(cx + ox + rng.range(-10, 10), cz + oz + rng.range(-10, 10), rng.range(78, 112), rng.range(75, 108), rng.range(30, 150), rng.pick(['#e8ac78', '#dc728f', '#5eaa9f', '#efa749', '#c57c9e']));
    }
  }
  // Edge blocks keep the skyline occupied without obstructing the beach.
  for (const x of [105, 2580]) for (const z of [450, 890, 1330, 1770]) building(x, z, 100, 145, rng.range(35, 110), '#eac5a3');

  const trunkGeometry = new THREE.CylinderGeometry(2.3, 3.2, 35, 6);
  const frondGeometry = new THREE.ConeGeometry(10, 34, 3);
  const crownGeometry = new THREE.IcosahedronGeometry(15, 0);
  function tree(x, z, palm = true) {
    if (blocked(x, z, 6)) return;
    const trunk = new THREE.Mesh(trunkGeometry, material('#a47d61'));
    trunk.position.set(x, 17, z);
    root.add(trunk);
    if (palm) {
      for (let i = 0; i < 5; i++) {
        const frond = new THREE.Mesh(frondGeometry, material(i % 2 ? '#498f79' : '#387e70'));
        const angle = i / 5 * Math.PI * 2;
        frond.position.set(x + Math.sin(angle) * 9, 35, z + Math.cos(angle) * 9);
        frond.rotation.set(Math.cos(angle) * 1.3, angle, -Math.sin(angle) * 1.3);
        root.add(frond);
      }
    } else {
      const crown = new THREE.Mesh(crownGeometry, material('#5e987b'));
      crown.position.set(x, 32, z);
      crown.scale.set(1.4, 1, 1.2);
      root.add(crown);
    }
    addBlocker(x, z, 6, 6, 'tree');
    shadeZones.push({ x, z, radius: palm ? 18 : 25, source: 'tree' });
  }
  function bench(x, z) {
    box(root, x, 4, z, 20, 2, 7, '#be855d');
    box(root, x, 8, z + 3, 20, 8, 1.5, '#be855d');
    for (const offset of [-7, 7]) box(root, x + offset, 2, z, 2, 4, 6, '#37656a');
    addBlocker(x, z, 20, 8, 'bench');
  }
  function kiosk(x, z, name, color) {
    box(root, x, 7, z, 30, 14, 20, color);
    box(root, x, 18, z, 38, 3, 29, PALETTE.cream);
    for (const side of [-1, 1]) box(root, x + side * 15, 14, z, 1, 13, 1, '#775e54');
    addBlocker(x, z, 32, 22, 'kiosk');
    shadeZones.push({ x, z, halfX: 22, halfZ: 18, source: 'awning' });
    label(root, name, x, 27, z, 48);
  }
  box(root, 460, 0.4, 490, 255, 1, 230, '#92b48a');
  box(root, 460, 1.1, 490, 230, 1, 15, '#eed5ae');
  box(root, 460, 1.1, 490, 15, 1, 222, '#eed5ae');
  for (const x of [360, 410, 510, 560]) for (const z of [402, 545]) tree(x, z, false);
  bench(410, 515); bench(505, 466);
  label(root, 'CITRUS GREEN', 460, 32, 410, 105);
  building(430, 596, 118, 32, 37, '#e7afab');
  box(root, 430, 8, 613, 11, 16, 1, PALETTE.teal);
  box(root, 437, 8, 614, 1, 2, 1, PALETTE.orange);
  label(root, "JUNO'S SAFEHOUSE", 430, 27, 615, 70);
  kiosk(1300, 530, 'SUNBASKET / FOOD', PALETTE.orange);
  kiosk(1430, 530, 'THREAD & TIDE', PALETTE.pink);
  box(root, 1370, 0.6, 570, 235, 1, 135, '#d9bd93');
  label(root, 'MARIGOLD MARKET', 1370, 48, 590, 130);
  for (let i = 0; i < 8; i++) {
    const x = 1260 + i * 27;
    box(root, x, 5, 580, 13, 10, 13, '#b78558');
    addBlocker(x, 580, 13, 13, 'crate');
    box(root, x, 11, 580, 10, 3, 10, i % 2 ? '#ed9b63' : '#dfbb59');
  }
  box(root, 1780, 0.5, 940, 258, 1, 244, '#dbb7a4');
  box(root, 1780, 5, 860, 100, 10, 45, PALETTE.teal);
  label(root, 'LANTERN FEST', 1780, 47, 860, 126, '#f7bd6b');
  for (const x of [1680, 1880]) kiosk(x, 900, 'LANTERNS', '#e4a48b');
  for (let i = 0; i < 9; i++) {
    box(root, 1660 + i * 30, 44 + Math.sin(i / 8 * Math.PI) * 7, 970, 9, 12, 9, i % 2 ? PALETTE.orange : PALETTE.pink);
  }
  building(1780, 1370, 190, 142, 52, '#6fa5a2');
  box(root, 1780, 18, 1442, 86, 34, 2, '#2e515c');
  for (let i = 0; i < 5; i++) box(root, 1780, 4 + i * 7, 1444, 84, 1, 1, '#66928c');
  box(root, 1780, 39, 1448, 130, 6, 14, PALETTE.orange);
  label(root, "TAVI'S WORKSHOP", 1780, 64, 1444, 147);
  shadeZones.push({ x: 1780, z: 1453, halfX: 65, halfZ: 18, source: 'workshop awning' });
  box(root, 910, 0.8, 1815, 234, 1, 242, '#c3b79e');
  function fence(x, z, w, d) {
    box(root, x, 9, z, w, 1, d, '#587d7b');
    box(root, x, 17, z, w, 1, d, '#587d7b');
    const length = Math.max(w, d);
    for (let i = -length / 2; i <= length / 2; i += 15) box(root, x + (w > d ? i : 0), 9, z + (d > w ? i : 0), 1.5, 18, 1.5, '#587d7b');
    addBlocker(x, z, Math.max(w, 3), Math.max(d, 3), 'fence');
  }
  fence(794, 1815, 3, 240); fence(1026, 1815, 3, 240);
  fence(910, 1935, 235, 3);
  fence(832, 1695, 77, 3); fence(978, 1695, 97, 3);
  label(root, 'SUNSPUR IMPOUND', 900, 39, 1693, 152);
  label(root, 'GATE / KEEP CLEAR', 900, 17, 1695, 54, '#f5a66c');
  box(root, 2150, 1.2, 2350, 64, 4, 370, '#b98866');
  for (let z = 2170; z < 2535; z += 10) box(root, 2150, 3.3, z, 63, 0.3, 1, '#8a654f');
  for (const x of [2120, 2180]) for (let z = 2208; z < 2530; z += 35) {
    box(root, x, 7, z, 3, 17, 3, '#977158');
  }
  fence(2120, 2370, 2, 320); fence(2180, 2370, 2, 320);
  fence(2150, 2532, 60, 2);
  label(root, 'TIN CUP PIER', 2150, 36, 2205, 108);
  // A short raised coastal road with water and bridge piers beneath its edges.
  box(root, 1970, 0.8, 2040, 530, 0.2, 200, PALETTE.sea);
  box(root, 1970, 1.2, 2040, 530, 0.4, 112, PALETTE.road);
  for (const z of [1980, 2100]) {
    box(root, 1970, 4, z, 530, 2, 3, '#edcba0');
    for (let x = 1710; x < 2235; x += 45) box(root, x, 6, z, 2, 9, 2, '#eac297');
  }
  label(root, 'COASTAL CAUSEWAY', 1900, 30, 1970, 90);
  const buoy = new THREE.Mesh(new THREE.ConeGeometry(7, 14, 8), material(PALETTE.orange));
  buoy.position.set(2750, 6, 1840); root.add(buoy);
  label(root, 'SWIMMER BUOY', 2750, 25, 1840, 72);
  for (const tap of [{ x: 2150, z: 2190 }, { x: 1410, z: 640 }]) {
    box(root, tap.x, 4, tap.z, 4, 8, 4, '#65c5d3');
    box(root, tap.x + 2, 8, tap.z, 6, 2, 2, '#dce9ce');
    label(root, 'WATER / REFILL', tap.x, 19, tap.z, 40, '#a2e7e5');
  }
  bench(2150, 2460);
  for (const x of STREETS.x) for (let z = 390; z < 2000; z += 220) {
    tree(x - 68, z);
    if (rng() > 0.3) tree(x + 68, z + 54);
  }
  for (let z = 140; z < 2170; z += 125) tree(2660, z);
  for (let x = 100; x < 2650; x += 150) tree(x, 2160);
  const glowMaterial = new THREE.MeshBasicMaterial({ color: '#ffe5a0' });
  for (const z of STREETS.z) for (let x = 345; x < 2630; x += 220) {
    if (blocked(x, z - 68, 4)) continue;
    box(root, x, 18, z - 68, 2, 36, 2, '#557778');
    box(root, x + 4, 36, z - 68, 10, 2, 3, '#557778');
    const glow = new THREE.Mesh(new THREE.SphereGeometry(2.5, 5, 4), glowMaterial);
    glow.position.set(x + 8, 35, z - 68);
    glow.userData.dynamic = true;
    root.add(glow);
    lamps.push(glow);
    addBlocker(x, z - 68, 3, 3, 'lamp');
    if (rng() > 0.8) bench(x + 32, z - 70);
  }
  const skyLight = new THREE.HemisphereLight('#ffc0ce', '#137e83', 1);
  const sun = new THREE.DirectionalLight('#ffcca1', 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -280, right: 280, top: 280, bottom: -280, near: 1, far: 2200 });
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.5;
  sun.shadow.radius = 3;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(5000, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { zenith: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, sunDirection: { value: new THREE.Vector3() }, disc: { value: new THREE.Color('#ffe3a0') } },
    vertexShader: 'varying vec3 direction; void main() { direction = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 direction;
      uniform vec3 zenith; uniform vec3 horizon; uniform vec3 sunDirection; uniform vec3 disc;
      void main() {
        vec3 ray = normalize(direction);
        float elevation = max(ray.y, 0.0);
        vec3 color = mix(horizon, zenith, smoothstep(0.0, 0.65, elevation));
        float alignment = dot(ray, sunDirection);
        color += disc * pow(max(alignment, 0.0), 90.0) * 0.24;
        color = mix(color, disc * 2.5, smoothstep(0.9984, 0.9988, alignment));
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  sky.frustumCulled = false;
  sky.onBeforeRender = (renderer, scene, camera) => { sky.position.copy(camera.position); sky.updateMatrixWorld(); };
  const sunOffset = new THREE.Vector3();
  scene.add(skyLight, sun, sun.target, sky);
  function updateLighting(position) {
    sun.target.position.set(position.x, 0, position.z);
    sun.position.copy(sun.target.position).add(sunOffset);
  }
  function setTimeOfDay(name = 'golden') {
    const preset = TIME_PRESETS[name] ?? TIME_PRESETS.golden;
    scene.background = new THREE.Color(preset.sky);
    scene.fog = new THREE.Fog(preset.fog, 420, 2300);
    sun.color.set(preset.sun);
    sun.intensity = preset.power;
    sunOffset.set(...preset.angle);
    sky.material.uniforms.zenith.value.set(preset.sky);
    sky.material.uniforms.horizon.value.set(preset.fog);
    sky.material.uniforms.sunDirection.value.copy(sunOffset).normalize();
    updateLighting({ x: 1400, z: 1100 });
    skyLight.intensity = preset.ambient;
    lamps.forEach(lamp => { lamp.visible = preset.lamps; });
    city.timeOfDay = TIME_PRESETS[name] ? name : 'golden';
  }
  const city = {
    get swimAllowed() { return swimming; }, set swimAllowed(value) { swimming = value; },
    root, blockers, shadeZones, lamps, places: PLACES, districtAt, blocked, move, withinLand, addBlocker, setTimeOfDay, updateLighting,
    isShaded: (x, z) => shadeZones.some(s => s.radius ? Math.hypot(x - s.x, z - s.z) < s.radius : Math.abs(x - s.x) < s.halfX && Math.abs(z - s.z) < s.halfZ),
  };
  // Batch the static geometry by material and shape; signs and lamps remain separate.
  root.updateMatrixWorld(true);
  const batches = new Map();
  root.traverse(mesh => {
    if (!mesh.isMesh || mesh.userData.dynamic) return;
    const key = `${mesh.geometry.uuid}/${mesh.material.uuid}`;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(mesh);
  });
  for (const meshes of batches.values()) {
    const instanced = new THREE.InstancedMesh(meshes[0].geometry, meshes[0].material, meshes.length);
    instanced.castShadow = meshes.some(mesh => mesh.castShadow);
    instanced.receiveShadow = true;
    meshes.forEach((mesh, index) => { instanced.setMatrixAt(index, mesh.matrixWorld); mesh.removeFromParent(); });
    instanced.computeBoundingSphere();
    root.add(instanced);
  }
  setTimeOfDay('golden');
  return city;
}
