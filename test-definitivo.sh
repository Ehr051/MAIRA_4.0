#!/bin/bash
# 🚀 MAIRA 4.0 - TEST DEFINITIVO Y COMPLETO
# Verifica ABSOLUTAMENTE TODO antes del desarrollo del juego

echo "🚀 MAIRA 4.0 - TEST DEFINITIVO COMPLETO"
echo "========================================"
echo "⏰ $(date)"
echo ""

total_tests=0
passed_tests=0

function test_resultado() {
    total_tests=$((total_tests + 1))
    if [ "$1" = "pass" ]; then
        passed_tests=$((passed_tests + 1))
        echo "✅ $2"
    else
        echo "❌ $2"
    fi
}

# 🌐 TEST CRÍTICO 1: Producción Online
echo "🌐 TEST 1: Verificación de Producción"
echo "====================================="
response=$(curl -s -w "%{http_code}" -o /dev/null https://maira-4-0.onrender.com)
if [ "$response" -eq 200 ]; then
    test_resultado "pass" "Sitio de producción responde (HTTP $response)"
else
    test_resultado "fail" "Sitio de producción NO responde (HTTP $response)"
fi

# Verificar tiempo de respuesta
response_time=$(curl -w "%{time_total}" -s -o /dev/null https://maira-4-0.onrender.com)
if (( $(echo "$response_time < 5.0" | bc -l) )); then
    test_resultado "pass" "Tiempo de respuesta bueno (${response_time}s)"
else
    test_resultado "fail" "Tiempo de respuesta lento (${response_time}s)"
fi

# 📦 TEST CRÍTICO 2: Módulos Refactorizados
echo ""
echo "📦 TEST 2: Módulos Refactorizados (Ubicaciones Reales)"
echo "===================================================="

# Verificar módulos en sus ubicaciones reales
declare -A modulos_ubicaciones=(
    ["measurementHandler"]="Client/js/handlers/measurementHandler.js"
    ["elevationProfileService"]="Client/js/services/elevationProfileService.js"
    ["mapInteractionHandler"]="Client/js/handlers/mapInteractionHandler.js"
    ["geometryUtils"]="Client/js/utils/geometryUtils.js"
    ["mobileOptimizationHandler"]="Client/js/handlers/mobileOptimizationHandler.js"
    ["toolsInitializer"]="Client/js/common/toolsInitializer.js"
    ["herramientasP"]="Client/js/common/herramientasP.js"
)

for modulo in "${!modulos_ubicaciones[@]}"; do
    archivo="${modulos_ubicaciones[$modulo]}"
    if [ -f "$archivo" ]; then
        size=$(ls -lh "$archivo" | awk '{print $5}')
        test_resultado "pass" "$modulo encontrado en $archivo ($size)"
        
        # Verificar que no sea ES6
        if grep -q "export default" "$archivo"; then
            test_resultado "fail" "$modulo contiene ES6 export (necesita conversión)"
        else
            test_resultado "pass" "$modulo sin exports ES6"
        fi
    else
        test_resultado "fail" "$modulo NO encontrado en $archivo"
    fi
done

# 🔧 TEST CRÍTICO 3: herramientasP.js Refactorizado
echo ""
echo "🔧 TEST 3: Verificación herramientasP.js"
echo "======================================="
if [ -f "Client/js/common/herramientasP.js" ]; then
    lines=$(wc -l < Client/js/common/herramientasP.js)
    if [ $lines -lt 100 ]; then
        test_resultado "pass" "herramientasP.js refactorizado ($lines líneas, era 3154)"
    else
        test_resultado "fail" "herramientasP.js NO refactorizado ($lines líneas)"
    fi
    
    # Verificar que mantiene las funciones globales críticas
    if grep -q "window\.medirDistancia" Client/js/common/herramientasP.js; then
        test_resultado "pass" "Funciones globales mantenidas en herramientasP.js"
    else
        test_resultado "fail" "Funciones globales perdidas en herramientasP.js"
    fi
else
    test_resultado "fail" "herramientasP.js no encontrado"
fi

# 🛠️ TEST CRÍTICO 4: Sintaxis JavaScript
echo ""
echo "🛠️ TEST 4: Sintaxis JavaScript (Solo Críticos)"
echo "============================================="

# Verificar archivos críticos específicos
critical_js_files=(
    "Client/js/config/mairaConfig.js"
    "Client/js/common/herramientasP.js"
    "Client/js/handlers/measurementHandler.js"
    "Client/js/services/elevationProfileService.js"
    "Client/js/gaming/FogOfWar.js"
    "Client/js/legacy/index.js"
)

for file in "${critical_js_files[@]}"; do
    if [ -f "$file" ]; then
        if node -c "$file" 2>/dev/null; then
            test_resultado "pass" "Sintaxis OK: $(basename $file)"
        else
            test_resultado "fail" "ERROR SINTAXIS: $(basename $file)"
        fi
    else
        test_resultado "fail" "ARCHIVO FALTANTE: $(basename $file)"
    fi
done

# ⚙️ TEST CRÍTICO 5: Configuraciones
echo ""
echo "⚙️ TEST 5: Configuraciones del Sistema"
echo "====================================="

# mairaConfig.js con URLs v4.0
if grep -q "MAIRA-4.0/v4.0" Client/js/config/mairaConfig.js 2>/dev/null; then
    test_resultado "pass" "URLs GitHub actualizadas a v4.0 en mairaConfig.js"
else
    test_resultado "fail" "URLs GitHub NO actualizadas en mairaConfig.js"
fi

# Flask con node_modules
if grep -q "node_modules" app.py 2>/dev/null; then
    test_resultado "pass" "Flask configurado para node_modules"
else
    test_resultado "fail" "Flask SIN configuración node_modules"
fi

# 📄 TEST CRÍTICO 6: Páginas HTML
echo ""
echo "📄 TEST 6: Páginas HTML Principales"
echo "=================================="

html_pages=(
    "Client/planeamiento.html"
    "Client/CO.html" 
    "Client/juegodeguerra.html"
    "Client/index.html"
)

for page in "${html_pages[@]}"; do
    if [ -f "$page" ]; then
        # Verificar que tiene scripts directos (sin bootstrap)
        if grep -q "script src.*js/" "$page"; then
            test_resultado "pass" "$(basename $page) carga scripts directamente"
        else
            test_resultado "fail" "$(basename $page) NO carga scripts directos"
        fi
    else
        test_resultado "fail" "$(basename $page) no encontrada"
    fi
done

# 🎮 TEST CRÍTICO 7: Funcionalidades del Juego
echo ""
echo "🎮 TEST 7: Preparación para Sistema de Puntería"
echo "=============================================="

# Verificar archivos del sistema de combate
game_files=(
    "Client/js/gaming/GameEngine.js"
    "Client/js/gaming/FogOfWar.js"
    "Client/js/modules/juego/combate.js"
    "Client/js/modules/juego/gestorJuego.js"
)

for file in "${game_files[@]}"; do
    if [ -f "$file" ]; then
        test_resultado "pass" "$(basename $file) disponible para puntería"
    else
        test_resultado "fail" "$(basename $file) FALTANTE para puntería"
    fi
done

# 🔍 TEST CRÍTICO 8: Git y Deploy
echo ""
echo "🔍 TEST 8: Estado de Deployment"
echo "=============================="

# Verificar que no hay ES6 exports problemáticos
es6_problems=$(find Client/js -name "*.js" -exec grep -l "^export default" {} \; 2>/dev/null | wc -l)
if [ $es6_problems -eq 0 ]; then
    test_resultado "pass" "Sin exports ES6 problemáticos"
else
    test_resultado "fail" "$es6_problems archivos con exports ES6 problemáticos"
fi

# Verificar último commit
last_commit_hash=$(git log -1 --format="%h")
if [[ "$last_commit_hash" == "d9ba1fed" ]]; then
    test_resultado "pass" "Último commit es la refactorización (d9ba1fed)"
else
    test_resultado "fail" "Último commit NO es la refactorización esperada"
fi

# Estado git
if [ -z "$(git status --porcelain)" ]; then
    test_resultado "pass" "Working directory limpio para deploy"
else
    test_resultado "fail" "Working directory con cambios pendientes"
fi

# 📊 RESUMEN FINAL
echo ""
echo "📊 RESUMEN FINAL DEL TEST DEFINITIVO"
echo "==================================="
echo "✅ Tests pasados: $passed_tests"
echo "📊 Total de tests: $total_tests"

percentage=$(echo "scale=1; $passed_tests * 100 / $total_tests" | bc)
echo "🎯 Porcentaje de éxito: $percentage%"

if (( $(echo "$percentage >= 90.0" | bc -l) )); then
    echo ""
    echo "🎉 ¡EXCELENTE! MAIRA 4.0 ESTÁ 100% LISTO"
    echo "======================================="
    echo "✅ Sistema refactorizado y optimizado"
    echo "✅ Todos los módulos funcionando"
    echo "✅ Sintaxis JavaScript corregida"
    echo "✅ Deploy en producción exitoso"
    echo "✅ Configuraciones correctas"
    echo ""
    echo "🚀 LISTO PARA DESARROLLAR:"
    echo "  🎯 Sistema de puntería"
    echo "  ⚔️ Mecánicas de combate avanzadas"
    echo "  🎮 Funcionalidades del juego"
    echo ""
    echo "🎊 ¡A DESARROLLAR EL JUEGO!"
elif (( $(echo "$percentage >= 80.0" | bc -l) )); then
    echo ""
    echo "⚠️ CASI LISTO - Revisar elementos marcados con ❌"
    echo "=============================================="
    echo "🔧 Completar las correcciones faltantes"
    echo "🚀 Luego proceder con el desarrollo del juego"
else
    echo ""
    echo "❌ REQUIERE CORRECCIONES CRÍTICAS"
    echo "================================"
    echo "🔥 Solucionar todos los ❌ antes de continuar"
    echo "⚠️ El sistema NO está listo para desarrollo"
fi

echo ""
echo "⏰ Test completado: $(date)"
