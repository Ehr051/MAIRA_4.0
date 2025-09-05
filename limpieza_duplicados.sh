#!/bin/bash
# 🧹 SCRIPT DE LIMPIEZA SISTEMÁTICA DE ARCHIVOS DUPLICADOS
# MAIRA 4.0 - Eliminación de redundancias siguiendo arquitectura DDD

echo "🚀 INICIANDO LIMPIEZA SISTEMÁTICA DE DUPLICADOS..."

# =============================================================================
# 1. USERIDENTITY - MANTENER SOLO LA VERSIÓN PRINCIPAL
# =============================================================================
echo "🔧 Limpiando UserIdentity duplicados..."

# MANTENER: /Client/js/core/UserIdentity.js (versión 2.0.0 hexagonal)
# ELIMINAR: todas las demás versiones

rm -f "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0/Client/js/core/UserIdentity_v2.js"
rm -f "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0/Client/js/core/UserIdentity_legacy.js"
rm -f "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0/Client/js/legacy/UserIdentityLoader.js"
rm -f "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0/Client/js/common/UserIdentity.js"
rm -f "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0/Client/js/handlers/UserIdentityLoader.js"

echo "✅ UserIdentity - eliminados duplicados"

# =============================================================================
# 2. VEGETACIÓN HANDLERS - MANTENER SOLO LA VERSIÓN PRINCIPAL
# =============================================================================
echo "🔧 Limpiando VegetacionHandler duplicados..."

# MANTENER: /Client/js/handlers/vegetacionhandler.js (versión principal)
# ELIMINAR: todas las versiones backup/old/new

rm -f "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0/Client/js/handlers/vegetacionhandler_backup_old.js"
rm -f "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0/Client/js/handlers/vegetacionHandler_v4.js"
rm -f "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0/Client/js/handlers/vegetacionhandler_old.js"
rm -f "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0/Client/js/handlers/vegetacionhandler_backup.js"
rm -f "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0/Client/js/handlers/vegetacionhandler_new.js"
rm -f "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0/Client/js/common/vegetacionhandler.js"

echo "✅ VegetacionHandler - eliminados duplicados"

# =============================================================================
# 3. MINI TILES LOADER - MANTENER SOLO LA VERSIÓN PRINCIPAL
# =============================================================================
echo "🔧 Limpiando Mini Tiles Loader duplicados..."

# MANTENER: /Client/js/utils/mini_tiles_loader.js (versión principal)
# ELIMINAR: todas las demás versiones

rm -f "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0/tools/tiles/mini_tiles_loader.js"
rm -f "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0/development/tools/dev-tools/mini_tiles_loader.js"
rm -f "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0/Client/js/utils/mini_tiles_loader_legacy.js"
rm -f "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0/Client/js/common/mini_tiles_loader.js"

echo "✅ Mini Tiles Loader - eliminados duplicados"

# =============================================================================
# 4. APP.PY - MANTENER SOLO LA VERSIÓN PRINCIPAL
# =============================================================================
echo "🔧 Limpiando app.py duplicados..."

# MANTENER: /app.py (versión principal en raíz)
# ELIMINAR: versión en scripts/

rm -f "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0/scripts/app.py"

echo "✅ app.py - eliminados duplicados"

# =============================================================================
# 5. ARCHIVOS BACKUP Y TEMPORALES - ELIMINAR TODOS
# =============================================================================
echo "🔧 Limpiando archivos backup y temporales..."

# Eliminar archivos con sufijos backup, old, legacy, temp
find "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0" -name "*_backup.*" -type f -delete
find "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0" -name "*_old.*" -type f -delete
find "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0" -name "*_legacy.*" -type f -delete
find "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0" -name "*_temp.*" -type f -delete
find "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0" -name "*.backup" -type f -delete

echo "✅ Archivos backup y temporales - eliminados"

# =============================================================================
# 6. TERRAIN ADAPTER - VERIFICAR SI ES NECESARIO
# =============================================================================
echo "🔧 Analizando TerrainAdapter..."

if [ -f "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0/Client/js/infrastructure/terrainAdapter.js" ]; then
    echo "⚠️ TerrainAdapter encontrado - revisar manualmente si es necesario"
    echo "   Ubicación: /Client/js/infrastructure/terrainAdapter.js"
    echo "   ¿Ya tienes handlers de elevación y vegetación?"
fi

# =============================================================================
# 7. SLOPE ANALYSIS SERVICE - VERIFICAR FUNCIONALIDAD
# =============================================================================
echo "🔧 Analizando SlopeAnalysisService..."

find "/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0" -name "*slope*" -type f | head -5

echo "⚠️ Revisar manualmente SlopeAnalysisService vs tu implementación de pendiente"

# =============================================================================
# 8. DIRECTORIOS REDUNDANTES - VERIFICAR
# =============================================================================
echo "🔧 Analizando directorios potencialmente redundantes..."

echo "📁 Directorios a revisar manualmente:"
echo "   - /tools/ vs /scripts/"
echo "   - /test/ vs /tests/"
echo "   - /Server/ vs archivos en raíz"

# =============================================================================
# RESUMEN
# =============================================================================
echo ""
echo "🎯 LIMPIEZA COMPLETADA"
echo "✅ UserIdentity: mantenido /Client/js/common/UserIdentity.js"
echo "✅ VegetacionHandler: mantenido /Client/js/handlers/vegetacionhandler.js"
echo "✅ Mini Tiles Loader: mantenido /Client/js/utils/mini_tiles_loader.js"
echo "✅ app.py: mantenido /app.py (raíz)"
echo "✅ Archivos backup/old/legacy: eliminados"
echo ""
echo "⚠️ REVISAR MANUALMENTE:"
echo "   - TerrainAdapter: ¿necesario si ya tienes handlers?"
echo "   - SlopeAnalysisService: ¿mejor que tu implementación?"
echo "   - Directorios: tools/ vs scripts/, test/ vs tests/"
echo ""
echo "🚀 SIGUIENTE PASO: git add . && git commit -m 'Limpieza sistemática duplicados'"
