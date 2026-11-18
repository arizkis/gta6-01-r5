// Nonlethal actions: a shove, workshop wrench and refillable festival water toy.
import { distance } from './navigation.js';
export function createWeapons(game) {
  let cooldown = 0;
  const taps = [{ x: 2150, z: 2190 }, { x: 1410, z: 640 }];
  function use() {
    const { player, crowd, police, effects, hud } = game, p = player.state;
    if (cooldown > 0 || player.vehicle || game.state.screen !== 'play') return false;
    cooldown = p.weapon === 2 ? 0.16 : 0.5;
    const origin = { x: player.position.x + Math.sin(player.heading) * 6, y: 9, z: player.position.z + Math.cos(player.heading) * 6 };
    if (p.weapon === 2) {
      if (p.tank < 2) { hud.notify('Tank empty / refill by a blue tap or at Tin Cup Pier.'); return false; }
      p.tank -= 2;
      for (let i = 0; i < 4; i++) effects.puff(origin, '#9be9f2', 0.6, 0.5, { x: Math.sin(player.heading) * 80, y: 3 - i, z: Math.cos(player.heading) * 80 });
      const hit = { x: origin.x + Math.sin(player.heading) * 25, z: origin.z + Math.cos(player.heading) * 25 };
      crowd.scare(hit, 75);
      if (police.units.some(u => distance(u.position, player.position) < 200)) police.crime(1, 'FESTIVAL TOY / PUBLIC DISTURBANCE');
    } else {
      player.arms[1].rotation.x = -1.6;
      crowd.scare(origin, 25);
      const car = game.vehicles.find(v => distance(v.position, origin) < 24);
      if (car && p.weapon === 1) { car.condition = Math.max(0, car.condition - 8); effects.burst(origin, 8); police.crime(1, 'VEHICLE DAMAGED'); }
    }
    return true;
  }
  function update(dt) {
    cooldown = Math.max(0, cooldown - dt);
    if (game.keys.has('KeyR') || game.keys.has('Mouse0')) use();
    if (taps.some(t => distance(t, game.player.position) < 25)) game.player.state.tank = Math.min(100, game.player.state.tank + dt * 35);
  }
  return { use, update, taps };
}
