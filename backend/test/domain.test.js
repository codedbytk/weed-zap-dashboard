const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateTemperature, getDelaySeverity, SIGNAL_TIMEOUT_MS } = require('../src/domain');

const produce = { min_temp_c: 2, max_temp_c: 10 };

test('safe temperature is more than two degrees from either cargo limit', () => {
  assert.deepEqual(evaluateTemperature(6, produce), { status: 'safe', severity: null });
});

test('temperature within two degrees of a cargo limit warns', () => {
  assert.deepEqual(evaluateTemperature(3.5, produce), { status: 'warning', severity: 'warning' });
});

test('temperature beyond either cargo limit is critical', () => {
  assert.deepEqual(evaluateTemperature(10.1, produce), { status: 'critical', severity: 'critical' });
  assert.deepEqual(evaluateTemperature(1.9, produce), { status: 'critical', severity: 'critical' });
});

test('delay alerts at 80 percent and becomes critical after the transit limit', () => {
  const safeTime = 100 * 60 * 1000;
  assert.equal(getDelaySeverity(safeTime * 0.79, 100), null);
  assert.equal(getDelaySeverity(safeTime * 0.8, 100), 'warning');
  assert.equal(getDelaySeverity(safeTime * 1.01, 100), 'critical');
});

test('signal loss monitoring uses a five-minute timeout', () => {
  assert.equal(SIGNAL_TIMEOUT_MS, 300000);
});
