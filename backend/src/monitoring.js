const { SIGNAL_TIMEOUT_MS, getDelaySeverity } = require('./domain');

async function createAlertIfOpen(client, vehicleId, readingId, alertType, severity) {
  const existing = await client.query(
    `SELECT alert_id, severity FROM alerts
     WHERE vehicle_id = $1 AND alert_type = $2 AND acknowledged_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [vehicleId, alertType]
  );
  if (existing.rowCount) {
    if (existing.rows[0].severity !== 'critical' && severity === 'critical') {
      await client.query('UPDATE alerts SET severity = $1 WHERE alert_id = $2', [
        severity, existing.rows[0].alert_id
      ]);
    }
    return;
  }
  await client.query(
    `INSERT INTO alerts (vehicle_id, reading_id, alert_type, severity)
     VALUES ($1, $2, $3, $4)`,
    [vehicleId, readingId, alertType, severity]
  );
}

async function checkStaleSignals(db, now = new Date()) {
  const cutoff = new Date(now.getTime() - SIGNAL_TIMEOUT_MS);
  const stale = await db.query(
    `SELECT v.vehicle_id, r.reading_id
     FROM vehicles v
     LEFT JOIN LATERAL (
       SELECT reading_id, "timestamp" FROM readings
       WHERE vehicle_id = v.vehicle_id
       ORDER BY "timestamp" DESC LIMIT 1
     ) r ON TRUE
     WHERE v.status = 'active'
       AND COALESCE(r."timestamp", v.created_at) < $1`,
    [cutoff]
  );
  for (const vehicle of stale.rows) {
    await createAlertIfOpen(db, vehicle.vehicle_id, vehicle.reading_id, 'signal_loss', 'critical');
  }
}

async function checkDeliveryDelays(db, now = new Date()) {
  const active = await db.query(
    `SELECT d.vehicle_id, d.departure_time, t.transit_limit_minutes
     FROM deliveries d
     JOIN cargo_thresholds t ON t.cargo_type = d.cargo_type
     WHERE d.status = 'in_transit'`
  );
  for (const delivery of active.rows) {
    const elapsed = now.getTime() - new Date(delivery.departure_time).getTime();
    const severity = getDelaySeverity(elapsed, delivery.transit_limit_minutes);
    if (severity) await createAlertIfOpen(db, delivery.vehicle_id, null, 'delay', severity);
  }
}

async function runMonitoring(db) {
  await checkStaleSignals(db);
  await checkDeliveryDelays(db);
}

module.exports = { createAlertIfOpen, checkStaleSignals, checkDeliveryDelays, runMonitoring };
