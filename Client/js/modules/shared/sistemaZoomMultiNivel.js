/**
 * SISTEMA ZOOM MULTI-NIVEL - MAIRA 4.0
 * =====================================
 * Inspirado en Total War: 3 niveles de visualización
 * 1. ESTRATÉGICO (zoom 5-8): Estandartes y símbolos militares
 * 2. TÁCTICO (zoom 9-12): Unidades detalladas con iconografía
 * 3. OPERACIONAL (zoom 13-18): Elementos individuales 3D
 */

class SistemaZoomMultiNivel {
    constructor(mapa) {
        this.mapa = mapa;
        this.nivelActual = 'estrategico';
        this.niveles = {
            estrategico: { min: 5, max: 8, icono: 'flag', escala: 1.0 },
            tactico: { min: 9, max: 12, icono: 'chess-board', escala: 0.8 },
            operacional: { min: 13, max: 18, icono: 'cube', escala: 0.6 }
        };
        
        this.elementos = new Map(); // Almacena todos los elementos del mapa
        this.capasRenderizado = {
            estandartes: null,
            unidades: null,
            elementos3d: null
        };
        
        this.inicializar();
        console.log('🔍 Sistema Zoom Multi-Nivel inicializado (Total War Style)');
    }

    inicializar() {
        // Crear capas de renderizado
        this.crearCapas();
        
        // Escuchar cambios de zoom
        this.mapa.on('zoomend', () => {
            this.actualizarNivelZoom();
        });
        
        // Configurar zoom inicial
        this.actualizarNivelZoom();
    }

    crearCapas() {
        // Capa de estandartes (nivel estratégico)
        this.capasRenderizado.estandartes = L.layerGroup().addTo(this.mapa);
        
        // Capa de unidades (nivel táctico)
        this.capasRenderizado.unidades = L.layerGroup().addTo(this.mapa);
        
        // Capa de elementos 3D (nivel operacional)
        this.capasRenderizado.elementos3d = L.layerGroup().addTo(this.mapa);
    }

    actualizarNivelZoom() {
        const zoomActual = this.mapa.getZoom();
        const nivelAnterior = this.nivelActual;
        
        // Determinar nivel actual
        if (zoomActual >= this.niveles.estrategico.min && zoomActual <= this.niveles.estrategico.max) {
            this.nivelActual = 'estrategico';
        } else if (zoomActual >= this.niveles.tactico.min && zoomActual <= this.niveles.tactico.max) {
            this.nivelActual = 'tactico';
        } else if (zoomActual >= this.niveles.operacional.min && zoomActual <= this.niveles.operacional.max) {
            this.nivelActual = 'operacional';
        }
        
        // Si cambió el nivel, actualizar renderizado
        if (nivelAnterior !== this.nivelActual) {
            this.cambiarNivelRenderizado(nivelAnterior, this.nivelActual);
            this.actualizarIndicadorVisual(zoomActual);
            console.log(`🔍 Zoom nivel cambiado: ${nivelAnterior} → ${this.nivelActual} (zoom: ${zoomActual})`);
        } else {
            // Solo actualizar el zoom en el indicador
            this.actualizarIndicadorVisual(zoomActual);
        }
    }

    cambiarNivelRenderizado(nivelAnterior, nivelNuevo) {
        // Ocultar nivel anterior
        this.ocultarNivel(nivelAnterior);
        
        // Mostrar nivel nuevo
        this.mostrarNivel(nivelNuevo);
        
        // Emitir evento para otros sistemas
        document.dispatchEvent(new CustomEvent('cambioNivelZoom', {
            detail: { 
                nivelAnterior, 
                nivelNuevo, 
                zoom: this.mapa.getZoom() 
            }
        }));
    }

    ocultarNivel(nivel) {
        switch(nivel) {
            case 'estrategico':
                this.capasRenderizado.estandartes.clearLayers();
                break;
            case 'tactico':
                this.capasRenderizado.unidades.clearLayers();
                break;
            case 'operacional':
                this.capasRenderizado.elementos3d.clearLayers();
                break;
        }
    }

    mostrarNivel(nivel) {
        switch(nivel) {
            case 'estrategico':
                this.renderizarEstandartes();
                break;
            case 'tactico':
                this.renderizarUnidades();
                break;
            case 'operacional':
                this.renderizarElementos3D();
                break;
        }
    }

    // NIVEL ESTRATÉGICO: Estandartes y símbolos grandes
    renderizarEstandartes() {
        this.elementos.forEach((elemento, id) => {
            if (elemento.tipo === 'unidad' || elemento.tipo === 'formacion') {
                const estandarte = this.crearEstandarte(elemento);
                this.capasRenderizado.estandartes.addLayer(estandarte);
            }
        });
    }

    crearEstandarte(elemento) {
        const icono = L.divIcon({
            className: 'estandarte-militar',
            html: `
                <div class="estandarte-contenedor">
                    <div class="bandera ${elemento.bando || 'azul'}">
                        <i class="fas fa-flag"></i>
                    </div>
                    <div class="nombre-unidad">${elemento.nombre}</div>
                    <div class="fuerza-numerica">${elemento.efectivos || '???'}</div>
                </div>
            `,
            iconSize: [60, 80],
            iconAnchor: [30, 70]
        });

        const marker = L.marker(elemento.posicion, { icon: icono });
        
        // Evento click para mostrar información
        marker.on('click', () => {
            if (window.panelUnificado) {
                window.panelUnificado.seleccionarElemento(elemento);
            }
        });

        return marker;
    }

    // NIVEL TÁCTICO: Unidades con iconografía detallada
    renderizarUnidades() {
        this.elementos.forEach((elemento, id) => {
            const unidad = this.crearUnidad(elemento);
            this.capasRenderizado.unidades.addLayer(unidad);
        });
    }

    crearUnidad(elemento) {
        const tipoIcono = this.getIconoTactico(elemento.tipo);
        
        const icono = L.divIcon({
            className: 'unidad-tactica',
            html: `
                <div class="unidad-contenedor ${elemento.estado || 'operacional'}">
                    <div class="icono-unidad">
                        <i class="fas fa-${tipoIcono}"></i>
                    </div>
                    <div class="barra-estado">
                        <div class="barra-vida" style="width: ${100 - (elemento.daños || 0)}%"></div>
                    </div>
                    <div class="etiqueta-unidad">${elemento.nombre?.substring(0, 8) || 'U-???'}</div>
                </div>
            `,
            iconSize: [40, 50],
            iconAnchor: [20, 45]
        });

        const marker = L.marker(elemento.posicion, { icon: icono });
        
        marker.on('click', () => {
            if (window.panelUnificado) {
                window.panelUnificado.seleccionarElemento(elemento);
            }
        });

        return marker;
    }

    // NIVEL OPERACIONAL: Elementos 3D individuales
    renderizarElementos3D() {
        this.elementos.forEach((elemento, id) => {
            const elemento3d = this.crearElemento3D(elemento);
            this.capasRenderizado.elementos3d.addLayer(elemento3d);
        });
    }

    crearElemento3D(elemento) {
        const tipoIcono = this.getIconoOperacional(elemento.tipo);
        
        const icono = L.divIcon({
            className: 'elemento-3d',
            html: `
                <div class="modelo-3d ${elemento.tipo} ${elemento.estado || 'operacional'}">
                    <div class="sombra-elemento"></div>
                    <div class="modelo">
                        <i class="fas fa-${tipoIcono}"></i>
                    </div>
                    <div class="indicadores">
                        ${elemento.combustible < 20 ? '<div class="alerta combustible"><i class="fas fa-gas-pump"></i></div>' : ''}
                        ${elemento.municion < 20 ? '<div class="alerta municion"><i class="fas fa-bomb"></i></div>' : ''}
                        ${elemento.daños > 50 ? '<div class="alerta daños"><i class="fas fa-wrench"></i></div>' : ''}
                    </div>
                </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 28]
        });

        const marker = L.marker(elemento.posicion, { icon: icono });
        
        marker.on('click', () => {
            if (window.panelUnificado) {
                window.panelUnificado.seleccionarElemento(elemento);
            }
        });

        return marker;
    }

    // Métodos utilitarios
    getIconoTactico(tipo) {
        const iconos = {
            'tanque': 'tank',
            'mecanizado': 'truck-military', 
            'artilleria': 'cannon',
            'infanteria': 'running',
            'comando': 'star',
            'apoyo': 'medkit',
            'helicoptero': 'helicopter',
            'avion': 'plane'
        };
        return iconos[tipo?.toLowerCase()] || 'square';
    }

    getIconoOperacional(tipo) {
        return this.getIconoTactico(tipo); // Mismos iconos pero más detallados
    }

    // API pública
    agregarElemento(id, elemento) {
        this.elementos.set(id, elemento);
        this.actualizarNivelZoom(); // Refrescar renderizado
    }

    removerElemento(id) {
        this.elementos.delete(id);
        this.actualizarNivelZoom(); // Refrescar renderizado
    }

    actualizarElemento(id, propiedades) {
        if (this.elementos.has(id)) {
            Object.assign(this.elementos.get(id), propiedades);
            this.actualizarNivelZoom(); // Refrescar renderizado
        }
    }

    obtenerNivelActual() {
        return this.nivelActual;
    }

    actualizarIndicadorVisual(zoom) {
        const indicador = document.getElementById('indicadorNivelZoom');
        if (!indicador) return;
        
        // Actualizar clases CSS
        indicador.className = `indicador-nivel-zoom ${this.nivelActual}`;
        
        // Actualizar textos
        const textoNivel = indicador.querySelector('.nivel-texto');
        const textoZoom = indicador.querySelector('.nivel-zoom');
        
        if (textoNivel) {
            textoNivel.textContent = this.nivelActual.toUpperCase();
        }
        
        if (textoZoom) {
            textoZoom.textContent = `Zoom: ${zoom}`;
        }
    }

    forzarNivel(nivel) {
        if (this.niveles[nivel]) {
            const rango = this.niveles[nivel];
            const zoomTarget = Math.floor((rango.min + rango.max) / 2);
            this.mapa.setZoom(zoomTarget);
        }
    }
}

// Instancia global
let sistemaZoom;

// Función de inicialización
window.inicializarSistemaZoom = (mapa) => {
    sistemaZoom = new SistemaZoomMultiNivel(mapa);
    window.sistemaZoom = sistemaZoom;
    return sistemaZoom;
};

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SistemaZoomMultiNivel;
}
