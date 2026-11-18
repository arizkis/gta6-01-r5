// Three original generative stations and a quiet dial position; no audio assets.
export function createRadio(game) {
  const stations = [
    { name: 'SUNSPUR FM', wave: 'triangle', bpm: 108, notes: [0, 4, 7, 9, 7, 4, 2, 7], root: 220 },
    { name: 'MARLIN TALK', wave: 'sine', bpm: 76, notes: [0, 2, 0, -3, 5, 2, -3, -5], root: 146.83 },
    { name: 'TIDEWAVE', wave: 'square', bpm: 124, notes: [0, 3, 7, 10, 12, 10, 7, 3], root: 164.81 },
  ];
  let context = null, master = null, index = -1, beat = 0, next = 0;
  function unlock() {
    if (!context) { const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) return; context = new Audio(); master = context.createGain(); master.gain.value = 0.055; master.connect(context.destination); }
    if (context.state === 'suspended') context.resume().catch(() => {});
  }
  function cycle() { unlock(); index = (index + 2) % 4 - 1; beat = 0; next = context?.currentTime ?? 0; }
  function tone(freq, start, length, type, volume) {
    const osc = context.createOscillator(), gain = context.createGain(); osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(volume, start + 0.015); gain.gain.exponentialRampToValueAtTime(0.001, start + length);
    osc.connect(gain); gain.connect(master); osc.start(start); osc.stop(start + length + 0.03);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  function update() {
    const playing = !!game.player.vehicle && game.state.screen === 'play';
    game.state.radio.station = index < 0 ? 'OFF / STATIC' : stations[index].name;
    if (master) master.gain.setTargetAtTime(playing ? 0.055 : 0, context.currentTime, 0.1);
    if (!playing || index < 0 || !context || context.state !== 'running') return;
    const station = stations[index], duration = 60 / station.bpm / 2;
    if (next < context.currentTime) next = context.currentTime + 0.01;
    while (next < context.currentTime + 0.12) {
      tone(station.root * 2 ** (station.notes[beat % 8] / 12), next, duration * 0.75, station.wave, 0.5);
      if (beat % 2 === 0) tone(station.root / 2, next, duration * 1.5, 'sine', 0.7);
      beat++; next += duration;
    }
  }
  return { unlock, cycle, update, get context() { return context; }, get index() { return index; } };
}
