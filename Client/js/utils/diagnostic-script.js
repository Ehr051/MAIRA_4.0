/**
 * 🔍 SCRIPT DE DIAGNÓSTICO COMPLETO PARA MAIRA 4.0
 * Copia y pega en la consola del navegador para detectar problemas
 */

function diagnosticoCompleto() {
    console.clear();
    console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO MAIRA 4.0');
    console.log('='.repeat(60));
    
    // 1. VERIFICAR MÓDULOS PRINCIPALES
    console.log('\n📦 1. MÓDULOS PRINCIPALES:');
    const modulosPrincipales = {
        'window.mapa': window.mapa,
        'window.calcoActivo': window.calcoActivo,
        'window.L (Leaflet)': window.L,
        'window.measurementHandler': window.measurementHandler,
        'window.MAIRABootstrap': window.MAIRABootstrap,
        'window.searchHandler': window.searchHandler
    };
    
    Object.entries(modulosPrincipales).forEach(([nombre, modulo]) => {
        console.log(`${modulo ? '✅' : '❌'} ${nombre}:`, modulo ? 'DISPONIBLE' : 'NO ENCONTRADO');
    });
    
    // 2. VERIFICAR FUNCIONES CRÍTICAS
    console.log('\n🔧 2. FUNCIONES CRÍTICAS:');
    const funcionesCriticas = [
        'medirDistancia',
        'initializeBuscarLugar',
        'agregarMarcador',
        'inicializarMapa',
        'crearLinea',
        'obtenerCalcoActivo',
        'calcularMarcha'
    ];
    
    funcionesCriticas.forEach(func => {
        const existe = typeof window[func] === 'function';
        console.log(`${existe ? '✅' : '❌'} ${func}():`, existe ? 'DISPONIBLE' : 'NO ENCONTRADA');
    });
    
    // 3. VERIFICAR ELEMENTOS HTML
    console.log('\n🏗️ 3. ELEMENTOS HTML CRÍTICOS:');
    const elementosHTML = {
        'busquedaLugar': document.getElementById('busquedaLugar'),
        'btnBuscarLugar': document.getElementById('btnBuscarLugar'),
        'btnMedirDistancia': document.getElementById('btnMedirDistancia'),
        'calculoMarchaPanel': document.getElementById('calculoMarchaPanel'),
        'search-container': document.getElementById('search-container'),
        'mapa': document.getElementById('mapa')
    };
    
    Object.entries(elementosHTML).forEach(([id, elemento]) => {
        console.log(`${elemento ? '✅' : '❌'} #${id}:`, elemento ? 'ENCONTRADO' : 'NO ENCONTRADO');
        if (elemento && elemento.style.display === 'none') {
            console.log(`   ⚠️ Elemento oculto (display: none)`);
        }
    });
    
    // 4. VERIFICAR EVENTOS DE MAPA
    console.log('\n🗺️ 4. ESTADO DEL MAPA:');
    if (window.mapa) {
        console.log('✅ Mapa inicializado');
        console.log('📍 Centro:', window.mapa.getCenter());
        console.log('🔍 Zoom:', window.mapa.getZoom());
        console.log('🎛️ Eventos registrados:', Object.keys(window.mapa._events || {}));
        
        // Verificar capas
        const capas = window.mapa._layers ? Object.keys(window.mapa._layers).length : 0;
        console.log('🗂️ Capas activas:', capas);
        
        // Verificar controles
        const controles = window.mapa._controlContainer ? 
            window.mapa._controlContainer.children.length : 0;
        console.log('🎮 Controles activos:', controles);
    } else {
        console.log('❌ Mapa no inicializado');
    }
    
    // 5. VERIFICAR CSS CRÍTICOS
    console.log('\n🎨 5. ESTILOS CRÍTICOS:');
    const estilosCriticos = [
        'leaflet.css',
        'planeamiento.css',
        'style.css',
        'graficomarcha.css'
    ];
    
    const hojas = Array.from(document.styleSheets);
    estilosCriticos.forEach(css => {
        const encontrado = hojas.some(hoja => 
            hoja.href && hoja.href.includes(css)
        );
        console.log(`${encontrado ? '✅' : '❌'} ${css}:`, encontrado ? 'CARGADO' : 'NO ENCONTRADO');
    });
    
    // 6. VERIFICAR ERRORES EN CONSOLA
    console.log('\n🚨 6. DIAGNÓSTICO DE ERRORES:');
    
    // Interceptar errores temporalmente
    const erroresOriginales = [];
    const originalError = console.error;
    console.error = function(...args) {
        erroresOriginales.push(args.join(' '));
        originalError.apply(console, args);
    };
    
    // Ejecutar pruebas rápidas
    try {
        if (window.mapa) {
            window.mapa.getZoom();
        }
        console.log('✅ Mapa funcional');
    } catch (e) {
        console.log('❌ Error en mapa:', e.message);
    }
    
    try {
        if (typeof medirDistancia === 'function') {
            // No ejecutar, solo verificar sintaxis
            medirDistancia.toString();
        }
        console.log('✅ medirDistancia sintaxis OK');
    } catch (e) {
        console.log('❌ Error en medirDistancia:', e.message);
    }
    
    // Restaurar console.error
    console.error = originalError;
    
    // 7. SUGERENCIAS DE SOLUCIÓN
    console.log('\n💡 7. SUGERENCIAS DE SOLUCIÓN:');
    
    if (!window.measurementHandler) {
        console.log('🔧 Ejecutar: await MAIRABootstrap.loadForModule("planeamiento")');
    }
    
    if (!window.mapa) {
        console.log('🔧 Ejecutar: inicializarMapa()');
    }
    
    if (!document.getElementById('btnMedirDistancia')) {
        console.log('🔧 Verificar que planeamiento.html tiene el botón de medición');
    }
    
    console.log('\n📋 8. COMANDOS ÚTILES PARA PROBAR:');
    console.log('// Reinicializar bootstrap:');
    console.log('MAIRABootstrap.loadForModule("planeamiento")');
    console.log('');
    console.log('// Verificar funciones de medición:');
    console.log('window.measurementHandler?.medirDistancia()');
    console.log('');
    console.log('// Ver estado de handlers:');
    console.log('console.table(window.herramientasPInfo)');
    console.log('');
    console.log('// Probar búsqueda:');
    console.log('initializeBuscarLugar()');
    
    console.log('\n='.repeat(60));
    console.log('🔍 DIAGNÓSTICO COMPLETO FINALIZADO');
    
    return {
        modulos: modulosPrincipales,
        funciones: funcionesCriticas.map(f => ({ [f]: typeof window[f] === 'function' })),
        elementos: elementosHTML,
        mapa: window.mapa ? 'OK' : 'ERROR',
        sugerencias: [
            !window.measurementHandler && 'Cargar measurementHandler',
            !window.mapa && 'Inicializar mapa',
            !document.getElementById('btnMedirDistancia') && 'Verificar HTML'
        ].filter(Boolean)
    };
}

// Función específica para probar medición
function probarMedicion() {
    console.log('🧪 PROBANDO SISTEMA DE MEDICIÓN...');
    
    if (!window.mapa) {
        console.error('❌ Mapa no disponible');
        return false;
    }
    
    if (!window.calcoActivo) {
        console.warn('⚠️ No hay calco activo');
    }
    
    if (typeof window.medirDistancia === 'function') {
        console.log('✅ Función medirDistancia disponible');
        try {
            // Simular click en botón
            const btn = document.getElementById('btnMedirDistancia');
            if (btn) {
                console.log('🔘 Simulando click en botón...');
                btn.click();
            } else {
                console.log('🔧 Ejecutando función directamente...');
                window.medirDistancia();
            }
            return true;
        } catch (e) {
            console.error('❌ Error ejecutando medición:', e);
            return false;
        }
    } else {
        console.error('❌ Función medirDistancia no disponible');
        return false;
    }
}

// Función para restaurar función original
function restaurarMedicionOriginal() {
    console.log('🔄 RESTAURANDO MEDICIÓN ORIGINAL...');
    
    // Aquí cargaremos la función del backup
    fetch('/Client/js/common/herramientasP.js.backup')
        .then(response => response.text())
        .then(codigo => {
            // Extraer solo las funciones de medición
            const funcionMedir = codigo.match(/function medirDistancia\(\)[^}]+\{[\s\S]*?\n\}/);
            const funcionAdd = codigo.match(/function addDistancePoint\([^}]+\{[\s\S]*?\n\}/);
            const funcionFinalizar = codigo.match(/function finalizarMedicion\([^}]+\{[\s\S]*?\n\}/);
            
            if (funcionMedir) {
                eval(funcionMedir[0]);
                window.medirDistancia = medirDistancia;
                console.log('✅ medirDistancia restaurada');
            }
            
            if (funcionAdd) {
                eval(funcionAdd[0]);
                window.addDistancePoint = addDistancePoint;
                console.log('✅ addDistancePoint restaurada');
            }
            
            if (funcionFinalizar) {
                eval(funcionFinalizar[0]);
                window.finalizarMedicion = finalizarMedicion;
                console.log('✅ finalizarMedicion restaurada');
            }
            
            console.log('🎉 Funciones de medición originales restauradas');
        })
        .catch(err => {
            console.error('❌ Error cargando backup:', err);
        });
}

// Verificar cuadrículas
function verificarCuadriculas() {
    console.log('🔍 VERIFICANDO CUADRÍCULAS...');
    
    const mgrsDisponible = typeof window.mgrs !== 'undefined';
    const utmDisponible = typeof window.utm !== 'undefined';
    
    console.log(`${mgrsDisponible ? '✅' : '❌'} MGRS:`, mgrsDisponible ? 'DISPONIBLE' : 'NO ENCONTRADO');
    console.log(`${utmDisponible ? '✅' : '❌'} UTM:`, utmDisponible ? 'DISPONIBLE' : 'NO ENCONTRADO');
    
    // Verificar si las cuadrículas están en el mapa
    if (window.mapa) {
        const capasConCuadricula = Object.values(window.mapa._layers || {})
            .filter(capa => capa.options?.className?.includes('grid') || 
                           capa.options?.pane === 'gridPane');
        
        console.log('🗂️ Capas de cuadrícula activas:', capasConCuadricula.length);
        
        if (capasConCuadricula.length === 0) {
            console.log('💡 Sugerencia: Activar cuadrículas desde el menú');
        }
    }
}

// Exportar funciones
window.diagnosticoCompleto = diagnosticoCompleto;
window.probarMedicion = probarMedicion;
window.restaurarMedicionOriginal = restaurarMedicionOriginal;
window.verificarCuadriculas = verificarCuadriculas;

console.log('🔍 Script de diagnóstico cargado');
console.log('💡 Ejecuta: diagnosticoCompleto() para análisis completo');
console.log('💡 Ejecuta: probarMedicion() para probar medición');
console.log('💡 Ejecuta: verificarCuadriculas() para verificar MGRS/UTM');
