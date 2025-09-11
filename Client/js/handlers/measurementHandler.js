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
        
        // ✅ FUNCIONES GLOBALES RESTAURADAS PARA EDICIÓN DE LÍNEAS
window.hacerLineaEditable = function(linea) {
    if (!linea || !(linea instanceof L.Polyline)) {
        console.warn('⚠️ Elemento no válido para hacer editable');
        return false;
    }
    
    console.log('🖊️ Haciendo línea editable...');
    
    // Habilitar edición nativa de Leaflet
    if (!linea.editing) {
        linea.editing = new L.Edit.Poly(linea);
    }
    linea.editing.enable();
    
    // Agregar eventos de edición
    linea.on('edit', function() {
        if (window.measurementHandler) {
            // Buscar ID de la línea en el handler
            for (let [lineId, lineData] of Object.entries(window.measurementHandler.lineas)) {
                if (lineData.polyline === linea) {
                    window.measurementHandler.actualizarLinea(lineId);
                    break;
                }
            }
        }
    });
    
    if (window.MAIRA?.Utils?.mostrarNotificacion) {
        window.MAIRA.Utils.mostrarNotificacion('Línea editable activada. Arrastra los puntos para modificar.', 'success');
    }
    
    return true;
};

window.deshabilitarEdicionLinea = function(linea) {
    if (!linea || !linea.editing) {
        return false;
    }
    
    console.log('🔒 Deshabilitando edición de línea...');
    linea.editing.disable();
    
    if (window.MAIRA?.Utils?.mostrarNotificacion) {
        window.MAIRA.Utils.mostrarNotificacion('Edición de línea deshabilitada.', 'info');
    }
    
    return true;
};

window.convertirAPolyline = function(elemento) {
    if (!elemento) return null;
    
    // Si ya es polyline, retornar
    if (elemento instanceof L.Polyline) {
        console.log('✅ El elemento ya es una polyline');
        return elemento;
    }
    
    // Si es un polígono, convertir a polyline
    if (elemento instanceof L.Polygon) {
        console.log('🔄 Convirtiendo polígono a polyline...');
        const coordenadas = elemento.getLatLngs()[0]; // Los polígonos tienen coordenadas anidadas
        const nuevaPolyline = L.polyline(coordenadas, elemento.options);
        
        // Copiar propiedades importantes
        if (elemento.distancia) nuevaPolyline.distancia = elemento.distancia;
        if (elemento.options.distancia) nuevaPolyline.options.distancia = elemento.options.distancia;
        
        return nuevaPolyline;
    }
    
    console.warn('⚠️ Tipo de elemento no compatible para conversión a polyline');
    return null;
};

console.log('✅ MeasurementHandler con Leaflet cargado y funciones exportadas al scope global');
console.log('✅ Funciones de edición de líneas restauradas: hacerLineaEditable, deshabilitarEdicionLinea, convertirAPolyline');
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
    
    // Crear nueva línea COMPATIBLE CON GRÁFICO DE MARCHA
    crearLinea() {
        console.log('🔧 Creando nueva línea de medición compatible con marcha...');
        
        // ✅ VERIFICAR CALCO ACTIVO:
        if (!this.calcoActivo) {
            this.calcoActivo = this.obtenerCalcoActivo();
            if (!this.calcoActivo) {
                console.error('❌ No hay calco activo disponible');
                return null;
            }
        }
        
        var id = "linea_" + Date.now();
        var nuevaLinea = L.polyline([], {
            color: 'red',
            weight: 5,
            nombre: 'Línea de medición',
            distanciaAcumulada: 0,
            distanciaTotal: 0,
            distancia: 0,
            opacity: 0.8,
            dashArray: '10, 10'
        }).addTo(this.calcoActivo);
        
        // ✅ ESTABLECER PROPIEDADES DIRECTAS EN POLYLINE (REQUERIDO PARA MARCHA):
        nuevaLinea.distanciaAcumulada = 0;
        nuevaLinea.distanciaTotal = 0;
        nuevaLinea.distancia = 0;
        nuevaLinea.options.distanciaAcumulada = 0;
        nuevaLinea.options.distanciaTotal = 0;
        nuevaLinea.options.distancia = 0;
      
        this.lineas[id] = {
            id: id,
            polyline: nuevaLinea,
            marcadores: [],
            nombre: "Línea " + (Object.keys(this.lineas).length + 1),
            color: 'red',
            ancho: 5,
            tipo: 'solid',
            distancia: 0,
            distanciaAcumulada: 0,
            distanciaTotal: 0,
            totalDistance: 0
        };
      
        // ✅ EVENTOS DE LA LÍNEA - CLICK SOLO SELECCIONA, NO AUTO-PERFIL:
        nuevaLinea.on('click', function(e) {
            if (typeof window.seleccionarElemento === 'function') {
                window.seleccionarElemento(this);
            }
            // Mostrar distancia en display
            if (typeof this.distancia === 'number') {
                const medicionDisplay = document.getElementById('medicionDistancia');
                if (medicionDisplay) {
                    medicionDisplay.innerHTML = `<span>Distancia: ${this.distancia.toFixed(2)} metros</span><button onclick="finalizarMedicion()" style="float: right;">X</button>`;
                    medicionDisplay.style.display = 'block';
                }
            }
            // ✅ NO AUTO-PERFIL: Solo seleccionar, el usuario debe usar el menú contextual
            console.log('📏 Línea seleccionada. Doble-click para mostrar menú de opciones.');
        });

        // ✅ DOBLE-CLICK MUESTRA MENÚ CONTEXTUAL (NO AUTO-EDICIÓN):
        nuevaLinea.on('dblclick', function(e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            console.log('📋 Mostrando menú contextual para línea');
            
            // Crear menú contextual
            mostrarMenuContextualLinea(e, this);
        });

        // ✅ EVENTO PARA ACTUALIZAR DISTANCIA AL EDITAR
        nuevaLinea.on('edit', function(e) {
            const self = this;
            // Recalcular distancia después de editar
            setTimeout(() => {
                if (window.measurementHandler) {
                    const nuevaDistancia = window.measurementHandler.actualizarLinea(id);
                    console.log('📏 Distancia actualizada tras edición:', nuevaDistancia.toFixed(2), 'm');
                }
            }, 100);
        });
        
        return id;
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
    
    // Actualizar línea SINCRONIZANDO PROPIEDADES PARA MARCHA
    actualizarLinea(lineId) {
        if (!this.lineas[lineId]) return;
        
        const linea = this.lineas[lineId];
        const distancia = this.calcularDistancia(linea.polyline);
        
        // ✅ SINCRONIZAR TODAS LAS PROPIEDADES DE DISTANCIA:
        linea.distancia = distancia;
        linea.distanciaTotal = distancia;
        linea.distanciaAcumulada = distancia;
        linea.totalDistance = distancia;
        
        // ✅ PROPIEDADES DIRECTAS EN POLYLINE (REQUERIDO PARA MARCHA):
        linea.polyline.distancia = distancia;
        linea.polyline.distanciaTotal = distancia;
        linea.polyline.distanciaAcumulada = distancia;
        linea.polyline.options.distancia = distancia;
        linea.polyline.options.distanciaTotal = distancia;
        linea.polyline.options.distanciaAcumulada = distancia;
        
        console.log(`🔄 Línea actualizada: ${distancia.toFixed(2)}m`);
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
    const puntos = handler.lineas[handler.lineaActual].polyline.getLatLngs();
    const esPrimerPunto = puntos.length === 0;
    
    handler.lineas[handler.lineaActual].polyline.addLatLng(latlng);
    
    // ✅ CREAR MARCADOR ESTÁNDAR PARA VÉRTICE
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
    
    // ✅ PI/PT SOLO SI ESTÁ EN CONTEXTO DE MARCHA (NO EN MEDICIÓN NORMAL)
    // Los símbolos PI/PT solo se insertan desde CalculoMarcha.js, no en mediciones normales
    
    handler.actualizarLinea(handler.lineaActual);
    handler.actualizarDisplayMedicion(handler.lineaActual);
    
    console.log(`📍 Punto agregado ${esPrimerPunto ? '(PI)' : ''} - Distancia: ${handler.lineas[handler.lineaActual].distancia.toFixed(2)}m`);
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
        
        // ✅ CAMBIAR ESTILO DE LÍNEA A DEFINITIVO (COMPATIBLE CON MARCHA):
        handler.lineas[handler.lineaActual].polyline.setStyle({
            dashArray: null,
            color: 'blue',
            opacity: 1,
            weight: 3
        });
        
        // ✅ ASEGURAR PROPIEDADES FINALES:
        handler.actualizarLinea(handler.lineaActual);
    }
    
    handler.lineaActual = null;
    handler.ocultarDisplayMedicion();
}

function mostrarPerfilElevacion() {
    console.log('📈 Iniciando perfil de elevación con línea seleccionada');
    
    // ✅ USAR LÍNEA SELECCIONADA (IGUAL QUE GRÁFICO DE MARCHA):
    const polyline = window.elementoSeleccionado;
    if (!polyline || !(polyline instanceof L.Polyline)) {
        console.warn('⚠️ No hay línea seleccionada para calcular el perfil de elevación');
        if (window.MAIRA?.Utils?.mostrarNotificacion) {
            window.MAIRA.Utils.mostrarNotificacion('Debe seleccionar una línea para ver el perfil de elevación', 'warning');
        } else {
            alert('Debe seleccionar una línea para ver el perfil de elevación');
        }
        return;
    }
    
    console.log('🎯 Usando línea seleccionada para perfil:', polyline);
    
    // Obtener puntos de la línea
    const latlngs = polyline.getLatLngs();
    console.log(`📍 Línea tiene ${latlngs.length} puntos`);
    
    // Calcular distancia total
    const distanciaTotal = polyline.distancia || polyline.distanciaTotal || 
                          (window.geometryUtils ? window.geometryUtils.calcularDistancia(polyline) : 0);
    
    console.log(`📏 Distancia total: ${distanciaTotal}m`);
    
    // Convertir LatLngs a formato para elevationProfileService
    const puntos = latlngs.map(latlng => ({
        lat: latlng.lat,
        lon: latlng.lng
    }));
    
    // Llamar al servicio de elevación con los puntos de la línea seleccionada
    if (typeof window.elevationProfileService !== 'undefined' && window.elevationProfileService.mostrarGraficoPerfil) {
        console.log('🔧 Llamando a elevationProfileService con puntos de línea seleccionada');
        window.elevationProfileService.mostrarGraficoPerfil(puntos, distanciaTotal);
    } else if (typeof window.mostrarGraficoPerfil === 'function') {
        console.log('🔧 Llamando a mostrarGraficoPerfil global con puntos de línea seleccionada');
        window.mostrarGraficoPerfil(puntos, distanciaTotal);
    } else {
        console.error('❌ No hay servicio de elevación disponible');
        if (window.MAIRA?.Utils?.mostrarNotificacion) {
            window.MAIRA.Utils.mostrarNotificacion('Servicio de elevación no disponible', 'error');
        }
    }
}

// ✅ FUNCIONES DE CONEXIÓN SIMPLE PARA SERVICIOS ESPECIALIZADOS
function mostrarAnalisisPendiente() {
    console.log('📐 Conectando con servicio de pendientes...');
    
    // ✅ VERIFICAR LÍNEA SELECCIONADA:
    const polyline = window.elementoSeleccionado;
    if (!polyline || !(polyline instanceof L.Polyline)) {
        console.warn('⚠️ Seleccione una línea para análisis de pendiente');
        if (window.MAIRA?.Utils?.mostrarNotificacion) {
            window.MAIRA.Utils.mostrarNotificacion('Debe seleccionar una línea para analizar pendientes', 'warning');
        }
        return;
    }
    
    // ✅ DELEGAR AL SERVICIO ESPECIALIZADO:
    if (window.pendienteHandler && typeof window.pendienteHandler.analizarLineaCompleta === 'function') {
        window.pendienteHandler.analizarLineaCompleta(polyline);
    } else if (window.slopeAnalysisService && typeof window.slopeAnalysisService.analyzeRoute === 'function') {
        window.slopeAnalysisService.analyzeRoute(polyline);
    } else {
        console.warn('⚠️ Servicio de pendientes no disponible');
    }
}

function mostrarAnalisisTransitabilidad(tipoUnidad = 'infantry') {
    console.log('🚗 Conectando con servicio de transitabilidad...');
    
    // ✅ VERIFICAR LÍNEA SELECCIONADA:
    const polyline = window.elementoSeleccionado;
    if (!polyline || !(polyline instanceof L.Polyline)) {
        console.warn('⚠️ Seleccione una línea para análisis de transitabilidad');
        if (window.MAIRA?.Utils?.mostrarNotificacion) {
            window.MAIRA.Utils.mostrarNotificacion('Debe seleccionar una línea para analizar transitabilidad', 'warning');
        }
        return;
    }
    
    // ✅ DELEGAR AL SERVICIO ESPECIALIZADO:
    if (window.transitabilityService && typeof window.transitabilityService.analyzeRoute === 'function') {
        window.transitabilityService.analyzeRoute(polyline, tipoUnidad);
    } else if (window.transitabilidadHandler && typeof window.transitabilidadHandler.analizarRuta === 'function') {
        window.transitabilidadHandler.analizarRuta(polyline, tipoUnidad);
    } else {
        console.warn('⚠️ Servicio de transitabilidad no disponible');
    }
}

// Exportar funciones globalmente
window.medirDistancia = medirDistancia;
window.addDistancePoint = addDistancePoint;
window.finalizarMedicion = finalizarMedicion;
window.mostrarPerfilElevacion = mostrarPerfilElevacion;
window.mostrarAnalisisPendiente = mostrarAnalisisPendiente;
window.mostrarAnalisisTransitabilidad = mostrarAnalisisTransitabilidad;

// ✅ ALIAS GLOBALES PARA COMPATIBILIDAD CON GRÁFICO DE MARCHA:
window.lineas = window.measurementHandler.lineas;
window.measuringDistance = false;
window.lineaActual = null;

// ✅ GETTER DINÁMICO PARA VARIABLES DE ESTADO:
Object.defineProperty(window, 'measuringDistance', {
    get: function() { return window.measurementHandler.measuringDistance; },
    set: function(value) { window.measurementHandler.measuringDistance = value; }
});

Object.defineProperty(window, 'lineaActual', {
    get: function() { return window.measurementHandler.lineaActual; },
    set: function(value) { window.measurementHandler.lineaActual = value; }
});

// ========== FUNCIÓN MENÚ CONTEXTUAL ==========

function mostrarMenuContextualLinea(evento, linea) {
    // Remover menú existente si existe
    const menuExistente = document.getElementById('menuContextualLinea');
    if (menuExistente) {
        menuExistente.remove();
    }
    
    // Crear menú contextual
    const menu = document.createElement('div');
    menu.id = 'menuContextualLinea';
    menu.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        min-width: 180px;
        font-family: Arial, sans-serif;
        font-size: 14px;
    `;
    
    // Posicionar menú
    const rect = evento.target.getBoundingClientRect();
    menu.style.left = (evento.originalEvent?.clientX || rect.left) + 'px';
    menu.style.top = (evento.originalEvent?.clientY || rect.top) + 'px';
    
    // Opciones del menú
    const opciones = [
        {
            icono: '📈',
            texto: 'Ver Perfil de Elevación',
            accion: () => {
                // Seleccionar la línea y mostrar perfil
                window.seleccionarElemento(linea);
                mostrarPerfilElevacion();
                menu.remove();
            }
        },
        {
            icono: '🖊️',
            texto: 'Editar Línea',
            accion: () => {
                // Habilitar modo edición
                if (!linea.editing) {
                    linea.editing = new L.Edit.Poly(linea);
                }
                linea.editing.enable();
                
                if (window.MAIRA?.Utils?.mostrarNotificacion) {
                    window.MAIRA.Utils.mostrarNotificacion('Línea en modo edición. Arrastra los puntos para modificar.', 'info');
                }
                menu.remove();
            }
        },
        {
            icono: '📏',
            texto: 'Mostrar Distancia',
            accion: () => {
                const distancia = linea.distancia || linea.distanciaTotal || window.measurementHandler.calcularDistancia(linea);
                if (window.MAIRA?.Utils?.mostrarNotificacion) {
                    window.MAIRA.Utils.mostrarNotificacion(`Distancia: ${distancia.toFixed(2)} metros`, 'info');
                } else {
                    alert(`Distancia: ${distancia.toFixed(2)} metros`);
                }
                menu.remove();
            }
        },
        {
            icono: '🗑️',
            texto: 'Eliminar Línea',
            accion: () => {
                if (confirm('¿Está seguro de que desea eliminar esta línea?')) {
                    // Remover del calco
                    if (linea._map) {
                        linea._map.removeLayer(linea);
                    }
                    
                    // Remover del handler si existe
                    for (let [lineId, lineData] of Object.entries(window.measurementHandler.lineas)) {
                        if (lineData.polyline === linea) {
                            // Remover marcadores
                            if (lineData.marcadores) {
                                lineData.marcadores.forEach(marker => {
                                    if (marker._map) {
                                        marker._map.removeLayer(marker);
                                    }
                                });
                            }
                            delete window.measurementHandler.lineas[lineId];
                            break;
                        }
                    }
                    
                    if (window.MAIRA?.Utils?.mostrarNotificacion) {
                        window.MAIRA.Utils.mostrarNotificacion('Línea eliminada', 'success');
                    }
                }
                menu.remove();
            }
        }
    ];
    
    // Crear botones del menú
    opciones.forEach(opcion => {
        const boton = document.createElement('div');
        boton.style.cssText = `
            padding: 10px 15px;
            cursor: pointer;
            border-bottom: 1px solid #eee;
            transition: background-color 0.2s;
        `;
        
        boton.innerHTML = `${opcion.icono} ${opcion.texto}`;
        
        boton.addEventListener('mouseenter', () => {
            boton.style.backgroundColor = '#f5f5f5';
        });
        
        boton.addEventListener('mouseleave', () => {
            boton.style.backgroundColor = 'transparent';
        });
        
        boton.addEventListener('click', opcion.accion);
        
        menu.appendChild(boton);
    });
    
    // Agregar al DOM
    document.body.appendChild(menu);
    
    // Cerrar menú al hacer click fuera
    setTimeout(() => {
        document.addEventListener('click', function cerrarMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', cerrarMenu);
            }
        });
    }, 100);
    
    console.log('📋 Menú contextual mostrado para línea');
}

// Exportar función de menú contextual
window.mostrarMenuContextualLinea = mostrarMenuContextualLinea;

console.log('✅ MeasurementHandler cargado - Funciones exportadas al scope global - Menú contextual implementado');
