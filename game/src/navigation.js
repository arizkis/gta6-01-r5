// Street-aligned waypoints shared by delivery routes and patrol navigation.
import { STREETS } from './config.js';
export const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const nearest = (values, value) => values.reduce((best, x) => Math.abs(x - value) < Math.abs(best - value) ? x : best);
export function streetRoute(from, to) {
  const a = { x: nearest(STREETS.x, from.x), z: nearest(STREETS.z, from.z) };
  const b = { x: nearest(STREETS.x, to.x), z: nearest(STREETS.z, to.z) };
  const enter = Math.abs(from.x - a.x) < Math.abs(from.z - a.z) ? { x: a.x, z: from.z } : { x: from.x, z: a.z };
  const leave = Math.abs(to.x - b.x) < Math.abs(to.z - b.z) ? { x: b.x, z: to.z } : { x: to.x, z: b.z };
  return [{ x: from.x, z: from.z }, enter, a, { x: b.x, z: a.z }, b, leave, { x: to.x, z: to.z }].filter((p, i, all) => !i || distance(p, all[i - 1]) > 2);
}
