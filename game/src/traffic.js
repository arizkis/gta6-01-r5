// Scope: civilian cars following block loops, with a following-distance stop rule.
import { STREETS, SPEEDS } from './config.js';
import { createVehicle, MODELS, syncVehicleBlocker } from './vehicles.js';
import { createRandom } from './random.js';

export function createTraffic(scene, city, seed = 17) {
  const rng = createRandom(seed + 311);
  const cars = [];
  for (let i = 0; i < 14; i++) {
    const ix = i % 5, iz = Math.floor(i / 5) % 4;
    const left = STREETS.x[ix] - 23, right = STREETS.x[ix + 1] + 23;
    const top = STREETS.z[iz] - 23, bottom = STREETS.z[iz + 1] + 23;
    const route = [{ x: left, z: top }, { x: left, z: bottom }, { x: right, z: bottom }, { x: right, z: top }];
    const edge = i % 4, a = route[edge], b = route[(edge + 1) % 4], t = rng.range(0.1, 0.8);
    const car = createVehicle(scene, { id: `traffic-${i}`, traffic: true, model: rng.pick(MODELS), color: rng.pick(['#dba8be', '#f2c57b', '#82b6ad', '#e7d7b0']), x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, heading: Math.atan2(b.x - a.x, b.z - a.z) });
    car.route = route;
    car.routeIndex = (edge + 1) % 4;
    car.cruise = SPEEDS.traffic + rng.range(-9, 9);
    car.state = 'cruise';
    car.blocker = city.addBlocker(car.position.x, car.position.z, car.model.width, car.model.length, 'traffic', car);
    cars.push(car);
  }
  function update(dt, vehicles, player) {
    for (const car of cars) {
      if (car.occupied || !car.traffic) continue;
      const target = car.route[car.routeIndex];
      const dx = target.x - car.position.x, dz = target.z - car.position.z;
      const distance = Math.hypot(dx, dz);
      const nx = dx / (distance || 1), nz = dz / (distance || 1);
      let stopped = vehicles.some(other => {
        if (other === car) return false;
        const ox = other.position.x - car.position.x, oz = other.position.z - car.position.z;
        const ahead = ox * nx + oz * nz, lateral = Math.abs(ox * nz - oz * nx);
        return ahead > 0 && ahead < 47 && lateral < 16;
      });
      if (!player.vehicle && Math.hypot(player.position.x - car.position.x, player.position.z - car.position.z) < 26) stopped = true;
      car.state = stopped ? 'waiting' : 'cruise';
      const desired = stopped ? 0 : car.cruise;
      car.speed += (desired - car.speed) * Math.min(1, dt * (stopped ? 8 : 2));
      const step = Math.min(distance, car.speed * dt);
      if (city.move(car.position, nx * step, nz * step, 7, car)) car.speed = 0;
      car.heading = Math.atan2(nx, nz);
      car.mesh.rotation.y = car.heading;
      car.wheels.forEach(wheel => { wheel.rotation.x += step / 3; });
      syncVehicleBlocker(car);
      if (distance < 3) car.routeIndex = (car.routeIndex + 1) % car.route.length;
    }
  }
  return { cars, update };
}
