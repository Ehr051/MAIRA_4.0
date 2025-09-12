// calcos.js
// Este archivo maneja la creación, gestión y guardado de calcos (capas) en el mapa

// Objeto para almacenar los calcos
var calcos = {};

// Función para crear un nuevo calco
function crearNuevoCalco() {
    console.log("Creando nuevo calco");
    var calcoCount = Object.keys(calcos).length + 1;
    var nombreCalco = "Calco " + calcoCount;
  
    var nuevoCalco = L.layerGroup();
    calcos[nombreCalco] = nuevoCalco;
  
    nuevoCalco.addTo(mapa); 
  
    setCalcoActivo(nombreCalco);
    agregarCalcoALista(nombreCalco);
    console.log("Nuevo calco creado:", nombreCalco);
}
  
// Función para establecer el calco activo
function setCalcoActivo(nombreCalco) {
    console.log("Estableciendo calco activo:", nombreCalco);
    if (window.calcoActivo) {
        mapa.removeLayer(window.calcoActivo);
    }
    window.calcoActivo = calcos[nombreCalco];
    mapa.addLayer(window.calcoActivo);
    actualizarInterfazCalcos();
}
  
// Función para agregar un calco a la lista en la interfaz
function agregarCalcoALista(nombreCalco) {
    var calcosLista = document.getElementById('calcosLista');
    var nuevoCalcoItem = document.createElement('div');
    nuevoCalcoItem.className = 'calco-item';
    nuevoCalcoItem.innerHTML = `
        <div class="calco-header">
            <input type="radio" name="calcoActivo" id="calcoRadio_${nombreCalco}" value="${nombreCalco}" ${window.calcoActivo === calcos[nombreCalco] ? 'checked' : ''}>
            <label for="calcoRadio_${nombreCalco}">${nombreCalco}</label>
            <div class="calco-buttons">
                <button onclick="toggleCalcoVisibility('${nombreCalco}')" title="Mostrar/Ocultar"><i class="fas fa-eye"></i></button>
                <button onclick="renameCalco('${nombreCalco}')" title="Renombrar"><i class="fas fa-pencil-alt"></i></button>
                <button onclick="eliminarCalco('${nombreCalco}')" title="Eliminar"><i class="fas fa-trash"></i></button>
                <button onclick="toggleElementosList('${nombreCalco}')" title="Lista de elementos"><i class="fas fa-list"></i></button>
            </div>
        </div>
        <ul id="elementosList_${nombreCalco}" class="elementos-list" style="display: none;"></ul>
    `;
    calcosLista.appendChild(nuevoCalcoItem);

    document.getElementById(`calcoRadio_${nombreCalco}`).addEventListener('change', function() {
        setCalcoActivo(this.value);
    });
}

function toggleElementosList(nombreCalco) {
    var lista = document.getElementById(`elementosList_${nombreCalco}`);
    if (lista.style.display === 'none') {
        actualizarElementosList(nombreCalco);
        lista.style.display = 'block';
    } else {
        lista.style.display = 'none';
    }
}

// En calcosP.js
function actualizarElementosList(nombreCalco) {
    var lista = document.getElementById(`elementosList_${nombreCalco}`);
    if (!lista) {
        console.warn(`Lista de elementos no encontrada para el calco: ${nombreCalco}`);
        return;
    }
    lista.innerHTML = '';
    
    calcos[nombreCalco].eachLayer(function(layer) {
        // Solo procesar elementos con nombre y excluir marcadores sin nombre
        if ((layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.Polygon) 
            && layer.options.nombre
            && layer.options.nombre !== 'Sin nombre'
            && !(layer instanceof L.Marker && layer.options.nombre === 'Sin nombre')) {
            
            var item = document.createElement('li');
            item.className = 'elemento-item';
            
            var nombreElemento = layer.options.nombre;
            var tipoElemento = obtenerTipoElemento(layer);
            
            item.innerHTML = `
                <span class="elemento-icono">${obtenerIconoElemento(layer)}</span>
                <span class="elemento-info">${tipoElemento}: ${nombreElemento}</span>
            `;
            
            item.addEventListener('click', function() {
                mapa.setView(layer.getLatLng ? layer.getLatLng() : layer.getBounds().getCenter());
                seleccionarElemento(layer);
            });
            lista.appendChild(item);
        }
    });
}

function obtenerTipoElemento(layer) {
    if (layer instanceof L.Marker) return 'Marcador';
    if (layer instanceof L.Polygon) return 'Polígono';
    if (layer instanceof L.Polyline) {
        if (layer.options.tipoElemento === 'flechaAncha') return 'Flecha Ancha';
        if (layer.options.tipoElemento === 'flecha') return 'Flecha';
        if (layer.options.tipoElemento === 'lineaMedicion') return 'Medición';
        return 'Línea';
    }
    return 'Desconocido';
}

function obtenerIconoElemento(layer) {
    if (layer instanceof L.Marker && layer.options.sidc) {
        var sym = new ms.Symbol(layer.options.sidc, {size: 20});
        return sym.asSVG();
    }
    if (layer instanceof L.Polygon) return '&#9633;'; // Cuadrado
    if (layer instanceof L.Polyline) return '&#9585;'; // Línea diagonal
    return '&#9679;'; // Círculo por defecto
}

// Asegúrate de que esta función esté definida y se llame después de cualquier modificación en el calco
function actualizarElementosCalco() {
    // Buscar el nombre del calco activo
    let nombreCalcoActivo = Object.keys(calcos).find(key => calcos[key] === calcoActivo);
    
    if (nombreCalcoActivo) {
        console.log(`[calcosP] Actualizando elementos del calco: ${nombreCalcoActivo}`);
        actualizarElementosList(nombreCalcoActivo);
    } else {
        console.warn('[calcosP] No se pudo determinar el calco activo para actualizar los elementos');
        console.log('[calcosP] calcoActivo actual:', calcoActivo);
        console.log('[calcosP] Calcos disponibles:', Object.keys(calcos));
        
        // Intentar con el calco global como fallback
        if (window.calcoGlobal && calcos['global'] === window.calcoGlobal) {
            console.log('[calcosP] Usando calco global como fallback');
            actualizarElementosList('global');
        } else if (Object.keys(calcos).length > 0) {
            // Usar el primer calco disponible como último recurso
            const primerCalco = Object.keys(calcos)[0];
            console.log(`[calcosP] Usando primer calco disponible como fallback: ${primerCalco}`);
            actualizarElementosList(primerCalco);
        }
    }
}

// Función para alternar la visibilidad de un calco
function toggleCalcoVisibility(nombreCalco) {
    console.log("Alternando visibilidad del calco:", nombreCalco);
    var calco = calcos[nombreCalco];
    if (calco) {
        if (mapa.hasLayer(calco)) {
            mapa.removeLayer(calco);
        } else {
            calco.addTo(mapa);
        }
    } else {
        console.error("El calco '" + nombreCalco + "' no existe.");
    }
}

// Función para renombrar un calco
function renameCalco(nombreCalco) {
    var nuevoNombre = prompt("Ingrese el nuevo nombre para el calco:", nombreCalco);
    if (nuevoNombre && nuevoNombre.trim() !== "" && nuevoNombre !== nombreCalco) {
        if (calcos[nuevoNombre]) {
            alert("Ya existe un calco con ese nombre.");
            return; 
        }

        calcos[nuevoNombre] = calcos[nombreCalco];
        delete calcos[nombreCalco];

        if (window.calcoActivo === calcos[nuevoNombre]) {
            window.calcoActivo = calcos[nuevoNombre];
        }

        actualizarInterfazCalcos();
        console.log("Calco renombrado de", nombreCalco, "a", nuevoNombre);
    }
}

// Función para eliminar un calco
function eliminarCalco(nombreCalco) {
    if (confirm("¿Estás seguro de que quieres eliminar el calco \"" + nombreCalco + "\"?")) {
        mapa.removeLayer(calcos[nombreCalco]);
        delete calcos[nombreCalco];
        if (window.calcoActivo === calcos[nombreCalco]) {
            window.calcoActivo = null;
        }
        actualizarInterfazCalcos();
        console.log("Calco eliminado:", nombreCalco);
    }
}

// Función para actualizar la interfaz de calcos
function actualizarInterfazCalcos() {
    var calcosLista = document.getElementById('calcosLista');
    if (!calcosLista) {
        console.error('Elemento calcosLista no encontrado en el DOM');
        return;
    }
    calcosLista.innerHTML = '';
    Object.keys(calcos).forEach(agregarCalcoALista);
}

// Función para crear un elemento del calco
function crearElementoCalco(nuevoCalco) {
    return function(feature) {
        console.log("Procesando Feature:", feature);
        if (feature.tipo === "marcador") {
            var sym = new ms.Symbol(feature.sidc, {size: 35});
            var canvas = sym.asCanvas();
            var iconUrl = canvas.toDataURL();
            var icon = L.icon({
                iconUrl: iconUrl,
                iconSize: [50, 35],
                iconAnchor: [25, 17]
            });
            var marker = L.marker([feature.latlng.lat, feature.latlng.lng], { 
                icon: icon, 
                title: feature.nombre, 
                draggable: true,
                sidc: feature.sidc,
                nombre: feature.nombre
            }).addTo(nuevoCalco);
            marker.on('click', function () { seleccionarElemento(this); });
        } else if (feature.tipo === "polilinea" || feature.tipo === "poligono") {
            var PolyClass = feature.tipo === "poligono" ? L.polygon : L.polyline;
            var poly = new PolyClass(feature.latlngs, { 
                color: feature.color, 
                weight: feature.weight,
                sidc: feature.sidc,
                name: feature.name
            }).addTo(nuevoCalco);
            poly.on('click', function () { seleccionarElemento(this); });
        }
    };
}

// ✅ FUNCIÓN PARA EXTRAER TEXTO (SIN TOOLTIPS):
function extraerTextoElemento(feature) {
    // 1. Texto desde textoMarcador (prioridad alta)
    if (feature.textoMarcador && feature.textoMarcador._icon) {
        const divTexto = feature.textoMarcador._icon.querySelector('div');
        if (divTexto && divTexto.textContent && divTexto.textContent.trim() !== '') {
            console.log(`📝 Texto extraído desde textoMarcador: "${divTexto.textContent}"`);
            return divTexto.textContent.trim();
        }
    }
    
    // 2. Texto desde propiedades del panel MCC (si está siendo editado)
    if (window.elementoSeleccionado === feature) {
        try {
            const campoTextoMCC = document.getElementById('textoMCC');
            if (campoTextoMCC && campoTextoMCC.value && campoTextoMCC.value.trim() !== '') {
                console.log(`📝 Texto extraído desde panel MCC: "${campoTextoMCC.value}"`);
                return campoTextoMCC.value.trim();
            }
        } catch (error) {
            console.warn('⚠️ Error accediendo al panel MCC:', error);
        }
    }
    
    // 3. Texto desde propiedades directas del elemento
    if (feature.options.texto && feature.options.texto.trim() !== '') {
        console.log(`📝 Texto extraído desde options.texto: "${feature.options.texto}"`);
        return feature.options.texto.trim();
    }
    
    if (feature.texto && feature.texto.trim() !== '') {
        console.log(`📝 Texto extraído desde propiedad directa: "${feature.texto}"`);
        return feature.texto.trim();
    }
    
    // 4. Texto desde nombre del elemento
    if (feature.options.nombre && feature.options.nombre.trim() !== '') {
        console.log(`📝 Texto extraído desde options.nombre: "${feature.options.nombre}"`);
        return feature.options.nombre.trim();
    }
    
    if (feature.nombre && feature.nombre.trim() !== '') {
        console.log(`📝 Texto extraído desde nombre directo: "${feature.nombre}"`);
        return feature.nombre.trim();
    }
    
    return null;
}

// ✅ FUNCIÓN PARA EXTRAER POSICIÓN DEL TEXTO:
function extraerPosicionTexto(feature) {
    if (feature.textoMarcador) {
        const pos = feature.textoMarcador.getLatLng();
        return { lat: pos.lat, lng: pos.lng };
    }
    
    if (feature.marcadorTexto) {
        const pos = feature.marcadorTexto.getLatLng();
        return { lat: pos.lat, lng: pos.lng };
    }
    
    return null;
}


// ✅ FUNCIÓN PARA APLICAR PATRONES DE RELLENO:
function aplicarPatronRelleno(elemento, tipoRelleno, color) {
    if (!tipoRelleno || tipoRelleno === 'solid') return;
    
    try {
        let patron;
        switch(tipoRelleno) {
            case 'diagonal':
                patron = new L.StripePattern({
                    color: color || '#3388ff',
                    weight: 2,
                    spaceWeight: 4,
                    angle: 45
                });
                break;
                
            case 'puntos':
                patron = new L.PatternCircle({
                    x: 5, y: 5, radius: 2,
                    fill: true, color: color || '#3388ff'
                });
                break;
                
            case 'lineas':
                patron = new L.StripePattern({
                    color: color || '#3388ff',
                    weight: 1,
                    spaceWeight: 3,
                    angle: 0
                });
                break;
        }
        
        if (patron) {
            patron.addTo(window.mapa);
            elemento.setStyle({ fillPattern: patron });
            console.log(`✅ Patrón ${tipoRelleno} aplicado correctamente`);
        }
    } catch (error) {
        console.error('❌ Error creando patrón:', error);
    }
}


// Función para guardar un calco
function guardarCalco() {
    if (!calcoActivo) {
        mostrarNotificacion('No hay calco activo para guardar', 'warning');
        return;
    }

    console.log('💾 Iniciando guardado de calco...');

    // ✅ DECLARAR VARIABLES CORRECTAS:
    const escenarioData = {  // CAMBIAR DE escenarioData por const
        nombre: calcoActivo.nombre || 'Escenario sin nombre',
        fecha: new Date().toISOString(),
        elementos: []
    };

    const contadores = {
        marcadores: 0,
        vertices: 0,
        lineas: 0,
        poligonos: 0,
        filtrados: 0
    };

    // ✅ PROCESAR ELEMENTOS:
    calcoActivo.eachLayer(function(feature) {
        if (feature instanceof L.Marker) {
            console.log('🔍 Analizando marcador completo:', {
                sidc: feature.options.sidc,
                nombre: feature.options.nombre,
                tipo: feature.options.tipo,
                numero: feature.options.numero,
                color: feature.options.color,
                id: feature.options.id,
                designacion: feature.options.designacion,
                dependencia: feature.options.dependencia
            });

                
                    // ✅ CLASIFICAR TIPOS DE MARCADORES:
                    const esSimboloMilitar = feature.options.sidc && feature.options.sidc.trim() !== '';
                    const esPuntoControl = feature.options.tipo && ['PC', 'PI', 'PT', 'PD', 'PE', 'PP'].includes(feature.options.tipo);
                    const esVertice = feature.esVerticeEvidente || feature.esVerticeExplicito;
                    
                    // ✅ FILTRO MEJORADO PARA DETECTAR VÉRTICES:
                    const esProbablementeVertice = (
                        !esSimboloMilitar && 
                        !esPuntoControl && 
                        (
                            // Condición 1: Nombre genérico
                            (!feature.options.nombre || 
                             feature.options.nombre === 'Marcador sin nombre' || 
                             feature.options.nombre === 'Sin nombre') &&
                            // Condición 2: Sin propiedades específicas
                            (!feature.options.tipo && !feature.options.id && !feature.options.designacion)
                        )
                    );
        
                    let elementoData = null;
        
                    if (esVertice || esProbablementeVertice) {
                        // ✅ FILTRAR VÉRTICES:
                        console.log(`🗑️ FILTRADO VÉRTICE: ${feature.options.nombre || 'Sin nombre'}`);
                        contadores.filtrados++;
                        return; // No guardar vértices
                        
                    } else if (esPuntoControl) {
                        // ✅ GUARDAR PUNTOS DE CONTROL - PRIORIDAD MÁXIMA:
                        elementoData = {
                            tipo: "puntoControl",
                            subtipo: feature.options.tipo,
                            numero: feature.options.numero,
                            color: feature.options.color,
                            id: feature.options.id,
                            sidc: feature.options.sidc || null,
                            nombre: feature.options.nombre || `${feature.options.tipo}${feature.options.numero ? ' #' + feature.options.numero : ''}`,
                            lat: feature.getLatLng().lat,
                            lng: feature.getLatLng().lng
                        };
                        console.log(`💾 ✅ GUARDANDO PUNTO DE CONTROL: ${elementoData.nombre} (Tipo: ${elementoData.subtipo})`);
                        
                    } else if (esSimboloMilitar) {
                        // ✅ GUARDAR SÍMBOLOS MILITARES:
                        elementoData = {
                            tipo: "marcador",
                            sidc: feature.options.sidc,
                            nombre: feature.options.nombre || '',
                            designacion: feature.options.designacion || '',
                            dependencia: feature.options.dependencia || '',
                            lat: feature.getLatLng().lat,
                            lng: feature.getLatLng().lng
                        };
                        console.log(`💾 ✅ GUARDANDO SÍMBOLO: ${elementoData.nombre} (SIDC: ${elementoData.sidc})`);
                        
                    } else {
                        // ✅ MARCADOR GENÉRICO:
                        elementoData = {
                            tipo: "marcador",
                            nombre: feature.options.nombre || 'Marcador sin nombre',
                            lat: feature.getLatLng().lat,
                            lng: feature.getLatLng().lng,
                            color: feature.options.color,
                            icon: feature.options.icon ? 'custom' : 'default'
                        };
                        console.log(`💾 ✅ GUARDANDO MARCADOR GENÉRICO: ${elementoData.nombre}`);
                    }

            if (elementoData) {
                escenarioData.elementos.push(elementoData); // ✅ USAR escenarioData CORRECTAMENTE
                contadores.marcadores++;
            }

        } else if (feature instanceof L.Polyline) {
            // ✅ GUARDAR LÍNEAS Y POLÍGONOS:
            var latlngs = feature.getLatLngs();
            if (latlngs && latlngs.length > 0) {
                

                // ✅ PRESERVAR PRECISIÓN MÁXIMA:
                const formatearCoordenadas = (coords) => {
                    if (!coords || coords.length === 0) {
                        return [];
                    }
                    
                    console.log('🔍 COORDENADAS RAW RECIBIDAS:', coords);
                    console.log('🔍 TIPO PRIMER ELEMENTO:', typeof coords[0], Array.isArray(coords[0]));
                    
                    if (Array.isArray(coords[0])) {
                        // CASO: Polígono con anillos [[punto1, punto2...], [anillo2...]]
                        return coords.map((ring, ringIndex) => {
                            console.log(`🔍 PROCESANDO ANILLO ${ringIndex}:`, ring);
                            if (Array.isArray(ring)) {
                                return ring.map((point, pointIndex) => {
                                    console.log(`   Punto ${pointIndex}:`, point);
                                    return {
                                        lat: parseFloat(point.lat.toFixed(8)),
                                        lng: parseFloat(point.lng.toFixed(8))
                                    };
                                });
                            } else {
                                // Punto individual en el anillo
                                return {
                                    lat: parseFloat(ring.lat.toFixed(8)),
                                    lng: parseFloat(ring.lng.toFixed(8))
                                };
                            }
                        });
                    } else {
                        // CASO: Línea simple [punto1, punto2...]
                        return coords.map((point, pointIndex) => {
                            console.log(`   Punto línea ${pointIndex}:`, point);
                            return {
                                lat: parseFloat(point.lat.toFixed(8)),
                                lng: parseFloat(point.lng.toFixed(8))
                            };
                        });
                    }
                };

                let coordenadasFormateadas = formatearCoordenadas(latlngs);
                console.log('✅ Coordenadas formateadas FINAL:', coordenadasFormateadas);

                // ✅ CONTAR CORRECTAMENTE LOS PUNTOS:
                let totalPuntos = 0;
                if (Array.isArray(coordenadasFormateadas[0])) {
                    // Polígono con anillos: [[v1,v2,v3,v4,v5]]
                    totalPuntos = coordenadasFormateadas.reduce((total, ring) => total + ring.length, 0);
                    console.log(`🔍 ESTRUCTURA POLÍGONO: ${coordenadasFormateadas.length} anillos, ${totalPuntos} vértices total`);
                } else {
                    // Línea simple: [v1,v2,v3]
                    totalPuntos = coordenadasFormateadas.length;
                    console.log(`🔍 ESTRUCTURA LÍNEA: ${totalPuntos} puntos`);
                }

                console.log(`   Coordenadas: ${totalPuntos} vértices total`);


                let elementoData = {
                    tipo: feature instanceof L.Polygon ? "poligono" : "polilinea",
                    latlngs: coordenadasFormateadas,
                    
                    // ✅ PROPIEDADES BÁSICAS:
                    color: feature.options.color || '#3388ff',
                    weight: feature.options.weight || 3,
                    opacity: feature.options.opacity || 1,
                    dashArray: feature.options.dashArray || null,
                    nombre: feature.options.nombre || `${feature instanceof L.Polygon ? 'Polígono' : 'Línea'} sin nombre`,
                    
                    // ✅ PROPIEDADES DE POLÍGONO:
                    fillColor: feature.options.fillColor || feature.options.color || '#3388ff',
                    fillOpacity: feature.options.fillOpacity !== undefined ? feature.options.fillOpacity : 
                                (feature instanceof L.Polygon ? 0.2 : 0),
                    
                    // ✅ GUARDAR PATRÓN COMO STRING (NO OBJETO):
                    fillPattern: feature.options.fillPattern ? 'pattern' : null,
                    tipoRelleno: feature.options.tipoRelleno || 'solid',
                    
                    // ✅ EXTRAER TEXTO DE MÚLTIPLES FUENTES:
                    texto: extraerTextoElemento(feature),
                    mostrarTexto: !!extraerTextoElemento(feature),
                    posicionTexto: extraerPosicionTexto(feature),
                    
                    // ✅ PROPIEDADES ADICIONALES:
                    tipoElemento: feature.options.tipoElemento || feature.options.tipo,
                    interactive: feature.options.interactive !== undefined ? feature.options.interactive : true,
                    className: feature.options.className || null,
                    
                    // ✅ PROPIEDADES DE DISTANCIA:
                    distancia: feature.distancia || feature.options.distancia || null,
                    distanciaTotal: feature.distanciaTotal || feature.options.distanciaTotal || null,
                    distanciaAcumulada: feature.distanciaAcumulada || feature.options.distanciaAcumulada || null
                };
                
                console.log(`💾 Guardando ${elementoData.tipo}: ${elementoData.nombre}`);
                console.log(`📝 Texto extraído: "${elementoData.texto || 'Sin texto'}"`);
                
                if (coordenadasFormateadas && coordenadasFormateadas.length > 0) {
                    const primerPunto = Array.isArray(coordenadasFormateadas[0]) ? 
                                       coordenadasFormateadas[0][0] : coordenadasFormateadas[0];
                    console.log(`   Coordenadas: ${totalPuntos} vértices (${coordenadasFormateadas.length} anillos)`);
                    console.log(`   Precisión: lat=${primerPunto.lat}, lng=${primerPunto.lng}`);
                }
                
                // ✅ AGREGAR AL ARRAY - LÍNEA FALTANTE:
                escenarioData.elementos.push(elementoData);
                
                if (feature instanceof L.Polygon) {
                    contadores.poligonos++;
                } else {
                    contadores.lineas++;
                }
            }
        }
    });

    // ✅ CONTINUAR CON EL RESTO DE LA FUNCIÓN...
    console.log('📊 Resumen de guardado:', contadores);
    
    // ✅ GENERAR ARCHIVO:
    const nombreArchivo = prompt('Nombre del archivo (sin extensión):', escenarioData.nombre) || escenarioData.nombre;
    const dataStr = JSON.stringify(escenarioData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${nombreArchivo}.json`;
    link.click();
    
    console.log(`✅ Escenario guardado como: ${nombreArchivo}.json`);
    console.log(`📈 Elementos guardados: ${escenarioData.elementos.length}`);
    
    mostrarNotificacion(`Calco guardado exitosamente: ${contadores.marcadores} marcadores, ${contadores.lineas} líneas, ${contadores.poligonos} poligonos`, 'success');
}


// ✅ AGREGAR FUNCIÓN mostrarNotificacion antes de línea ~374:
function mostrarNotificacion(mensaje, tipo) {
    tipo = tipo || 'info';
    
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${tipo === 'success' ? '#4CAF50' : tipo === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    notificacion.textContent = mensaje;
    
    document.body.appendChild(notificacion);
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.parentNode.removeChild(notificacion);
        }
    }, 3000);
    
    console.log(`📢 Notificación (${tipo}): ${mensaje}`);
}

// Ejecuta esto en consola ANTES de guardar:
if (window.calcoActivo) {
    window.calcoActivo.eachLayer(function(layer) {
        if (layer instanceof L.Marker) {
            console.log('📍 Marcador:', {
                nombre: layer.options.nombre,
                sidc: layer.options.sidc,
                esVertice: layer.options.esVertice,
                tipo: typeof layer.options.nombre,
                longitud: layer.options.nombre ? layer.options.nombre.length : 0
            });
        }
    });
} else {
    console.log('🔍 Calcos inicializados correctamente');
}


// ✅ FUNCIÓN AUXILIAR PARA MARCAR VÉRTICES:
function marcarComoVertice(marcador) {
    if (marcador && marcador.options) {
        marcador.options.esVertice = true;
        marcador.options.nombre = marcador.options.nombre || 'Vértice';
        console.log('🔗 Marcador marcado como vértice');
    }
}



function cargarCalco() {
    console.log('📂 Iniciando carga de calco...');
    
    const inputArchivo = document.createElement('input');
    inputArchivo.type = 'file';
    inputArchivo.accept = '.json';
    
    inputArchivo.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) {
            console.log('❌ No se seleccionó archivo');
            return;
        }

        console.log('📂 Archivo seleccionado:', file.name);
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                console.log('📂 Leyendo contenido del archivo...');
                const escenario = JSON.parse(e.target.result);
                
                console.log('📂 JSON parseado exitosamente:', escenario);
                
                // ✅ VALIDACIONES:
                if (!escenario) {
                    throw new Error('Datos del escenario son null o undefined');
                }
                
                if (!escenario.elementos) {
                    throw new Error('El archivo no contiene la propiedad "elementos"');
                }
                
                console.log('🔍 VERIFICANDO ARCHIVO JSON CARGADO:');
                console.log('📂 Elementos en archivo:', escenario.elementos.length);

                const tiposEncontrados = {};
                escenario.elementos.forEach(el => {
                    tiposEncontrados[el.tipo] = (tiposEncontrados[el.tipo] || 0) + 1;
                });

                console.log('📊 Tipos de elementos en archivo:', tiposEncontrados);

                // ✅ LIMPIEZA AUTOMÁTICA:
                console.log('🧹 Limpiando archivo de escenario...');
                console.log(`📂 Preservando todos los ${escenario.elementos.length} elementos sin filtros`);
                
                escenario.elementos.forEach(function(elemento) {
                    if (elemento.tipo === "marcador") {
                        console.log(`✅ Marcador preservado: ${elemento.nombre || 'Sin nombre'} (SIDC: ${elemento.sidc || 'Sin SIDC'})`);
                    } else {
                        console.log(`✅ Elemento ${elemento.tipo} preservado: ${elemento.nombre || 'Sin nombre'}`);
                    }
                });
                
                console.log(`🧹 Limpieza completada: ${escenario.elementos.length} → ${escenario.elementos.length} elementos (sin filtros)`);

                // ✅ CREAR CALCO:
                var nombreCalco = escenario.nombre || "Calco Importado";
                
                var contador = 1;
                var nombreOriginal = nombreCalco;
                while (calcos[nombreCalco]) {
                    nombreCalco = `${nombreOriginal} (${contador})`;
                    contador++;
                }
                
                var nuevoCalco = L.layerGroup().addTo(mapa);
                calcos[nombreCalco] = nuevoCalco;
                
                if (escenario.vista) {
                    mapa.setView(escenario.vista.centro, escenario.vista.zoom);
                }

                var contadoresCarga = {
                    marcadores: 0,
                    lineas: 0,
                    poligonos: 0,
                    errores: 0
                };
// REEMPLAZAR DESDE LÍNEA 616 hasta 853:

                escenario.elementos.forEach(function(elemento) {
                    try {
                        console.log(`🔍 PROCESANDO ELEMENTO:`, {
                            tipo: elemento.tipo,
                            nombre: elemento.nombre,
                            tieneLatLngs: !!elemento.latlngs,
                            cantidadPuntos: elemento.latlngs ? 
                                (Array.isArray(elemento.latlngs[0]) ? 
                                 elemento.latlngs.reduce((total, ring) => total + ring.length, 0) : 
                                 elemento.latlngs.length) : 0,
                            estructuraDetallada: {
                                latlngs: elemento.latlngs,
                                esAnidado: elemento.latlngs ? Array.isArray(elemento.latlngs[0]) : false,
                                primerAnillo: elemento.latlngs ? elemento.latlngs[0] : null,
                                cantidadAnillos: elemento.latlngs ? elemento.latlngs.length : 0
                            }
                        });

                        if (elemento.tipo === "marcador" || elemento.tipo === "puntoControl") {
                            let marker;

                            if (elemento.tipo === "puntoControl") {
                                // ✅ RECREAR PUNTOS DE CONTROL:
                                const tipoPC = elemento.subtipo;
                                const numeroPC = elemento.numero;
                                const colorPC = elemento.color || '#2196F3';
                                
                                let iconoPC;
                                let sidcParaUsar = elemento.sidc;
                                
                                if (tipoPC === 'PC') {
                                    iconoPC = L.divIcon({
                                        className: `punto-control-icon pc`,
                                        html: `<div class="pc-marker-container">
                                                  <div class="pc-marker" style="background-color: ${colorPC}; color: white;">
                                                      <div class="pc-text">${numeroPC}</div>
                                                  </div>
                                               </div>`,
                                        iconSize: [40, 40],
                                        iconAnchor: [20, 40],
                                        popupAnchor: [0, -40]
                                    });
                                } else {
                                    if (!sidcParaUsar || sidcParaUsar === null || sidcParaUsar === 'null') {
                                        console.log(`🔧 Generando SIDC para ${tipoPC}...`);
                                        sidcParaUsar = 'GFGPGPP---';
                                        console.log(`✅ SIDC generado: ${sidcParaUsar} para ${tipoPC}`);
                                    }
                                    
                                    const symbol = new ms.Symbol(sidcParaUsar, {
                                        size: 35,
                                        uniqueDesignation: tipoPC,
                                        infoFields: false,
                                        colorMode: "Light",
                                        fill: true,
                                        monoColor: "black"
                                    });
                                    
                                    iconoPC = L.divIcon({
                                        className: `punto-control-icon ${tipoPC.toLowerCase()}`,
                                        html: symbol.asSVG(),
                                        iconSize: [35, 35],
                                        iconAnchor: [17.5, 70],
                                        popupAnchor: [0, 35]
                                    });
                                }
                                
                                marker = L.marker([elemento.lat, elemento.lng], {
                                    icon: iconoPC,
                                    draggable: true,
                                    tipo: tipoPC,
                                    numero: numeroPC,
                                    color: colorPC,
                                    id: elemento.id,
                                    sidc: sidcParaUsar,
                                    nombre: elemento.nombre
                                });
                                
                                console.log(`✅ Punto de control ${tipoPC} recreado`);
                                
                            } else if (elemento.sidc) {
                                // ✅ RECREAR SÍMBOLOS MILITARES:
                                try {
                                    const simbolo = new ms.Symbol(elemento.sidc, {
                                        size: 35,
                                        uniqueDesignation: elemento.designacion || '',
                                        higherFormation: elemento.dependencia || ''
                                    });

                                    const icono = L.divIcon({
                                        className: 'marcador-militar',
                                        html: simbolo.asSVG(),
                                        iconSize: [35, 35],
                                        iconAnchor: [17.5, 35],
                                        popupAnchor: [0, -35]
                                    });

                                    marker = L.marker([elemento.lat, elemento.lng], {
                                        icon: icono,
                                        draggable: true,
                                        sidc: elemento.sidc,
                                        nombre: elemento.nombre,
                                        designacion: elemento.designacion,
                                        dependencia: elemento.dependencia
                                    });
                                    
                                    console.log(`✅ Símbolo militar recreado: ${elemento.nombre}`);
                                } catch (simboloError) {
                                    console.error('❌ Error creando símbolo militar:', simboloError);
                                    contadoresCarga.errores++;
                                    return;
                                }
                            } else {
                                // ✅ VERIFICAR SI ES UN VÉRTICE:
                                const esProbablementeVertice = (
                                    (!elemento.nombre || elemento.nombre === 'Marcador sin nombre') &&
                                    !elemento.sidc &&
                                    !elemento.tipo
                                );
                                
                                if (esProbablementeVertice) {
                                    console.log('🗑️ FILTRADO: Probable vértice detectado en carga:', elemento);
                                    contadoresCarga.errores++;
                                    return;
                                }
                                
                                // ✅ MARCADORES GENÉRICO:
                                console.log('🔧 Creando marcador genérico legítimo...', elemento);
                                
                                const iconoGenerico = L.divIcon({
                                    className: 'marcador-generico',
                                    html: `<div style="
                                        width: 25px;
                                        height: 25px;
                                        background: #ff6b6b;
                                        border: 2px solid white;
                                        border-radius: 50% 50% 50% 0;
                                        transform: rotate(-45deg);
                                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                                    "></div>`,
                                    iconSize: [25, 41],
                                    iconAnchor: [12, 41],
                                    popupAnchor: [1, -34]
                                });

                                marker = L.marker([elemento.lat, elemento.lng], {
                                    icon: iconoGenerico,
                                    draggable: true,
                                    nombre: elemento.nombre || 'Marcador genérico'
                                });
                                
                                console.log(`✅ Marcador genérico recreado: ${elemento.nombre}`);
                            }

                            if (marker) {
                                marker.on('click', function() { 
                                    seleccionarElemento(this);
                                });
                                
                                marker.addTo(nuevoCalco);
                                contadoresCarga.marcadores++;
                                console.log(`✅ ${elemento.tipo} añadido al calco`);
                            }

                        } else if (elemento.tipo === "polilinea" || elemento.tipo === "poligono") {
                            // ✅ USAR MISMA LÓGICA QUE JUEGO DE GUERRA:
                            console.log(`🔍 PROCESANDO ${elemento.tipo.toUpperCase()}:`, {
                            nombre: elemento.nombre,
                            totalVertices: elemento.latlngs ? 
                                (Array.isArray(elemento.latlngs[0]) ? 
                                elemento.latlngs.reduce((total, ring) => total + ring.length, 0) : 
                                elemento.latlngs.length) : 0,
                            estructura: elemento.latlngs,
                            esAnidado: elemento.latlngs ? Array.isArray(elemento.latlngs[0]) : false
                        });

                            // ✅ VALIDACIÓN SIMPLE COMO EN JUEGO DE GUERRA:
                            let totalPuntos = 0;
                        if (elemento.latlngs && Array.isArray(elemento.latlngs)) {
                            if (Array.isArray(elemento.latlngs[0])) {
                                // Estructura anidada: [[punto1, punto2...]]
                                totalPuntos = elemento.latlngs.reduce((total, ring) => total + ring.length, 0);
                            } else {
                                // Estructura simple: [punto1, punto2...]
                                totalPuntos = elemento.latlngs.length;
                            }
                        }

                        const puntosMinimu = elemento.tipo === "poligono" ? 3 : 2;
                        if (!elemento.latlngs || totalPuntos < puntosMinimu) {
                            console.error(`❌ ${elemento.tipo} sin coordenadas válidas - necesita mínimo ${puntosMinimu} puntos, tiene ${totalPuntos}`);
                            contadoresCarga.errores++;
                            return;
                        }

                        console.log(`✅ Coordenadas válidas para ${elemento.tipo} - ${totalPuntos} puntos total`);

                            console.log(`✅ Coordenadas válidas para ${elemento.tipo}`);

                            // ✅ USAR MISMA LÓGICA DE CREACIÓN QUE JUEGO DE GUERRA:
                            const PolyClass = elemento.tipo === "poligono" ? L.polygon : L.polyline;
                            
                            const options = {
                                // ✅ PROPIEDADES BÁSICAS:
                                color: elemento.color || '#3388ff',
                                weight: elemento.weight || 3,
                                opacity: elemento.opacity !== undefined ? elemento.opacity : 1,
                                dashArray: elemento.dashArray || null,
                                nombre: elemento.nombre || `${elemento.tipo} sin nombre`,
                                
                                // ✅ PROPIEDADES DE POLÍGONO:
                                fillColor: elemento.fillColor || elemento.color || '#3388ff',
                                fillOpacity: elemento.fillOpacity !== undefined ? elemento.fillOpacity : 
                                            (elemento.tipo === "poligono" ? 0.2 : 0),
                                fillPattern: elemento.fillPattern || null,
                                tipoRelleno: elemento.tipoRelleno || 'solid',
                                
                                // ✅ PROPIEDADES ADICIONALES:
                                tipoElemento: elemento.tipoElemento || elemento.tipo,
                                interactive: elemento.interactive !== undefined ? elemento.interactive : true,
                                className: elemento.className || null,
                                
                                // ✅ PROPIEDADES DE TEXTO:
                                texto: elemento.texto || null,
                                label: elemento.texto || null,
                                mostrarTexto: elemento.mostrarTexto !== undefined ? elemento.mostrarTexto : !!elemento.texto,
                                
                                // ✅ PROPIEDADES DE DISTANCIA:
                                distancia: elemento.distancia || null,
                                distanciaTotal: elemento.distanciaTotal || null,
                                distanciaAcumulada: elemento.distanciaAcumulada || null
                            };

                            console.log(`🔧 Creando ${elemento.tipo} con opciones completas:`, options);

                            try {
                                const nuevoElemento = new PolyClass(elemento.latlngs, options);
                                
                                // ✅ PROPIEDADES CRÍTICAS PARA EDICIÓN:
                                nuevoElemento.options.nombre = elemento.nombre;
                                nuevoElemento.nombre = elemento.nombre;
                                nuevoElemento.options.tipo = elemento.tipo;
                                nuevoElemento.options.tipoElemento = elemento.tipoElemento || elemento.tipo;
                                
                                // ✅ PROPIEDADES DE TEXTO:
                                nuevoElemento.options.texto = elemento.texto;
                                nuevoElemento.options.mostrarTexto = elemento.mostrarTexto;
                                nuevoElemento.options.posicionTexto = elemento.posicionTexto;
                                
                                // ✅ PROPIEDADES DE ESTILO:
                                nuevoElemento.options.color = elemento.color;
                                nuevoElemento.options.weight = elemento.weight;
                                nuevoElemento.options.opacity = elemento.opacity;
                                nuevoElemento.options.dashArray = elemento.dashArray;
                                
                                if (elemento.tipo === "poligono") {
                                    nuevoElemento.options.fillColor = elemento.fillColor;
                                    nuevoElemento.options.fillOpacity = elemento.fillOpacity;
                                    nuevoElemento.options.tipoRelleno = elemento.tipoRelleno;
                                }
                                
                                // ✅ APLICAR PATRONES DE RELLENO SI EXISTEN:
                                if (elemento.tipo === "poligono" && elemento.fillPattern && elemento.tipoRelleno !== 'solid') {
                                    try {
                                        aplicarPatronRelleno(nuevoElemento, elemento.tipoRelleno, elemento.fillColor);
                                    } catch (patronError) {
                                        console.warn('⚠️ Error aplicando patrón de relleno:', patronError);
                                    }
                                }
                                
                                // ✅ EVENTOS PARA SELECCIÓN Y EDICIÓN:
                                nuevoElemento.on('click', function(e) {
                                    seleccionarElemento(this);
                                    e.originalEvent.stopPropagation();
                                });
                                
                                nuevoElemento.on('dblclick', function(e) {
                                    if (typeof editarElementoSeleccionado === 'function') {
                                        window.elementoSeleccionado = this;
                                        editarElementoSeleccionado();
                                    }
                                    e.originalEvent.stopPropagation();
                                });
                                
                                // ✅ AGREGAR MENÚ CONTEXTUAL:
                                nuevoElemento.on('contextmenu', function(e) {
                                    console.log('🎯 Click derecho en elemento - mostrando menú contextual');
                                    window.elementoSeleccionado = this;
                                    seleccionarElemento(this);
                                    
                                    // Mostrar menú contextual
                                    if (typeof mostrarMenuContextual === 'function') {
                                        mostrarMenuContextual(e.originalEvent, this);
                                    } else if (typeof window.menuContextual === 'function') {
                                        window.menuContextual(e.originalEvent, this);
                                    } else {
                                        console.warn('⚠️ Función de menú contextual no encontrada');
                                    }
                                    
                                    e.originalEvent.preventDefault();
                                    e.originalEvent.stopPropagation();
                                });
                                
                                // ✅ AGREGAR AL CALCO:
                                nuevoCalco.addLayer(nuevoElemento);
                                
                                // ✅ RESTAURAR TEXTO COMO MARCADOR ASOCIADO:
                                if (elemento.texto && elemento.mostrarTexto !== false) {
                                    try {
                                        console.log(`📝 Restaurando texto como marcador: "${elemento.texto}"`);
                                        
                                        // Calcular posición según tipo de elemento
                                        let posicionTexto;
                                        if (nuevoElemento instanceof L.Polygon) {
                                            posicionTexto = nuevoElemento.getBounds().getCenter();
                                        } else if (nuevoElemento instanceof L.Polyline) {
                                            const latlngs = nuevoElemento.getLatLngs();
                                            posicionTexto = latlngs[Math.floor(latlngs.length / 2)];
                                        } else {
                                            posicionTexto = nuevoElemento.getLatLng();
                                        }
                                        
                                        // Crear textoMarcador directamente
                                        nuevoElemento.textoMarcador = L.marker(posicionTexto, {
                                            icon: L.divIcon({
                                                className: nuevoElemento instanceof L.Polygon ? 'texto-poligono' : 'texto-linea',
                                                html: `<div style="color: black; pointer-events: auto; cursor: pointer;">${elemento.texto}</div>`,
                                                iconSize: [100, 20]
                                            }),
                                            draggable: true,
                                            interactive: true
                                        });
                                        
                                        // ✅ EVENTOS CRÍTICOS PARA EL textoMarcador:
                                        nuevoElemento.textoMarcador.on('click', function(e) {
                                            console.debug('🎯 Click en textoMarcador - seleccionando elemento padre');
                                            seleccionarElemento(nuevoElemento);
                                            e.originalEvent.stopPropagation();
                                        });
                                        
                                        nuevoElemento.textoMarcador.on('dblclick', function(e) {
                                            console.log('🎯 Doble click en textoMarcador - editando elemento padre');
                                            if (typeof editarElementoSeleccionado === 'function') {
                                                window.elementoSeleccionado = nuevoElemento;
                                                editarElementoSeleccionado();
                                            }
                                            e.originalEvent.stopPropagation();
                                        });
                                        
                                        nuevoElemento.textoMarcador.on('contextmenu', function(e) {
                                            console.log('🎯 Click derecho en textoMarcador - menú contextual del elemento padre');
                                            window.elementoSeleccionado = nuevoElemento;
                                            seleccionarElemento(nuevoElemento);
                                            // Permitir que el menú contextual se propague
                                        });
                                        
                                        // Agregar al calco
                                        nuevoElemento.textoMarcador.addTo(nuevoCalco);
                                        
                                        // ✅ REFERENCIA BIDIRECCIONAL:
                                        nuevoElemento.textoMarcador.elementoPadre = nuevoElemento;
                                        
                                        console.log(`✅ Texto "${elemento.texto}" restaurado como textoMarcador para ${elemento.tipo}`);
                                        
                                    } catch (textoError) {
                                        console.error('❌ Error restaurando texto:', textoError);
                                    }
                                }
                                
                                // ✅ CONTAR CORRECTAMENTE (SOLO UNA VEZ):
                                if (elemento.tipo === "poligono") {
                                    contadoresCarga.poligonos++;
                                    console.log(`✅ Polígono "${elemento.nombre}" añadido al calco`);
                                } else {
                                    contadoresCarga.lineas++;
                                    console.log(`✅ Línea "${elemento.nombre}" añadida al calco`);
                                }
                            } catch (createError) {
                                console.error(`❌ Error creando ${elemento.tipo}:`, createError);
                                contadoresCarga.errores++;
                            }
                        }
                    } catch (elementError) {
                        console.error('❌ Error procesando elemento:', elementError);
                        contadoresCarga.errores++;
                    }
                }); // ✅ CERRAR forEach CORRECTAMENTE

                setCalcoActivo(nombreCalco);
                agregarCalcoALista(nombreCalco);
                
                console.log("✅ Escenario cargado exitosamente:", nombreCalco);
                console.log('📊 Resumen de carga:', contadoresCarga);

                mostrarNotificacion(`Calco cargado: ${contadoresCarga.marcadores} marcadores, ${contadoresCarga.lineas} líneas, ${contadoresCarga.poligonos} poligonos`, "success"); 
            } catch (parseError) {
                console.error('❌ Error parseando JSON:', parseError);
                mostrarNotificacion('Error cargando archivo: ' + parseError.message, 'error');
            }
        }; // ✅ CERRAR reader.onload

        reader.onerror = function(error) {
            console.error('❌ Error leyendo archivo:', error);
            mostrarNotificacion('Error leyendo archivo', 'error');
        };
        
        reader.readAsText(file);
    }; // ✅ CERRAR inputArchivo.onchange
    
    inputArchivo.click();
} // ✅ CERRAR function cargarCalco()


function eliminarElementoSeleccionado() {
    if (!window.elementoSeleccionado) {
        console.warn('⚠️ No hay elemento seleccionado para eliminar');
        mostrarNotificacion('No hay elemento seleccionado', 'warning');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
        // ✅ ELIMINAR TEXTO ASOCIADO PRIMERO:
        if (window.elementoSeleccionado.textoMarcador) {
            if (window.calcoActivo && window.calcoActivo.hasLayer(window.elementoSeleccionado.textoMarcador)) {
                window.calcoActivo.removeLayer(window.elementoSeleccionado.textoMarcador);
            } else if (mapa.hasLayer(window.elementoSeleccionado.textoMarcador)) {
                mapa.removeLayer(window.elementoSeleccionado.textoMarcador);
            }
            console.log('🗑️ textoMarcador eliminado');
        }
        
        // Remover elemento principal del mapa y del calco
        if (window.calcoActivo && window.calcoActivo.hasLayer(window.elementoSeleccionado)) {
            window.calcoActivo.removeLayer(window.elementoSeleccionado);
        } else if (mapa.hasLayer(window.elementoSeleccionado)) {
            mapa.removeLayer(window.elementoSeleccionado);
        }
        
        console.log('🗑️ Elemento eliminado del mapa');
        mostrarNotificacion('Elemento eliminado', 'success');
        
        // Limpiar selección
        window.elementoSeleccionado = null;
        
        // Actualizar lista de elementos si existe
        if (typeof actualizarElementosCalco === 'function') {
            actualizarElementosCalco();
        }
    }
}

// Exportar la función
window.eliminarElementoSeleccionado = eliminarElementoSeleccionado;


// Inicialización cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando funcionalidades de calcos");
    var nuevoCalcoBtn = document.getElementById('nuevoCalcoBtn');
    var cargarCalcoBtn = document.getElementById('cargarCalcoBtn');

    var guardarCalcoBtn = document.getElementById('guardarCalcoBtn');

    if (nuevoCalcoBtn) {
        nuevoCalcoBtn.addEventListener('click', crearNuevoCalco);
    } else {
        console.error('Botón nuevoCalcoBtn no encontrado en el DOM');
    }

    if (cargarCalcoBtn) {
        cargarCalcoBtn.addEventListener('click', cargarCalco);
    } else {
        console.error('Botón cargarCalcoBtn no encontrado en el DOM');
    }

    if (guardarCalcoBtn) {
        guardarCalcoBtn.addEventListener('click', guardarCalco);
    } else {
        console.error('Botón guardarCalcoBtn no encontrado en el DOM');
    }
});

function depurarElementosCalco() {
    if (!window.calcoActivo) {
        console.warn('No hay calco activo para depurar');
        return;
    }
    
    console.log('🔍 DEPURANDO ELEMENTOS DEL CALCO:');
    var resumen = {
        marcadores: [],
        lineas: [],
        vertices: []
    };
    
    window.calcoActivo.eachLayer(function(feature) {
        if (feature instanceof L.Marker) {
            var info = {
                nombre: feature.options.nombre,
                sidc: feature.options.sidc,
                esVertice: feature.options.esVertice,
                posicion: feature.getLatLng()
            };
            
            if (feature.options.esVertice) {
                resumen.vertices.push(info);
            } else {
                resumen.marcadores.push(info);
            }
        } else if (feature instanceof L.Polyline) {
            resumen.lineas.push({
                nombre: feature.options.nombre,
                tipo: feature instanceof L.Polygon ? 'polígono' : 'línea',
                puntos: feature.getLatLngs().length
            });
        }
    });
    
    console.log('📊 RESUMEN:', resumen);
    return resumen;
}


// Exportación de funciones para uso en otros archivos
window.crearNuevoCalco = crearNuevoCalco;
window.setCalcoActivo = setCalcoActivo;
window.toggleCalcoVisibility = toggleCalcoVisibility;
window.renameCalco = renameCalco;
window.eliminarCalco = eliminarCalco;
window.cargarCalco = cargarCalco;
window.guardarCalco = guardarCalco;
window.actualizarElementosList = actualizarElementosList;
window.actualizarElementosCalco = actualizarElementosCalco;
window.marcarComoVertice = marcarComoVertice;
window.depurarElementosCalco = depurarElementosCalco;
window.mostrarNotificacion = mostrarNotificacion;
window.eliminarElementoSeleccionado = eliminarElementoSeleccionado;


window.MAIRA = window.MAIRA || {};
window.MAIRA.Calcos = {
    crear: crearNuevoCalco,
    activar: setCalcoActivo,
    visibilidad: toggleCalcoVisibility,
    renombrar: renameCalco,
    eliminar: eliminarCalco,
    persistencia: {
        guardar: guardarCalco,
        cargar: cargarCalco,
    },
    elementos: {
        listar: actualizarElementosList,
        actualizar: actualizarElementosCalco,
        obtenerTipo: obtenerTipoElemento,
        obtenerIcono: obtenerIconoElemento,
        marcarVertice: marcarComoVertice            // ✅ NUEVA FUNCIÓN
    }
};

// ✅ VERIFICACIÓN SEGURA DEL MENÚ CONTEXTUAL:
window.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        console.log('🔍 Verificando funciones críticas:');
        console.log('  - editarElementoSeleccionado:', typeof editarElementoSeleccionado);
        console.log('  - mostrarMenuContextual:', typeof mostrarMenuContextual);
        console.log('  - seleccionarElemento:', typeof seleccionarElemento);
        
        // ✅ VERIFICAR MAPA SOLO SI EXISTE:
        if (typeof mapa !== 'undefined' && mapa && mapa.getContainer) {
            console.log('  - Mapa inicializado correctamente');
        } else {
            console.log('  - Mapa aún no inicializado');
        }
        
        if (typeof editarElementoSeleccionado !== 'function') {
            console.error('❌ editarElementoSeleccionado no está definida');
        }
    }, 1000);
});



