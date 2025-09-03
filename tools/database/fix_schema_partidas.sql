-- SCRIPT MIGRACIÓN TABLA PARTIDAS
-- Arreglar esquema para compatibilidad con endpoints

-- 1. Agregar columnas faltantes
ALTER TABLE partidas 
ADD COLUMN IF NOT EXISTS max_jugadores INTEGER DEFAULT 8;

ALTER TABLE partidas 
ADD COLUMN IF NOT EXISTS jugadores_unidos INTEGER DEFAULT 0;

-- 2. Actualizar jugadores_unidos basado en datos reales
UPDATE partidas SET jugadores_unidos = (
    SELECT COUNT(*) 
    FROM usuarios_partida up 
    WHERE up.partida_id = partidas.id
);

-- 3. Establecer max_jugadores por defecto donde sea NULL
UPDATE partidas SET max_jugadores = 8 WHERE max_jugadores IS NULL;

-- 4. Opcional: Eliminar columna antigua si no se usa
-- ALTER TABLE partidas DROP COLUMN IF EXISTS jugadores_actuales;

-- Verificar estructura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'partidas'
ORDER BY ordinal_position;
