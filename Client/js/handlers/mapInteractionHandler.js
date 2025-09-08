/**
 * @fileoverview Manejador de interacciones del mapa - VERSIÓN LEAFLET
 * @version 2.0.0
 * @description Módulo especializado para selección y manipulación de elementos del mapa con Leaflet
 * Convertido de OpenLayers a Leaflet para compatibilidad con el sistema original
 */

class MapInteractionHandler {
    constructor() {
        this.elementoSeleccionado = null;
        this.elementosSeleccionados = [];
        this.modoSeleccion = false;
        this.estiloOriginal = null;
        
        console.log('✅ MapInteractionHandler inicializado con Leaflet');
    }

    /**
     * Selecciona un elemento en el mapa
     */
    seleccionarElemento(elemento) {
        try {
            if (!elemento) {
                console.warn('⚠️ Elemento nulo pasado a seleccionarElemento');
                return;
            }

            console.log('🎯 Seleccionando elemento:', elemento);
            
            // Deseleccionar elemento anterior si existe
            if (this.elementoSeleccionado) {
                this.deseleccionarElemento();
            }

            this.elementoSeleccionado = elemento;
            
            // Aplicar estilo de selección
            this.aplicarEstiloSeleccion(elemento);
            
            // Mostrar información del elemento
            this.mostrarInformacionElemento(elemento);
            
            // Disparar evento de selección
            this.dispararEventoSeleccion(elemento);
            
            console.log('✅ Elemento seleccionado correctamente');
            
        } catch (error) {
            console.error('❌ Error seleccionando elemento:', error);
        }
    }

    /**
     * Deselecciona el elemento actual
     */
    deseleccionarElemento() {
        try {
            if (!this.elementoSeleccionado) {
                return;
            }

            console.log('🔄 Deseleccionando elemento...');
            
            // Restaurar estilo original
            this.restaurarEstiloOriginal(this.elementoSeleccionado);
            
            // Ocultar información
            this.ocultarInformacionElemento();
            
            // Limpiar referencia
            this.elementoSeleccionado = null;
            this.estiloOriginal = null;
            
            // Disparar evento de deselección
            this.dispararEventoDeseleccion();
            
            console.log('✅ Elemento deseleccionado');
            
        } catch (error) {
            console.error('❌ Error deseleccionando elemento:', error);
        }
    }

    /**
     * Aplica estilo de selección al elemento usando Leaflet
     */
    aplicarEstiloSeleccion(elemento) {
        try {
            // Guardar estilo original para Leaflet
            if (elemento.options) {
                this.estiloOriginal = {...elemento.options};
            }
            
            // Determinar tipo de elemento Leaflet y aplicar estilo apropiado
            if (elemento instanceof L.Marker) {
                this.aplicarEstiloSeleccionPunto(elemento);
            } else if (elemento instanceof L.Polyline && !(elemento instanceof L.Polygon)) {
                this.aplicarEstiloSeleccionLinea(elemento);
            } else if (elemento instanceof L.Polygon) {
                this.aplicarEstiloSeleccionPoligono(elemento);
            } else if (elemento instanceof L.Circle || elemento instanceof L.CircleMarker) {
                this.aplicarEstiloSeleccionCirculo(elemento);
            } else {
                this.aplicarEstiloSeleccionGenerico(elemento);
            }
            
        } catch (error) {
            console.error('❌ Error aplicando estilo de selección:', error);
        }
    }

    /**
     * Aplica estilo de selección para marcadores/puntos en Leaflet
     */
    aplicarEstiloSeleccionPunto(elemento) {
        // Para marcadores, crear un círculo de selección
        if (elemento.getLatLng) {
            const latlng = elemento.getLatLng();
            
            // Crear círculo de selección temporal
            if (this.circuloSeleccion) {
                this.circuloSeleccion.remove();
            }
            
            this.circuloSeleccion = L.circle(latlng, {
                radius: 50, // Radio en metros
                color: '#ff0000',
                weight: 3,
                opacity: 1,
                fillColor: '#ff0000',
                fillOpacity: 0.3
            });
            
            if (window.mapa) {
                this.circuloSeleccion.addTo(window.mapa);
            }
        }
    }

    /**
     * Aplica estilo de selección para líneas en Leaflet
     */
    aplicarEstiloSeleccionLinea(elemento) {
        elemento.setStyle({
            color: '#ff0000',
            weight: 4,
            opacity: 1,
            dashArray: '5, 5'
        });
    }

    /**
     * Aplica estilo de selección para polígonos en Leaflet
     */
    aplicarEstiloSeleccionPoligono(elemento) {
        elemento.setStyle({
            color: '#ff0000',
            weight: 3,
            opacity: 1,
            fillColor: '#ff0000',
            fillOpacity: 0.3,
            dashArray: '10, 5'
        });
    }

    /**
     * Aplica estilo de selección para círculos en Leaflet
     */
    aplicarEstiloSeleccionCirculo(elemento) {
        elemento.setStyle({
            color: '#ff0000',
            weight: 3,
            opacity: 1,
            fillColor: '#ff0000',
            fillOpacity: 0.3
        });
    }

    /**
     * Aplica estilo de selección genérico para Leaflet
     */
    aplicarEstiloSeleccionGenerico(elemento) {
        if (elemento.setStyle) {
            elemento.setStyle({
                color: '#ff0000',
                weight: 3,
                opacity: 1,
                fillColor: '#ff0000',
                fillOpacity: 0.2
            });
        }
    }

    /**
     * Restaura el estilo original del elemento Leaflet
     */
    restaurarEstiloOriginal(elemento) {
        try {
            if (this.estiloOriginal && elemento.setStyle) {
                elemento.setStyle(this.estiloOriginal);
            } else if (elemento.setStyle) {
                // Restaurar estilo por defecto básico
                const estiloDefecto = {
                    color: '#3388ff',
                    weight: 3,
                    opacity: 1,
                    fillColor: '#3388ff',
                    fillOpacity: 0.2
                };
                elemento.setStyle(estiloDefecto);
            }
            
            // Limpiar círculo de selección si existe
            if (this.circuloSeleccion) {
                this.circuloSeleccion.remove();
                this.circuloSeleccion = null;
            }
            
        } catch (error) {
            console.error('❌ Error restaurando estilo original:', error);
        }
    }

    /**
     * Muestra información del elemento seleccionado (versión Leaflet)
     */
    mostrarInformacionElemento(elemento) {
        try {
            // Crear o actualizar panel de información
            let panelInfo = document.getElementById('elemento-info-panel');
            if (!panelInfo) {
                panelInfo = this.crearPanelInformacion();
            }
            
            // Obtener información del elemento Leaflet
            const info = this.extraerInformacionElemento(elemento);
            
            // Actualizar contenido del panel
            const contenido = document.getElementById('elemento-info-contenido');
            if (contenido) {
                contenido.innerHTML = this.generarHTMLInformacion(info);
            }
            
            // Mostrar panel
            panelInfo.style.display = 'block';
            
        } catch (error) {
            console.error('❌ Error mostrando información del elemento:', error);
        }
    }

    /**
     * Crea el panel de información
     */
    crearPanelInformacion() {
        const panel = document.createElement('div');
        panel.id = 'elemento-info-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: white;
            border: 2px solid #333;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            z-index: 1000;
            display: none;
        `;
        
        // Header del panel
        const header = document.createElement('div');
        header.style.cssText = `
            background: #333;
            color: white;
            padding: 10px;
            border-radius: 6px 6px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const titulo = document.createElement('h4');
        titulo.textContent = 'Información del Elemento';
        titulo.style.margin = '0';
        
        const btnCerrar = document.createElement('button');
        btnCerrar.textContent = '×';
        btnCerrar.style.cssText = `
            background: transparent;
            color: white;
            border: none;
            font-size: 20px;
            cursor: pointer;
        `;
        btnCerrar.onclick = () => this.ocultarInformacionElemento();
        
        header.appendChild(titulo);
        header.appendChild(btnCerrar);
        
        // Contenido del panel
        const contenido = document.createElement('div');
        contenido.id = 'elemento-info-contenido';
        contenido.style.cssText = `
            padding: 15px;
            max-height: 400px;
            overflow-y: auto;
        `;
        
        panel.appendChild(header);
        panel.appendChild(contenido);
        document.body.appendChild(panel);
        
        return panel;
    }

    /**
     * Extrae información relevante del elemento usando Leaflet
     */
    extraerInformacionElemento(elemento, propiedades) {
        const info = {
            tipo: this.determinarTipoElemento(elemento),
            propiedades: {},
            coordenadas: null,
            area: null,
            longitud: null
        };
        
        // Extraer propiedades relevantes
        if (propiedades) {
            Object.keys(propiedades).forEach(key => {
                if (key !== 'geometry' && propiedades[key] !== undefined) {
                    info.propiedades[key] = propiedades[key];
                }
            });
        }
        
        // Extraer propiedades del elemento Leaflet
        if (elemento.options) {
            Object.keys(elemento.options).forEach(key => {
                if (key !== 'geometry' && elemento.options[key] !== undefined) {
                    info.propiedades[key] = elemento.options[key];
                }
            });
        }
        
        // Calcular métricas geométricas usando Leaflet
        if (elemento instanceof L.Marker) {
            info.coordenadas = elemento.getLatLng();
        } else if (elemento instanceof L.Polyline && !(elemento instanceof L.Polygon)) {
            const coords = elemento.getLatLngs();
            info.coordenadas = coords;
            info.longitud = this.calcularLongitudLinea(coords);
        } else if (elemento instanceof L.Polygon) {
            const coords = elemento.getLatLngs()[0]; // Exterior ring
            info.coordenadas = coords;
            info.area = this.calcularAreaPoligono(coords);
        } else if (elemento instanceof L.Circle) {
            info.coordenadas = elemento.getLatLng();
            info.area = Math.PI * Math.pow(elemento.getRadius(), 2);
        }
        
        return info;
    }

    /**
     * Calcula la longitud de una línea usando Leaflet
     */
    calcularLongitudLinea(coordenadas) {
        let longitud = 0;
        for (let i = 1; i < coordenadas.length; i++) {
            longitud += L.latLng(coordenadas[i-1]).distanceTo(L.latLng(coordenadas[i]));
        }
        return longitud;
    }

    /**
     * Calcula el área de un polígono usando Leaflet (algoritmo básico)
     */
    calcularAreaPoligono(coordenadas) {
        if (coordenadas.length < 3) return 0;
        
        let area = 0;
        const R = 6371000; // Radio de la Tierra en metros
        
        for (let i = 0; i < coordenadas.length; i++) {
            const j = (i + 1) % coordenadas.length;
            const lat1 = coordenadas[i].lat * Math.PI / 180;
            const lat2 = coordenadas[j].lat * Math.PI / 180;
            const lng1 = coordenadas[i].lng * Math.PI / 180;
            const lng2 = coordenadas[j].lng * Math.PI / 180;
            
            area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
        }
        
        area = Math.abs(area) * R * R / 2;
        return area;
    }

    /**
     * Determina el tipo de elemento Leaflet
     */
    determinarTipoElemento(elemento) {
        if (elemento instanceof L.Marker) return 'Marcador';
        if (elemento instanceof L.Polygon) return 'Polígono';
        if (elemento instanceof L.Polyline) return 'Línea';
        if (elemento instanceof L.Circle) return 'Círculo';
        if (elemento instanceof L.CircleMarker) return 'Marcador Circular';
        if (elemento instanceof L.Rectangle) return 'Rectángulo';
        return 'Desconocido';
    }

    /**
     * Genera HTML para mostrar la información de elementos Leaflet
     */
    generarHTMLInformacion(info) {
        let html = `<div style="margin-bottom: 15px;">
            <strong>Tipo:</strong> ${info.tipo}
        </div>`;
        
        // Métricas
        if (info.longitud) {
            html += `<div style="margin-bottom: 10px;">
                <strong>Longitud:</strong> ${(info.longitud / 1000).toFixed(3)} km
            </div>`;
        }
        
        if (info.area) {
            html += `<div style="margin-bottom: 10px;">
                <strong>Área:</strong> ${(info.area / 1000000).toFixed(3)} km²
            </div>`;
        }
        
        // Propiedades
        if (Object.keys(info.propiedades).length > 0) {
            html += '<div style="margin-bottom: 15px;"><strong>Propiedades:</strong><ul style="margin: 5px 0; padding-left: 20px;">';
            
            Object.entries(info.propiedades).forEach(([key, value]) => {
                html += `<li><strong>${key}:</strong> ${value}</li>`;
            });
            
            html += '</ul></div>';
        }
        
        // Coordenadas (formato Leaflet)
        if (info.coordenadas) {
            html += '<div style="margin-bottom: 10px;"><strong>Coordenadas:</strong><br>';
            
            if (info.tipo === 'Marcador' || info.tipo === 'Círculo') {
                // Para marcadores y círculos, coordenadas es un LatLng
                html += `${info.coordenadas.lat.toFixed(6)}, ${info.coordenadas.lng.toFixed(6)}`;
            } else if (Array.isArray(info.coordenadas)) {
                const maxPuntos = Math.min(3, info.coordenadas.length);
                for (let i = 0; i < maxPuntos; i++) {
                    const coord = info.coordenadas[i];
                    if (coord.lat !== undefined && coord.lng !== undefined) {
                        html += `${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}<br>`;
                    }
                }
                if (info.coordenadas.length > 3) {
                    html += `... y ${info.coordenadas.length - 3} puntos más`;
                }
            }
            
            html += '</div>';
        }
        
        return html;
    }

    /**
     * Oculta el panel de información
     */
    ocultarInformacionElemento() {
        const panel = document.getElementById('elemento-info-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    /**
     * Dispara evento de selección
     */
    dispararEventoSeleccion(elemento) {
        const evento = new CustomEvent('elementoSeleccionado', {
            detail: { elemento: elemento }
        });
        document.dispatchEvent(evento);
    }

    /**
     * Dispara evento de deselección
     */
    dispararEventoDeseleccion() {
        const evento = new CustomEvent('elementoDeseleccionado');
        document.dispatchEvent(evento);
    }

    /**
     * Obtiene el elemento actualmente seleccionado
     */
    obtenerElementoSeleccionado() {
        return this.elementoSeleccionado;
    }

    /**
     * Verifica si hay un elemento seleccionado
     */
    hayElementoSeleccionado() {
        return this.elementoSeleccionado !== null;
    }

    /**
     * Inicializa los event listeners para interacciones del mapa
     */
    inicializarEventListeners() {
        // Buscar mapa Leaflet
        const mapa = window.mapa || window.map || null;
        if (!mapa) {
            console.warn('⚠️ Mapa Leaflet no disponible para inicializar event listeners');
            return;
        }

        // Event listener para click en el mapa usando Leaflet
        mapa.on('click', (evt) => {
            const layers = [];
            
            // Buscar layers en el punto clickeado
            mapa.eachLayer((layer) => {
                if (layer.feature || layer._layers) {
                    layers.push(layer);
                }
            });

            if (layers.length > 0) {
                this.seleccionarElemento(layers[0]);
            } else {
                this.deseleccionarElemento();
            }
        });

        console.log('✅ Event listeners de MapInteractionHandler inicializados con Leaflet');
    }
}

// Crear instancia global
window.mapInteractionHandler = new MapInteractionHandler();

// Exportar funciones al scope global para compatibilidad
// Nota: Estas funciones pueden coexistir con las de CO.js ya que son específicas para diferentes contextos
window.seleccionarElementoMapa = (elemento) => window.mapInteractionHandler.seleccionarElemento(elemento);
window.deseleccionarElementoMapa = () => window.mapInteractionHandler.deseleccionarElemento();
window.obtenerCalcoActivo = () => window.mapInteractionHandler.obtenerElementoSeleccionado();

// Mantener compatibilidad global pero con verificación de contexto
if (!window.seleccionarElemento) {
    window.seleccionarElemento = (elemento) => window.mapInteractionHandler.seleccionarElemento(elemento);
}
if (!window.deseleccionarElemento) {
    window.deseleccionarElemento = () => window.mapInteractionHandler.deseleccionarElemento();
}

console.log('✅ MapInteractionHandler cargado y funciones exportadas al scope global');
