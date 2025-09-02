window.interpolarPuntosRuta = interpolarpuntos;
// herramientas.js
// Este archivo contiene funciones para herramientas de medición, búsqueda y manipulación del mapa

// ======================================================
// MAIRA - Optimización Móvil y Táctil Integrada
// ======================================================

/**
 * Detección avanzada de dispositivo móvil y configuración táctil
 */
function detectarDispositivoMovil() {
    const userAgent = navigator.userAgent.toLowerCase();
    const deviceInfo = {
        isMobile: /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
        isTablet: /ipad|android(?!.*mobile)|kindle|silk/i.test(userAgent) || 
                 (window.innerWidth >= 768 && window.innerWidth <= 1024),
        isIOS: /ipad|iphone|ipod/i.test(userAgent),
        hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        screenWidth: screen.width,
        windowWidth: window.innerWidth
    };
    
    // Configurar viewport dinámico para móviles
    if (deviceInfo.isMobile || deviceInfo.isTablet) {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        
        if (deviceInfo.isIOS) {
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, shrink-to-fit=no';
        } else {
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
        }
    }
    
    return deviceInfo;
}

/**
 * Configuración de gestos táctiles mejorados para herramientas de medición
 */
function configurarGestosTactiles() {
    const deviceInfo = detectarDispositivoMovil();
    
    if (!deviceInfo.hasTouch) return;
    
    console.log('🔧 Configurando gestos táctiles para herramientas');
    
    // Variables para tracking de gestos
    let touchStartTime = 0;
    let touchStartPos = { x: 0, y: 0 };
    let tapCount = 0;
    let tapTimer = null;
    
    // Manejo específico para mediciones
    document.addEventListener('touchstart', (e) => {
        touchStartTime = Date.now();
        const touch = e.touches[0];
        touchStartPos = { x: touch.clientX, y: touch.clientY };
        
        // Si es en el mapa y hay herramienta activa
        if (e.target.closest('.leaflet-container') && window.herramientaActiva) {
            e.preventDefault(); // Prevenir scroll en mediciones
        }
    }, { passive: false });
    
    document.addEventListener('touchend', (e) => {
        const touchEndTime = Date.now();
        const touch = e.changedTouches[0];
        const touchEndPos = { x: touch.clientX, y: touch.clientY };
        
        const deltaTime = touchEndTime - touchStartTime;
        const deltaX = touchEndPos.x - touchStartPos.x;
        const deltaY = touchEndPos.y - touchStartPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Detectar tap (click) en lugar de drag
        if (distance < 10 && deltaTime < 300) {
            tapCount++;
            
            if (tapTimer) clearTimeout(tapTimer);
            
            tapTimer = setTimeout(() => {
                if (tapCount === 1) {
                    // Single tap - equivale a click
                    simularClickEnPunto(touchEndPos);
                } else if (tapCount === 2) {
                    // Double tap - equivale a double click
                    simularDoubleClickEnPunto(touchEndPos);
                }
                tapCount = 0;
            }, 300);
        }
    }, { passive: true });
    
    // Mejorar botones para táctil
    aplicarEstilosTactiles();
}

/**
 * Aplicar estilos optimizados para dispositivos táctiles
 */
function aplicarEstilosTactiles() {
    const estilosTactiles = document.createElement('style');
    estilosTactiles.id = 'estilos-tactiles-maira';
    estilosTactiles.textContent = `
        /* Optimizaciones táctiles para herramientas */
        .leaflet-control-zoom a,
        .leaflet-bar a {
            min-width: 44px !important;
            min-height: 44px !important;
            line-height: 44px !important;
            font-size: 18px !important;
        }
        
        /* Botones de herramientas más grandes en móviles */
        @media (max-width: 768px) {
            #botones-secundarios button {
                min-height: 48px !important;
                min-width: 48px !important;
                padding: 12px !important;
                font-size: 14px !important;
                margin: 5px !important;
            }
            
            .menu-btn button {
                min-height: 48px !important;
                padding: 12px 16px !important;
                font-size: 15px !important;
            }
            
            /* Displays informativos adaptados */
            .medicion-display,
            .coordenadas-display {
                bottom: 140px !important;
                left: 10px !important;
                right: 10px !important;
                width: auto !important;
                font-size: 14px !important;
                padding: 10px !important;
                border-radius: 8px !important;
            }
            
            .medicion-display {
                bottom: 180px !important;
            }
        }
        
        /* Feedback táctil visual */
        @media (hover: none) and (pointer: coarse) {
            button:active,
            .leaflet-control a:active {
                transform: scale(0.95) !important;
                opacity: 0.8 !important;
            }
        }
    `;
    
    // Solo añadir si no existe
    if (!document.getElementById('estilos-tactiles-maira')) {
        document.head.appendChild(estilosTactiles);
    }
}

/**
 * Simular click en punto específico para herramientas de medición
 */
function simularClickEnPunto(punto) {
    const elemento = document.elementFromPoint(punto.x, punto.y);
    if (elemento && elemento.closest('.leaflet-container')) {
        // Crear evento de mouse sintético
        const evento = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: punto.x,
            clientY: punto.y
        });
        elemento.dispatchEvent(evento);
    }
}

/**
 * Simular double click para finalizar mediciones
 */
function simularDoubleClickEnPunto(punto) {
    const elemento = document.elementFromPoint(punto.x, punto.y);
    if (elemento && elemento.closest('.leaflet-container')) {
        // Crear evento de doble click sintético
        const evento = new MouseEvent('dblclick', {
            bubbles: true,
            cancelable: true,
            clientX: punto.x,
            clientY: punto.y
        });
        elemento.dispatchEvent(evento);
        
        console.log('📱 Double tap detectado - finalizando medición');
    }
}

// Inicializar optimizaciones móviles cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        configurarGestosTactiles();
    });
} else {
    configurarGestosTactiles();
}

/**
 * Configurar eventos táctiles específicos para medición
 */
function configurarEventosTactilesMedicion() {
    const mapContainer = mapa.getContainer();
    
    // Variables para tracking de touch en medición
    let touchStartPos = null;
    let hasMoved = false;
    let touchCount = 0;
    let lastTouchTime = 0;
    const touchThreshold = 300; // ms para detectar doble tap
    const touchMoveThreshold = 10; // px para detectar movimiento

    // Touch start para medición
    const onTouchStartMedicion = (e) => {
        if (!measuringDistance) return;
        
        touchStartPos = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            time: Date.now()
        };
        hasMoved = false;
        e.preventDefault(); // Prevenir scroll durante medición
    };

    // Touch move para medición
    const onTouchMoveMedicion = (e) => {
        if (!touchStartPos) return;
        
        const moveDistance = Math.sqrt(
            Math.pow(e.touches[0].clientX - touchStartPos.x, 2) +
            Math.pow(e.touches[0].clientY - touchStartPos.y, 2)
        );
        
        if (moveDistance > touchMoveThreshold) {
            hasMoved = true;
        }
    };

    // Touch end para medición
    const onTouchEndMedicion = (e) => {
        if (!measuringDistance || !touchStartPos || hasMoved) {
            touchStartPos = null;
            return;
        }

        const touchDuration = Date.now() - touchStartPos.time;
        
        // Solo procesar toques rápidos y precisos
        if (touchDuration < 500) {
            const now = Date.now();
            
            // Detectar doble tap para finalizar medición
            if (now - lastTouchTime < touchThreshold && touchCount > 0) {
                console.log('📱 Doble tap detectado - finalizando medición');
                finalizarMedicion();
                return;
            }
            
            lastTouchTime = now;
            touchCount++;

            // Convertir posición de touch a coordenadas del mapa
            const containerPoint = L.point(touchStartPos.x, touchStartPos.y);
            const latlng = mapa.containerPointToLatLng(containerPoint);
            
            // Feedback visual táctil
            mostrarFeedbackTactil(touchStartPos.x, touchStartPos.y);
            
            // Agregar punto de medición
            addDistancePoint({ latlng });
            
            // Actualizar instrucciones táctiles
            actualizarInstruccionesTactiles(touchCount);
        }
        
        touchStartPos = null;
    };

    // Limpiar eventos anteriores si existen
    if (window.touchEventHandlersMedicion) {
        mapContainer.removeEventListener('touchstart', window.touchEventHandlersMedicion.touchstart);
        mapContainer.removeEventListener('touchmove', window.touchEventHandlersMedicion.touchmove);
        mapContainer.removeEventListener('touchend', window.touchEventHandlersMedicion.touchend);
    }

    // Agregar nuevos event listeners
    mapContainer.addEventListener('touchstart', onTouchStartMedicion, { passive: false });
    mapContainer.addEventListener('touchmove', onTouchMoveMedicion, { passive: true });
    mapContainer.addEventListener('touchend', onTouchEndMedicion, { passive: true });

    // Guardar referencias para limpieza posterior
    window.touchEventHandlersMedicion = {
        touchstart: onTouchStartMedicion,
        touchmove: onTouchMoveMedicion,
        touchend: onTouchEndMedicion
    };
}

/**
 * Mostrar alerta optimizada para dispositivos táctiles
 */
function mostrarAlertaTactil(mensaje) {
    // Crear modal táctil más amigable que alert()
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: Arial, sans-serif;
    `;
    
    const contenido = document.createElement('div');
    contenido.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 12px;
        max-width: 80vw;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;
    
    contenido.innerHTML = `
        <div style="font-size: 16px; margin-bottom: 15px; color: #333;">
            ${mensaje}
        </div>
        <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" 
                style="background: #007cba; color: white; border: none; padding: 12px 24px; 
                       border-radius: 6px; font-size: 16px; min-height: 44px; min-width: 80px;">
            Entendido
        </button>
    `;
    
    modal.appendChild(contenido);
    document.body.appendChild(modal);
}

/**
 * Mostrar display de medición optimizado para táctil
 */
function mostrarDisplayMedicionTactil(deviceInfo) {
    let medicionDisplay = document.getElementById('medicionDistancia');
    if (medicionDisplay) {
        const instrucciones = deviceInfo.hasTouch ? 
            'Toque para agregar puntos • Doble toque para finalizar' :
            'Haga clic para comenzar la medición';
            
        medicionDisplay.innerHTML = `
            <span>${instrucciones}</span>
            <button onclick="finalizarMedicion()" style="float: right; min-height: 32px; min-width: 32px;">✕</button>
        `;
        medicionDisplay.style.display = 'block';
    }
}

/**
 * Mostrar feedback visual táctil cuando se agrega un punto
 */
function mostrarFeedbackTactil(x, y) {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed;
        left: ${x - 15}px;
        top: ${y - 15}px;
        width: 30px;
        height: 30px;
        background: rgba(0, 123, 255, 0.8);
        border: 2px solid #007bff;
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        animation: feedbackPulse 0.6s ease-out forwards;
    `;
    
    // Añadir animación CSS si no existe
    if (!document.getElementById('feedback-styles')) {
        const styles = document.createElement('style');
        styles.id = 'feedback-styles';
        styles.textContent = `
            @keyframes feedbackPulse {
                0% {
                    transform: scale(0.5);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.2);
                    opacity: 0.8;
                }
                100% {
                    transform: scale(1.5);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(feedback);
    
    // Remover el elemento después de la animación
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.parentNode.removeChild(feedback);
        }
    }, 600);
}

/**
 * Actualizar instrucciones durante la medición táctil
 */
function actualizarInstruccionesTactiles(puntos) {
    let medicionDisplay = document.getElementById('medicionDistancia');
    if (medicionDisplay && lineaActual) {
        const distanciaActual = calcularDistancia(lineas[lineaActual].polyline);
        
        medicionDisplay.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>📏 ${puntos} punto${puntos > 1 ? 's' : ''} • ${distanciaActual.toFixed(2)}m</span>
                <div>
                    <button onclick="finalizarMedicion()" style="min-height: 36px; min-width: 60px; margin-left: 8px; background: #28a745; color: white; border: none; border-radius: 4px;">✓ Fin</button>
                    <button onclick="finalizarMedicion()" style="min-height: 36px; min-width: 36px; margin-left: 4px; background: #dc3545; color: white; border: none; border-radius: 4px;">✕</button>
                </div>
            </div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
                ${puntos === 0 ? 'Toque para comenzar' : 'Toque para continuar • Doble toque para finalizar'}
            </div>
        `;
        
        console.log(`📱 Instrucciones actualizadas - ${puntos} puntos, ${distanciaActual.toFixed(2)}m`);
    }
}

// ======================================================
// VARIABLES GLOBALES Y FUNCIONES ORIGINALES
// ======================================================

// VERIFICAR QUE ESTAS VARIABLES ESTÉN DECLARADAS AL INICIO:

// ✅ VARIABLES GLOBALES NECESARIAS (línea ~10):
var measuringDistance = false;
var distancePolyline;
var lineaActual = null;
var lineas = {};
var perfilElevacionDisplay = null;
var lineaSeleccionada = null;
var elementoSeleccionado = null; // ✅ AGREGAR ESTA QUE FALTA
let puntos = [];
var punto = null;
var calcoActivo = null; // ✅ INICIALIZAR CORRECTAMENTE

// ✅ FUNCIÓN PARA OBTENER CALCO ACTIVO:
function obtenerCalcoActivo() {
    if (window.calcos && window.calcoActivoId) {
        return window.calcos[window.calcoActivoId];
    }
    return window.calcoActivo || null;
}

function actualizarLinea(id) {
    const linea = lineas[id];
    if (linea) {
        // Actualizar geometría
        if (linea.marcadores) {
            const latlngs = linea.marcadores.map(m => m.getLatLng());
            linea.polyline.setLatLngs(latlngs);
        }
        
        // Actualizar estilo
        linea.polyline.setStyle({
            color: linea.color,
            weight: linea.ancho,
            dashArray: linea.tipo === 'dashed' ? '5, 5' : null
        });
        
        // Calcular y actualizar distancia
        const distancia = calcularDistancia(linea.polyline);
        linea.distancia = distancia;
        
        // ✅ MANTENER TODAS LAS PROPIEDADES DE DISTANCIA SINCRONIZADAS:
        linea.distanciaAcumulada = distancia;
        linea.distanciaTotal = distancia;
        linea.totalDistance = distancia;
        
        // ✅ ACTUALIZAR EN EL POLYLINE TAMBIÉN:
        linea.polyline.distanciaAcumulada = distancia;
        linea.polyline.distanciaTotal = distancia;
        linea.polyline.distancia = distancia;
        linea.polyline.options.distanciaAcumulada = distancia;
        linea.polyline.options.distanciaTotal = distancia;
        
        // Actualizar display de medición si está visible
        const medicionDisplay = document.getElementById('medicionDistancia');
        if (medicionDisplay && medicionDisplay.style.display !== 'none') {
            medicionDisplay.innerHTML = `
                <span>Distancia: ${distancia.toFixed(2)} metros</span>
                <button onclick="finalizarMedicion()" style="float: right;">X</button>
            `;
        }
    }
}

function calcularDistancia(puntos) {
    // Si es una polyline, obtener sus puntos
    if (puntos instanceof L.Polyline) {
        puntos = puntos.getLatLngs();
    }

    // Si no es array o no tiene puntos suficientes, retornar 0
    if (!Array.isArray(puntos) || puntos.length < 2) {
        return 0;
    }

    let distanciaTotal = 0;
    for (let i = 1; i < puntos.length; i++) {
        distanciaTotal += L.latLng(puntos[i-1]).distanceTo(L.latLng(puntos[i]));
    }
    return distanciaTotal;
}

// REEMPLAZAR FUNCIÓN crearLinea (línea ~50):

function crearLinea() {
    console.log('🔧 Creando nueva línea de medición...');
    
    // ✅ VERIFICAR CALCO ACTIVO:
    if (!calcoActivo) {
        calcoActivo = obtenerCalcoActivo();
        if (!calcoActivo) {
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
        distancia: 0
    }).addTo(calcoActivo);
    
    // ✅ ESTABLECER PROPIEDADES DIRECTAS:
    nuevaLinea.distanciaAcumulada = 0;
    nuevaLinea.distanciaTotal = 0;
    nuevaLinea.distancia = 0;
  
    lineas[id] = {
        id: id,
        polyline: nuevaLinea,
        marcadores: [],
        nombre: "Línea " + (Object.keys(lineas).length + 1),
        color: 'red',
        ancho: 5,
        tipo: 'solid',
        distancia: 0,
        distanciaAcumulada: 0,
        distanciaTotal: 0,
        totalDistance: 0
    };
  
    // ✅ EVENTOS DE LA LÍNEA:
    nuevaLinea.on('click', function(e) {
        seleccionarElemento(this);
        // Mostrar distancia en display
        if (typeof this.distancia === 'number') {
            const medicionDisplay = document.getElementById('medicionDistancia');
            if (medicionDisplay) {
                medicionDisplay.innerHTML = `<span>Distancia: ${this.distancia.toFixed(2)} metros</span><button onclick="finalizarMedicion()" style="float: right;">X</button>`;
                medicionDisplay.style.display = 'block';
            }
        }
        // Mostrar perfil de elevación si corresponde
        if (window.mostrarPerfilElevacion) {
            window.mostrarPerfilElevacion();
        }
    });
    nuevaLinea.on('dblclick', function(e) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        if (typeof mostrarMenuContextual === 'function') {
            mostrarMenuContextual(e);
        }
    });
    nuevaLinea.on('contextmenu', function(e) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        if (typeof mostrarMenuContextual === 'function') {
            mostrarMenuContextual(e);
        }
    });
    
    console.log('✅ Línea creada con ID:', id);
    return id;
}

function actualizarMedicion(id) {
    const linea = lineas[id];
    if (linea && linea.polyline) {
        const distancia = calcularDistancia(linea.polyline);
        
        // ✅ ACTUALIZAR TODAS LAS PROPIEDADES DE DISTANCIA:
        linea.distancia = distancia;
        linea.distanciaAcumulada = distancia;
        linea.distanciaTotal = distancia;
        linea.totalDistance = distancia;
        
        // ✅ ACTUALIZAR EN EL POLYLINE:
        linea.polyline.distanciaAcumulada = distancia;
        linea.polyline.distanciaTotal = distancia;
        linea.polyline.distancia = distancia;
        linea.polyline.options.distanciaAcumulada = distancia;
        linea.polyline.options.distanciaTotal = distancia;
        
        const medicionDisplay = document.getElementById('medicionDistancia');
        if (medicionDisplay) {
            medicionDisplay.innerHTML = `
                <span>Distancia: ${distancia.toFixed(2)} metros</span>
                <button onclick="finalizarMedicion()" style="float: right;">X</button>
            `;
        }
    }
}

// Función para detener la medición
function stopMeasuring() {
    console.log("Deteniendo medición de distancia");
    measuringDistance = false;
    mapa.off('click', addDistancePoint);
    mapa.off('dblclick', stopMeasuring);
    if (lineaActual) {
        ocultarMarcadores(lineaActual);
        lineaActual = null;
    }
}


// Funciones auxiliares para manejar marcadores y líneas
function mostrarMarcadores(id) {
    if (lineas[id] && lineas[id].marcadores) {
        lineas[id].marcadores.forEach(function(marker) {
            marker.getElement().style.display = '';
        });
    }
}

function ocultarMarcadores(id) {
    if (lineas[id] && lineas[id].marcadores) {
        lineas[id].marcadores.forEach(function(marker) {
            marker.getElement().style.display = 'none';
        });
    }
}

function resaltarLinea(id) {
    if (lineas[id] && lineas[id].polyline) {
        lineas[id].polyline.setStyle({weight: lineas[id].ancho + 1});
    }
}

function desresaltarLinea(id) {
    if (lineas[id] && lineas[id].polyline) {
        lineas[id].polyline.setStyle({weight: lineas[id].ancho});
    }
}

// Función para actualizar la polyline cuando se arrastran los marcadores
function actualizarPolyline(id) {
    if (lineas[id] && lineas[id].polyline && lineas[id].marcadores) {
        var nuevosLatLngs = lineas[id].marcadores.map(function(marker) {
            return marker.getLatLng();
        });
        lineas[id].polyline.setLatLngs(nuevosLatLngs);
    }
}

// Función para actualizar la distancia mostrada
function updateDistanceDisplay(id) {
    if (lineas[id] && lineas[id].polyline) {
        var distancia = calcularDistancia(lineas[id].polyline);
        document.getElementById('medicionDistancia').textContent = "Distancia: " + distancia.toFixed(2) + " metros";
    }
}



// Función para inicializar la búsqueda de lugar
function initializeBuscarLugar() {
    console.log('🔍 Iniciando inicialización de buscarLugar');
    var busquedaLugarInput = document.getElementById('busquedaLugar');
    var btnBuscarLugar = document.getElementById('btnBuscarLugar');
    var resultadosBusquedaLugar = document.getElementById('resultadosBusquedaLugar');

    if (!busquedaLugarInput || !btnBuscarLugar || !resultadosBusquedaLugar) {
        console.warn('⚠️ Elementos de búsqueda de lugar no encontrados en esta página');
        return;
    }

    if (!window.mapa) {
        console.error('❌ Mapa no disponible para búsqueda de lugar');
        return;
    }

    console.log('✅ Todos los elementos necesarios encontrados, verificando geocoder...');

    // Verificar que el geocoder esté disponible
    if (typeof L === 'undefined' || !L.Control || !L.Control.Geocoder) {
        console.error('❌ Leaflet Geocoder no está cargado');
        return;
    }

    var geocoder = L.Control.Geocoder.nominatim();
    console.log('✅ Geocoder inicializado:', geocoder);

    function handleSearch() {
        var busqueda = busquedaLugarInput.value.trim();
        if (busqueda.length === 0) return;

        console.log('🔍 Realizando búsqueda para:', busqueda);
        
        try {
            geocoder.geocode(busqueda, function(results) {
                console.log('📍 Resultados de búsqueda:', results);
                resultadosBusquedaLugar.innerHTML = '';
                if (results.length > 0) {
                    results.forEach(function(result) {
                        var li = document.createElement('li');
                        li.textContent = result.name;
                        li.style.cursor = 'pointer';
                        li.style.padding = '5px';
                        li.addEventListener('click', function() {
                            window.mapa.setView(result.center, 13);
                            console.log('🎯 Mapa centrado en:', result.center);
                            busquedaLugarInput.value = '';
                            resultadosBusquedaLugar.innerHTML = '';
                        });
                        resultadosBusquedaLugar.appendChild(li);
                    });
                } else {
                    resultadosBusquedaLugar.innerHTML = '<li style="color: #666;">No se encontraron resultados</li>';
                }
            });
        } catch (error) {
            console.error('❌ Error en geocoder:', error);
            resultadosBusquedaLugar.innerHTML = '<li style="color: red;">Error en la búsqueda</li>';
        }
    }

    busquedaLugarInput.addEventListener('input', function() {
        if (busquedaLugarInput.value.trim().length > 2) {
            handleSearch();
        } else {
            resultadosBusquedaLugar.innerHTML = '';
        }
    });

    btnBuscarLugar.addEventListener('click', handleSearch);
    
    busquedaLugarInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });

    console.log('✅ Función buscarLugar inicializada correctamente');
}

// Inicialización cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando herramientas del mapa");
    initializeBuscarLugar();
    
    var btnMedirDistancia = document.getElementById('btnMedirDistancia');
    if (btnMedirDistancia) {
        btnMedirDistancia.addEventListener('click', medirDistancia);
    } else {
        console.warn("Botón de medir distancia no encontrado");
    }

    var perfilElevacionBtn = document.getElementById('PerfilElevacionBtn');
    if (perfilElevacionBtn) {
    perfilElevacionBtn.addEventListener('click', mostrarPerfilElevacion);
    } else {
    console.warn("Botón de perfil de elevación no encontrado");
    }
    inicializarControlGestos();
});


// REEMPLAZAR FUNCIÓN medirDistancia (línea ~290):

function medirDistancia() {
    console.log("🔄 Iniciando medición optimizada para táctil");
    
    // ✅ VERIFICAR CALCO ACTIVO:
    calcoActivo = obtenerCalcoActivo();
    if (!calcoActivo) {
        const deviceInfo = detectarDispositivoMovil();
        if (deviceInfo.isMobile || deviceInfo.hasTouch) {
            mostrarAlertaTactil('Debe tener un calco activo para medir distancias');
        } else {
            alert('Debe tener un calco activo para medir distancias');
        }
        return;
    }
    
    if (measuringDistance) {
        finalizarMedicion();
    } else {
        measuringDistance = true;
        
        // Configurar cursor solo para dispositivos no táctiles
        const deviceInfo = detectarDispositivoMovil();
        if (!deviceInfo.hasTouch) {
            mapa.getContainer().style.cursor = 'crosshair';
        }
        
        lineaActual = crearLinea();
        
        // ✅ REMOVER LISTENERS EXISTENTES PARA EVITAR CONFLICTOS:
        mapa.off('click', addDistancePoint);
        mapa.off('mousemove', actualizarDistanciaProvisional);
        mapa.off('dblclick', finalizarMedicion);
        
        // ✅ CONFIGURAR EVENTOS SEGÚN DISPOSITIVO:
        if (deviceInfo.hasTouch) {
            configurarEventosTactilesMedicion();
        } else {
            // Desktop - eventos estándar
            mapa.on('click', addDistancePoint);
            mapa.on('mousemove', actualizarDistanciaProvisional);
            mapa.once('dblclick', finalizarMedicion);
        }
        
        // Mostrar el display de medición con mensaje optimizado
        mostrarDisplayMedicionTactil(deviceInfo);
    }
}

function addDistancePoint(e) {
    if (!lineaActual) return;
    const latlng = e.latlng;
    lineas[lineaActual].polyline.addLatLng(latlng);
    
    const marker = L.marker(latlng, {
        draggable: true,
        icon: L.divIcon({className: 'vertex-marker', iconSize: [4, 4]})
    }).addTo(calcoActivo);
    
    marker.on('drag', function() {
        actualizarLinea(lineaActual);
    });
    
    lineas[lineaActual].marcadores.push(marker);
    actualizarLinea(lineaActual);
    actualizarMedicion(lineaActual);

    // Mejorar feedback para dispositivos táctiles
    const deviceInfo = detectarDispositivoMovil();
    const puntos = lineas[lineaActual].polyline.getLatLngs().length;
    const distanciaActual = calcularDistancia(lineas[lineaActual].polyline);
    
    // Asegurarse de que el display de medición permanezca visible con información actualizada
    let medicionDisplay = document.getElementById('medicionDistancia');
    if (medicionDisplay) {
        if (deviceInfo.hasTouch) {
            medicionDisplay.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>📏 ${puntos} punto${puntos > 1 ? 's' : ''} • ${distanciaActual.toFixed(2)}m</span>
                    <div>
                        <button onclick="finalizarMedicion()" style="min-height: 36px; min-width: 60px; margin-left: 8px; background: #28a745; color: white; border: none; border-radius: 4px;">✓ Fin</button>
                        <button onclick="finalizarMedicion()" style="min-height: 36px; min-width: 36px; margin-left: 4px; background: #dc3545; color: white; border: none; border-radius: 4px;">✕</button>
                    </div>
                </div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                    Toque para agregar • Doble toque para finalizar
                </div>
            `;
        } else {
            medicionDisplay.innerHTML = `
                <span>Distancia: ${distanciaActual.toFixed(2)} metros (${puntos} puntos)</span>
                <button onclick="finalizarMedicion()" style="float: right;">X</button>
            `;
        }
        medicionDisplay.style.display = 'block';
    }
    
    console.log(`📍 Punto ${puntos} agregado - Distancia actual: ${distanciaActual.toFixed(2)}m`);
}

function actualizarDistanciaProvisional(e) {
    if (measuringDistance && lineaActual) {
        const latlngs = lineas[lineaActual].polyline.getLatLngs();
        if (latlngs.length > 0) {
            const distanciaProvisional = calcularDistancia(L.polyline([...latlngs, e.latlng]));
            const puntos = latlngs.length;
            const deviceInfo = detectarDispositivoMovil();
            
            let medicionDisplay = document.getElementById('medicionDistancia');
            if (medicionDisplay) {
                if (deviceInfo.hasTouch) {
                    // En móviles, mostrar información más completa
                    medicionDisplay.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>📏 ${puntos} punto${puntos > 1 ? 's' : ''} → ${distanciaProvisional.toFixed(2)}m</span>
                            <div>
                                <button onclick="finalizarMedicion()" style="min-height: 36px; min-width: 60px; margin-left: 8px; background: #28a745; color: white; border: none; border-radius: 4px;">✓ Fin</button>
                                <button onclick="finalizarMedicion()" style="min-height: 36px; min-width: 36px; margin-left: 4px; background: #dc3545; color: white; border: none; border-radius: 4px;">✕</button>
                            </div>
                        </div>
                        <div style="font-size: 12px; color: #666; margin-top: 4px;">
                            Toque para agregar punto • Doble toque para finalizar
                        </div>
                    `;
                } else {
                    // En desktop, mostrar versión más simple
                    medicionDisplay.innerHTML = `
                        <span>Distancia: ${distanciaProvisional.toFixed(2)} metros</span>
                        <button onclick="finalizarMedicion()" style="float: right;">X</button>
                    `;
                }
                medicionDisplay.style.display = 'block';
            }
        }
    }
}

// EN herramientasP.js línea ~390 - VERSIÓN FUNCIONAL ORIGINAL:
function finalizarMedicion(e) {
    if (e) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
    }

    console.log('🏁 Finalizando medición');
    
    measuringDistance = false;
    mapa.getContainer().style.cursor = '';
    
    // Limpiar eventos estándar
    mapa.off('click', addDistancePoint);
    mapa.off('mousemove', actualizarDistanciaProvisional);
    mapa.off('dblclick', finalizarMedicion);
    
    // Limpiar eventos táctiles si existen
    if (window.touchEventHandlersMedicion) {
        const mapContainer = mapa.getContainer();
        mapContainer.removeEventListener('touchstart', window.touchEventHandlersMedicion.touchstart);
        mapContainer.removeEventListener('touchmove', window.touchEventHandlersMedicion.touchmove);
        mapContainer.removeEventListener('touchend', window.touchEventHandlersMedicion.touchend);
        window.touchEventHandlersMedicion = null;
    }
    
    if (lineaActual) {
        let linea = lineas[lineaActual];
        if (linea && linea.polyline) {
            const distancia = calcularDistancia(linea.polyline);
            
            // ✅ PROPIEDADES PARA PANEL DE MARCHA:
            linea.distancia = distancia;
            linea.distanciaAcumulada = distancia;
            linea.distanciaTotal = distancia;
            
            linea.polyline.distancia = distancia;
            linea.polyline.distanciaAcumulada = distancia;
            linea.polyline.distanciaTotal = distancia;
            linea.polyline.options.distanciaAcumulada = distancia;
            linea.polyline.options.distanciaTotal = distancia;
            
            // ✅ ACTUALIZAR NOMBRE:
            linea.nombre = `Medición: ${distancia.toFixed(2)}m`;
            linea.polyline.options.nombre = linea.nombre;
            linea.polyline.options.tipoElemento = 'lineaMedicion';
            
            console.log('✅ Medición completada:', distancia.toFixed(2), 'metros');
            
            // ✅ SELECCIONAR LÍNEA CREADA:
            if (typeof seleccionarElemento === 'function') {
                seleccionarElemento(linea.polyline);
            } else {
                window.elementoSeleccionado = linea.polyline;
            }
        }
        
        lineaActual = null;
    }
    
    // ✅ ACTUALIZAR DISPLAY:
    let medicionDisplay = document.getElementById('medicionDistancia');
    if (medicionDisplay) {
        medicionDisplay.style.display = 'none';
    }
    
    console.log('✅ Medición finalizada correctamente');
}



// Función de fallback sin worker
async function procesarElevacionSinWorker(puntosInterpolados) {
    if (!window.elevationHandler) {
        throw new Error('elevationHandler no disponible');
    }

    let distanciaAcumulada = 0;
    const datosElevacion = [];

    for (let index = 0; index < puntosInterpolados.length; index++) {
        const punto = puntosInterpolados[index];
        
        // Calcular distancia acumulada
        if (index > 0) {
            const puntoAnterior = puntosInterpolados[index - 1];
            const distanciaParcial = L.latLng(puntoAnterior.lat, puntoAnterior.lng)
                .distanceTo(L.latLng(punto.lat, punto.lng));
            distanciaAcumulada += distanciaParcial;
        }

        // Obtener elevación
        let elevation;
        try {
            elevation = await window.elevationHandler.obtenerElevacion(punto.lat, punto.lng);
            if (!isFinite(elevation)) elevation = 0;
        } catch (error) {
            console.warn(`Error obteniendo elevación para punto ${index}:`, error);
            elevation = 0;
        }

        datosElevacion.push({
            distancia: distanciaAcumulada,
            elevation: elevation,
            lat: punto.lat,
            lng: punto.lng,
            pendiente: 0
        });
    }

    // Calcular pendientes
    datosElevacion.forEach((dato, index) => {
        if (index > 0) {
            const anterior = datosElevacion[index - 1];
            const distanciaParcial = dato.distancia - anterior.distancia;
            const elevacionParcial = dato.elevation - anterior.elevation;
            
            if (distanciaParcial > 0) {
                dato.pendiente = (elevacionParcial / distanciaParcial) * 100;
                if (Math.abs(dato.pendiente) > 100) {
                    dato.pendiente = Math.sign(dato.pendiente) * 100;
                }
            }
        }
    });

    return datosElevacion;
}


// AGREGAR EN herramientasP.js línea ~600:

function mostrarGraficoPerfil(datos, estadisticas = null) {
    console.log('📈 Mostrando gráfico con', datos?.length || 0, 'puntos');
    
    if (!datos || !Array.isArray(datos) || datos.length === 0) {
        console.warn('⚠️ No hay datos válidos para mostrar el gráfico');
        alert('No hay datos de elevación válidos para mostrar el gráfico');
        return;
    }
    
    // ✅ CREAR MODAL PARA EL GRÁFICO:
    const modal = document.createElement('div');
    modal.id = 'graficoPerfilModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    const contenido = document.createElement('div');
    contenido.style.cssText = `
        background: white;
        border-radius: 10px;
        padding: 20px;
        max-width: 90%;
        max-height: 90%;
        position: relative;
    `;
    
    // ✅ BOTÓN CERRAR:
    const btnCerrar = document.createElement('button');
    btnCerrar.textContent = '✕';
    btnCerrar.style.cssText = `
        position: absolute;
        top: 10px;
        right: 15px;
        border: none;
        background: #ff4444;
        color: white;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        cursor: pointer;
        font-size: 16px;
    `;
    btnCerrar.onclick = () => modal.remove();
    
    // ✅ TÍTULO:
    const titulo = document.createElement('h3');
    titulo.textContent = 'Perfil de Elevación';
    titulo.style.marginTop = '0';
    
    // ✅ ESTADÍSTICAS:
    const divEstadisticas = document.createElement('div');
    if (estadisticas) {
        divEstadisticas.innerHTML = `
            <p><strong>Estadísticas:</strong></p>
            <ul>
                <li>Elevación mínima: ${estadisticas.elevacion?.minima || 'N/A'} m</li>
                <li>Elevación máxima: ${estadisticas.elevacion?.maxima || 'N/A'} m</li>
                <li>Desnivel total: ${estadisticas.elevacion?.desnivel || 'N/A'} m</li>
                <li>Distancia total: ${(estadisticas.distanciaTotal / 1000).toFixed(2) || 'N/A'} km</li>
            </ul>
        `;
    }
    
    // ✅ CONTENEDOR PARA CANVAS:
    const canvasContainer = document.createElement('div');
    canvasContainer.style.cssText = `
        width: 800px;
        height: 400px;
        margin: 20px 0;
        position: relative;
    `;
    
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    canvas.style.cssText = `
        border: 1px solid #ccc;
        background: #f9f9f9;
    `;
    
    // ✅ DIBUJAR GRÁFICO:
    const ctx = canvas.getContext('2d');
    dibujarGraficoPerfil(ctx, datos, canvas.width, canvas.height);
    
    // ✅ ENSAMBLAR MODAL:
    canvasContainer.appendChild(canvas);
    contenido.appendChild(btnCerrar);
    contenido.appendChild(titulo);
    contenido.appendChild(divEstadisticas);
    contenido.appendChild(canvasContainer);
    modal.appendChild(contenido);
    document.body.appendChild(modal);
    
    console.log('✅ Gráfico de perfil mostrado correctamente');
}

function dibujarGraficoPerfil(ctx, datos, width, height) {
    // ✅ PREPARAR DATOS:
    const margen = { top: 40, right: 40, bottom: 60, left: 80 };
    const graficaWidth = width - margen.left - margen.right;
    const graficaHeight = height - margen.top - margen.bottom;
    
    // ✅ OBTENER RANGOS:
    const elevaciones = datos.map(d => d.elevation).filter(e => e !== null && !isNaN(e));
    const distancias = datos.map(d => d.distancia || 0);
    
    if (elevaciones.length === 0) {
        ctx.fillStyle = '#ff0000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No hay datos de elevación válidos', width/2, height/2);
        return;
    }
    
    const minElevacion = Math.min(...elevaciones);
    const maxElevacion = Math.max(...elevaciones);
    const maxDistancia = Math.max(...distancias);
    
    // ✅ LIMPIAR CANVAS:
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, width, height);
    
    // ✅ DIBUJAR EJES:
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Eje Y (elevación)
    ctx.moveTo(margen.left, margen.top);
    ctx.lineTo(margen.left, height - margen.bottom);
    // Eje X (distancia)
    ctx.moveTo(margen.left, height - margen.bottom);
    ctx.lineTo(width - margen.right, height - margen.bottom);
    ctx.stroke();
    
    // ✅ ETIQUETAS EJES:
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // Etiquetas X (distancia)
    for (let i = 0; i <= 5; i++) {
        const x = margen.left + (i / 5) * graficaWidth;
        const distancia = (i / 5) * maxDistancia;
        ctx.fillText(`${(distancia/1000).toFixed(1)}km`, x, height - margen.bottom + 20);
        
        // Líneas de cuadrícula verticales
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, margen.top);
        ctx.lineTo(x, height - margen.bottom);
        ctx.stroke();
    }
    
    // Etiquetas Y (elevación)
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const y = height - margen.bottom - (i / 5) * graficaHeight;
        const elevacion = minElevacion + (i / 5) * (maxElevacion - minElevacion);
        ctx.fillStyle = '#333';
        ctx.fillText(`${elevacion.toFixed(0)}m`, margen.left - 10, y + 4);
        
        // Líneas de cuadrícula horizontales
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margen.left, y);
        ctx.lineTo(width - margen.right, y);
        ctx.stroke();
    }
    
    // ✅ DIBUJAR PERFIL:
    ctx.strokeStyle = '#2196F3';
    ctx.fillStyle = 'rgba(33, 150, 243, 0.3)';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    let firstPoint = true;
    
    for (let i = 0; i < datos.length; i++) {
        const punto = datos[i];
        if (punto.elevation === null || isNaN(punto.elevation)) continue;
        
        const x = margen.left + (punto.distancia / maxDistancia) * graficaWidth;
        const y = height - margen.bottom - ((punto.elevation - minElevacion) / (maxElevacion - minElevacion)) * graficaHeight;
        
        if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    // Stroke del perfil
    ctx.stroke();
    
    // Relleno bajo el perfil
    ctx.lineTo(width - margen.right, height - margen.bottom);
    ctx.lineTo(margen.left, height - margen.bottom);
    ctx.closePath();
    ctx.fill();
    
    // ✅ TÍTULO DEL GRÁFICO:
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Perfil de Elevación', width/2, 25);
}
function calcularPendiente(punto1, punto2) {
    // Verifica que ambos puntos tengan lat, lng y elevation
    if (!punto1 || !punto2 || !punto1.lat || !punto1.lng || punto1.elevation === undefined || !punto2.lat || !punto2.lng || punto2.elevation === undefined) {
        console.warn("Datos incompletos para calcular pendiente.");
        return 0;
    }

    // Calcula la distancia horizontal entre los dos puntos
    const distanciaHorizontal = L.latLng(punto1.lat, punto1.lng).distanceTo(L.latLng(punto2.lat, punto2.lng));
    if (distanciaHorizontal === 0) return 0;

    // Diferencia de elevación entre los puntos
    const diferenciaElevacion = punto2.elevation - punto1.elevation;

    // Calcula la pendiente como porcentaje
    const pendientePorcentaje = (diferenciaElevacion / distanciaHorizontal) * 100;
    return pendientePorcentaje;
}


function cerrarMedicion() {
    document.getElementById('medicionDistancia').style.display = 'none';
    finalizarMedicion();
}


function hacerEditableFlecha(flecha) {
    flecha.editing.enable();
    
    // Agregar marcadores para ajustar el ancho y la punta de la flecha
    let puntos = flecha.getLatLngs();
    let mitad = Math.floor(puntos.length / 2);
    
    let marcadorAncho = L.marker(puntos[mitad], {draggable: true}).addTo(calcoActivo);
    let marcadorPunta = L.marker(puntos[puntos.length - 2], {draggable: true}).addTo(calcoActivo);

    marcadorAncho.on('drag', function(e) {
        // Ajustar el ancho de la flecha
        let nuevaFlecha = crearFlechaAncha(flecha.getLatLngs().slice(0, mitad));
        flecha.setLatLngs(nuevaFlecha.getLatLngs());
    });

    marcadorPunta.on('drag', function(e) {
        // Ajustar la punta de la flecha
        let puntos = flecha.getLatLngs();
        puntos[puntos.length - 2] = e.latlng;
        puntos[puntos.length - 1] = e.latlng;
        flecha.setLatLngs(puntos);
    });
}

function agregarTextoPoligono(poligono, texto) {
    let bounds = poligono.getBounds();
    let centro = bounds.getCenter();
    
    let textoMarcador = L.marker(centro, {
        draggable: true,
        icon: L.divIcon({
            className: 'text-icon',
            html: `<input type="text" class="editable-text" value="${texto || 'Editar'}">`
        })
    }).addTo(calcoActivo);

    textoMarcador.on('drag', function(e) {
        // Mantener el texto dentro del polígono
        let punto = poligono.closestLayerPoint(e.target.getLatLng());
        e.target.setLatLng(mapa.layerPointToLatLng(punto));
    });
}

function agregarOpcionColor(panel, elemento) {
    let div = L.DomUtil.create('div', '', panel);
    let label = L.DomUtil.create('label', '', div);
    label.innerHTML = 'Color: ';
    let input = L.DomUtil.create('input', '', div);
    input.type = 'color';
    input.value = elemento.options.color || '#ff0000';
    input.onchange = function() {
        elemento.setStyle({color: this.value});
    };
}

function agregarOpcionAncho(panel, elemento) {
    let div = L.DomUtil.create('div', '', panel);
    let label = L.DomUtil.create('label', '', div);
    label.innerHTML = 'Ancho de línea: ';
    let input = L.DomUtil.create('input', '', div);
    input.type = 'number';
    input.min = '1';
    input.max = '10';
    input.value = elemento.options.weight || 3;
    input.onchange = function() {
        elemento.setStyle({weight: parseInt(this.value)});
    };
}

function agregarOpcionEstiloLinea(panel, elemento) {
    let div = L.DomUtil.create('div', '', panel);
    let label = L.DomUtil.create('label', '', div);
    label.innerHTML = 'Estilo de línea: ';
    let select = L.DomUtil.create('select', '', div);
    select.innerHTML = `
        <option value="">Sólida</option>
        <option value="5,5">Punteada</option>
        <option value="10,10">Discontinua</option>
    `;
    select.value = elemento.options.dashArray || '';
    select.onchange = function() {
        elemento.setStyle({dashArray: this.value});
    };
}

function agregarOpcionRelleno(panel, elemento) {
    let div = L.DomUtil.create('div', '', panel);
    let label = L.DomUtil.create('label', '', div);
    label.innerHTML = 'Relleno: ';
    let select = L.DomUtil.create('select', '', div);
    select.innerHTML = `
        <option value="none">Sin relleno</option>
        <option value="solid">Sólido</option>
        <option value="diagonal">Diagonal</option>
        <option value="rombos">Cuadrícula</option>
    `;
    select.value = elemento.options.fillPattern ? 'pattern' : (elemento.options.fillOpacity > 0 ? 'solid' : 'none');
    select.onchange = function() {
        switch(this.value) {
            case 'none':
                elemento.setStyle({fillOpacity: 0});
                break;
            case 'solid':
                elemento.setStyle({fillOpacity: 0.2, fillColor: elemento.options.color});
                break;
            case 'diagonal':
                elemento.setStyle({fillPattern: crearPatronRelleno('diagonal'), fillOpacity: 1});
                break;
            case 'rombos':
                elemento.setStyle({fillPattern: crearPatronRelleno('rombos'), fillOpacity: 1});
                break;
        }
    };
}

function agregarOpcionTexto(panel, elemento) {
    let div = L.DomUtil.create('div', '', panel);
    let label = L.DomUtil.create('label', '', div);
    label.innerHTML = 'Texto: ';
    let input = L.DomUtil.create('input', '', div);
    input.type = 'text';
    input.value = elemento.options.texto || '';
    input.onchange = function() {
        elemento.options.texto = this.value;
        actualizarTextoElemento(elemento);
    };
}

function agregarOpcionAnchoFlecha(panel, elemento) {
    let div = L.DomUtil.create('div', '', panel);
    let label = L.DomUtil.create('label', '', div);
    label.innerHTML = 'Ancho de flecha: ';
    let input = L.DomUtil.create('input', '', div);
    input.type = 'number';
    input.min = '1';
    input.max = '50';
    input.value = elemento.options.anchoFlecha || 20;
    input.onchange = function() {
        elemento.options.anchoFlecha = parseInt(this.value);
        actualizarFlechaAncha(elemento);
    };
}


function actualizarFlechaAncha(elemento) {
    let latlngs = elemento.getLatLngs();
    let puntoInicio = latlngs[0];
    let puntoFin = latlngs[latlngs.length - 1];
    
    let angulo = Math.atan2(puntoFin.lat - puntoInicio.lat, puntoFin.lng - puntoInicio.lng);
    let longitud = puntoInicio.distanceTo(puntoFin);
    
    let anchoFlecha = elemento.options.anchoFlecha / 100000; // Ajusta este valor según sea necesario
    let tamañoPunta = elemento.options.tamañoPunta / 100000; // Ajusta este valor según sea necesario

    let puntoIzquierda = L.latLng(
        puntoInicio.lat + Math.sin(angulo - Math.PI/2) * anchoFlecha,
        puntoInicio.lng + Math.cos(angulo - Math.PI/2) * anchoFlecha
    );
    let puntoDerecha = L.latLng(
        puntoInicio.lat + Math.sin(angulo + Math.PI/2) * anchoFlecha,
        puntoInicio.lng + Math.cos(angulo + Math.PI/2) * anchoFlecha
    );
    
    let puntaIzquierda = L.latLng(
        puntoFin.lat + Math.sin(angulo - Math.PI/4) * tamañoPunta,
        puntoFin.lng + Math.cos(angulo - Math.PI/4) * tamañoPunta
    );
    let puntaDerecha = L.latLng(
        puntoFin.lat + Math.sin(angulo + Math.PI/4) * tamañoPunta,
        puntoFin.lng + Math.cos(angulo + Math.PI/4) * tamañoPunta
    );

    elemento.setLatLngs([
        puntoIzquierda,
        puntaIzquierda,
        puntoFin,
        puntaDerecha,
        puntoDerecha,
        puntoIzquierda
    ]);
}

function crearPuntaFlecha(penultimoPunto, ultimoPunto) {
    let angulo = Math.atan2(ultimoPunto.lat - penultimoPunto.lat, ultimoPunto.lng - penultimoPunto.lng);
    let tamañoPunta = 0.0010; // Ajusta este valor según sea necesario
    let punta1 = L.latLng(
    ultimoPunto.lat + Math.sin(angulo - Math.PI/6) * tamañoPunta,
    ultimoPunto.lng + Math.cos(angulo - Math.PI/6) * tamañoPunta
     );
    let punta2 = L.latLng(
    ultimoPunto.lat + Math.sin(angulo + Math.PI/6) * tamañoPunta,
    ultimoPunto.lng + Math.cos(angulo + Math.PI/6) * tamañoPunta
     );
    return [punta1, ultimoPunto, punta2];
    }

// En herramientasP.js

function dibujarElemento(tipo, sidc = null, nombre = '') {
    let opciones = {
        color: 'red',
        weight: 3,
        opacity: 0.7,
        fill: tipo === 'poligono',
        fillOpacity: 0.2
    };

    let puntos = [];
    let elemento;

    mapa.on('click', agregarPunto);
    mapa.once('dblclick', finalizarDibujo);

    function agregarPunto(e) {
        puntos.push(e.latlng);
        if (!elemento) {
                switch(tipo) {
                    case 'poligono':
                        elemento = L.polygon(puntos, opciones).addTo(calcoActivo);
                        break;
                    case 'lineaConTexto':
                    case 'linea':
                        elemento = L.polyline(puntos, opciones).addTo(calcoActivo);
                        break;
                    case 'flechaAncha':
                        elemento = crearFlechaAncha(puntos, sidc, nombre);
                        break;
                    default:
                        console.error('Tipo de elemento no reconocido:', tipo);
                        return;
            }
        } else {
            elemento.setLatLngs(puntos);
        }
    }

    function finalizarDibujo(e) {
        mapa.off('click', agregarPunto);
        mapa.off('dblclick', finalizarDibujo);
    
        if (tipo === 'linea' || tipo === 'lineaConTexto') {
            elemento.options.nombre = nombre || 'Línea sin nombre';
            let textoMarcador = L.marker(elemento.getCenter(), {
                icon: L.divIcon({
                    className: 'texto-linea',
                    html: `<div style="color: black;">${elemento.options.nombre}</div>`,
                    iconSize: [100, 20]
                }),
                draggable: true,
                interactive: true
            }).addTo(calcoActivo);
            elemento.textoMarcador = textoMarcador;
    
            // Mantener el texto en la línea
            textoMarcador.on('drag', function(e) {
                let closestPoint = L.GeometryUtil.closest(mapa, elemento.getLatLngs(), e.latlng);
                this.setLatLng(closestPoint);
            });
        }
        if (tipo === 'poligono') {
            elemento.options.nombre = nombre || 'Polígono sin nombre';
            let textoMarcador = L.marker(elemento.getBounds().getCenter(), {
                icon: L.divIcon({
                    className: 'texto-poligono',
                    html: `<div style="color: black;">${elemento.options.nombre}</div>`,
                    iconSize: [100, 20]
                }),
                draggable: true,
                interactive: true
            }).addTo(calcoActivo);
            elemento.textoMarcador = textoMarcador;
        }
        if (tipo === 'lineaSIDC' && sidc) {
            let puntos = elemento.getLatLngs();
            for (let i = 0; i < puntos.length - 1; i++) {
                let punto = L.GeometryUtil.interpolateOnLine(mapa, [puntos[i], puntos[i+1]], 0.5);
                let sym = new ms.Symbol(sidc, {size: 30});
                let marcadorSIDC = L.marker(punto.latLng, {
                    icon: L.divIcon({
                        className: 'sidc-icon',
                        html: sym.asSVG(),
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    }),
                    interactive: false
                }).addTo(calcoActivo);
                elemento.marcadoresSIDC = elemento.marcadoresSIDC || [];
                elemento.marcadoresSIDC.push(marcadorSIDC);
            }
        }
    
        elemento.off('dblclick').on('dblclick', function(e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            mostrarMenuContextual(e);
        });
    
        elemento.on('click', function() { seleccionarElemento(this); });
    
        elemento.on('edit', function() {
            if (this.textoMarcador) {
                if (this instanceof L.Polyline) {
                    this.textoMarcador.setLatLng(this.getCenter());
                } else if (this instanceof L.Polygon) {
                    this.textoMarcador.setLatLng(this.getBounds().getCenter());
                }
            }
        });
    
        if (typeof registrarAccion === 'function') {
            registrarAccion({
                tipo: `agregar${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`,
                elemento: elemento
            });
        }
    
        hacerEditable(elemento, elemento.textoMarcador, tipo);
        habilitarDobleClicEnElementos();
    }
}

function ajustarFlechaAncha(linea) {
    let puntos = linea.getLatLngs();
    let flecha = crearFlechaAncha(puntos);
    calcoActivo.removeLayer(linea);
    flecha.addTo(calcoActivo);
    hacerEditableFlecha(flecha);
    return flecha;
}

// AGREGAR función inicializarControlGestos (línea ~280):
function inicializarControlGestos() {
    console.log('🎮 Inicializando control de gestos');
    
    // Verificar si estamos en dispositivo móvil
    const esMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!esMobile) {
        console.log('📱 No es dispositivo móvil, gestos táctiles omitidos');
        return;
    }
    
    // Detectar elemento del mapa
    const mapaElement = document.getElementById('mapa') || document.querySelector('.leaflet-container');
    if (!mapaElement) {
        console.warn('⚠️ Elemento del mapa no encontrado para gestos');
        return;
    }
    
    // Variables para tracking de gestos
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isGesturing = false;
    let gestureTimeout = null;
    
    // Configuración de gestos
    const SWIPE_THRESHOLD = 70;    // Distancia mínima para swipe
    const SWIPE_VELOCITY = 0.3;    // Velocidad mínima
    const VERTICAL_THRESHOLD = 50; // Límite vertical para swipe horizontal
    
    // Evento touchstart
    mapaElement.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            isGesturing = false;
            
            // Limpiar timeout anterior
            if (gestureTimeout) {
                clearTimeout(gestureTimeout);
            }
        } else if (e.touches.length === 2) {
            isGesturing = true; // Zoom/pinch gesture
        }
    });
    
    // Detectar movimientos durante el gesto
    mapaElement.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) {
            isGesturing = true;
        }
    });
    
    // Detectar swipe y otros gestos
    mapaElement.addEventListener('touchend', function(e) {
        if (isGesturing || !e.changedTouches || e.changedTouches.length === 0) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const touchTime = Date.now() - touchStartTime;
        
        // Evitar gestos muy rápidos o muy lentos
        if (touchTime < 50 || touchTime > 1000) return;
        
        const distX = touchEndX - touchStartX;
        const distY = touchEndY - touchStartY;
        const velocidadX = Math.abs(distX) / touchTime;
        
        // Swipe horizontal para abrir/cerrar paneles
        if (Math.abs(distX) > SWIPE_THRESHOLD && 
            Math.abs(distY) < VERTICAL_THRESHOLD && 
            velocidadX > SWIPE_VELOCITY) {
            
            console.log('👆 Swipe detectado:', distX > 0 ? 'derecha' : 'izquierda');
            
            if (distX > 0) {
                // Swipe derecha -> Mostrar panel
                if (window.MAIRA?.GestionBatalla?.togglePanel) {
                    window.MAIRA.GestionBatalla.togglePanel(true);
                } else if (window.mostrarPanel) {
                    window.mostrarPanel();
                }
            } else {
                // Swipe izquierda -> Ocultar panel
                if (window.MAIRA?.GestionBatalla?.togglePanel) {
                    window.MAIRA.GestionBatalla.togglePanel(false);
                } else if (window.ocultarPanel) {
                    window.ocultarPanel();
                }
            }
        }
        
        // Double tap para centrar/zoom
        if (Math.abs(distX) < 10 && Math.abs(distY) < 10 && touchTime < 300) {
            if (gestureTimeout) {
                // Es un double tap
                clearTimeout(gestureTimeout);
                gestureTimeout = null;
                console.log('👆👆 Double tap detectado');
                
                // Zoom in en la posición
                if (window.mapa) {
                    const latlng = window.mapa.containerPointToLatLng(L.point(touchEndX, touchEndY));
                    window.mapa.setView(latlng, window.mapa.getZoom() + 1);
                }
            } else {
                // Primer tap, esperar segundo
                gestureTimeout = setTimeout(() => {
                    gestureTimeout = null;
                    // Single tap - no hacer nada especial
                }, 250);
            }
        }
    });
    
    console.log('✅ Control de gestos inicializado para dispositivos móviles');
}


// AGREGAR AL FINAL DEL ARCHIVO:

// ✅ HACER FUNCIÓN GLOBAL PARA COMPATIBILIDAD:
window.initializeBuscarLugar = function() {
    console.log('🔍 Inicializando buscarLugar desde herramientasP...');
    
    // Verificar múltiples veces si es necesario
    let intentos = 0;
    const maxIntentos = 10;
    
    function intentarInicializar() {
        intentos++;
        
        // Verificar que Leaflet y Geocoder estén disponibles
        if (typeof L === 'undefined') {
            console.warn(`⚠️ Intento ${intentos}/${maxIntentos}: Leaflet no disponible`);
            if (intentos < maxIntentos) {
                setTimeout(intentarInicializar, 500);
                return;
            }
            console.error('❌ Leaflet no se cargó después de múltiples intentos');
            return;
        }
        
        if (!L.Control || !L.Control.Geocoder) {
            console.warn(`⚠️ Intento ${intentos}/${maxIntentos}: Geocoder no disponible`);
            if (intentos < maxIntentos) {
                setTimeout(intentarInicializar, 500);
                return;
            }
            console.error('❌ Geocoder no se cargó después de múltiples intentos');
            return;
        }
        
        // Verificar que el mapa esté disponible
        if (!window.mapa) {
            console.warn(`⚠️ Intento ${intentos}/${maxIntentos}: Mapa no disponible`);
            if (intentos < maxIntentos) {
                setTimeout(intentarInicializar, 500);
                return;
            }
            console.error('❌ Mapa no se inicializó después de múltiples intentos');
            return;
        }
        
        // Buscar si ya está inicializado
        if (typeof inicializarBuscarLugar === 'function') {
            console.log('✅ Inicializando función buscarLugar...');
            inicializarBuscarLugar();
        } else {
            console.warn('❌ Función inicializarBuscarLugar no está disponible');
        }
    }
    
    // Iniciar el proceso
    intentarInicializar();
};

// EN herramientasP.js línea ~830 - SIMPLIFICAR FUNCIÓN:
function seleccionarElemento(elemento) {
    console.log('🎯 Seleccionando elemento:', elemento);
    
    try {
        // ✅ DESELECCIONAR ANTERIOR SI EXISTE:
        if (window.elementoSeleccionado && window.elementoSeleccionado !== elemento) {
            deseleccionarElemento();
        }
        
        // ✅ GUARDAR ESTILO ORIGINAL SOLO LA PRIMERA VEZ:
        if (elemento.setStyle && !elemento.originalStyle && !elemento._editedStyle) {
            elemento.originalStyle = {
                color: elemento.options.color || '#3388ff',
                weight: elemento.options.weight || 3,
                opacity: elemento.options.opacity || 1,
                fillOpacity: elemento.options.fillOpacity || 0.2
            };
            console.log('💾 Estilo original guardado:', elemento.originalStyle);
        }
        
        // ✅ APLICAR ESTILO DE SELECCIÓN (RESALTAR SIN CAMBIAR COLOR):
        if (elemento.setStyle) {
            // Obtener el color actual del elemento (editado o original)
            let colorActual = '#3388ff'; // Por defecto
            let pesoActual = 3; // Por defecto
            let dashArrayActual = null; // Por defecto
            
            if (elemento._editedStyle) {
                colorActual = elemento._editedStyle.color;
                pesoActual = elemento._editedStyle.weight;
                dashArrayActual = elemento._editedStyle.dashArray;
            } else if (elemento.originalStyle) {
                colorActual = elemento.originalStyle.color;
                pesoActual = elemento.originalStyle.weight;
                dashArrayActual = elemento.originalStyle.dashArray;
            } else {
                colorActual = elemento.options.color || '#3388ff';
                pesoActual = elemento.options.weight || 3;
                dashArrayActual = elemento.options.dashArray || null;
            }
            
            // Si no hay dashArray definido pero el elemento tiene tipo, convertir
            if (!dashArrayActual && elemento.tipo === 'dashed') {
                dashArrayActual = '5, 5';
            }
            
            // Aplicar resaltado: MANTENER COLOR pero hacer más grueso y añadir sombra/glow
            elemento.setStyle({
                color: colorActual, // ✅ MANTENER EL COLOR ORIGINAL/EDITADO
                weight: pesoActual + 3, // ✅ SOLO AUMENTAR GROSOR PARA INDICAR SELECCIÓN
                opacity: 1,
                dashArray: dashArrayActual, // ✅ MANTENER TIPO DE LÍNEA
                // Añadir efecto de resaltado sin cambiar color
                className: 'elemento-seleccionado'
            });
            console.log(`✅ Elemento resaltado manteniendo color: ${colorActual}, peso: ${pesoActual + 3}, dashArray: ${dashArrayActual}`);
        }
        
        // ✅ ESTABLECER COMO SELECCIONADO:
        window.elementoSeleccionado = elemento;
        
        // ✅ SINCRONIZAR CON GESTIÓN DE BATALLA:
        if (window.elementoSeleccionadoGB !== undefined) {
            window.elementoSeleccionadoGB = elemento;
            console.log('🔄 Sincronizando con elementoSeleccionadoGB');
        }
        
        console.log('✅ Elemento seleccionado exitosamente');

        // Mostrar distancia en display si es línea
        if (elemento instanceof L.Polyline && typeof elemento.distancia === 'number') {
            const medicionDisplay = document.getElementById('medicionDistancia');
            if (medicionDisplay) {
                medicionDisplay.innerHTML = `<span>Distancia: ${elemento.distancia.toFixed(2)} metros</span><button onclick=\"finalizarMedicion()\" style=\"float: right;\">X</button>`;
                medicionDisplay.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('❌ Error al seleccionar elemento:', error);
    }
}

// EN herramientasP.js línea ~800 - FUNCIÓN DESELECCIONAR SIMPLIFICADA:
function deseleccionarElemento() {
    console.log('🔄 Deseleccionando elemento actual');
    
    if (!window.elementoSeleccionado) {
        console.log('⚠️ No hay elemento seleccionado para deseleccionar');
        return;
    }
    
    try {
        const elemento = window.elementoSeleccionado;
        
        // ✅ PRIORIDAD: 1°_editedStyle, 2°propiedades del elemento, 3°valores por defecto
        if (elemento.setStyle) {
            // Determinar el dashArray basado en el tipo
            let dashArray = null;
            if (elemento._editedStyle?.dashArray !== undefined) {
                dashArray = elemento._editedStyle.dashArray;
            } else if (elemento.tipo) {
                dashArray = elemento.tipo === 'dashed' ? '5, 5' : null;
            }
            
            const estiloFinal = {
                color: elemento._editedStyle?.color || elemento.color || elemento.options.color || '#3388ff',
                weight: elemento._editedStyle?.weight || elemento.ancho || elemento.options.weight || 3,
                opacity: elemento._editedStyle?.opacity || elemento.options.opacity || 1,
                fillOpacity: elemento._editedStyle?.fillOpacity || elemento.options.fillOpacity || 0.2,
                dashArray: dashArray
            };
            
            elemento.setStyle(estiloFinal);
            console.log('✅ Estilo preservado al deseleccionar:', estiloFinal);
        }
        
        // ✅ LIMPIAR SELECCIÓN:
        window.elementoSeleccionado = null;
        
        // ✅ SINCRONIZAR CON GESTIÓN DE BATALLA:
        if (window.elementoSeleccionadoGB !== undefined) {
            window.elementoSeleccionadoGB = null;
            console.log('🔄 Sincronizando deselección con elementoSeleccionadoGB');
        }
        
        console.log('✅ Elemento deseleccionado exitosamente');
        
    } catch (error) {
        console.error('❌ Error al deseleccionar elemento:', error);
        window.elementoSeleccionado = null;
    }
}

function interpolarpuntos(coordenadas, intervalo = 100) {
    if (!coordenadas || coordenadas.length < 2) return [];
    
    // ✅ CALCULAR DISTANCIA TOTAL COMO ANTES:
    let distanciaTotal = 0;
    for (let i = 0; i < coordenadas.length - 1; i++) {
        distanciaTotal += L.latLng(coordenadas[i]).distanceTo(L.latLng(coordenadas[i + 1]));
    }

    // ✅ DETERMINAR SEGMENTOS SEGÚN DISTANCIA TOTAL (COMO ANTES):
    let segmentosPorTramo;
    if (distanciaTotal < 500) { // Menos de 500m
        segmentosPorTramo = 50; // Un punto cada 10m aproximadamente
    } else if (distanciaTotal < 2000) { // Menos de 2km
        segmentosPorTramo = 40; // Un punto cada 50m aproximadamente
    } else if (distanciaTotal < 5000) { // Menos de 5km
        segmentosPorTramo = 10; // Un punto cada 167m aproximadamente
    } else {
        segmentosPorTramo = 20; // Un punto cada 250m o más
    }

    console.log('🔄 Interpolando puntos para', coordenadas.length, 'coordenadas');
    console.log('📏 Distancia total:', (distanciaTotal/1000).toFixed(2), 'km');
    console.log('🎯 Segmentos por tramo:', segmentosPorTramo);

    const puntosInterpolados = [];
    
    for (let i = 0; i < coordenadas.length - 1; i++) {
        const inicio = coordenadas[i];
        const fin = coordenadas[i + 1];
        const distanciaTramo = L.latLng(inicio).distanceTo(L.latLng(fin));
        
        // ✅ AJUSTAR SEGMENTOS PROPORCIONALMENTE:
        const segmentosTramo = Math.max(
            5, // Mínimo 5 puntos por tramo
            Math.round(segmentosPorTramo * (distanciaTramo / distanciaTotal))
        );

        // Para el primer tramo, incluir el punto inicial
        const empezarEn = (i === 0) ? 0 : 1;
        // Para el último tramo, no incluir el punto final duplicado
        const terminarEn = (i === coordenadas.length - 2) ? segmentosTramo - 1 : segmentosTramo;
        
        for (let j = empezarEn; j <= terminarEn; j++) {
            const fraccion = j / segmentosTramo;
            const lat = inicio.lat + (fin.lat - inicio.lat) * fraccion;
            const lng = inicio.lng + (fin.lng - inicio.lng) * fraccion;
            puntosInterpolados.push({ lat, lng });
        }
    }
    
    // Agregar siempre el último punto final
    if (coordenadas.length > 0) {
        const ultimoPunto = coordenadas[coordenadas.length - 1];
        puntosInterpolados.push({ lat: ultimoPunto.lat, lng: ultimoPunto.lng });
    }

    console.log('✅ Interpolación completada:', puntosInterpolados.length, 'puntos generados');
    return puntosInterpolados;
}


async function mostrarPerfilElevacion() {
    console.log('🎯 INICIANDO mostrarPerfilElevacion');
    
    // 1. Buscar el contenedor correcto dependiendo del contexto
    let targetContainer = null;
    let svgContainer = null;
    
    // Intentar encontrar el panel de perfil de elevación específico
    const perfilPanel = document.getElementById('perfilElevacionDisplay');
    if (perfilPanel) {
        console.log('📍 Usando panel perfilElevacionDisplay');
        targetContainer = perfilPanel;
        // Mostrar el panel si está oculto
        perfilPanel.style.display = 'block';
        
        // Intentar abrir el panel usando las funciones existentes
        if (typeof abrirPanel === 'function') {
            console.log('🔓 Abriendo panel con abrirPanel()');
            abrirPanel('perfilElevacionDisplay');
        }
        if (typeof mostrarPanel === 'function') {
            console.log('👁️ Mostrando panel con mostrarPanel()');
            mostrarPanel('perfilElevacionDisplay');
        }
    } else {
        // Buscar displayContent como fallback
        targetContainer = document.getElementById('displayContent');
        if (!targetContainer) {
            console.log('📍 Usando document.body como fallback');
            targetContainer = document.body;
        } else {
            console.log('📍 Usando displayContent como fallback');
        }
    }
    
    console.log('📦 Target container:', targetContainer);
    
    // Buscar container SVG existente
    svgContainer = document.getElementById('perfil-elevacion-svg');
    if (svgContainer) {
        console.log('🧹 Limpiando container SVG existente militar');
        svgContainer.innerHTML = '';
        // Actualizar estilos para navegación mejorada
        Object.assign(svgContainer.style, {
            overflowX: 'auto',
            overflowY: 'auto',
            scrollBehavior: 'smooth',
            height: '500px',
            maxHeight: '60vh',
            border: '3px solid #7fa650',
            backgroundColor: '#1a1a1a',
            marginBottom: '10px'
        });
    } else {
        console.log('🆕 Creando nuevo container SVG militar');
        svgContainer = document.createElement('div');
        svgContainer.id = 'perfil-elevacion-svg';
        svgContainer.className = 'svg-container-militar';
        
        // Estilo militar completo con navegación mejorada
        Object.assign(svgContainer.style, {
            width: '100%',
            height: '500px',
            minHeight: '400px',
            maxHeight: '60vh', // Reducido para dejar espacio a la tabla
            overflowX: 'auto',
            overflowY: 'auto',
            position: 'relative',
            border: '3px solid #7fa650',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: '#7fa650 #2d4a22',
            marginBottom: '10px' // Espacio para la tabla
        });
        
        // CSS para barras de scroll militares
        if (!document.getElementById('military-scrollbar-style')) {
            const style = document.createElement('style');
            style.id = 'military-scrollbar-style';
            style.textContent = `
                .svg-container-militar::-webkit-scrollbar {
                    width: 12px;
                    height: 12px;
                }
                .svg-container-militar::-webkit-scrollbar-track {
                    background: #2d4a22;
                    border-radius: 6px;
                }
                .svg-container-militar::-webkit-scrollbar-thumb {
                    background: #7fa650;
                    border-radius: 6px;
                    border: 2px solid #2d4a22;
                }
                .svg-container-militar::-webkit-scrollbar-thumb:hover {
                    background: #8fb069;
                }
                .svg-container-militar::-webkit-scrollbar-corner {
                    background: #2d4a22;
                }
            `;
            document.head.appendChild(style);
        }
        
        targetContainer.appendChild(svgContainer);
    }

    console.log('📦 SVG Container final:', svgContainer);
    console.log('📍 Está en el DOM:', document.contains(svgContainer));

    // 2. Obtener puntos de la línea seleccionada
    const polyline = window.elementoSeleccionado;
    if (!polyline) {
        svgContainer.innerHTML = '<div class="error-message">❌ No hay línea seleccionada para calcular el perfil.</div>';
        return;
    }
    const latlngs = polyline.getLatLngs();
    if (!latlngs || latlngs.length < 2) {
        svgContainer.innerHTML = '<div class="error-message">❌ No hay suficientes puntos para calcular el perfil.</div>';
        return;
    }
    // 3. Interpolar puntos
    const puntosInterpolados = interpolarpuntos(latlngs);
    // 4. Obtener elevación y luego calcular stats y renderizar
    try {
        const datosElevacion = await procesarDatosElevacion(puntosInterpolados);
        if (!datosElevacion || datosElevacion.length < 2) {
            svgContainer.innerHTML = '<div class="error-message">No se obtuvieron datos de elevación válidos.</div>';
            return;
        }
        
        console.log('🎨 RENDERIZANDO GRÁFICO con', datosElevacion.length, 'puntos');
        console.log('📦 Verificando D3.js:', typeof d3);
        console.log('📦 SVG Container:', svgContainer);
        
        // 5. Renderizar el gráfico SVG
        renderizarGraficoElevacion(datosElevacion, svgContainer);
        
    } catch (error) {
        console.error('💥 Error en mostrarPerfilElevacion:', error);
        svgContainer.innerHTML = '<div class="error-message">Error al crear el perfil de elevación: ' + error.message + '</div>';
    }
}

function renderizarGraficoElevacion(datosElevacion, svgContainer) {
    console.log('🎨 Iniciando renderizado del perfil de elevación militar');
    console.log('📊 Datos recibidos:', datosElevacion);
    
    if (typeof d3 === 'undefined') {
        console.error('❌ D3.js NO está disponible!');
        svgContainer.innerHTML = '<div class="error-message">❌ D3.js no está cargado. No se puede renderizar el gráfico.</div>';
        return;
    }
    
    if (!svgContainer) {
        console.error('❌ SVG Container no está disponible!');
        return;
    }
    
    try {
        // Limpiar contenido previo
        svgContainer.innerHTML = '';
        
        // Validar y limpiar datos
        const datosLimpios = datosElevacion.filter(d => 
            d && 
            typeof d.elevation === 'number' && 
            !isNaN(d.elevation) && 
            typeof d.distancia === 'number' && 
            !isNaN(d.distancia)
        );
        
        console.log('🧹 Datos limpiados:', datosLimpios.length, 'puntos válidos');
        
        if (datosLimpios.length < 2) {
            svgContainer.innerHTML = '<div class="error-message">❌ Datos insuficientes para generar el perfil</div>';
            return;
        }
        
        // Configuración militar con colores apropiados
        const margin = { top: 50, right: 80, bottom: 120, left: 90 };
        const containerRect = svgContainer.getBoundingClientRect();
        const width = Math.max(800, containerRect.width - 40) - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        
        console.log('📐 Dimensiones:', { width, height, containerWidth: containerRect.width });
        
        // Crear contenedor principal
        const container = d3.select(svgContainer);
        
        // Crear SVG responsivo
        const svg = container
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .style('background', '#1a1a1a')  // Fondo militar oscuro
            .style('border', '2px solid #4a5c3a')  // Verde militar
            .style('border-radius', '4px')
            .style('box-shadow', '0 2px 8px rgba(0,0,0,0.3)');
        
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Calcular estadísticas robustas
        const elevaciones = datosLimpios.map(d => d.elevation);
        const distancias = datosLimpios.map(d => d.distancia);
        const distanciaTotal = Math.max(...distancias);
        const elevacionMin = Math.min(...elevaciones);
        const elevacionMax = Math.max(...elevaciones);
        const desnivel = elevacionMax - elevacionMin;
        
        console.log('📊 Stats:', { distanciaTotal, elevacionMin, elevacionMax, desnivel });
        
        // Escalas con validación
        const xScale = d3.scaleLinear()
            .domain([0, distanciaTotal])
            .range([0, width]);
        
        const yScale = d3.scaleLinear()
            .domain([elevacionMin - desnivel * 0.1, elevacionMax + desnivel * 0.1])
            .range([height, 0]);
        
        // Crear gradiente militar
        const defs = svg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', 'elevation-gradient-military')
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', 0).attr('y1', height)
            .attr('x2', 0).attr('y2', 0);
        
        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#2d4a22')  // Verde militar oscuro
            .attr('stop-opacity', 0.8);
        
        gradient.append('stop')
            .attr('offset', '50%')
            .attr('stop-color', '#5c7a47')  // Verde militar medio
            .attr('stop-opacity', 0.6);
        
        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#8fb069')  // Verde militar claro
            .attr('stop-opacity', 0.4);
        
        // Grid militar con líneas sólidas
        const xAxisGrid = d3.axisBottom(xScale)
            .tickSize(-height)
            .tickFormat('')
            .ticks(8);
        
        const yAxisGrid = d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat('')
            .ticks(6);
        
        g.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${height})`)
            .call(xAxisGrid)
            .selectAll('line')
            .style('stroke', '#4a5c3a')  // Verde militar para grid
            .style('stroke-width', '0.5px')
            .style('opacity', 0.5);
        
        g.append('g')
            .attr('class', 'grid')
            .call(yAxisGrid)
            .selectAll('line')
            .style('stroke', '#4a5c3a')
            .style('stroke-width', '0.5px')
            .style('opacity', 0.5);
        
        // Verificar datos antes de crear líneas
        console.log('🔍 Verificando datos para líneas:');
        datosLimpios.forEach((d, i) => {
            const x = xScale(d.distancia);
            const y = yScale(d.elevation);
            console.log(`Punto ${i}: dist=${d.distancia} -> x=${x}, elev=${d.elevation} -> y=${y}`);
        });
        
        // Línea de elevación suavizada mejorada
        const line = d3.line()
            .x(d => {
                const x = xScale(d.distancia);
                return isNaN(x) ? 0 : x;
            })
            .y(d => {
                const y = yScale(d.elevation);
                return isNaN(y) ? height : y;
            })
            .curve(d3.curveCatmullRom.alpha(0.5)); // Curva más suave y natural
        
        // Área bajo la curva mejorada
        const area = d3.area()
            .x(d => {
                const x = xScale(d.distancia);
                return isNaN(x) ? 0 : x;
            })
            .y0(height)
            .y1(d => {
                const y = yScale(d.elevation);
                return isNaN(y) ? height : y;
            })
            .curve(d3.curveCatmullRom.alpha(0.5)); // Misma curva para coherencia
        
        // Renderizar área con gradiente militar
        g.append('path')
            .datum(datosLimpios)
            .attr('class', 'elevation-area')
            .attr('d', area)
            .style('fill', 'url(#elevation-gradient-military)');
        
        // Renderizar línea principal con color militar
        g.append('path')
            .datum(datosLimpios)
            .attr('class', 'elevation-line')
            .attr('d', line)
            .style('fill', 'none')
            .style('stroke', '#7fa650')  // Verde militar vibrante
            .style('stroke-width', '3px')
            .style('stroke-linejoin', 'round')
            .style('stroke-linecap', 'round');
        
        // Ejes con colores militares
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d => `${(d/1000).toFixed(1)} km`)
            .ticks(8);
        
        const yAxis = d3.axisLeft(yScale)
            .tickFormat(d => `${Math.round(d)} m`)
            .ticks(6);
        
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis)
            .selectAll('text')
            .style('font-size', '12px')
            .style('fill', '#c0c0c0');  // Gris claro militar
        
        g.append('g')
            .attr('class', 'y-axis')
            .call(yAxis)
            .selectAll('text')
            .style('font-size', '12px')
            .style('fill', '#c0c0c0');
        
        // Styling de los ejes
        g.selectAll('.axis')
            .selectAll('path, line')
            .style('stroke', '#7fa650');
        
        // Título militar simplificado
        svg.append('text')
            .attr('x', (width + margin.left + margin.right) / 2)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#c0c0c0')
            .text('PERFIL DE ELEVACIÓN');
        
        // Etiquetas de ejes militares
        svg.append('text')
            .attr('class', 'x-label')
            .attr('text-anchor', 'middle')
            .attr('x', (width + margin.left + margin.right) / 2)
            .attr('y', height + margin.top + margin.bottom - 20)
            .style('font-size', '14px')
            .style('fill', '#a0a0a0')
            .text('DISTANCIA');
        
        svg.append('text')
            .attr('class', 'y-label')
            .attr('text-anchor', 'middle')
            .attr('y', 20)
            .attr('x', -(height + margin.top) / 2)
            .attr('transform', 'rotate(-90)')
            .style('font-size', '14px')
            .style('fill', '#a0a0a0')
            .text('ELEVACIÓN (metros)');
        
        // Indicadores MIN/MAX militares
        const minPoint = datosLimpios.find(d => d.elevation === elevacionMin);
        const maxPoint = datosLimpios.find(d => d.elevation === elevacionMax);
        
        if (minPoint) {
            g.append('circle')
                .attr('class', 'min-point')
                .attr('cx', xScale(minPoint.distancia))
                .attr('cy', yScale(minPoint.elevation))
                .attr('r', 6)
                .style('fill', '#4a5c3a')  // Verde militar oscuro
                .style('stroke', '#c0c0c0')
                .style('stroke-width', 2);
            
            g.append('text')
                .attr('class', 'min-text')
                .attr('x', xScale(minPoint.distancia))
                .attr('y', yScale(minPoint.elevation) - 15)
                .attr('text-anchor', 'middle')
                .style('font-size', '12px')
                .style('fill', '#c0c0c0')
                .style('font-weight', 'bold')
                .text(`MIN: ${Math.round(minPoint.elevation)}m`);
        }
        
        if (maxPoint) {
            g.append('circle')
                .attr('class', 'max-point')
                .attr('cx', xScale(maxPoint.distancia))
                .attr('cy', yScale(maxPoint.elevation))
                .attr('r', 6)
                .style('fill', '#8fb069')  // Verde militar claro
                .style('stroke', '#c0c0c0')
                .style('stroke-width', 2);
            
            g.append('text')
                .attr('class', 'max-text')
                .attr('x', xScale(maxPoint.distancia))
                .attr('y', yScale(maxPoint.elevation) - 15)
                .attr('text-anchor', 'middle')
                .style('font-size', '12px')
                .style('fill', '#c0c0c0')
                .style('font-weight', 'bold')
                .text(`MAX: ${Math.round(maxPoint.elevation)}m`);
        }
        
        // Tooltip militar mejorado
        const tooltip = container
            .append('div')
            .attr('class', 'elevation-tooltip-military')
            .style('position', 'absolute')
            .style('background', 'rgba(26,26,26,0.95)')
            .style('color', '#c0c0c0')
            .style('padding', '12px 16px')
            .style('border-radius', '4px')
            .style('border', '1px solid #7fa650')
            .style('font-size', '13px')
            .style('font-family', 'monospace')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', 1000)
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.4)');
        
        // Línea guía vertical militar
        const guideLine = g.append('line')
            .attr('class', 'guide-line-military')
            .attr('y1', 0)
            .attr('y2', height)
            .style('stroke', '#7fa650')
            .style('stroke-width', 2)
            .style('stroke-dasharray', '4,2')
            .style('opacity', 0);
        
        // Punto indicador móvil
        const movePoint = g.append('circle')
            .attr('class', 'move-point')
            .attr('r', 5)
            .style('fill', '#7fa650')
            .style('stroke', '#c0c0c0')
            .style('stroke-width', 2)
            .style('opacity', 0);
        
        // 🎯 SISTEMA CLICK-TO-ACTIVATE para evitar conflictos con scroll
        let graficoActivo = false;
        
        // Overlay para mostrar estado inactivo
        const clickOverlay = g.append('rect')
            .attr('width', width)
            .attr('height', height)
            .style('fill', 'rgba(0,0,0,0.1)')
            .style('pointer-events', 'all')
            .style('cursor', 'pointer')
            .style('stroke', '#7fa650')
            .style('stroke-width', 2)
            .style('stroke-dasharray', '10,5')
            .style('opacity', 1);
        
        // Texto indicativo
        const clickText = g.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .style('fill', '#7fa650')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('pointer-events', 'none')
            .text('🖱️ CLICK PARA ACTIVAR INTERACCIÓN');
        
        // Área de interacción mejorada con seguimiento preciso
        const interactionArea = g.append('rect')
            .attr('width', width)
            .attr('height', height)
            .style('fill', 'none')
            .style('pointer-events', 'all')
            .style('cursor', 'crosshair')
            .style('opacity', 0) // Inicialmente invisible
            .on('click', function() {
                if (!graficoActivo) {
                    // Activar gráfico
                    graficoActivo = true;
                    clickOverlay.style('opacity', 0);
                    clickText.style('opacity', 0);
                    interactionArea.style('opacity', 1);
                    console.log('🎯 Gráfico activado - interacción habilitada');
                }
            })
            .on('mousemove', function(event) {
                if (!graficoActivo) return; // Solo si está activado
                
                const [mouseX] = d3.pointer(event);
                const distanciaTarget = xScale.invert(mouseX);
                
                // Interpolación mejorada para seguir exactamente la línea
                let puntoInterpolado = null;
                
                // Encontrar los dos puntos más cercanos
                for (let i = 0; i < datosLimpios.length - 1; i++) {
                    const p1 = datosLimpios[i];
                    const p2 = datosLimpios[i + 1];
                    
                    if (distanciaTarget >= p1.distancia && distanciaTarget <= p2.distancia) {
                        // Interpolación lineal entre los dos puntos
                        const ratio = (distanciaTarget - p1.distancia) / (p2.distancia - p1.distancia);
                        const elevacionInterpolada = p1.elevation + ratio * (p2.elevation - p1.elevation);
                        const pendienteInterpolada = p1.pendiente + ratio * ((p2.pendiente || 0) - (p1.pendiente || 0));
                        
                        puntoInterpolado = {
                            distancia: distanciaTarget,
                            elevation: elevacionInterpolada,
                            pendiente: pendienteInterpolada,
                            lat: p1.lat + ratio * ((p2.lat || 0) - (p1.lat || 0)),
                            lng: p1.lng + ratio * ((p2.lng || 0) - (p1.lng || 0))
                        };
                        break;
                    }
                }
                
                // Si no encontramos interpolación, usar el punto más cercano
                if (!puntoInterpolado) {
                    const bisect = d3.bisector(d => d.distancia).left;
                    const index = bisect(datosLimpios, distanciaTarget, 1);
                    const d0 = datosLimpios[index - 1];
                    const d1 = datosLimpios[index];
                    
                    puntoInterpolado = !d1 ? d0 : !d0 ? d1 : 
                        distanciaTarget - d0.distancia > d1.distancia - distanciaTarget ? d1 : d0;
                }
                
                if (puntoInterpolado) {
                    const x = xScale(puntoInterpolado.distancia);
                    const y = yScale(puntoInterpolado.elevation);
                    
                    // Mostrar línea guía exactamente en la posición del cursor
                    guideLine
                        .attr('x1', x)
                        .attr('x2', x)
                        .style('opacity', 1);
                    
                    // Mostrar punto indicador en la línea
                    movePoint
                        .attr('cx', x)
                        .attr('cy', y)
                        .style('opacity', 1);
                    
                    // Tooltip mejorado con más información
                    tooltip
                        .style('opacity', 1)
                        .html(`
                            <div style="font-weight: bold; color: #7fa650; margin-bottom: 8px;">📍 PUNTO DE REFERENCIA</div>
                            <div><span style="color: #a0a0a0;">DISTANCIA:</span> ${((puntoInterpolado.distancia || 0)/1000).toFixed(3)} km</div>
                            <div><span style="color: #a0a0a0;">ELEVACIÓN:</span> ${Math.round(puntoInterpolado.elevation)} m</div>
                            <div><span style="color: #a0a0a0;">PENDIENTE:</span> ${(puntoInterpolado.pendiente || 0).toFixed(1)}%</div>
                            ${puntoInterpolado.lat ? `<div style="margin-top: 8px; font-size: 11px; color: #808080;">LAT: ${puntoInterpolado.lat.toFixed(6)}</div>` : ''}
                            ${puntoInterpolado.lng ? `<div style="font-size: 11px; color: #808080;">LON: ${puntoInterpolado.lng.toFixed(6)}</div>` : ''}
                        `)
                        .style('left', Math.min(event.pageX + 15, window.innerWidth - 220) + 'px')
                        .style('top', Math.max(event.pageY - 10, 10) + 'px');
                }
            })
            .on('mouseout', function() {
                if (!graficoActivo) return; // Solo si está activado
                guideLine.style('opacity', 0);
                movePoint.style('opacity', 0);
                tooltip.style('opacity', 0);
            });
        
        // Click fuera del gráfico para desactivar
        svg.on('click', function(event) {
            const [mouseX, mouseY] = d3.pointer(event);
            // Si click está fuera del área del gráfico, desactivar
            if (mouseX < margin.left || mouseX > width + margin.left || 
                mouseY < margin.top || mouseY > height + margin.top) {
                graficoActivo = false;
                clickOverlay.style('opacity', 1);
                clickText.style('opacity', 1);
                interactionArea.style('opacity', 0);
                guideLine.style('opacity', 0);
                movePoint.style('opacity', 0);
                tooltip.style('opacity', 0);
                console.log('🔄 Gráfico desactivado - scroll libre');
            }
        });
        
        // Funcionalidad de zoom y pan (solo cuando está activado)
        const zoom = d3.zoom()
            .scaleExtent([0.5, 10])
            .extent([[0, 0], [width, height]])
            .filter(function(event) {
                // Solo permitir zoom si el gráfico está activado
                return graficoActivo;
            })
            .on('zoom', function(event) {
                const { transform } = event;
                
                // Crear nuevas escalas transformadas
                const newXScale = transform.rescaleX(xScale);
                const newYScale = transform.rescaleY(yScale);
                
                // Recrear línea y área con nuevas escalas y curva mejorada
                const newLine = d3.line()
                    .x(d => newXScale(d.distancia))
                    .y(d => newYScale(d.elevation))
                    .curve(d3.curveCatmullRom.alpha(0.5)); // Misma curva mejorada
                
                const newArea = d3.area()
                    .x(d => newXScale(d.distancia))
                    .y0(height)
                    .y1(d => newYScale(d.elevation))
                    .curve(d3.curveCatmullRom.alpha(0.5)); // Misma curva mejorada
                
                // Actualizar línea y área
                g.select('.elevation-area').attr('d', newArea(datosLimpios));
                g.select('.elevation-line').attr('d', newLine(datosLimpios));
                
                // Actualizar puntos MIN/MAX
                if (minPoint) {
                    g.selectAll('.min-point')
                        .attr('cx', newXScale(minPoint.distancia))
                        .attr('cy', newYScale(minPoint.elevation));
                    g.selectAll('.min-text')
                        .attr('x', newXScale(minPoint.distancia))
                        .attr('y', newYScale(minPoint.elevation) - 15);
                }
                
                if (maxPoint) {
                    g.selectAll('.max-point')
                        .attr('cx', newXScale(maxPoint.distancia))
                        .attr('cy', newYScale(maxPoint.elevation));
                    g.selectAll('.max-text')
                        .attr('x', newXScale(maxPoint.distancia))
                        .attr('y', newYScale(maxPoint.elevation) - 15);
                }
                
                // Actualizar ejes con nuevas escalas
                g.select('.x-axis').call(
                    d3.axisBottom(newXScale).tickFormat(d => `${(d/1000).toFixed(1)} km`)
                );
                g.select('.y-axis').call(
                    d3.axisLeft(newYScale).tickFormat(d => `${Math.round(d)} m`)
                );
                
                // Actualizar grid
                g.select('.grid').selectAll('.x-grid')
                    .call(d3.axisBottom(newXScale).tickSize(-height).tickFormat(''));
                g.select('.grid').selectAll('.y-grid')
                    .call(d3.axisLeft(newYScale).tickSize(-width).tickFormat(''));
            });
        
        svg.call(zoom);
        
        // Panel de estadísticas de planeamiento militar completo
        crearPanelPlaneamientoMilitar(container, datosLimpios, {
            distanciaTotal: distanciaTotal,
            elevacionMin: elevacionMin,
            elevacionMax: elevacionMax,
            desnivel: desnivel,
            puntos: datosLimpios.length
        });
        
        // Controles de navegación
        crearControlesNavegacion(container, svg, zoom);
        console.log('✅ Perfil de elevación militar renderizado exitosamente');
        
    } catch (error) {
        console.error('💥 ERROR al renderizar perfil militar:', error);
        svgContainer.innerHTML = `<div style="color: #ff6b6b; padding: 20px; text-align: center; font-family: monospace;">
            <h3>❌ ERROR OPERACIONAL</h3>
            <p>No se pudo generar el perfil de elevación</p>
            <details style="margin-top: 10px; text-align: left;">
                <summary>Detalles técnicos</summary>
                <pre style="margin-top: 10px; font-size: 12px;">${error.message}\n\n${error.stack}</pre>
            </details>
        </div>`;
    }
}

function crearControlesNavegacion(container, svg, zoom) {
    const controlsDiv = container
        .append('div')
        .style('position', 'absolute')
        .style('top', '10px')
        .style('right', '10px')
        .style('background', 'rgba(26,26,26,0.9)')
        .style('border', '1px solid #7fa650')
        .style('border-radius', '4px')
        .style('padding', '8px')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('gap', '4px');
    
    // Zoom In
    controlsDiv.append('button')
        .text('🔍+')
        .style('background', '#4a5c3a')
        .style('color', '#c0c0c0')
        .style('border', '1px solid #7fa650')
        .style('border-radius', '2px')
        .style('padding', '4px 8px')
        .style('cursor', 'pointer')
        .style('font-size', '12px')
        .on('click', function() {
            svg.transition().duration(200).call(zoom.scaleBy, 1.5);
        });
    
    // Zoom Out
    controlsDiv.append('button')
        .text('🔍-')
        .style('background', '#4a5c3a')
        .style('color', '#c0c0c0')
        .style('border', '1px solid #7fa650')
        .style('border-radius', '2px')
        .style('padding', '4px 8px')
        .style('cursor', 'pointer')
        .style('font-size', '12px')
        .on('click', function() {
            svg.transition().duration(200).call(zoom.scaleBy, 0.67);
        });
    
    // Reset
    controlsDiv.append('button')
        .text('⌂')
        .style('background', '#4a5c3a')
        .style('color', '#c0c0c0')
        .style('border', '1px solid #7fa650')
        .style('border-radius', '2px')
        .style('padding', '4px 8px')
        .style('cursor', 'pointer')
        .style('font-size', '12px')
        .on('click', function() {
            svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
        });
}

function crearPanelPlaneamientoMilitar(container, datosLimpios, stats) {
    console.log('📋 Creando panel de planeamiento militar...');
    
    // Calcular estadísticas avanzadas para planeamiento
    const pendientes = datosLimpios.map(d => Math.abs(d.pendiente || 0));
    const pendienteMax = Math.max(...pendientes);
    const pendienteMin = Math.min(...pendientes);
    const pendientePromedio = pendientes.reduce((sum, p) => sum + p, 0) / pendientes.length;
    
    // Calcular segmentos de dificultad
    const segmentosFaciles = datosLimpios.filter(d => Math.abs(d.pendiente || 0) <= 5).length;
    const segmentosModerados = datosLimpios.filter(d => Math.abs(d.pendiente || 0) > 5 && Math.abs(d.pendiente || 0) <= 15).length;
    const segmentosDificiles = datosLimpios.filter(d => Math.abs(d.pendiente || 0) > 15).length;
    
    // Calcular tiempo estimado de marcha (promedio 4 km/h en terreno mixto)
    const tiempoMarchaHoras = (stats.distanciaTotal / 1000) / 4;
    const tiempoHoras = Math.floor(tiempoMarchaHoras);
    const tiempoMinutos = Math.round((tiempoMarchaHoras - tiempoHoras) * 60);
    
    // Separador visual entre gráfico y tabla
    container
        .append('div')
        .style('height', '20px')
        .style('background', 'linear-gradient(to right, transparent, #7fa650, transparent)')
        .style('margin', '20px 0')
        .style('opacity', '0.5');
    
    // Título de la sección de datos
    container
        .append('div')
        .style('text-align', 'center')
        .style('margin-bottom', '15px')
        .style('padding', '10px')
        .style('background', 'rgba(127, 166, 80, 0.1)')
        .style('border-radius', '5px')
        .style('border', '1px solid #7fa650')
        .append('h3')
        .style('margin', '0')
        .style('color', '#7fa650')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text('📊 DATOS DE PLANEAMIENTO MILITAR');
    
    // Crear panel principal con mejor visibilidad y scroll
    const statsPanel = container
        .append('div')
        .style('padding', '25px')
        .style('background', 'linear-gradient(135deg, #1a1a1a 0%, #2d4a22 100%)')
        .style('border-radius', '8px')
        .style('border', '3px solid #7fa650')
        .style('box-shadow', '0 6px 20px rgba(0,0,0,0.5)')
        .style('font-family', 'monospace')
        .style('position', 'relative')
        .style('z-index', '100')
        .style('width', '100%')
        .style('max-height', '400px')
        .style('overflow-y', 'auto')
        .style('overflow-x', 'hidden')
        // Mejorar el scroll en dispositivos táctiles
        .style('scroll-behavior', 'smooth')
        .style('-webkit-overflow-scrolling', 'touch');
    
    // Indicador de scroll
    container
        .append('div')
        .style('text-align', 'center')
        .style('margin-top', '10px')
        .style('color', '#7fa650')
        .style('font-size', '12px')
        .style('opacity', '0.7')
        .text('↕️ Desliza aquí para ver más datos');
    
    console.log('📊 Panel creado, agregando contenido...');
    
    // Título de planeamiento
    statsPanel.append('h3')
        .style('margin', '0 0 25px 0')
        .style('color', '#c0c0c0')
        .style('font-size', '18px')
        .style('font-weight', 'bold')
        .style('text-align', 'center')
        .style('text-transform', 'uppercase')
        .style('letter-spacing', '1px')
        .style('border-bottom', '2px solid #7fa650')
        .style('padding-bottom', '10px')
        .text('� DATOS DE PLANEAMIENTO MILITAR');
    
    // Sección 1: Datos básicos de distancia y elevación
    const seccionBasica = statsPanel.append('div')
        .style('margin-bottom', '20px');
    
    seccionBasica.append('h4')
        .style('color', '#7fa650')
        .style('margin', '0 0 10px 0')
        .style('font-size', '14px')
        .style('text-transform', 'uppercase')
        .text('📏 DISTANCIAS Y ELEVACIONES');
    
    const gridBasico = seccionBasica.append('div')
        .style('display', 'grid')
        .style('grid-template-columns', '1fr 1fr 1fr 1fr')
        .style('gap', '15px')
        .style('font-size', '13px');
    
    // Datos básicos
    crearDatoMilitar(gridBasico, 'Distancia Total', `${(stats.distanciaTotal/1000).toFixed(2)} km`, '#7fa650');
    crearDatoMilitar(gridBasico, 'Elevación Mínima', `${stats.elevacionMin.toFixed(0)} m`, '#4a5c3a');
    crearDatoMilitar(gridBasico, 'Elevación Máxima', `${stats.elevacionMax.toFixed(0)} m`, '#8fb069');
    crearDatoMilitar(gridBasico, 'Desnivel Total', `${stats.desnivel.toFixed(0)} m`, '#6b8e4b');
    
    // Sección 2: Análisis de pendientes
    const seccionPendientes = statsPanel.append('div')
        .style('margin-bottom', '20px');
    
    seccionPendientes.append('h4')
        .style('color', '#7fa650')
        .style('margin', '0 0 10px 0')
        .style('font-size', '14px')
        .style('text-transform', 'uppercase')
        .text('📈 ANÁLISIS DE PENDIENTES');
    
    const gridPendientes = seccionPendientes.append('div')
        .style('display', 'grid')
        .style('grid-template-columns', '1fr 1fr 1fr 1fr')
        .style('gap', '15px')
        .style('font-size', '13px');
    
    crearDatoMilitar(gridPendientes, 'Pendiente Mínima', `${pendienteMin.toFixed(1)}%`, '#5c7a47');
    crearDatoMilitar(gridPendientes, 'Pendiente Máxima', `${pendienteMax.toFixed(1)}%`, '#8fb069');
    crearDatoMilitar(gridPendientes, 'Pendiente Promedio', `${pendientePromedio.toFixed(1)}%`, '#7fa650');
    crearDatoMilitar(gridPendientes, 'Puntos de Muestra', `${stats.puntos}`, '#596b47');
    
    // Sección 3: Análisis de dificultad del terreno
    const seccionDificultad = statsPanel.append('div')
        .style('margin-bottom', '20px');
    
    seccionDificultad.append('h4')
        .style('color', '#7fa650')
        .style('margin', '0 0 10px 0')
        .style('font-size', '14px')
        .style('text-transform', 'uppercase')
        .text('⚡ DIFICULTAD DEL TERRENO');
    
    const gridDificultad = seccionDificultad.append('div')
        .style('display', 'grid')
        .style('grid-template-columns', '1fr 1fr 1fr')
        .style('gap', '15px')
        .style('font-size', '13px');
    
    crearDatoMilitar(gridDificultad, 'Segmentos Fáciles (≤5%)', `${segmentosFaciles} pts`, '#7fa650');
    crearDatoMilitar(gridDificultad, 'Segmentos Moderados (5-15%)', `${segmentosModerados} pts`, '#d4a574');
    crearDatoMilitar(gridDificultad, 'Segmentos Difíciles (>15%)', `${segmentosDificiles} pts`, '#a67c52');
    
    // Sección 4: Estimaciones de tiempo y planificación
    const seccionTiempo = statsPanel.append('div');
    
    seccionTiempo.append('h4')
        .style('color', '#7fa650')
        .style('margin', '0 0 10px 0')
        .style('font-size', '14px')
        .style('text-transform', 'uppercase')
        .text('⏱️ ESTIMACIONES DE TIEMPO');
    
    const gridTiempo = seccionTiempo.append('div')
        .style('display', 'grid')
        .style('grid-template-columns', '1fr 1fr 1fr')
        .style('gap', '15px')
        .style('font-size', '13px');
    
    crearDatoMilitar(gridTiempo, 'Tiempo Estimado Marcha', `${tiempoHoras}h ${tiempoMinutos}m`, '#7fa650');
    crearDatoMilitar(gridTiempo, 'Velocidad Promedio', '4.0 km/h', '#6b8e4b');
    crearDatoMilitar(gridTiempo, 'Clasificación Terreno', determinarClasificacionTerreno(pendientePromedio), '#8fb069');
    
    // Agregar indicadores de alerta si es necesario
    if (pendienteMax > 25) {
        statsPanel.append('div')
            .style('margin-top', '15px')
            .style('padding', '10px')
            .style('background', 'rgba(255, 69, 0, 0.2)')
            .style('border', '1px solid #ff4500')
            .style('border-radius', '4px')
            .style('color', '#ff6347')
            .style('font-size', '12px')
            .style('text-align', 'center')
            .text(`⚠️ ALERTA: Pendiente máxima de ${pendienteMax.toFixed(1)}% - Considerar rutas alternativas`);
    }
    
    if (stats.desnivel > 500) {
        statsPanel.append('div')
            .style('margin-top', '10px')
            .style('padding', '10px')
            .style('background', 'rgba(255, 215, 0, 0.2)')
            .style('border', '1px solid #ffd700')
            .style('border-radius', '4px')
            .style('color', '#ffa500')
            .style('font-size', '12px')
            .style('text-align', 'center')
            .text(`⚠️ ATENCIÓN: Desnivel significativo de ${stats.desnivel.toFixed(0)}m - Aumentar tiempo de marcha`);
    }
}

function crearDatoMilitar(container, titulo, valor, color) {
    const dato = container.append('div')
        .style('background', 'rgba(0,0,0,0.3)')
        .style('padding', '12px')
        .style('border-radius', '4px')
        .style('text-align', 'center')
        .style('border', `1px solid ${color}`)
        .style('box-shadow', '0 2px 6px rgba(0,0,0,0.3)');
    
    dato.append('div')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .style('color', color)
        .style('margin-bottom', '5px')
        .text(valor);
    
    dato.append('div')
        .style('font-size', '10px')
        .style('color', '#a0a0a0')
        .style('text-transform', 'uppercase')
        .style('letter-spacing', '0.5px')
        .text(titulo);
}

function determinarClasificacionTerreno(pendientePromedio) {
    if (pendientePromedio <= 5) return 'FÁCIL';
    if (pendientePromedio <= 10) return 'MODERADO';
    if (pendientePromedio <= 20) return 'DIFÍCIL';
    return 'MUY DIFÍCIL';
}

function calcularEstadisticas(datosElevacion) {
    const elevaciones = datosElevacion.map(d => d.elevation);
    const distanciaTotal = datosElevacion[datosElevacion.length - 1]?.distancia || 0;
    
    return {
        puntos: datosElevacion.length,
        distanciaTotal: distanciaTotal,
        elevacionMin: Math.min(...elevaciones),
        elevacionMax: Math.max(...elevaciones),
        desnivel: Math.max(...elevaciones) - Math.min(...elevaciones),
        pendientePromedio: datosElevacion.reduce((sum, d) => sum + Math.abs(d.pendiente || 0), 0) / datosElevacion.length
    };
}

function mostrarEstadisticas(stats, svgContainer) {
    const statsDiv = d3.select(svgContainer)
        .append('div')
        .attr('class', 'elevation-stats')
        .style('margin-top', '15px')
        .style('padding', '15px')
        .style('background', '#fff')
        .style('border-radius', '8px')
        .style('border', '1px solid #ddd')
        .style('font-family', 'Arial, sans-serif');
    
    statsDiv.html(`
        <h4 style="margin: 0 0 10px 0; color: #333;">📊 Estadísticas del Perfil</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; font-size: 13px;">
            <div><strong>Distancia:</strong> ${(stats.distanciaTotal/1000).toFixed(2)} km</div>
            <div><strong>Puntos:</strong> ${stats.puntos}</div>
            <div><strong>Desnivel:</strong> ${stats.desnivel.toFixed(0)} m</div>
            <div><strong>Mín:</strong> ${stats.elevacionMin.toFixed(0)} m</div>
            <div><strong>Máx:</strong> ${stats.elevacionMax.toFixed(0)} m</div>
            <div><strong>Pendiente Prom:</strong> ${stats.pendientePromedio.toFixed(1)}%</div>
        </div>
    `);
}

function agregarInteractividadCompleta(g, data, x, y, width, height, positionMarker, svgContainer) {
    // Tooltip flotante
    let tooltip = d3.select(svgContainer)
        .append('div')
        .attr('class', 'elevation-tooltip')
        .style('position', 'absolute')
        .style('pointer-events', 'none')
        .style('background', 'rgba(255,255,255,0.95)')
        .style('border', '1px solid #2196F3')
        .style('border-radius', '6px')
        .style('padding', '6px 10px')
        .style('font-size', '13px')
        .style('color', '#222')
        .style('z-index', 100)
        .style('display', 'none');
    // Guía vertical
    let verticalGuide = g.append('line')
        .attr('class', 'mouse-guide-vertical')
        .attr('y1', 0)
        .attr('y2', height)
        .style('stroke', '#999')
        .style('stroke-width', '1px')
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0);

    // Capa invisible para capturar eventos
    g.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'transparent')
        .on('mousemove', function(event) {
            const [mx, my] = d3.pointer(event);
            // Buscar el punto más cercano en X
            const distanciaMouse = x.invert(mx);
            let idx = d3.bisector(d => d.distancia).left(data, distanciaMouse);
            if (idx > 0 && (idx >= data.length || Math.abs(data[idx].distancia - distanciaMouse) > Math.abs(data[idx-1].distancia - distanciaMouse))) {
                idx = idx - 1;
            }
            const punto = data[idx];
            if (!punto) return;

            // Actualizar guía
            verticalGuide
                .attr('x1', x(punto.distancia))
                .attr('x2', x(punto.distancia))
                .style('opacity', 1);

            // Mostrar tooltip
            tooltip
                .style('display', 'block')
                .style('left', (x(punto.distancia) + 70) + 'px')
                .style('top', (y(punto.elevation) + 10) + 'px')
                .html(
                    '<b>Distancia:</b> ' + (punto.distancia/1000).toFixed(2) + ' km<br>' +
                    '<b>Elevación:</b> ' + punto.elevation.toFixed(1) + ' m' +
                    (punto.pendiente !== undefined ? '<br><b>Pendiente:</b> ' + punto.pendiente.toFixed(1) + '%' : '')
                );
        })
        .on('mouseleave', function() {
            verticalGuide.style('opacity', 0);
            tooltip.style('display', 'none');
        });
    }


// Exportar funciones críticas al scope global (fuera de cualquier función)
window.seleccionarElemento = seleccionarElemento;
window.deseleccionarElemento = deseleccionarElemento;
window.medirDistancia = medirDistancia;
window.addDistancePoint = addDistancePoint;
window.finalizarMedicion = finalizarMedicion;
window.actualizarDistanciaProvisional = actualizarDistanciaProvisional;
window.mostrarPerfilElevacion = mostrarPerfilElevacion;
window.interpolarpuntos = interpolarpuntos;
window.procesarDatosElevacion = (...args) => window.elevationHandler && window.elevationHandler.procesarDatosElevacion
    ? window.elevationHandler.procesarDatosElevacion(...args)
    : Promise.reject(new Error('ElevationHandler no disponible'));
window.mostrarGraficoPerfil = mostrarGraficoPerfil;
window.dibujarGraficoPerfil = dibujarGraficoPerfil;
window.calcularDistancia = calcularDistancia;
window.crearLinea = crearLinea;
window.actualizarLinea = actualizarLinea;
window.obtenerCalcoActivo = obtenerCalcoActivo;
window.procesarElevacionSinWorker = procesarElevacionSinWorker;
window.agregarInteractividadCompleta = agregarInteractividadCompleta;


console.log('✅ Perfil de elevación con D3.js restaurado');
console.log('✅ Todas las funciones de herramientasP exportadas al scope global');
console.log('✅ Funciones de gráfico agregadas al scope global');


