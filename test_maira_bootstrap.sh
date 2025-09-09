#!/bin/bash

# 🔍 MAIRA Bootstrap Testing Suite
# Script para verificar todos los módulos sistemáticamente

echo "🔍 MAIRA BOOTSTRAP TESTING SUITE"
echo "================================="

MAIRA_URL="https://maira-4-0.onrender.com"

# Función para verificar si una URL responde correctamente
check_url() {
    local url="$1"
    local expected_content="$2"
    local description="$3"
    
    echo -n "🔍 $description: "
    
    response=$(curl -s "$url")
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$http_code" = "200" ]; then
        if [[ "$response" == *"$expected_content"* ]]; then
            echo "✅ OK"
            return 0
        else
            echo "❌ FAIL - Contenido incorrecto"
            echo "   Esperado: $expected_content"
            echo "   Recibido: ${response:0:100}..."
            return 1
        fi
    else
        echo "❌ FAIL - HTTP $http_code"
        return 1
    fi
}

# Función para verificar archivos JavaScript críticos
check_js_file() {
    local file_path="$1"
    local description="$2"
    
    echo -n "📄 $description: "
    
    url="$MAIRA_URL/js/$file_path"
    response=$(curl -s "$url")
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    content_type=$(curl -s -I "$url" | grep -i content-type | cut -d' ' -f2-)
    
    if [ "$http_code" = "200" ]; then
        if [[ "$content_type" == *"javascript"* ]]; then
            if [[ "$response" == *"<html>"* ]] || [[ "$response" == *"<!DOCTYPE"* ]]; then
                echo "❌ FAIL - Recibiendo HTML en lugar de JS"
                return 1
            else
                echo "✅ OK - JavaScript válido"
                return 0
            fi
        else
            echo "❌ FAIL - Content-Type incorrecto: $content_type"
            return 1
        fi
    else
        echo "❌ FAIL - HTTP $http_code"
        return 1
    fi
}

# 1. VERIFICAR PÁGINAS PRINCIPALES
echo ""
echo "📋 FASE 1: Verificación de páginas principales"
echo "=============================================="

check_url "$MAIRA_URL" "MAIRA - Mesa de Arena" "Index.html"
check_url "$MAIRA_URL/planeamiento.html" "MAIRA - Planeamiento" "Planeamiento.html"
check_url "$MAIRA_URL/CO.html" "Cuadro de Organización" "CO.html"
check_url "$MAIRA_URL/iniciarpartida.html" "Inicio de Partida" "IniciarPartida.html"
check_url "$MAIRA_URL/juegodeguerra.html" "Juego de Guerra" "JuegoDeGuerra.html"
check_url "$MAIRA_URL/inicioGB.html" "Sala de Operaciones" "InicioGB.html"
check_url "$MAIRA_URL/gestionbatalla.html" "Gestión de Batalla" "GestionBatalla.html"

# 2. VERIFICAR BOOTSTRAP Y ARCHIVOS CRÍTICOS
echo ""
echo "📋 FASE 2: Verificación de archivos JavaScript críticos"
echo "======================================================="

check_js_file "bootstrap.js" "Bootstrap principal"
check_js_file "utils/diagnostic.js" "Herramienta de diagnóstico"
check_js_file "core/UserIdentity.js" "Primer archivo de carga"
check_js_file "handlers/dependency-manager.js" "Dependency manager"

# 3. VERIFICAR RUTAS DE MÓDULOS ESPECÍFICOS
echo ""
echo "📋 FASE 3: Verificación de archivos específicos por módulo"
echo "=========================================================="

# HOME
check_js_file "utils/config.js" "Config (HOME)"
check_js_file "ui/carrusel.js" "Carrusel (HOME)"

# PLANEAMIENTO
check_js_file "common/indexP.js" "IndexP (PLANEAMIENTO)"
check_js_file "common/mapaP.js" "MapaP (PLANEAMIENTO)"

# ORGANIZACION
check_js_file "modules/organizacion/CO.js" "CO principal (ORGANIZACION)"

# PARTIDAS
check_js_file "modules/partidas/iniciarpartida.js" "IniciarPartida (PARTIDAS)"

# JUEGO
check_js_file "modules/juego/gestorJuego.js" "GestorJuego (JUEGO)"

# INICIOGB
check_js_file "modules/gestion/inicioGBhandler.js" "InicioGB handler"

# GESTION BATALLA
check_js_file "modules/gestion/gestionBatalla.js" "GestionBatalla principal"

# 4. VERIFICAR DEPENDENCIAS EXTERNAS
echo ""
echo "📋 FASE 4: Verificación de dependencias externas"
echo "================================================"

check_url "$MAIRA_URL/node_modules/jquery/dist/jquery.min.js" "jQuery" "jQuery desde node_modules"
check_url "$MAIRA_URL/node_modules/bootstrap/dist/js/bootstrap.min.js" "Bootstrap" "Bootstrap desde node_modules"
check_url "$MAIRA_URL/node_modules/leaflet/dist/leaflet.js" "Leaflet" "Leaflet desde node_modules"

# 5. TEST DE DIAGNÓSTICO EN TIEMPO REAL
echo ""
echo "📋 FASE 5: Test de diagnóstico en tiempo real"
echo "============================================="

echo "🔍 Ejecutando diagnóstico desde index.html..."

# Crear un script temporal para inyectar en la página
cat > /tmp/maira_test.js << 'EOF'
// Test de diagnóstico
async function testMAIRABootstrap() {
    console.log('🔍 EJECUTANDO TEST MAIRA BOOTSTRAP...');
    
    // Test 1: Verificar disponibilidad
    if (typeof MAIRABootstrap === 'undefined') {
        console.error('❌ MAIRABootstrap no disponible');
        return false;
    }
    
    // Test 2: Verificar carga de módulo
    try {
        await MAIRABootstrap.loadForModule('home');
        console.log('✅ Módulo home cargado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error cargando módulo home:', error);
        return false;
    }
}

// Ejecutar test
testMAIRABootstrap().then(result => {
    if (result) {
        console.log('🎉 BOOTSTRAP FUNCIONANDO CORRECTAMENTE');
    } else {
        console.error('💥 BOOTSTRAP CON PROBLEMAS');
    }
});
EOF

# Nota: Este script se ejecutará en el browser, no podemos capturar el resultado aquí

# 6. RESUMEN FINAL
echo ""
echo "📋 RESUMEN DE TESTING"
echo "===================="
echo "✅ Si todos los tests pasaron, el problema puede estar en:"
echo "   - Timing de carga (archivos cargan pero no en el orden correcto)"
echo "   - Dependencias circulares"
echo "   - Errores de JavaScript en el browser"
echo ""
echo "❌ Si algunos tests fallaron, revisar:"
echo "   - Rutas del servidor"
echo "   - Content-Type de archivos JavaScript"
echo "   - Archivos que devuelven HTML en lugar de JS"
echo ""
echo "🔍 Próximos pasos:"
echo "   1. Abrir ${MAIRA_URL} en browser"
echo "   2. Abrir Developer Tools (F12)"
echo "   3. Ver Console para errores de JavaScript"
echo "   4. Ver Network tab para requests fallidos"
echo "   5. Ejecutar window.MAIRADiagnostic.runAllTests() manualmente"

echo ""
echo "🏁 Testing completo. Revisar resultados arriba."
