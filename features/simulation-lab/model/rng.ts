export interface Range {
  min: number;
  max: number;
}

export interface SeededRandom {
  next: () => number;
  int: (min: number, max: number) => number;
  chance: (probability: number) => boolean;
  pick: <T>(items: T[]) => T;
}

const normalizeSeed = (seed: number | string): number => {
  const input = String(seed);
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const mulberry32 = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

export const createSeededRandom = (seed: number | string): SeededRandom => {
  const random = mulberry32(normalizeSeed(seed));

  return {
    next: () => random(),
    int: (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min,
    chance: (probability: number) => random() < probability,
    pick: <T>(items: T[]) => items[Math.floor(random() * items.length)]
  };
};

export const randomAt = (seed: number | string, ...parts: Array<string | number>): number => (
  createSeededRandom([seed, ...parts].join('|')).next()
);

export const sampleRange = (range: Range, random: SeededRandom, digits = 2): number => {
  const value = range.min + ((range.max - range.min) * random.next());
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export const clamp = (value: number, min: number, max: number): number => (
  Math.min(max, Math.max(min, value))
);
