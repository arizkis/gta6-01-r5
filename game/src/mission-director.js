// Six sequential contact jobs, delivery cargo, timers, checkpoints and payouts.
import * as THREE from '../vendor/three.min.js';
import { streetRoute, distance } from './navigation.js';
export const JOB_DEFINITIONS = [
  { id: 'cooler-caper', name: 'The Cooler Caper', contact: 'Tavi Moss', contactId: 'tavi', faction: 'MECHANIC', pay: 280, fullPay: true, description: 'Meet Tavi at Lantern Fest. Reclaim the freezer van from Sunspur Impound, then bring the cooler to Tavi at Tin Cup Pier.', stages: ['Meet Tavi', 'Reclaim the freezer van', 'Deliver the cooler at Tin Cup Pier'] },
  { id: 'market-dash', name: 'A Market of Minutes', contact: 'Niko Vale', contactId: 'niko', faction: 'FIXER', pay: 220, description: 'Load fruit crates at Marigold Market and deliver them across town before the timer runs out.', stages: ['Meet Niko', 'Collect fruit crates', 'Make the timed delivery'] },
  { id: 'buoy-business', name: 'Buoy Business', contact: 'Paz Sol', contactId: 'paz', faction: 'FENCE', pay: 240, description: 'Take a beach errand to a marked swimmer buoy off Sunspur Strand and return to Paz.', stages: ['Meet Paz', 'Reach the marked buoy', 'Return to Paz'] },
  { id: 'last-cold-light', name: 'Last Cold Light', contact: 'Tavi Moss', contactId: 'tavi', faction: 'MECHANIC', pay: 380, description: 'Keep a second cooler shipment intact on a dusk run across the causeway.', stages: ['Collect the cooler', 'Cross the causeway at dusk', 'Deliver the shipment'] },
  { id: 'five-district-flyer', name: 'Five District Flyer', contact: 'Niko Vale', contactId: 'niko', faction: 'FIXER', pay: 420, description: 'Pass a checkpoint in each of Sunspur Bay’s five districts against the clock.', stages: ['Meet Niko', 'Clear all five districts', 'Finish before time runs out'] },
  { id: 'lantern-mile', name: 'The Lantern Mile', contact: 'Paz Sol', contactId: 'paz', faction: 'FENCE', pay: 500, description: 'Carry a night lantern delivery from Lantern Fest all the way to Tin Cup Pier.', stages: ['Collect festival lanterns', 'Drive the night route', 'Deliver to Tin Cup Pier'] },
];

export function createMissionDirector(board, onRequest) {
  const state = { active: false, jobId: null, name: '', objective: '', stage: 0, stageCount: 3, next: '', completed: [], requestedJobId: null };
  const isUnlocked = index => index === 0 || state.completed.includes(JOB_DEFINITIONS[index - 1].id);
  function renderBoard() {
    board.replaceChildren();
    if (state.completed.length === 6) {
      const thanks = document.createElement('p'); thanks.className = 'board-complete';
      thanks.textContent = 'SIX FAVORS PAID / Sunspur knows your name. The bay is yours to roam.';
      board.append(thanks);
    }
    JOB_DEFINITIONS.forEach((job, index) => {
      const unlocked = isUnlocked(index), complete = state.completed.includes(job.id);
      const card = document.createElement('article');
      card.className = `job-card${unlocked ? ' unlocked' : ' locked'}`;
      const heading = document.createElement('h3');
      heading.textContent = `${String(index + 1).padStart(2, '0')} / ${job.name}`;
      const meta = document.createElement('p');
      meta.className = 'job-meta';
      meta.textContent = `${job.contact} · ${job.faction} · $${job.pay}${job.fullPay ? ' full' : ''}`;
      const description = document.createElement('p');
      description.className = 'job-description';
      description.textContent = job.description;
      const button = document.createElement('button');
      button.textContent = complete ? 'COMPLETED' : unlocked ? 'TAKE THE JOB' : 'LOCKED';
      button.disabled = !unlocked || complete || state.active;
      button.dataset.job = job.id;
      button.addEventListener('click', () => { state.requestedJobId = job.id; onRequest?.(job); });
      card.append(heading, meta, description, button);
      board.append(card);
    });
  }
  let game, current, targets = [], routeAge = 0;
  const checkpointPoints = [{ x: 680, z: 720 }, { x: 1120, z: 1600 }, { x: 2000, z: 1600 }, { x: 2440, z: 2040 }, { x: 1560, z: 720 }];
  const openings = {
    tavi: ['That van has my lunch in it. And a very expensive compressor.', 'Impound kept the keys. I kept the spare. Be gentle with the cooler.', 'Meet me at Tin Cup Pier. The shade is free; the favor pays.'],
    niko: ['Morning fruit deserves an afternoon arrival.', 'Keep the crates level, Juno. Bruised peaches start arguments.', 'Take the long streets if you need them. I left room on the clock.'],
    paz: ['The tide brought a little work in with it.', 'Bring it back in one piece. We pay for care around here.', 'I’ll be at the pier, pretending this is a day off.'],
  };
  const marker = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(12, 15, 32), new THREE.MeshBasicMaterial({ color: '#ffcf88', side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
  ring.rotation.x = -Math.PI / 2; marker.add(ring);
  const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(4), new THREE.MeshBasicMaterial({ color: '#ffdb9d' }));
  diamond.position.y = 20; marker.add(diamond);
  function bind(context) { game = context; game.scene.add(marker); }
  function target() { return targets[state.stage]; }
  function contactHome() {
    const tavi = game.crowd.contacts.find(c => c.id === 'tavi');
    tavi.position.set(tavi.x, 1.5, tavi.z);
  }
  function setStage(stage) {
    state.stage = stage; state.stageCount = targets.length;
    const t = target(); if (!t) return;
    state.objective = t.label;
    game.city.swimAllowed = current.id === 'buoy-business' && stage > 0;
    state.next = targets[stage + 1]?.label ?? 'Collect your pay';
    if (current.id === 'cooler-caper' && stage >= 2) state.next = 'Reach Tin Cup Pier';
    if (current.id === 'cooler-caper' && stage >= 2) game.crowd.contacts.find(c => c.id === 'tavi').position.set(2150, 1.5, 2260);
    game.state.navigation.target = t.point;
    game.state.navigation.route = streetRoute(game.player.position, t.point);
    routeAge = 1;
  }
  function accept(job, force = false) {
    const index = JOB_DEFINITIONS.indexOf(job);
    if (!force && (state.active || state.completed.includes(job.id) || !isUnlocked(index))) return false;
    contactHome(); current = job;
    game.state.cooler.active = false; state.lanterns = false; state.crates = false;
    Object.assign(state, { active: true, jobId: job.id, requestedJobId: job.id, name: job.name.toUpperCase(), stage: 0, timer: null, runTime: 0, receipt: '' });
    const contact = game.crowd.contacts.find(c => c.id === job.contactId);
    const meet = { label: `Talk to ${job.contact}`, point: contact.position, talk: true };
    const pier = { label: 'Reach Tin Cup Pier', point: { x: 2150, z: 2260 }, finish: true };
    const pickup = (label, x, z) => ({ label, point: { x, z } });
    if (index === 0) targets = [meet, { label: 'Take the freezer van at Sunspur Impound', point: game.freezerVan.position, van: true }, { label: 'Lose the patrols / break their line of sight', point: { x: 2150, z: 2260 }, escape: true }, pier];
    if (index === 1) targets = [meet, pickup('Collect the fruit crates', 1370, 610), { label: 'Deliver fruit to Citrus Green', point: { x: 550, z: 720 }, finish: true }];
    if (index === 2) targets = [meet, pickup('Reach the orange swimmer buoy / swim from the Strand', 2750, 1840), { label: 'Return to Paz at the pier', point: contact.position, finish: true }];
    if (index === 3) targets = [meet, pickup('Collect the second cooler at Tavi’s Workshop', 1780, 1470), pickup('Cross the coastal causeway', 2150, 2040), pier];
    if (index === 4) targets = [meet, ...checkpointPoints.map((point, i) => ({ label: `Checkpoint ${i + 1}/5 / ${['Citrus Commons', 'Old Salt Quarter', 'Tideworks', 'Sunspur Strand', 'Marigold Market'][i]}`, point })), { label: 'Return the timecard to Niko', point: contact.position, finish: true }];
    if (index === 5) targets = [meet, pickup('Collect glowing lanterns at Lantern Fest', 1838, 940), pier];
    if (index === 3) game.city.setTimeOfDay('dusk');
    if (index === 5) game.city.setTimeOfDay('night');
    game.city.swimAllowed = index === 2;
    setStage(0); game.showScreen('play');
    game.hud.notify(`${job.contact} has a favor. Follow the gold diamond.`, 5);
    return true;
  }
  function talk(contact) {
    if (state.active && current.contactId === contact.id && state.stage === 0) {
      game.dialogue.say(contact, openings[contact.id]); setStage(1);
      if (current.id === 'five-district-flyer') state.timer = 480;
      return;
    }
    const offer = JOB_DEFINITIONS.find((job, i) => job.contactId === contact.id && isUnlocked(i) && !state.completed.includes(job.id));
    if (!state.active && offer) {
      accept(offer); game.dialogue.say(contact, [`Got a minute, Juno? ${offer.name}. That’s the favor.`, 'Call it accepted. I saved your place on the board.']);
      setStage(1);
      if (offer.id === 'five-district-flyer') state.timer = 480;
    } else game.dialogue.say(contact, ['Sun’s still up somewhere, Juno. Take your time coming home.', state.active ? 'Finish that favor first. We can talk after.' : 'All square between us. That feels nice.']);
  }
  function finish() {
    const c = game.state.cooler, full = !c.active || c.integrity >= 99.99;
    const pay = c.active ? Math.round(c.basePay * c.integrity / 100) : current.pay;
    const bonus = c.active && full ? ' · COLD BONUS / pristine cargo' : c.active ? ` · ${Math.round(c.integrity)}% cargo integrity` : '';
    game.player.state.cash += pay;
    game.player.state.respect[current.faction] = Math.min(100, game.player.state.respect[current.faction] + 45);
    if (!state.completed.includes(current.id)) state.completed.push(current.id);
    if (current.id === 'five-district-flyer') game.player.state.bestTime = Math.min(game.player.state.bestTime ?? Infinity, state.runTime);
    state.receipt = `${current.name.toUpperCase()} / +$${pay}${bonus}`;
    game.hud.notify(state.receipt, 12);
    const contact = game.crowd.contacts.find(c => c.id === current.contactId);
    game.dialogue.say(contact, [full ? 'Look at that. Just how I hoped it would arrive.' : 'A few knocks, a little warm. We can still use it.', `Here’s $${pay}, Juno.${full && c.active ? ' Cold bonus. You earned it.' : ' Thanks for seeing it through.'}`]);
    state.active = false; state.lanterns = false; state.crates = false; c.active = false; state.timer = null;
    game.state.navigation.target = null; game.state.navigation.route = [];
    game.city.swimAllowed = false;
    game.services.save(false); renderBoard();
  }
  function fail(message) {
    state.active = false; state.lanterns = false; state.crates = false; state.timer = null; game.state.cooler.active = false;
    game.state.navigation.target = null; game.state.navigation.route = [];
    game.city.swimAllowed = false; game.hud.notify(`${message} / The board will hold the favor for you.`, 7);
  }
  function update(dt) {
    marker.visible = state.active;
    if (!state.active) return;
    const t = target();
    marker.position.set(t.point.x, 1.9, t.point.z); diamond.rotation.y += dt; diamond.position.y = 23 + Math.sin(game.state.elapsed * 2) * 3;
    if (state.timer !== null) { state.timer -= dt; state.runTime += dt; if (state.timer <= 0) { fail('TIME UP'); return; } }
    routeAge -= dt;
    if (routeAge <= 0) { game.state.navigation.route = streetRoute(game.player.position, t.point); routeAge = 1; }
    if (t.talk) return;
    if (t.van) {
      if (game.player.vehicle !== game.freezerVan) return;
      game.cargo.start(current.pay, game.freezerVan); game.police.crime(2, 'IMPOUND VAN RECOVERED', true);
      const tavi = game.crowd.contacts.find(c => c.id === 'tavi'); tavi.position.set(2150, 1.5, 2260);
      setStage(state.stage + 1); return;
    }
    if (t.escape) { if (game.state.wanted.level === 0) setStage(state.stage + 1); return; }
    if (distance(game.player.position, t.point) > 25 || Math.abs(game.player.vehicle?.speed ?? 0) > 18) return;
    if (t.finish) { finish(); return; }
    if (current.id === 'market-dash' && state.stage === 1) { state.timer = 300; state.crates = true; game.hud.notify('Fruit crates loaded / 5 minutes. Plenty of room to breathe.'); }
    if (current.id === 'last-cold-light' && state.stage === 1) { game.cargo.start(current.pay, game.player.vehicle); game.police.crime(3, 'COLD SHIPMENT LOCATED', true); }
    if (current.id === 'lantern-mile' && state.stage === 1) { state.lanterns = true; game.police.crime(4, 'FESTIVAL ROUTE / AIR SUPPORT', true); }
    setStage(state.stage + 1);
  }
  return { state, definitions: JOB_DEFINITIONS, isUnlocked, renderBoard, bind, accept, talk, update, setStage, finish, fail, marker, get targets() { return targets; } };
}
