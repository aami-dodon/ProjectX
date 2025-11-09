const PERCENT_SCALE_THRESHOLD = 1;

function shouldScale(value) {
  return Math.abs(value) <= PERCENT_SCALE_THRESHOLD;
}

export function toPercentValue(rawValue) {
  if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
    return null;
  }

  const scaled = shouldScale(rawValue) ? rawValue * 100 : rawValue;
  return Math.round(scaled * 10) / 10;
}

export function formatPercent(rawValue) {
  const percent = toPercentValue(rawValue);
  return percent === null ? null : `${percent}%`;
}

export function formatPercentDelta(rawValue) {
  const percent = toPercentValue(rawValue);
  if (percent === null) {
    return null;
  }
  const prefix = percent > 0 ? "+" : "";
  return `${prefix}${percent}%`;
}
