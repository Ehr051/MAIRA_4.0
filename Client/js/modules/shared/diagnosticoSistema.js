/**
 * 🔍 MAIRA 4.0 - Diagnóstico del Sistema
 * Script para verificar el estado del sistema y resolver problemas
 */

function diagnosticarSistema() {
    console.group('🔍 MAIRA 4.0 - Diagnóstico del Sistema');
    
    const diagnostico = {
        timestamp: new Date().toISOString(),
        mapa: false,
        gestorJuego: false,
        gestorFases: false,
        gestorTurnos: false,
        hexGrid: false,
        vista3D: false,
        paneles: false,
        problemas: [],
        sugerencias: []
    };
    
    // 1. Verificar Mapa
    console.group('🗺️ Verificando Mapa');
    if (typeof window.mapa !== 'undefined' && window.mapa) {
        diagnostico.mapa = true;
        console.log('✅ Mapa inicializado:', window.mapa.getCenter());
    } else {
        diagnostico.mapa = false;
        diagnostico.problemas.push('Mapa no inicializado');
        diagnostico.sugerencias.push('Verificar la carga de Leaflet y inicializarMapaBase()');
        console.error('❌ Mapa no disponible');
    }
    console.groupEnd();
    
    // 2. Verificar GestorJuego
    console.group('🎮 Verificando GestorJuego');
    if (typeof window.gestorJuego !== 'undefined' && window.gestorJuego) {
        diagnostico.gestorJuego = true;
        console.log('✅ GestorJuego disponible');
        
        // Verificar GestorFases
        if (window.gestorJuego.gestorFases) {
            diagnostico.gestorFases = true;
            const fase = window.gestorJuego.gestorFases.fase || 'sin definir';
            const subfase = window.gestorJuego.gestorFases.subfase || 'sin definir';
            console.log(`✅ GestorFases activo - Fase: ${fase}, Subfase: ${subfase}`);
        } else {
            diagnostico.gestorFases = false;
            diagnostico.problemas.push('GestorFases no inicializado');
            diagnostico.sugerencias.push('Inicializar GestorFases en GestorJuego');
            console.error('❌ GestorFases no disponible');
        }
        
        // Verificar GestorTurnos
        if (window.gestorJuego.gestorTurnos) {
            diagnostico.gestorTurnos = true;
            console.log('✅ GestorTurnos disponible');
        } else {
            diagnostico.gestorTurnos = false;
            diagnostico.problemas.push('GestorTurnos no inicializado');
            console.error('❌ GestorTurnos no disponible');
        }
    } else {
        diagnostico.gestorJuego = false;
        diagnostico.problemas.push('GestorJuego no inicializado');
        diagnostico.sugerencias.push('Verificar la carga de GestorJuego y su inicialización');
        console.error('❌ GestorJuego no disponible');
    }
    console.groupEnd();
    
    // 3. Verificar HexGrid
    console.group('⬡ Verificando HexGrid');
    if (typeof HexGrid !== 'undefined') {
        diagnostico.hexGrid = true;
        console.log('✅ HexGrid disponible');
    } else {
        diagnostico.hexGrid = false;
        diagnostico.problemas.push('HexGrid no disponible');
        diagnostico.sugerencias.push('Cargar hexGrid.js');
        console.error('❌ HexGrid no disponible');
    }
    console.groupEnd();
    
    // 4. Verificar Vista 3D
    console.group('🎮 Verificando Vista 3D');
    const componentes3D = {
        toggleVista3DModular: typeof toggleVista3DModular !== 'undefined',
        Sistema3D: typeof Sistema3D !== 'undefined',
        THREE: typeof THREE !== 'undefined',
        sistema3DIntegrado: typeof window.sistema3DIntegrado !== 'undefined'
    };
    
    const componentes3DOK = Object.values(componentes3D).filter(Boolean).length;
    diagnostico.vista3D = componentes3DOK >= 2;
    
    console.log('Componentes 3D:', componentes3D);
    if (diagnostico.vista3D) {
        console.log(`✅ Vista 3D parcialmente disponible (${componentes3DOK}/4 componentes)`);
    } else {
        diagnostico.problemas.push('Sistema 3D incompleto');
        diagnostico.sugerencias.push('Cargar THREE.js, sistema3d.js y vista3DManager.js');
        console.error('❌ Vista 3D no disponible');
    }
    console.groupEnd();
    
    // 5. Verificar Sistema de Paneles
    console.group('📊 Verificando Sistema de Paneles');
    if (typeof window.sistemaPaneles !== 'undefined') {
        diagnostico.paneles = true;
        console.log('✅ Sistema de Paneles disponible');
    } else {
        diagnostico.paneles = false;
        diagnostico.problemas.push('Sistema de Paneles no disponible');
        console.error('❌ Sistema de Paneles no disponible');
    }
    console.groupEnd();
    
    // 6. Resumen y Sugerencias
    console.group('📋 Resumen del Diagnóstico');
    const componentesOK = Object.values(diagnostico)
        .filter(val => typeof val === 'boolean' && val).length;
    const totalComponentes = 6;
    
    console.log(`Estado general: ${componentesOK}/${totalComponentes} componentes funcionando`);
    
    if (diagnostico.problemas.length > 0) {
        console.group('❌ Problemas encontrados:');
        diagnostico.problemas.forEach((problema, i) => {
            console.error(`${i + 1}. ${problema}`);
        });
        console.groupEnd();
        
        console.group('💡 Sugerencias de solución:');
        diagnostico.sugerencias.forEach((sugerencia, i) => {
            console.log(`${i + 1}. ${sugerencia}`);
        });
        console.groupEnd();
    }
    
    if (componentesOK === totalComponentes) {
        console.log('🎉 ¡Sistema completamente funcional!');
    }
    console.groupEnd();
    
    console.groupEnd();
    return diagnostico;
}

// Función para forzar inicialización de componentes críticos
function forzarInicializacionSistema() {
    console.log('🔧 Forzando inicialización de componentes críticos...');
    
    // 1. Inicializar GestorJuego si no existe
    if (!window.gestorJuego && typeof GestorJuego !== 'undefined') {
        try {
            window.gestorJuego = new GestorJuego();
            console.log('✅ GestorJuego inicializado manualmente');
        } catch (error) {
            console.error('❌ Error inicializando GestorJuego:', error);
        }
    }
    
    // 2. Inicializar HexGrid si no existe y hay mapa
    if (typeof HexGrid !== 'undefined' && window.mapa && !HexGrid.initialized) {
        try {
            HexGrid.initialize(window.mapa);
            console.log('✅ HexGrid inicializado manualmente');
        } catch (error) {
            console.error('❌ Error inicializando HexGrid:', error);
        }
    }
    
    // 3. Limpiar paneles problemáticos
    if (typeof window.limpiarPanelesFlotantes3D === 'function') {
        window.limpiarPanelesFlotantes3D();
    }
    
    console.log('🔧 Inicialización forzada completada');
}

// Función para iniciar la fase de preparación manualmente
function iniciarFasePreparacion() {
    console.log('🚀 Iniciando fase de preparación manualmente...');
    
    if (window.gestorJuego?.gestorFases) {
        try {
            // Forzar fase de preparación
            window.gestorJuego.gestorFases.fase = 'preparacion';
            window.gestorJuego.gestorFases.subfase = 'definicion_sector';
            
            // Emitir evento de cambio de fase
            if (window.gestorJuego.gestorFases.emisorEventos) {
                window.gestorJuego.gestorFases.emisorEventos.emit('faseCambiada', {
                    nuevaFase: 'preparacion',
                    nuevaSubfase: 'definicion_sector'
                });
            }
            
            console.log('✅ Fase de preparación iniciada manualmente');
            return true;
        } catch (error) {
            console.error('❌ Error iniciando fase de preparación:', error);
            return false;
        }
    } else {
        console.error('❌ GestorFases no disponible');
        return false;
    }
}

// Funciones globales
window.diagnosticarSistema = diagnosticarSistema;
window.forzarInicializacionSistema = forzarInicializacionSistema;
window.iniciarFasePreparacion = iniciarFasePreparacion;

// Ejecutar diagnóstico automático en desarrollo
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setTimeout(() => {
        diagnosticarSistema();
    }, 3000);
}

console.log('🔍 Sistema de diagnóstico cargado - Funciones disponibles globalmente');
