/**
 * @fileoverview Manejador de interacciones del mapa
 * @version 1.0.0
 * @description Módulo especializado para selección y manipulación de elementos del mapa
 * Extraído de herramientasP.js como parte de la refactorización modular
 */

class MapInteractionHandler {
    constructor() {
        this.elementoSeleccionado = null;
        this.elementosSeleccionados = [];
        this.modoSeleccion = false;
        this.estiloOriginal = null;
        
        console.log('✅ MapInteractionHandler inicializado');
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
     * Aplica estilo de selección al elemento
     */
    aplicarEstiloSeleccion(elemento) {
        try {
            // Guardar estilo original
            this.estiloOriginal = elemento.getStyle();
            
            // Determinar tipo de elemento y aplicar estilo apropiado
            const geometria = elemento.getGeometry();
            
            if (geometria instanceof ol.geom.Point) {
                this.aplicarEstiloSeleccionPunto(elemento);
            } else if (geometria instanceof ol.geom.LineString) {
                this.aplicarEstiloSeleccionLinea(elemento);
            } else if (geometria instanceof ol.geom.Polygon) {
                this.aplicarEstiloSeleccionPoligono(elemento);
            } else {
                this.aplicarEstiloSeleccionGenerico(elemento);
            }
            
        } catch (error) {
            console.error('❌ Error aplicando estilo de selección:', error);
        }
    }

    /**
     * Aplica estilo de selección para puntos
     */
    aplicarEstiloSeleccionPunto(elemento) {
        const estilo = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 8,
                fill: new ol.style.Fill({ color: '#ff0000' }),
                stroke: new ol.style.Stroke({ 
                    color: '#ffffff', 
                    width: 3 
                })
            }),
            zIndex: 1000
        });
        
        elemento.setStyle(estilo);
    }

    /**
     * Aplica estilo de selección para líneas
     */
    aplicarEstiloSeleccionLinea(elemento) {
        const estilo = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#ff0000',
                width: 4,
                lineDash: [5, 5]
            }),
            zIndex: 1000
        });
        
        elemento.setStyle(estilo);
    }

    /**
     * Aplica estilo de selección para polígonos
     */
    aplicarEstiloSeleccionPoligono(elemento) {
        const estilo = new ol.style.Style({
            fill: new ol.style.Fill({ 
                color: 'rgba(255, 0, 0, 0.3)' 
            }),
            stroke: new ol.style.Stroke({
                color: '#ff0000',
                width: 3,
                lineDash: [10, 5]
            }),
            zIndex: 1000
        });
        
        elemento.setStyle(estilo);
    }

    /**
     * Aplica estilo de selección genérico
     */
    aplicarEstiloSeleccionGenerico(elemento) {
        const estilo = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#ff0000',
                width: 3
            }),
            fill: new ol.style.Fill({ 
                color: 'rgba(255, 0, 0, 0.2)' 
            }),
            zIndex: 1000
        });
        
        elemento.setStyle(estilo);
    }

    /**
     * Restaura el estilo original del elemento
     */
    restaurarEstiloOriginal(elemento) {
        if (this.estiloOriginal) {
            elemento.setStyle(this.estiloOriginal);
        } else {
            elemento.setStyle(null); // Usar estilo por defecto
        }
    }

    /**
     * Muestra información del elemento seleccionado
     */
    mostrarInformacionElemento(elemento) {
        try {
            const propiedades = elemento.getProperties();
            const geometria = elemento.getGeometry();
            
            // Crear o actualizar panel de información
            let panelInfo = document.getElementById('elemento-info-panel');
            if (!panelInfo) {
                panelInfo = this.crearPanelInformacion();
            }
            
            // Obtener información del elemento
            const info = this.extraerInformacionElemento(elemento, propiedades, geometria);
            
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
     * Extrae información relevante del elemento
     */
    extraerInformacionElemento(elemento, propiedades, geometria) {
        const info = {
            tipo: this.determinarTipoGeometria(geometria),
            propiedades: {},
            coordenadas: null,
            area: null,
            longitud: null
        };
        
        // Extraer propiedades relevantes
        Object.keys(propiedades).forEach(key => {
            if (key !== 'geometry' && propiedades[key] !== undefined) {
                info.propiedades[key] = propiedades[key];
            }
        });
        
        // Calcular métricas geométricas
        if (geometria instanceof ol.geom.Point) {
            info.coordenadas = geometria.getCoordinates();
        } else if (geometria instanceof ol.geom.LineString) {
            info.longitud = ol.sphere.getLength(geometria);
            info.coordenadas = geometria.getCoordinates();
        } else if (geometria instanceof ol.geom.Polygon) {
            info.area = ol.sphere.getArea(geometria);
            info.coordenadas = geometria.getCoordinates()[0]; // Exterior ring
        }
        
        return info;
    }

    /**
     * Determina el tipo de geometría
     */
    determinarTipoGeometria(geometria) {
        if (geometria instanceof ol.geom.Point) return 'Punto';
        if (geometria instanceof ol.geom.LineString) return 'Línea';
        if (geometria instanceof ol.geom.Polygon) return 'Polígono';
        if (geometria instanceof ol.geom.MultiPoint) return 'Multi-Punto';
        if (geometria instanceof ol.geom.MultiLineString) return 'Multi-Línea';
        if (geometria instanceof ol.geom.MultiPolygon) return 'Multi-Polígono';
        return 'Desconocido';
    }

    /**
     * Genera HTML para mostrar la información
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
        
        // Coordenadas (primeros puntos)
        if (info.coordenadas) {
            html += '<div style="margin-bottom: 10px;"><strong>Coordenadas:</strong><br>';
            
            if (info.tipo === 'Punto') {
                const [x, y] = info.coordenadas;
                html += `${x.toFixed(6)}, ${y.toFixed(6)}`;
            } else {
                const maxPuntos = Math.min(3, info.coordenadas.length);
                for (let i = 0; i < maxPuntos; i++) {
                    const [x, y] = info.coordenadas[i];
                    html += `${x.toFixed(6)}, ${y.toFixed(6)}<br>`;
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
        if (!window.map) {
            console.warn('⚠️ Mapa no disponible para inicializar event listeners');
            return;
        }

        // Event listener para click en el mapa
        window.map.on('click', (evt) => {
            const feature = window.map.forEachFeatureAtPixel(evt.pixel, (feature) => {
                return feature;
            });

            if (feature) {
                this.seleccionarElemento(feature);
            } else {
                this.deseleccionarElemento();
            }
        });

        console.log('✅ Event listeners de MapInteractionHandler inicializados');
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
