// Scope: six ordered job definitions, unlock state and job board presentation.
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
      button.disabled = !unlocked || complete;
      button.dataset.job = job.id;
      button.addEventListener('click', () => { state.requestedJobId = job.id; onRequest?.(job); });
      card.append(heading, meta, description, button);
      board.append(card);
    });
  }
  return { state, definitions: JOB_DEFINITIONS, isUnlocked, renderBoard };
}
