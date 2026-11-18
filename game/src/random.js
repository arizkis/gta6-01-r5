// Scope: repeatable placement, with streams kept separate from frame timing.
export function createRandom(seed = 17) {
  let state = seed >>> 0;
  const random = () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  random.range = (min, max) => min + random() * (max - min);
  random.pick = values => values[Math.floor(random() * values.length)];
  return random;
}
