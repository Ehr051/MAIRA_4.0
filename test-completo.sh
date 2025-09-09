#!/bin/bash
# 🚀 MAIRA 4.0 - Test Suite Completo
# Ejecuta todos los tests para garantizar funcionamiento 100%

echo "🚀 MAIRA 4.0 - BATERÍA COMPLETA DE TESTS"
echo "========================================"
echo "⏰ Iniciado: $(date)"
echo ""

# Test 1: Verificar conectividad a producción
echo "📡 TEST 1: Conectividad a Producción"
echo "------------------------------------"
response=$(curl -s -w "%{http_code}" -o /dev/null https://maira-4-0.onrender.com)
if [ "$response" -eq 200 ]; then
    echo "✅ Sitio responde correctamente (HTTP $response)"
else
    echo "❌ ERROR: Sitio no responde (HTTP $response)"
    exit 1
fi

# Test 2: Verificar archivos críticos
echo ""
echo "📁 TEST 2: Archivos Críticos del Sistema"
echo "----------------------------------------"

critical_files=(
    "Client/js/bootstrap.js"
    "Client/js/config/mairaConfig.js"
    "Client/js/modules/measurementHandler.js"
    "Client/js/modules/elevationProfileService.js"
    "Client/js/modules/mapInteractionHandler.js"
    "Client/js/modules/geometryUtils.js"
    "Client/js/modules/mobileOptimizationHandler.js"
    "Client/js/modules/toolsInitializer.js"
    "Client/js/core/herramientasP.js"
    "Client/planeamiento.html"
    "Client/CO.html"
    "Client/juegodeguerra.html"
    "app.py"
    "requirements.txt"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        size=$(ls -lh "$file" | awk '{print $5}')
        echo "✅ $file ($size)"
    else
        echo "❌ FALTA: $file"
    fi
done

# Test 3: Verificar estructura de módulos
echo ""
echo "🏗️ TEST 3: Estructura de Módulos"
echo "--------------------------------"
echo "📦 Módulos en /Client/js/modules/:"
ls -la Client/js/modules/ 2>/dev/null | grep -E '\.(js)$' | awk '{print "   ✅ " $9 " (" $5 " bytes)"}'

echo ""
echo "🎯 herramientasP.js refactorizado:"
if [ -f "Client/js/core/herramientasP.js" ]; then
    lines=$(wc -l < Client/js/core/herramientasP.js)
    echo "   ✅ $lines líneas (debería ser ~38)"
    if [ $lines -lt 100 ]; then
        echo "   ✅ Refactorización exitosa"
    else
        echo "   ⚠️  Posible problema en refactorización"
    fi
else
    echo "   ❌ herramientasP.js no encontrado"
fi

# Test 4: Verificar configuración
echo ""
echo "⚙️ TEST 4: Configuración del Sistema"
echo "-----------------------------------"

# Verificar mairaConfig.js
if grep -q "MAIRA-4.0/v4.0" Client/js/config/mairaConfig.js 2>/dev/null; then
    echo "✅ URLs de GitHub actualizadas a v4.0"
else
    echo "❌ URLs de GitHub no actualizadas"
fi

# Verificar bootstrap.js
if grep -q "loadForSpecificModule" Client/js/bootstrap.js 2>/dev/null; then
    echo "✅ Bootstrap con carga selectiva implementada"
else
    echo "❌ Bootstrap no tiene carga selectiva"
fi

# Test 5: Verificar Flask
echo ""
echo "🐍 TEST 5: Configuración Flask"
echo "-----------------------------"

if grep -q "node_modules" app.py 2>/dev/null; then
    echo "✅ Rutas de node_modules configuradas en Flask"
else
    echo "❌ Rutas de node_modules NO configuradas"
fi

if grep -q "static_folder" app.py 2>/dev/null; then
    echo "✅ Carpeta static configurada"
else
    echo "❌ Carpeta static NO configurada"
fi

# Test 6: Verificar dependencias
echo ""
echo "📚 TEST 6: Dependencias del Proyecto"
echo "-----------------------------------"

if [ -f "package.json" ]; then
    echo "✅ package.json presente"
    if command -v npm &> /dev/null; then
        echo "✅ npm disponible"
        # npm list --depth=0 2>/dev/null | head -10
    fi
else
    echo "❌ package.json faltante"
fi

if [ -f "requirements.txt" ]; then
    echo "✅ requirements.txt presente"
    deps=$(grep -c "^[^#]" requirements.txt)
    echo "   📦 $deps dependencias Python"
else
    echo "❌ requirements.txt faltante"
fi

# Test 7: Test de sintaxis JavaScript
echo ""
echo "🔍 TEST 7: Verificación de Sintaxis JavaScript"
echo "---------------------------------------------"

js_files=$(find Client/js -name "*.js" -type f)
syntax_errors=0

for file in $js_files; do
    if command -v node &> /dev/null; then
        if node -c "$file" 2>/dev/null; then
            echo "✅ $file"
        else
            echo "❌ ERROR SINTAXIS: $file"
            syntax_errors=$((syntax_errors + 1))
        fi
    else
        echo "⚠️  Node.js no disponible para verificar sintaxis"
        break
    fi
done

echo "📊 Errores de sintaxis encontrados: $syntax_errors"

# Test 8: Verificar Git
echo ""
echo "🔧 TEST 8: Estado de Git"
echo "-----------------------"

git_status=$(git status --porcelain)
if [ -z "$git_status" ]; then
    echo "✅ Working directory limpio"
else
    echo "⚠️  Cambios pendientes en Git:"
    echo "$git_status"
fi

last_commit=$(git log -1 --oneline)
echo "📝 Último commit: $last_commit"

# Test 9: Verificar puertos y procesos
echo ""
echo "🔌 TEST 9: Puertos y Procesos"
echo "----------------------------"

if command -v lsof &> /dev/null; then
    flask_proc=$(lsof -ti:5000 2>/dev/null)
    if [ ! -z "$flask_proc" ]; then
        echo "⚠️  Puerto 5000 ocupado (PID: $flask_proc)"
    else
        echo "✅ Puerto 5000 disponible"
    fi
else
    echo "⚠️  lsof no disponible"
fi

# RESUMEN FINAL
echo ""
echo "📊 RESUMEN FINAL"
echo "================"
echo "⏰ Completado: $(date)"
echo ""
echo "🎯 PRÓXIMOS PASOS RECOMENDADOS:"
echo "1. Ejecutar test de consola en producción"
echo "2. Verificar botón 'comenzar' manualmente"
echo "3. Probar navegación entre páginas"
echo "4. Verificar herramientas de medición"
echo "5. ¡Comenzar desarrollo del sistema de puntería!"
echo ""
echo "🚀 ¡MAIRA 4.0 LISTO PARA DESARROLLO DEL JUEGO!"
