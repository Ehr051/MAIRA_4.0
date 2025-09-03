#!/bin/bash
# 🧹 LIMPIEZA ESPECÍFICA MAIRA - Solo archivos de desarrollo propios
# Fecha: $(date)

echo "🔍 INICIANDO LIMPIEZA ESPECÍFICA DEL REPOSITORIO MAIRA"
echo "===================================================="

# Crear directorios de desarrollo
mkdir -p development/{testing,debugging,reports,scripts,tools}

echo ""
echo "📋 IDENTIFICANDO ARCHIVOS DE DESARROLLO MAIRA..."

# 1. INFORMES Y DOCUMENTACIÓN TEMPORAL ESPECÍFICA DE MAIRA
echo "📄 Moviendo informes específicos de MAIRA..."
[ -f "INFORME_AUDITORIA_COMPLETA.md" ] && mv "INFORME_AUDITORIA_COMPLETA.md" development/reports/
[ -f "INFORME_AUDITORIA_ACTUALIZADA.md" ] && mv "INFORME_AUDITORIA_ACTUALIZADA.md" development/reports/
[ -f "ELEVATION_HOTFIX_COMPLETED.md" ] && mv "ELEVATION_HOTFIX_COMPLETED.md" development/reports/
[ -f "DEPLOYMENT_RENDER.md" ] && mv "DEPLOYMENT_RENDER.md" development/reports/

# 2. SCRIPTS DE DEBUGGING ESPECÍFICOS DE MAIRA
echo "🔍 Moviendo scripts de debugging propios..."
[ -f "debug_console_script.js" ] && mv "debug_console_script.js" development/debugging/
[ -f "debug_storage.js" ] && mv "debug_storage.js" development/debugging/
[ -f "debug_partidas_console.py" ] && mv "debug_partidas_console.py" development/debugging/

# 3. ARCHIVOS DE TESTING PROPIOS
echo "🧪 Moviendo archivos de testing propios..."
[ -d "Client/js/Test" ] && mv "Client/js/Test" development/testing/
[ -f "static/debug-operaciones.html" ] && mv "static/debug-operaciones.html" development/testing/

# 4. SCRIPTS Y HERRAMIENTAS TEMPORALES
echo "🛠️ Moviendo scripts temporales..."
[ -f "verificar_estructura_db.py" ] && mv "verificar_estructura_db.py" development/scripts/
[ -f "crear_backup_completo.sh" ] && mv "crear_backup_completo.sh" development/scripts/
[ -f "backup_db_simple.sh" ] && mv "backup_db_simple.sh" development/scripts/
[ -f "monitor_tiempo_real.sh" ] && mv "monitor_tiempo_real.sh" development/scripts/
[ -f "configure-env.sh" ] && mv "configure-env.sh" development/scripts/

# 5. HERRAMIENTAS EN DEV-TOOLS
echo "🔧 Reorganizando dev-tools..."
if [ -d "dev-tools" ]; then
    mv dev-tools development/tools/
fi

# 6. ARCHIVOS DE CONFIGURACIÓN TEMPORAL
echo "⚙️ Moviendo configuraciones temporales..."
[ -f "uvicorn.conf.py" ] && mv "uvicorn.conf.py" development/tools/

# 7. SCRIPT DE AUDITORÍA PROPIO
echo "📊 Moviendo script de auditoría..."
[ -f "auditoria_completa.sh" ] && mv "auditoria_completa.sh" development/scripts/

echo ""
echo "📝 ACTUALIZANDO .gitignore..."

# Actualizar .gitignore para excluir development/
if ! grep -q "development/" .gitignore; then
    cat >> .gitignore << 'EOF'

# =====================================
# WORKSPACE DE DESARROLLO LOCAL
# =====================================
development/

# Scripts de desarrollo y testing
*_debug.js
*_test.html
debug_*.js
test_*.html
diagnostico_*.html
verificacion_*.js
auditoria_*.js

# Informes temporales  
INFORME_*.md
ANALISIS_*.md
PLAN_*.md

# Scripts temporales
prepare_*.py
setup_*.sh
convert_*.py
clean_*.py
monitor_*.sh
backup_*.sh
crear_backup_*.sh
verificar_*.py

# Archivos de configuración temporal
uvicorn.conf.py
render-*.yaml
EOF
fi

echo ""
echo "📊 GENERANDO RESUMEN..."

# Generar resumen
cat > development/README.md << 'EOF'
# 🛠️ DESARROLLO MAIRA

## 📁 Estructura

### `/testing/`
- **Test/**: Tests unitarios de MAIRA
- **debug-operaciones.html**: Panel de debug de operaciones

### `/debugging/`
- **debug_console_script.js**: Script de debugging para consola
- **debug_storage.js**: Verificador de localStorage
- **debug_partidas_console.py**: Debug de partidas en Python

### `/reports/`
- **INFORME_AUDITORIA_COMPLETA.md**: Auditoría completa del sistema
- **ELEVATION_HOTFIX_COMPLETED.md**: Reporte de corrección de elevación
- **DEPLOYMENT_RENDER.md**: Guía de deployment

### `/scripts/`
- **verificar_estructura_db.py**: Verificador de estructura de BD
- **crear_backup_completo.sh**: Script de backup
- **monitor_tiempo_real.sh**: Monitor en tiempo real
- **auditoria_completa.sh**: Script de auditoría

### `/tools/`
- **dev-tools/**: Herramientas de desarrollo previamente organizadas
- **uvicorn.conf.py**: Configuración temporal de uvicorn

## 🎯 Uso

**Para desarrollo local:**
```bash
# Ejecutar tests
cd development/testing/Test/
node testPlaneamiento.js

# Debugging
cd development/debugging/
python debug_partidas_console.py

# Scripts utilitarios
cd development/scripts/
./crear_backup_completo.sh
```

## ⚠️ Importante

Estos archivos están **excluidos del repositorio principal** via `.gitignore`.
Son herramientas para desarrollo local y testing.
EOF

echo ""
echo "✅ LIMPIEZA ESPECÍFICA COMPLETADA"
echo ""
echo "📊 RESUMEN:"
echo "   development/testing/    - Tests de MAIRA"
echo "   development/debugging/  - Scripts de debug"
echo "   development/reports/    - Informes de auditoría"
echo "   development/scripts/    - Scripts utilitarios"
echo "   development/tools/      - Herramientas dev"
echo ""
echo "📋 Ver: development/README.md"
echo ""
echo "🎯 RESULTADO:"
echo "   ✅ Solo archivos de desarrollo MAIRA organizados"
echo "   ✅ .gitignore actualizado con exclusiones"
echo "   ✅ Repositorio principal limpio"
echo "   ✅ Herramientas accesibles para desarrollo local"
echo ""
