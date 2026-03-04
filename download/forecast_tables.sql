-- Crear tabla ForecastEntry si no existe

CREATE TABLE IF NOT EXISTS "ForecastEntry" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha TIMESTAMP NOT NULL,
  "turnoId" UUID NOT NULL REFERENCES "Turno"(id),
  "restauranteId" UUID NOT NULL REFERENCES "Restaurante"(id),
  "canalId" UUID NOT NULL REFERENCES "Canal"(id),
  "tipoDiaId" UUID NOT NULL REFERENCES "TipoDia"(id),
  "paxTeorico" FLOAT,
  "paxReal" FLOAT,
  "ventaTeorica" FLOAT,
  "ventaReal" FLOAT,
  "ticketTeorico" FLOAT,
  "ticketReal" FLOAT,
  semana INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  trimestre INTEGER NOT NULL,
  año INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT forecast_entry_unique UNIQUE (fecha, "turnoId", "restauranteId", "canalId")
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_forecast_fecha ON "ForecastEntry"(fecha);
CREATE INDEX IF NOT EXISTS idx_forecast_restaurante ON "ForecastEntry"("restauranteId");
CREATE INDEX IF NOT EXISTS idx_forecast_canal ON "ForecastEntry"("canalId");
CREATE INDEX IF NOT EXISTS idx_forecast_turno ON "ForecastEntry"("turnoId");
