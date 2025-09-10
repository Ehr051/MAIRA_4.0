/**
 * 🔧 SCRIPT DE DIAGNÓSTICO COMPLETO MAIRA 4.0
 * Ejecutar en consola del navegador para diagnosticar y reparar problemas
 */

window.MAIRADiagnostic = {
    // ========================================
    // DIAGNÓSTICO GENERAL
    // ========================================
    
    checkSystemStatus() {
        console.log('🔍 DIAGNÓSTICO SISTEMA MAIRA 4.0');
        console.log('================================');
        
        const checks = {
            leaflet: !!window.L,
            mapa: !!window.mapa,
            bootstrap: !!window.MAIRABootstrap,
            herramientas: !!window.medirDistancia,
            measurementHandler: !!window.measurementHandler,
            searchHandler: !!window.searchHandler || !!window.initializeBuscarLugar,
            calculoMarcha: !!window.CalculoMarcha,
            graficoMarcha: !!window.generarGraficoMarcha,
            css: !!document.querySelector('link[href*="CYGMarcha"]'),
            cuadriculas: !!window.mostrarCuadriculas
        };
        
        console.table(checks);
        
        // Verificar CSS cargados
        const cssFiles = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(link => link.href);
        console.log('📄 CSS Cargados:', cssFiles);
        
        // Verificar JS cargados
        const jsFiles = Array.from(document.querySelectorAll('script[src]')).map(script => script.src);
        console.log('📄 JS Cargados:', jsFiles.slice(-10)); // Últimos 10
        
        return checks;
    },
    
    // ========================================
    // DIAGNÓSTICO ESPECÍFICO: MEDICIÓN
    // ========================================
    
    checkMeasurement() {
        console.log('📏 DIAGNÓSTICO MEDICIÓN DE DISTANCIA');
        console.log('====================================');
        
        const status = {
            medirDistancia: typeof window.medirDistancia === 'function',
            measurementHandler: !!window.measurementHandler,
            eventos_mapa: !!window.mapa && !!window.mapa._events,
            click_events: window.mapa && window.mapa._events ? Object.keys(window.mapa._events) : []
        };
        
        console.table(status);
        
        if (window.mapa && window.mapa._events) {
            console.log('🖱️ Eventos del mapa:', window.mapa._events);
        }
        
        return status;
    },
    
    // ========================================
    // REPARACIÓN: MEDICIÓN DE DISTANCIA
    // ========================================
    
    repairMeasurement() {
        console.log('🔧 REPARANDO MEDICIÓN DE DISTANCIA...');
        
        // Crear función medirDistancia funcional
        window.medirDistancia = function() {
            console.log('📏 Iniciando medición de distancia');
            
            if (!window.mapa) {
                console.error('❌ Mapa no disponible');
                return;
            }
            
            // Estado de medición
            if (!window.medicionState) {
                window.medicionState = {
                    activa: false,
                    puntos: [],
                    linea: null,
                    marcadores: []
                };
            }
            
            const state = window.medicionState;
            
            if (state.activa) {
                // Finalizar medición
                console.log('🛑 Finalizando medición');
                this.finalizarMedicion();
                return;
            }
            
            // Iniciar medición
            state.activa = true;
            state.puntos = [];
            
            // Crear polyline
            state.linea = L.polyline([], {
                color: 'red',
                weight: 3,
                opacity: 0.8,
                dashArray: '10, 10'
            }).addTo(window.mapa);
            
            // Configurar eventos de click
            window.mapa.on('click', this.onMapClick);
            window.mapa.on('dblclick', this.onMapDoubleClick);
            
            // Cambiar cursor
            window.mapa.getContainer().style.cursor = 'crosshair';
            
            // Mostrar indicador
            this.mostrarIndicadorMedicion();
            
            console.log('✅ Medición iniciada - Click para agregar puntos, doble-click para finalizar');
        };
        
        // Función de click en mapa
        window.onMapClick = function(e) {
            const state = window.medicionState;
            if (!state.activa) return;
            
            console.log('📍 Punto agregado:', e.latlng);
            
            // Agregar punto
            state.puntos.push(e.latlng);
            
            // Crear marcador
            const marcador = L.circleMarker(e.latlng, {
                radius: 5,
                color: 'red',
                fillColor: 'red',
                fillOpacity: 0.8
            }).addTo(window.mapa);
            
            state.marcadores.push(marcador);
            
            // Actualizar línea
            state.linea.setLatLngs(state.puntos);
            
            // Calcular distancia
            let distanciaTotal = 0;
            for (let i = 1; i < state.puntos.length; i++) {
                distanciaTotal += state.puntos[i-1].distanceTo(state.puntos[i]);
            }
            
            // Actualizar display
            window.actualizarDisplayMedicion(distanciaTotal);
        };
        
        // Función de doble click
        window.onMapDoubleClick = function(e) {
            console.log('⏹️ Doble click - Finalizando medición');
            window.finalizarMedicion();
        };
        
        // Finalizar medición
        window.finalizarMedicion = function() {
            const state = window.medicionState;
            if (!state.activa) return;
            
            console.log('🏁 Medición finalizada');
            
            // Remover eventos
            window.mapa.off('click', window.onMapClick);
            window.mapa.off('dblclick', window.onMapDoubleClick);
            
            // Restaurar cursor
            window.mapa.getContainer().style.cursor = '';
            
            // Ocultar indicador
            const indicator = document.getElementById('medicionIndicador');
            if (indicator) indicator.remove();
            
            // Limpiar estado
            state.activa = false;
            
            console.log('✅ Medición completada');
        };
        
        // Mostrar indicador
        window.mostrarIndicadorMedicion = function() {
            let indicator = document.getElementById('medicionIndicador');
            if (indicator) indicator.remove();
            
            indicator = document.createElement('div');
            indicator.id = 'medicionIndicador';
            indicator.innerHTML = `
                <div style="
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(255, 0, 0, 0.9);
                    color: white;
                    padding: 10px 15px;
                    border-radius: 5px;
                    z-index: 9999;
                    font-family: Arial, sans-serif;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                ">
                    📏 MIDIENDO DISTANCIA<br>
                    <small>Click: agregar punto | Doble-click: finalizar</small>
                    <div id="distanciaActual" style="font-size: 1.2em; margin-top: 5px;">0 m</div>
                </div>
            `;
            document.body.appendChild(indicator);
        };
        
        // Actualizar display
        window.actualizarDisplayMedicion = function(distancia) {
            const display = document.getElementById('distanciaActual');
            if (display) {
                if (distancia >= 1000) {
                    display.textContent = `${(distancia / 1000).toFixed(2)} km`;
                } else {
                    display.textContent = `${distancia.toFixed(0)} m`;
                }
            }
        };
        
        console.log('✅ Función medirDistancia reparada');
    },
    
    // ========================================
    // DIAGNÓSTICO: CUADRÍCULAS
    // ========================================
    
    checkGrids() {
        console.log('🔲 DIAGNÓSTICO CUADRÍCULAS');
        console.log('==========================');
        
        const status = {
            mostrarCuadriculas: typeof window.mostrarCuadriculas === 'function',
            mgrs: !!window.mgrs,
            leaflet_loaded: !!window.L,
            mapa_disponible: !!window.mapa
        };
        
        console.table(status);
        return status;
    },
    
    // ========================================
    // REPARACIÓN: CUADRÍCULAS
    // ========================================
    
    repairGrids() {
        console.log('🔧 REPARANDO CUADRÍCULAS...');
        
        if (!window.L || !window.mapa) {
            console.error('❌ Leaflet o mapa no disponible');
            return;
        }
        
        // Crear función de cuadrículas simple
        window.mostrarCuadriculas = function() {
            console.log('🔲 Mostrando cuadrículas');
            
            // Remover cuadrículas existentes
            if (window.gridLayer) {
                window.mapa.removeLayer(window.gridLayer);
            }
            
            // Crear nueva capa de cuadrículas
            window.gridLayer = L.layerGroup();
            
            const bounds = window.mapa.getBounds();
            const zoom = window.mapa.getZoom();
            
            // Calcular espaciado según zoom
            let spacing = 0.1; // grados
            if (zoom > 10) spacing = 0.01;
            if (zoom > 15) spacing = 0.001;
            
            // Crear líneas de cuadrícula
            for (let lat = Math.floor(bounds.getSouth() / spacing) * spacing; lat <= bounds.getNorth(); lat += spacing) {
                const line = L.polyline([[lat, bounds.getWest()], [lat, bounds.getEast()]], {
                    color: '#0281a8',
                    weight: 1,
                    opacity: 0.5
                });
                window.gridLayer.addLayer(line);
            }
            
            for (let lng = Math.floor(bounds.getWest() / spacing) * spacing; lng <= bounds.getEast(); lng += spacing) {
                const line = L.polyline([[bounds.getSouth(), lng], [bounds.getNorth(), lng]], {
                    color: '#0281a8',
                    weight: 1,
                    opacity: 0.5
                });
                window.gridLayer.addLayer(line);
            }
            
            window.gridLayer.addTo(window.mapa);
            console.log('✅ Cuadrículas creadas');
        };
        
        console.log('✅ Función mostrarCuadriculas reparada');
    },
    
    // ========================================
    // DIAGNÓSTICO: CSS CÁLCULO MARCHA
    // ========================================
    
    checkCalculoMarchaCSS() {
        console.log('📄 DIAGNÓSTICO CSS CÁLCULO MARCHA');
        console.log('=================================');
        
        const cygMarchaCSS = !!document.querySelector('link[href*="CYGMarcha"]');
        const panelExists = !!document.getElementById('calculoMarchaPanel');
        const stylesApplied = !!document.querySelector('.sub-panel');
        
        // Verificar ruta específica que debería estar cargando
        const expectedPath = './css/common/CYGMarcha.css';
        const linkElement = document.querySelector(`link[href*="CYGMarcha"]`);
        
        const status = {
            css_cargado: cygMarchaCSS,
            panel_existe: panelExists,
            estilos_aplicados: stylesApplied,
            ruta_actual: linkElement ? linkElement.href : 'No encontrada',
            ruta_esperada: expectedPath
        };
        
        console.table(status);
        
        // Verificar todos los CSS cargados
        const allCSS = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(link => link.href);
        console.log('📄 Todos los CSS cargados:', allCSS);
        
        return status;
    },
    
    // ========================================
    // REPARACIÓN COMPLETA
    // ========================================
    
    repairAll() {
        console.log('🛠️ REPARACIÓN COMPLETA MAIRA 4.0');
        console.log('=================================');
        
        this.repairMeasurement();
        this.repairGrids();
        
        // Verificar CSS
        const cssStatus = this.checkCalculoMarchaCSS();
        if (!cssStatus.css_cargado) {
            console.log('📄 Cargando CSS de CYGMarcha...');
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = './css/common/CYGMarcha.css';
            document.head.appendChild(link);
            console.log('✅ CSS de CYGMarcha agregado al DOM');
        }
        
        console.log('✅ Reparación completa finalizada');
        console.log('');
        console.log('🎯 FUNCIONES DISPONIBLES:');
        console.log('- medirDistancia() - Iniciar medición de distancia');
        console.log('- mostrarCuadriculas() - Mostrar cuadrículas en mapa');
        console.log('- MAIRADiagnostic.checkSystemStatus() - Verificar estado');
        console.log('- MAIRADiagnostic.checkMeasurement() - Verificar medición');
        console.log('- MAIRADiagnostic.checkGrids() - Verificar cuadrículas');
    },
    
    // ========================================
    // PRUEBAS RÁPIDAS
    // ========================================
    
    testMeasurement() {
        console.log('🧪 PROBANDO MEDICIÓN...');
        if (typeof window.medirDistancia === 'function') {
            console.log('✅ Función existe - Prueba: medirDistancia()');
            // No ejecutar automáticamente
        } else {
            console.log('❌ Función no existe - Ejecutando reparación...');
            this.repairMeasurement();
        }
    },
    
    testGrids() {
        console.log('🧪 PROBANDO CUADRÍCULAS...');
        if (typeof window.mostrarCuadriculas === 'function') {
            console.log('✅ Función existe - Ejecutando mostrarCuadriculas()');
            window.mostrarCuadriculas();
        } else {
            console.log('❌ Función no existe - Ejecutando reparación...');
            this.repairGrids();
            window.mostrarCuadriculas();
        }
    }
};

// Auto-diagnóstico inicial
console.log('🔍 MAIRA 4.0 - SCRIPT DE DIAGNÓSTICO CARGADO');
console.log('============================================');
console.log('');
console.log('🎯 COMANDOS DISPONIBLES:');
console.log('- MAIRADiagnostic.checkSystemStatus() - Diagnóstico completo');
console.log('- MAIRADiagnostic.repairAll() - Reparar todo');
console.log('- MAIRADiagnostic.testMeasurement() - Probar medición');
console.log('- MAIRADiagnostic.testGrids() - Probar cuadrículas');
console.log('');
console.log('🚀 Ejecuta: MAIRADiagnostic.checkSystemStatus() para empezar');
