#!/bin/bash
# Script para reorganizar y limpiar el repositorio MAIRA
# Mueve archivos a sus ubicaciones correctas y elimina archivos innecesarios

echo "🧹 REORGANIZANDO REPOSITORIO MAIRA"
echo "=================================="

# Crear directorios si no existen
mkdir -p docs
mkdir -p scripts  
mkdir -p tools
mkdir -p dev-tools
mkdir -p temp-cleanup

# Mover documentación importante a docs/
echo "📁 Moviendo documentación..."
mv MINI_TILES_SUCCESS.md docs/ 2>/dev/null
mv TESTING_GUIDE.md docs/ 2>/dev/null
mv README.md docs/ 2>/dev/null && cp docs/README.md . # Mantener copia en raíz

# Mover scripts de mini-tiles a scripts/
echo "🔧 Moviendo scripts principales..."
mv crear_mini_tiles.py scripts/ 2>/dev/null
mv servidor_demo.py scripts/ 2>/dev/null
mv test_urls.py scripts/ 2>/dev/null

# Mover herramientas de desarrollo a dev-tools/
echo "🛠️ Moviendo herramientas de desarrollo..."
mv maira_minitiles_integration.js dev-tools/ 2>/dev/null
mv mini_tiles_adapter.js dev-tools/ 2>/dev/null

# Mover archivos temporales para revisión
echo "📦 Moviendo archivos temporales..."
mv *-engineer.md temp-cleanup/ 2>/dev/null
mv *-developer.md temp-cleanup/ 2>/dev/null
mv *-specialist.md temp-cleanup/ 2>/dev/null
mv *-architect.md temp-cleanup/ 2>/dev/null
mv *-admin.md temp-cleanup/ 2>/dev/null
mv *-analyst.md temp-cleanup/ 2>/dev/null
mv *-auditor.md temp-cleanup/ 2>/dev/null
mv *-automator.md temp-cleanup/ 2>/dev/null
mv *-detective.md temp-cleanup/ 2>/dev/null
mv *-manager.md temp-cleanup/ 2>/dev/null
mv *-optimizer.md temp-cleanup/ 2>/dev/null
mv *-pro.md temp-cleanup/ 2>/dev/null
mv *-reviewer.md temp-cleanup/ 2>/dev/null
mv *-troubleshooter.md temp-cleanup/ 2>/dev/null

mv AGENTS.md temp-cleanup/ 2>/dev/null
mv agents-helper.sh temp-cleanup/ 2>/dev/null

mv ANALISIS_*.md temp-cleanup/ 2>/dev/null
mv PLAN_*.md temp-cleanup/ 2>/dev/null
mv AWS_S3_SETUP_GUIDE.md temp-cleanup/ 2>/dev/null
mv GITHUB_RELEASES_SETUP.md temp-cleanup/ 2>/dev/null
mv ALMACENAMIENTO_GRATUITO.md temp-cleanup/ 2>/dev/null
mv DEPLOYMENT*.md temp-cleanup/ 2>/dev/null
mv MIGRATION*.md temp-cleanup/ 2>/dev/null
mv ELEVATION_*.md temp-cleanup/ 2>/dev/null

# Mover archivos de testing temporal
mv test_*.html temp-cleanup/ 2>/dev/null
mv test_*.js temp-cleanup/ 2>/dev/null
mv debug_*.html temp-cleanup/ 2>/dev/null
mv diagnostico_*.html temp-cleanup/ 2>/dev/null
mv verificacion_*.js temp-cleanup/ 2>/dev/null
mv verificacion_*.html temp-cleanup/ 2>/dev/null

# Mover scripts temporales
mv prepare_*.py temp-cleanup/ 2>/dev/null
mv prepare_*.sh temp-cleanup/ 2>/dev/null
mv setup_*.sh temp-cleanup/ 2>/dev/null
mv convert_*.py temp-cleanup/ 2>/dev/null
mv clean_*.py temp-cleanup/ 2>/dev/null
mv auditoria_*.js temp-cleanup/ 2>/dev/null
mv correcciones_*.js temp-cleanup/ 2>/dev/null
mv dividir_*.py temp-cleanup/ 2>/dev/null
mv crear_provincias_*.py temp-cleanup/ 2>/dev/null

# Mover archivos de deploy temporal
mv render*.yaml temp-cleanup/ 2>/dev/null

# Mover archivos HTML temporales
mv documentacion.html temp-cleanup/ 2>/dev/null
mv estado_sistema_*.html temp-cleanup/ 2>/dev/null
mv gestionbatalla.html temp-cleanup/ 2>/dev/null
mv iniciarpartida.html temp-cleanup/ 2>/dev/null
mv inicioGB.html temp-cleanup/ 2>/dev/null
mv juegodeguerra.html temp-cleanup/ 2>/dev/null
mv planeamiento.html temp-cleanup/ 2>/dev/null
mv static-index.html temp-cleanup/ 2>/dev/null
mv demo_minitiles.html temp-cleanup/ 2>/dev/null

# Mover archivos de backup
mv *_backup.* temp-cleanup/ 2>/dev/null
mv *_old.* temp-cleanup/ 2>/dev/null
mv *_complete.* temp-cleanup/ 2>/dev/null

# Mover JS temporales
mv *_adapter.js temp-cleanup/ 2>/dev/null
mv *_config.js temp-cleanup/ 2>/dev/null
mv debug-panel*.js temp-cleanup/ 2>/dev/null
mv elevation_*.js temp-cleanup/ 2>/dev/null
mv external_*.js temp-cleanup/ 2>/dev/null
mv getServerUrl.js temp-cleanup/ 2>/dev/null
mv panel-debugger.js temp-cleanup/ 2>/dev/null
mv solucion_*.js temp-cleanup/ 2>/dev/null
mv temporary_*.js temp-cleanup/ 2>/dev/null

echo ""
echo "✅ REORGANIZACIÓN COMPLETADA"
echo ""
echo "📊 RESUMEN:"
echo "   docs/           - Documentación principal"
echo "   scripts/        - Scripts de mini-tiles"  
echo "   tools/          - Herramientas"
echo "   dev-tools/      - Herramientas de desarrollo"
echo "   temp-cleanup/   - Archivos temporales (revisar y eliminar)"
echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "1. Revisar temp-cleanup/ y eliminar lo que no necesites"
echo "2. Actualizar imports en archivos que usen los scripts movidos"
echo "3. Hacer commit de la estructura organizada"
echo "4. rm -rf temp-cleanup/ cuando estés seguro"

# Mostrar contenido de temp-cleanup
echo ""
echo "📦 ARCHIVOS EN temp-cleanup/:"
ls -la temp-cleanup/ 2>/dev/null | head -20
