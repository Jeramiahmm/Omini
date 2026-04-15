-- Run this in the Neon SQL Editor to set up the database.
-- Dashboard: https://console.neon.tech → your project → SQL Editor

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS stops (
  id SERIAL PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routes (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  total_distance DOUBLE PRECISION NOT NULL,
  total_duration DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS route_stops (
  id SERIAL PRIMARY KEY,
  route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  stop_id INTEGER NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_route_stops_route_id ON route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_stop_id ON route_stops(stop_id);
