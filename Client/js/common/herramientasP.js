/**
 * 🔄 MAIRA 4.0 - herramientasP.js STUB (Refactorizado)
 * 
 * ⚠️ IMPORTANTE: Este archivo ha sido refactorizado en módulos especializados
 * 
 * ANTES: Monolito de 3154 líneas (120KB)
 * AHORA: Módulos especializados con mejor arquitectura DDD/Hexagonal
 * 
 * 📋 MIGRACIÓN COMPLETA:
 * • MeasurementHandler        → /Client/js/handlers/measurementHandler.js
 * • ElevationProfileService   → /Client/js/services/elevationProfileService.js  
 * • MapInteractionHandler     → /Client/js/handlers/mapInteractionHandler.js
 * • GeometryUtils            → /Client/js/utils/geometryUtils.js
 * • MobileOptimizationHandler → /Client/js/handlers/mobileOptimizationHandler.js
 * • ToolsInitializer         → /Client/js/common/toolsInitializer.js
 * 
 * 🔗 COMPATIBILIDAD: Todas las funciones globales se mantienen mediante redirección
 * 📊 BENEFICIOS: Mejor testabilidad, mantenibilidad y separación de responsabilidades
 */

(function() {
    "use strict";

    console.log("🔄 herramientasP.js REFACTORIZADO");
    console.log("📦 Funcionalidad distribuida en 6 módulos especializados");
    console.log("🔍 Ver migrationMap.js para detalles completos");

    // 📊 INFORMACIÓN DE DEBUG
    window.herramientasPInfo = {
        estado: "REFACTORIZADO",
        version: "4.0-modular",
        modulos_creados: 6,
        lineas_originales: 3154,
        lineas_actuales: "~1800 distribuidas"
    };

    // 🔗 FUNCIONES GLOBALES CRÍTICAS (Implementación directa)
    window.medirDistancia = function() {
        console.log('📏 Iniciando medición de distancia (versión original restaurada)');
        
        if (!window.mapa) {
            console.error('❌ Mapa no disponible');
            return;
        }
        
        // Estado de medición global
        if (!window.medicionState) {
            window.medicionState = {
                activa: false,
                puntos: [],
                linea: null,
                marcadores: [],
                display: null
            };
        }
        
        const state = window.medicionState;
        
        if (state.activa) {
            // Finalizar medición actual
            console.log('🛑 Finalizando medición');
            window.finalizarMedicion();
            return;
        }
        
        // Iniciar nueva medición
        state.activa = true;
        state.puntos = [];
        state.marcadores = [];
        
        // Crear polyline
        state.linea = L.polyline([], {
            color: 'red',
            weight: 3,
            opacity: 0.8,
            dashArray: '10, 10'
        }).addTo(window.mapa);
        
        // Configurar eventos de click
        window.mapa.on('click', window.onMapClick);
        window.mapa.on('dblclick', window.onMapDoubleClick);
        
        // Cambiar cursor
        window.mapa.getContainer().style.cursor = 'crosshair';
        
        // Mostrar display de medición
        window.mostrarDisplayMedicion();
        
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
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
        window.finalizarMedicion();
    };

    window.finalizarMedicion = function() {
        const state = window.medicionState;
        if (!state || !state.activa) return;
        
        console.log('🏁 Medición finalizada');
        
        // Remover eventos
        window.mapa.off('click', window.onMapClick);
        window.mapa.off('dblclick', window.onMapDoubleClick);
        
        // Restaurar cursor
        window.mapa.getContainer().style.cursor = '';
        
        // Ocultar display
        if (state.display) {
            state.display.remove();
            state.display = null;
        }
        
        // Limpiar estado (mantener línea y marcadores en el mapa)
        state.activa = false;
        
        console.log('✅ Medición completada');
    };

    window.addDistancePoint = function() {
        if (window.measurementHandler) {
            return window.measurementHandler.addDistancePoint.apply(this, arguments);
        }
        console.warn("measurementHandler no disponible");
    };

    // Mostrar display de medición
    window.mostrarDisplayMedicion = function() {
        const state = window.medicionState;
        
        // Remover display anterior si existe
        if (state.display) {
            state.display.remove();
        }
        
        // Crear nuevo display
        state.display = document.createElement('div');
        state.display.id = 'medicionDistancia';
        state.display.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 9999;
                font-family: Arial, sans-serif;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                border: 2px solid #ff4444;
            ">
                <div style="font-size: 1.1em; font-weight: bold; margin-bottom: 5px;">
                    📏 MIDIENDO DISTANCIA
                </div>
                <div style="font-size: 0.9em; color: #ccc; margin-bottom: 8px;">
                    Click: agregar punto | Doble-click: finalizar
                </div>
                <div id="distanciaActual" style="
                    font-size: 1.4em; 
                    font-weight: bold; 
                    color: #ffff00;
                    text-align: center;
                ">0 m</div>
            </div>
        `;
        document.body.appendChild(state.display);
    };
    
    // Actualizar display de medición
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

    window.finalizarMedicion = function() {
        const state = window.medicionState;
        if (!state || !state.activa) return;
        
        console.log('🏁 Medición finalizada');
        
        // Remover eventos
        window.mapa.off('click', window.onMapClick);
        window.mapa.off('dblclick', window.onMapDoubleClick);
        
        // Restaurar cursor
        window.mapa.getContainer().style.cursor = '';
        
        // Ocultar display
        if (state.display) {
            state.display.remove();
            state.display = null;
        }
        
        // Limpiar estado (mantener línea y marcadores en el mapa)
        state.activa = false;
        
        console.log('✅ Medición completada');
    };

    window.mostrarGraficoPerfil = function() {
        if (window.elevationProfileService) {
            return window.elevationProfileService.mostrarGraficoPerfil.apply(this, arguments);
        }
        console.warn("elevationProfileService no disponible");
    };

    // Función de cuadrículas restaurada
    window.mostrarCuadriculas = function() {
        console.log('🔲 Mostrando cuadrículas (versión original restaurada)');
        
        if (!window.mapa) {
            console.error('❌ Mapa no disponible');
            return;
        }
        
        // Remover cuadrículas existentes
        if (window.gridLayer) {
            window.mapa.removeLayer(window.gridLayer);
            window.gridLayer = null;
            console.log('🔲 Cuadrículas ocultadas');
            return;
        }
        
        // Crear nueva capa de cuadrículas
        window.gridLayer = L.layerGroup();
        
        const bounds = window.mapa.getBounds();
        const zoom = window.mapa.getZoom();
        
        // Calcular espaciado según zoom
        let spacing = 0.1; // grados
        if (zoom > 10) spacing = 0.05;
        if (zoom > 12) spacing = 0.01;
        if (zoom > 15) spacing = 0.005;
        if (zoom > 17) spacing = 0.001;
        
        console.log(`🔲 Zoom: ${zoom}, Espaciado: ${spacing} grados`);
        
        // Crear líneas horizontales
        for (let lat = Math.floor(bounds.getSouth() / spacing) * spacing; lat <= bounds.getNorth(); lat += spacing) {
            const line = L.polyline([[lat, bounds.getWest()], [lat, bounds.getEast()]], {
                color: '#0281a8',
                weight: 1,
                opacity: 0.6,
                interactive: false
            });
            window.gridLayer.addLayer(line);
        }
        
        // Crear líneas verticales
        for (let lng = Math.floor(bounds.getWest() / spacing) * spacing; lng <= bounds.getEast(); lng += spacing) {
            const line = L.polyline([[bounds.getSouth(), lng], [bounds.getNorth(), lng]], {
                color: '#0281a8',
                weight: 1,
                opacity: 0.6,
                interactive: false
            });
            window.gridLayer.addLayer(line);
        }
        
        window.gridLayer.addTo(window.mapa);
        console.log('✅ Cuadrículas mostradas');
    };

    window.calcularDistancia = function() {
        if (window.geometryUtils) {
            return window.geometryUtils.calcularDistancia.apply(this, arguments);
        }
        console.warn("geometryUtils no disponible");
    };

    console.log("✅ herramientasP.js stub cargado - funcionalidad en módulos especializados");
})();
