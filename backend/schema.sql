CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('operator', 'driver', 'farmer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
  vehicle_id SERIAL PRIMARY KEY,
  registration_number TEXT NOT NULL UNIQUE,
  cargo_type TEXT NOT NULL,
  owner_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  driver_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS readings (
  reading_id BIGSERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  temperature_c DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('safe', 'warning', 'critical'))
);

CREATE TABLE IF NOT EXISTS alerts (
  alert_id BIGSERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
  reading_id BIGINT REFERENCES readings(reading_id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('temperature', 'delay', 'signal_loss')),
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
  acknowledged_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deliveries (
  delivery_id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  cargo_type TEXT NOT NULL,
  pickup_point TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  estimated_arrival TIMESTAMPTZ NOT NULL,
  actual_arrival TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_transit', 'completed', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS reports (
  report_id SERIAL PRIMARY KEY,
  delivery_id INTEGER NOT NULL REFERENCES deliveries(delivery_id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cargo_thresholds (
  cargo_type TEXT PRIMARY KEY,
  min_temp_c DOUBLE PRECISION NOT NULL,
  max_temp_c DOUBLE PRECISION NOT NULL,
  transit_limit_minutes INTEGER NOT NULL CHECK (transit_limit_minutes > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (min_temp_c < max_temp_c)
);

CREATE INDEX IF NOT EXISTS readings_vehicle_timestamp_idx
  ON readings (vehicle_id, "timestamp" DESC);
CREATE INDEX IF NOT EXISTS alerts_vehicle_created_idx
  ON alerts (vehicle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS alerts_unacknowledged_idx
  ON alerts (created_at DESC) WHERE acknowledged_at IS NULL;
CREATE INDEX IF NOT EXISTS deliveries_vehicle_status_idx
  ON deliveries (vehicle_id, status);

INSERT INTO cargo_thresholds (cargo_type, min_temp_c, max_temp_c, transit_limit_minutes)
VALUES
  ('Dairy', 2, 6, 360),
  ('Produce', 2, 10, 720),
  ('Meat', -2, 4, 480),
  ('Frozen', -25, -18, 600),
  ('Fish', -1, 2, 360)
ON CONFLICT (cargo_type) DO NOTHING;
