const SIGNAL_TIMEOUT_MS = 5 * 60 * 1000;

function evaluateTemperature(temperature, threshold) {
  if (!Number.isFinite(temperature) || !threshold) {
    throw new TypeError('A numeric temperature and cargo threshold are required');
  }
  if (temperature < threshold.min_temp_c || temperature > threshold.max_temp_c) {
    return { status: 'critical', severity: 'critical' };
  }
  const nearLimit = temperature - threshold.min_temp_c <= 2
    || threshold.max_temp_c - temperature <= 2;
  return nearLimit
    ? { status: 'warning', severity: 'warning' }
    : { status: 'safe', severity: null };
}

function getDelaySeverity(elapsedMs, safeMinutes) {
  if (!Number.isFinite(elapsedMs) || !Number.isFinite(safeMinutes) || safeMinutes <= 0) {
    throw new TypeError('A valid elapsed time and safe transit limit are required');
  }
  const ratio = elapsedMs / (safeMinutes * 60 * 1000);
  if (ratio < 0.8) return null;
  return ratio > 1 ? 'critical' : 'warning';
}

module.exports = { SIGNAL_TIMEOUT_MS, evaluateTemperature, getDelaySeverity };
