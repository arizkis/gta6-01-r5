// Scope: a north-up local map with world, route, target, police and search layers.
import { WORLD, STREETS, PLACES } from './config.js';

export function createMinimap(canvas, city) {
  const ctx = canvas.getContext('2d'), size = canvas.width;
  const scale = size / 1250, center = size / 2;
  function draw(player, contacts, navigation = {}, wanted = {}) {
    const position = player.vehicle?.position ?? player.position;
    const px = x => center + (x - position.x) * scale;
    const pz = z => center + (z - position.z) * scale;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath(); ctx.arc(center, center, center, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#3d929b'; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#8da590'; ctx.fillRect(px(0), pz(0), WORLD.landX * scale, WORLD.landZ * scale);
    ctx.fillStyle = '#d9c19a';
    ctx.fillRect(px(2580), pz(0), 140 * scale, 2200 * scale);
    ctx.fillRect(px(0), pz(2100), 2720 * scale, 100 * scale);
    ctx.fillStyle = '#b08b6d'; ctx.fillRect(px(2118), pz(2170), 64 * scale, 365 * scale);
    ctx.fillStyle = '#526c73';
    for (const x of STREETS.x) ctx.fillRect(px(x - 56), pz(0), 112 * scale, 2200 * scale);
    for (const z of STREETS.z) ctx.fillRect(px(0), pz(z - 56), 2720 * scale, 112 * scale);
    ctx.strokeStyle = '#d1c19a'; ctx.lineWidth = 1; ctx.setLineDash([4, 5]);
    for (const x of STREETS.x) { ctx.beginPath(); ctx.moveTo(px(x), pz(0)); ctx.lineTo(px(x), pz(2200)); ctx.stroke(); }
    for (const z of STREETS.z) { ctx.beginPath(); ctx.moveTo(px(0), pz(z)); ctx.lineTo(px(2720), pz(z)); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.fillStyle = '#c2b59f';
    for (const b of city.blockers) if (b.kind === 'building') ctx.fillRect(px(b.x - b.halfX), pz(b.z - b.halfZ), b.halfX * 2 * scale, b.halfZ * 2 * scale);
    ctx.fillStyle = '#b7d2a1'; ctx.fillRect(px(335), pz(375), 250 * scale, 220 * scale);
    const search = wanted.search ?? navigation.search;
    if (search?.radius) {
      const c = search.center ?? search;
      ctx.fillStyle = '#ed9baf33'; ctx.strokeStyle = '#ed9baf'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px(c.x), pz(c.z), search.radius * scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    if (navigation.route?.length) {
      ctx.strokeStyle = '#ffd391'; ctx.lineWidth = 6; ctx.lineJoin = 'round';
      ctx.beginPath(); navigation.route.forEach((p, i) => i ? ctx.lineTo(px(p.x), pz(p.z)) : ctx.moveTo(px(p.x), pz(p.z))); ctx.stroke();
    }
    for (const unit of wanted.units ?? []) {
      const p = unit.position ?? unit;
      const heading = unit.heading ?? 0;
      if (unit.visionRange) {
        const angle = Math.PI / 2 - heading, spread = unit.visionSpread ?? 0.5;
        ctx.fillStyle = '#ed9baf40'; ctx.beginPath(); ctx.moveTo(px(p.x), pz(p.z));
        ctx.arc(px(p.x), pz(p.z), unit.visionRange * scale, angle - spread, angle + spread); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#f599b2'; ctx.strokeStyle = '#173e49'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px(p.x), pz(p.z), 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    function marker(point, text, color, clamp = false) {
      let x = px(point.x), z = pz(point.z);
      const distance = Math.hypot(x - center, z - center), max = center - 21;
      if (clamp && distance > max) { x = center + (x - center) * max / distance; z = center + (z - center) * max / distance; }
      ctx.fillStyle = color; ctx.strokeStyle = '#173e49'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, z, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#173e49'; ctx.fillText(text, x, z + 1);
    }
    marker(PLACES.safehouse, 'H', '#c9d4b3');
    contacts.forEach(contact => marker(contact, contact.name[0], contact.color, true));
    if (navigation.target) marker(navigation.target, '◆', '#ffe4a5', true);
    ctx.save(); ctx.translate(center, center); ctx.rotate(Math.PI - player.heading);
    ctx.fillStyle = '#fff0cf'; ctx.strokeStyle = '#173e49'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(10, 12); ctx.lineTo(0, 7); ctx.lineTo(-10, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore(); ctx.restore();
  }
  return { draw };
}
