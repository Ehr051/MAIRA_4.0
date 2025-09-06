/**
 * @fileoverview Manejador de herramientas de medición
 * @version 1.0.0
 * @description Módulo especializado para medición de distancias y gestión de puntos
 * Extraído de herramientasP.js como parte de la refactorización modular
 */

class MeasurementHandler {
    constructor() {
        this.mediendoDistancia = false;
        this.puntosMedicion = [];
        this.lineaMedicion = null;
        this.marcadoresMedicion = [];
        this.interaccionMedicion = null;
        this.distanciaTotal = 0;
        this.marcadorProvisional = null;
        this.lineaProvisional = null;
        
        console.log('✅ MeasurementHandler inicializado');
    }

    /**
     * Inicia el modo de medición de distancia
     */
    medirDistancia() {
        console.log('🔧 Iniciando medición de distancia...');
        
        if (this.mediendoDistancia) {
            console.log('Ya se está midiendo distancia');
            return;
        }

        this.mediendoDistancia = true;
        this.puntosMedicion = [];
        this.distanciaTotal = 0;
        
        // Limpiar mediciones anteriores
        this.limpiarMedicionAnterior();
        
        // Crear interacción de click
        this.interaccionMedicion = new ol.interaction.Pointer({
            handleDownEvent: this.manejarClickMedicion.bind(this)
        });
        
        if (window.map) {
            window.map.addInteraction(this.interaccionMedicion);
            window.map.getViewport().style.cursor = 'crosshair';
            
            // Agregar listener para movimiento del mouse
            window.map.on('pointermove', this.manejarMovimientoMouse.bind(this));
        }

        console.log('✅ Modo medición activado');
    }

    /**
     * Maneja el evento de click para agregar puntos de medición
     */
    manejarClickMedicion(evt) {
        const coordenada = evt.coordinate;
        this.addDistancePoint(coordenada);
        return true;
    }

    /**
     * Maneja el movimiento del mouse para línea provisional
     */
    manejarMovimientoMouse(evt) {
        if (!this.mediendoDistancia || this.puntosMedicion.length === 0) {
            return;
        }
        
        this.actualizarDistanciaProvisional(evt.coordinate);
    }

    /**
     * Añade un punto de medición
     */
    addDistancePoint(coordenada) {
        console.log('🎯 Agregando punto de medición:', coordenada);
        
        this.puntosMedicion.push(coordenada);
        
        // Crear marcador
        const marcador = new ol.Feature({
            geometry: new ol.geom.Point(coordenada),
            tipo: 'punto-medicion'
        });
        
        // Estilo del marcador
        marcador.setStyle(new ol.style.Style({
            image: new ol.style.Circle({
                radius: 6,
                fill: new ol.style.Fill({ color: '#ff0000' }),
                stroke: new ol.style.Stroke({ color: '#ffffff', width: 2 })
            })
        }));
        
        this.marcadoresMedicion.push(marcador);
        
        if (window.vectorSource) {
            window.vectorSource.addFeature(marcador);
        }
        
        // Si hay más de un punto, crear/actualizar línea
        if (this.puntosMedicion.length > 1) {
            this.actualizarLineaMedicion();
            this.calcularDistanciaTotal();
        }
        
        console.log(`✅ Punto ${this.puntosMedicion.length} agregado`);
    }

    /**
     * Actualiza la línea de medición
     */
    actualizarLineaMedicion() {
        // Eliminar línea anterior si existe
        if (this.lineaMedicion && window.vectorSource) {
            window.vectorSource.removeFeature(this.lineaMedicion);
        }
        
        // Crear nueva línea
        this.lineaMedicion = new ol.Feature({
            geometry: new ol.geom.LineString(this.puntosMedicion),
            tipo: 'linea-medicion'
        });
        
        // Estilo de la línea
        this.lineaMedicion.setStyle(new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#ff0000',
                width: 3,
                lineDash: [5, 5]
            })
        }));
        
        if (window.vectorSource) {
            window.vectorSource.addFeature(this.lineaMedicion);
        }
    }

    /**
     * Actualiza la distancia provisional mientras se mueve el mouse
     */
    actualizarDistanciaProvisional(coordenada) {
        if (this.puntosMedicion.length === 0) return;
        
        // Eliminar línea provisional anterior
        if (this.lineaProvisional && window.vectorSource) {
            window.vectorSource.removeFeature(this.lineaProvisional);
        }
        
        // Crear línea provisional desde el último punto
        const ultimoPunto = this.puntosMedicion[this.puntosMedicion.length - 1];
        const puntosProvisionales = [...this.puntosMedicion, coordenada];
        
        this.lineaProvisional = new ol.Feature({
            geometry: new ol.geom.LineString(puntosProvisionales),
            tipo: 'linea-provisional'
        });
        
        // Estilo de línea provisional
        this.lineaProvisional.setStyle(new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#ff6600',
                width: 2,
                lineDash: [10, 5]
            })
        }));
        
        if (window.vectorSource) {
            window.vectorSource.addFeature(this.lineaProvisional);
        }
        
        // Calcular y mostrar distancia provisional
        const distanciaProvisional = this.calcularDistanciaEntrePuntos(ultimoPunto, coordenada);
        const distanciaTotalProvisional = this.distanciaTotal + distanciaProvisional;
        
        this.mostrarDistanciaEnPantalla(distanciaTotalProvisional, true);
    }

    /**
     * Calcula la distancia total de todos los segmentos
     */
    calcularDistanciaTotal() {
        this.distanciaTotal = 0;
        
        for (let i = 1; i < this.puntosMedicion.length; i++) {
            const distanciaSegmento = this.calcularDistanciaEntrePuntos(
                this.puntosMedicion[i - 1],
                this.puntosMedicion[i]
            );
            this.distanciaTotal += distanciaSegmento;
        }
        
        this.mostrarDistanciaEnPantalla(this.distanciaTotal, false);
        console.log(`📏 Distancia total: ${(this.distanciaTotal / 1000).toFixed(3)} km`);
    }

    /**
     * Calcula la distancia entre dos puntos
     */
    calcularDistanciaEntrePuntos(punto1, punto2) {
        const linea = new ol.geom.LineString([punto1, punto2]);
        return ol.sphere.getLength(linea);
    }

    /**
     * Muestra la distancia en pantalla
     */
    mostrarDistanciaEnPantalla(distancia, esProvisional = false) {
        const distanciaKm = (distancia / 1000).toFixed(3);
        const prefijo = esProvisional ? 'Distancia provisional: ' : 'Distancia total: ';
        
        // Crear o actualizar elemento de distancia
        let elementoDistancia = document.getElementById('distancia-medicion');
        if (!elementoDistancia) {
            elementoDistancia = document.createElement('div');
            elementoDistancia.id = 'distancia-medicion';
            elementoDistancia.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                z-index: 1000;
                border: 2px solid #ff0000;
            `;
            document.body.appendChild(elementoDistancia);
        }
        
        elementoDistancia.innerHTML = `
            ${prefijo}<strong>${distanciaKm} km</strong><br>
            <small>Click para agregar puntos<br>Doble-click para finalizar</small>
        `;
        
        if (esProvisional) {
            elementoDistancia.style.borderColor = '#ff6600';
        } else {
            elementoDistancia.style.borderColor = '#ff0000';
        }
    }

    /**
     * Finaliza la medición
     */
    finalizarMedicion() {
        console.log('🏁 Finalizando medición...');
        
        this.mediendoDistancia = false;
        
        // Remover interacción
        if (this.interaccionMedicion && window.map) {
            window.map.removeInteraction(this.interaccionMedicion);
            window.map.getViewport().style.cursor = 'default';
            window.map.un('pointermove', this.manejarMovimientoMouse);
        }
        
        // Limpiar línea provisional
        if (this.lineaProvisional && window.vectorSource) {
            window.vectorSource.removeFeature(this.lineaProvisional);
            this.lineaProvisional = null;
        }
        
        // Mostrar perfil de elevación si hay suficientes puntos
        if (this.puntosMedicion.length >= 2) {
            console.log('📊 Generando perfil de elevación...');
            this.mostrarPerfilElevacion();
        }
        
        console.log('✅ Medición finalizada');
    }

    /**
     * Muestra el perfil de elevación
     */
    mostrarPerfilElevacion() {
        // Esta función interactúa con el ElevationProfileService
        if (typeof window.mostrarGraficoPerfil === 'function') {
            const puntos = this.puntosMedicion.map((coord, index) => ({
                lat: coord[1],
                lon: coord[0],
                index: index
            }));
            
            // Pasar datos al servicio de elevación
            window.mostrarGraficoPerfil(puntos, this.distanciaTotal);
        } else {
            console.warn('⚠️ Servicio de perfil de elevación no disponible');
        }
    }

    /**
     * Limpia las mediciones anteriores
     */
    limpiarMedicionAnterior() {
        // Limpiar marcadores
        this.marcadoresMedicion.forEach(marcador => {
            if (window.vectorSource) {
                window.vectorSource.removeFeature(marcador);
            }
        });
        this.marcadoresMedicion = [];
        
        // Limpiar línea
        if (this.lineaMedicion && window.vectorSource) {
            window.vectorSource.removeFeature(this.lineaMedicion);
            this.lineaMedicion = null;
        }
        
        // Limpiar línea provisional
        if (this.lineaProvisional && window.vectorSource) {
            window.vectorSource.removeFeature(this.lineaProvisional);
            this.lineaProvisional = null;
        }
        
        // Limpiar marcador provisional
        if (this.marcadorProvisional && window.vectorSource) {
            window.vectorSource.removeFeature(this.marcadorProvisional);
            this.marcadorProvisional = null;
        }
        
        // Limpiar display de distancia
        const elementoDistancia = document.getElementById('distancia-medicion');
        if (elementoDistancia) {
            elementoDistancia.remove();
        }
    }

    /**
     * Inicializa los event listeners
     */
    inicializarEventListeners() {
        // Event listener para el botón de medir distancia
        const btnMedirDistancia = document.getElementById('btnMedirDistancia');
        if (btnMedirDistancia) {
            btnMedirDistancia.addEventListener('click', (e) => {
                e.preventDefault();
                this.medirDistancia();
            });
        }

        // Event listener para doble click para finalizar
        if (window.map) {
            window.map.on('dblclick', (evt) => {
                if (this.mediendoDistancia) {
                    evt.preventDefault();
                    this.finalizarMedicion();
                }
            });
        }
    }
}

// Crear instancia global
window.measurementHandler = new MeasurementHandler();

// Exportar funciones al scope global para compatibilidad
window.medirDistancia = () => window.measurementHandler.medirDistancia();
window.addDistancePoint = (coord) => window.measurementHandler.addDistancePoint(coord);
window.finalizarMedicion = () => window.measurementHandler.finalizarMedicion();
window.actualizarDistanciaProvisional = (coord) => window.measurementHandler.actualizarDistanciaProvisional(coord);
window.mostrarPerfilElevacion = () => window.measurementHandler.mostrarPerfilElevacion();

console.log('✅ MeasurementHandler cargado y funciones exportadas al scope global');
