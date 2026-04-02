/**
 * Fisher-Yates shuffle with seeded PRNG for deterministic randomization.
 * Uses a simple linear congruential generator (LCG) so the same seed
 * always produces the same shuffle order — needed for scoring after submit.
 *
 * @param {Array} array - The array to shuffle (NOT mutated)
 * @param {number} seed - Integer seed for reproducibility
 * @returns {{ shuffled: Array, order: number[] }} - Shuffled array and index mapping
 */
const seededShuffle = (array, seed) => {
  const arr = [...array];
  const order = arr.map((_, i) => i);

  /* LCG parameters (Numerical Recipes values) */
  let s = seed;
  const next = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };

  /* Fisher-Yates using seeded random */
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
    [order[i], order[j]] = [order[j], order[i]];
  }

  return { shuffled: arr, order };
};

/**
 * Generate a random integer seed.
 */
const generateSeed = () => Math.floor(Math.random() * 2147483647);

module.exports = { seededShuffle, generateSeed };
