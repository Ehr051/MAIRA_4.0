/**
 * 📏 MEASUREMENT HANDLER - LEAFLET VERSION
 * Refactorizado desde herramientasP.js.backup - Funciones de medición usando Leaflet
 */

class MeasurementHandler {
    constructor() {
        this.measuringDistance = false;
        this.lineaActual = null;
        this.lineas = {};
        this.lineCounter = 0;
        this.calcoActivo = null;
        this.mapa = null;
        
        console.log('✅ MeasurementHandler inicializado con Leaflet');
    }
    
    // Establecer referencia al mapa
    setMapa(mapa) {
        this.mapa = mapa;
        this.calcoActivo = this.obtenerCalcoActivo();
    }
    
    // Obtener calco activo
    obtenerCalcoActivo() {
        if (typeof window.calcoActivo !== 'undefined' && window.calcoActivo) {
            return window.calcoActivo;
        }
        
        // Buscar en mapas globales
        if (typeof window.mapa !== 'undefined' && window.mapa) {
            this.mapa = window.mapa;
            return window.mapa;
        }
        
        return null;
    }
    
    // Crear nueva línea
    crearLinea() {
        this.lineCounter++;
        const lineId = `line_${this.lineCounter}`;
        
        const polyline = L.polyline([], {
            color: 'red',
            weight: 3,
            opacity: 0.8,
            dashArray: '10, 10'
        });
        
        if (this.calcoActivo) {
            polyline.addTo(this.calcoActivo);
        }
        
        this.lineas[lineId] = {
            polyline: polyline,
            marcadores: [],
            distancia: 0
        };
        
        return lineId;
    }
    
    // Calcular distancia usando Leaflet
    calcularDistancia(polyline) {
        const latlngs = polyline.getLatLngs();
        let distanciaTotal = 0;
        
        for (let i = 1; i < latlngs.length; i++) {
            const dist = latlngs[i-1].distanceTo(latlngs[i]);
            distanciaTotal += dist;
        }
        
        return distanciaTotal;
    }
    
    // Actualizar línea
    actualizarLinea(lineId) {
        if (!this.lineas[lineId]) return;
        
        const linea = this.lineas[lineId];
        const distancia = this.calcularDistancia(linea.polyline);
        linea.distancia = distancia;
        
        return distancia;
    }
    
    // Mostrar display de medición
    mostrarDisplayMedicion() {
        let medicionDisplay = document.getElementById('medicionDistancia');
        
        if (!medicionDisplay) {
            medicionDisplay = document.createElement('div');
            medicionDisplay.id = 'medicionDistancia';
            medicionDisplay.style.cssText = `
                position: fixed;
                bottom: 80px;
                left: 10px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px;
                border-radius: 5px;
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 14px;
                min-width: 200px;
            `;
            document.body.appendChild(medicionDisplay);
        }
        
        medicionDisplay.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>📏 Iniciando medición...</span>
                <button onclick="window.finalizarMedicion()" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 5px;">✕</button>
            </div>
            <div style="font-size: 12px; color: #ccc; margin-top: 4px;">
                Click para agregar • Doble click para finalizar
            </div>
        `;
        medicionDisplay.style.display = 'block';
    }
    
    // Actualizar display de medición
    actualizarDisplayMedicion(lineId) {
        const linea = this.lineas[lineId];
        if (!linea) return;
        
        const puntos = linea.polyline.getLatLngs().length;
        const distancia = this.calcularDistancia(linea.polyline);
        
        let medicionDisplay = document.getElementById('medicionDistancia');
        if (medicionDisplay) {
            medicionDisplay.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>📏 ${puntos} punto${puntos > 1 ? 's' : ''} • ${distancia.toFixed(2)}m</span>
                    <button onclick="window.finalizarMedicion()" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 5px;">✕</button>
                </div>
                <div style="font-size: 12px; color: #ccc; margin-top: 4px;">
                    Click para agregar • Doble click para finalizar
                </div>
            `;
        }
    }
    
    // Ocultar display de medición
    ocultarDisplayMedicion() {
        const medicionDisplay = document.getElementById('medicionDistancia');
        if (medicionDisplay) {
            medicionDisplay.style.display = 'none';
        }
    }
}

// Crear instancia global
window.measurementHandler = new MeasurementHandler();

// ========== FUNCIONES GLOBALES PARA COMPATIBILIDAD ==========

function medirDistancia() {
    console.log("🔄 Iniciando medición con Leaflet");
    
    const handler = window.measurementHandler;
    
    // Verificar mapa
    if (!handler.mapa) {
        handler.mapa = window.mapa || window.map || null;
    }
    
    if (!handler.mapa) {
        alert('Mapa no disponible para medición');
        return;
    }
    
    // Verificar calco activo
    handler.calcoActivo = handler.obtenerCalcoActivo();
    if (!handler.calcoActivo) {
        alert('Debe tener un calco activo para medir distancias');
        return;
    }
    
    if (handler.measuringDistance) {
        finalizarMedicion();
    } else {
        handler.measuringDistance = true;
        handler.mapa.getContainer().style.cursor = 'crosshair';
        handler.lineaActual = handler.crearLinea();
        
        // Remover listeners existentes
        handler.mapa.off('click', addDistancePoint);
        handler.mapa.off('mousemove', actualizarDistanciaProvisional);
        handler.mapa.off('dblclick', finalizarMedicion);
        
        // Configurar eventos
        handler.mapa.on('click', addDistancePoint);
        handler.mapa.on('mousemove', actualizarDistanciaProvisional);
        handler.mapa.once('dblclick', finalizarMedicion);
        
        handler.mostrarDisplayMedicion();
    }
}

function addDistancePoint(e) {
    const handler = window.measurementHandler;
    if (!handler.lineaActual || !handler.lineas[handler.lineaActual]) return;
    
    const latlng = e.latlng;
    handler.lineas[handler.lineaActual].polyline.addLatLng(latlng);
    
    const marker = L.marker(latlng, {
        draggable: true,
        icon: L.divIcon({
            className: 'vertex-marker',
            iconSize: [8, 8],
            html: '<div style="background: red; border: 2px solid white; border-radius: 50%; width: 8px; height: 8px;"></div>'
        })
    }).addTo(handler.calcoActivo);
    
    marker.on('drag', function() {
        handler.actualizarLinea(handler.lineaActual);
        handler.actualizarDisplayMedicion(handler.lineaActual);
    });
    
    handler.lineas[handler.lineaActual].marcadores.push(marker);
    handler.actualizarLinea(handler.lineaActual);
    handler.actualizarDisplayMedicion(handler.lineaActual);
    
    console.log(`📍 Punto agregado - Distancia: ${handler.lineas[handler.lineaActual].distancia.toFixed(2)}m`);
}

function actualizarDistanciaProvisional(e) {
    const handler = window.measurementHandler;
    if (!handler.measuringDistance || !handler.lineaActual) return;
    
    const linea = handler.lineas[handler.lineaActual];
    if (!linea) return;
    
    const latlngs = linea.polyline.getLatLngs();
    if (latlngs.length > 0) {
        // Crear polyline provisional para calcular distancia
        const polylineProvisional = L.polyline([...latlngs, e.latlng]);
        const distanciaProvisional = handler.calcularDistancia(polylineProvisional);
        const puntos = latlngs.length;
        
        let medicionDisplay = document.getElementById('medicionDistancia');
        if (medicionDisplay) {
            medicionDisplay.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>📏 ${puntos} punto${puntos > 1 ? 's' : ''} → ${distanciaProvisional.toFixed(2)}m</span>
                    <button onclick="finalizarMedicion()" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 5px;">✕</button>
                </div>
                <div style="font-size: 12px; color: #ccc; margin-top: 4px;">
                    Click para agregar • Doble click para finalizar
                </div>
            `;
        }
    }
}

function finalizarMedicion() {
    const handler = window.measurementHandler;
    
    if (!handler.measuringDistance) return;
    
    handler.measuringDistance = false;
    
    if (handler.mapa) {
        handler.mapa.getContainer().style.cursor = '';
        handler.mapa.off('click', addDistancePoint);
        handler.mapa.off('mousemove', actualizarDistanciaProvisional);
        handler.mapa.off('dblclick', finalizarMedicion);
    }
    
    if (handler.lineaActual && handler.lineas[handler.lineaActual]) {
        const distanciaFinal = handler.lineas[handler.lineaActual].distancia;
        console.log(`✅ Medición finalizada: ${distanciaFinal.toFixed(2)} metros`);
        
        // Cambiar estilo de línea a definitivo
        handler.lineas[handler.lineaActual].polyline.setStyle({
            dashArray: null,
            color: 'blue',
            opacity: 1
        });
    }
    
    handler.lineaActual = null;
    handler.ocultarDisplayMedicion();
}

function mostrarPerfilElevacion() {
    console.log('📈 Perfil de elevación - función placeholder');
    // Esta función se implementará cuando tengamos elevationProfileService
    if (typeof window.elevationProfileService !== 'undefined') {
        window.elevationProfileService.mostrarPerfil();
    } else {
        console.warn('⚠️ elevationProfileService no disponible');
    }
}

// Exportar funciones globalmente
window.medirDistancia = medirDistancia;
window.addDistancePoint = addDistancePoint;
window.finalizarMedicion = finalizarMedicion;
window.mostrarPerfilElevacion = mostrarPerfilElevacion;

console.log('✅ MeasurementHandler cargado - Funciones exportadas al scope global');
