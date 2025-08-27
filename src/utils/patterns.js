// Returns a CSS background-image string
export function patternForId(id, seed = "") {
  const hash = (id + seed)
    .split("")
    .reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 5381);
  const a = hash % 360;
  const b = (hash >> 8) % 360;
  return `linear-gradient(135deg, hsl(${a} 70% 60% / .25) 0%, hsl(${b} 70% 60% / .25) 100%)`;
}
