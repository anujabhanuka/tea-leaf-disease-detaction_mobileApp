export function confidencePercent(value: number) {
  const percent = value <= 1 ? value * 100 : value;
  return Math.round(Math.min(Math.max(percent, 0), 100));
}
