

// Contenido completo del archivo gestorMapa.js ajustado para depender de mapa inicializado
class GestorMapa extends GestorBase {
    constructor() {
        super();
            // Verificar que el mapa global existe
            if (!window.mapa) {
                throw new Error('El mapa debe estar inicializado antes de usar GestorMapa');
            }
            this.mapa = window.mapa;
            this.calcoGlobal = null;
            this.calcoActivo = null;
            this.hexGrid = null;
            this.emisorEventos = new EventEmitter();
        }
    
        async inicializar(config) {
            console.log('Inicializando GestorMapa...');
            
            try {
                // Crear calco global
                this.crearCalcoGlobal();
                
                // Inicializar HexGrid
                await this.inicializarHexGrid();
    
                console.log('GestorMapa inicializado correctamente');
                return true;
            } catch (error) {
                console.error('Error al inicializar GestorMapa:', error);
                throw error;
            }
        }
    
        async inicializarHexGrid() {
            return new Promise((resolve, reject) => {
                try {
                    console.log('Generando grid hexagonal...');
                    if (!window.HexGrid) {
                        throw new Error('Módulo HexGrid no encontrado');
                    }
                    // Verificar si la hexgrid ya fue inicializada
                    if (window.hexGridInitialized) {
                        console.warn('HexGrid ya está inicializada.');
                        return resolve();
                    }
        
                    // Código de inicialización del hexgrid
                    window.HexGrid.initialize(this.mapa);
                    window.hexGridInitialized = true;
        
                    console.log('Grid hexagonal inicializado correctamente');
                    resolve();
                } catch (error) {
                    console.error('Error al generar hexágonos:', error);
                    reject(error);
                }
            });
        }
    
        configurarEventosMapa() {
            this.mapa.on('dblclick contextmenu', (e) => {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                this.gestorJuego?.gestorAcciones?.mostrarMenuContextual(e);
            });
        
            this.mapa.on('click', (e) => {
                if (this.dibujandoSector || this.dibujandoZona) {
                    this.gestorJuego?.gestorFases?.manejarClickMapa(e);
                }
            });
        }

        configurarEventosMapa() {
    this.mapa.on('dblclick contextmenu', (e) => {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        this.gestorJuego?.gestorAcciones?.mostrarMenuContextual(e);
    });

    this.mapa.on('click', (e) => {
        if (this.dibujandoSector || this.dibujandoZona) {
            this.gestorJuego?.gestorFases?.manejarClickMapa(e);
        }
    });
}
    crearCalcoGlobal() {
        this.calcoGlobal = L.layerGroup().addTo(this.mapa);
        this.calcoActivo = this.calcoGlobal;
        window.calcoGlobal = this.calcoGlobal;
        window.calcoActivo = this.calcoActivo;
    }

    // En GestorMapa.js
    async inicializarHexGrid() {
        try {
            console.log('Generando grid hexagonal...');
            if (!window.HexGrid) {
                throw new Error('Módulo HexGrid no encontrado');
            }
            // Verificar si la hexgrid ya fue inicializada
            if (window.hexGridInitialized) {
                console.warn('HexGrid ya está inicializada.');
                return;
            }

            // Corrección del método initialize
            window.HexGrid.initialize(this.mapa);  // Cambio de initalize a initialize
            window.hexGridInitialized = true;

            console.log('Grid hexagonal inicializado correctamente');

        } catch (error) {
            console.error('Error al inicializar HexGrid:', error);
            // No lanzamos el error para permitir que la aplicación continúe
            console.warn('Continuando sin HexGrid...');
        }
    }

    getHexagonoEn(latlng) {
        if (!this.hexGrid) {
            console.warn('HexGrid no inicializada');
            return null;
        }
        return this.hexGrid.getHexagonAt(latlng);
    }

    marcarHexagono(hexagono, estilo) {
        if (!hexagono) return;
        hexagono.setStyle(estilo || {
            color: '#ff4444',
            weight: 2,
            opacity: 0.8,
            fillColor: '#ff4444',
            fillOpacity: 0.3
        });
    }

    limpiarMarcadoHexagono(hexagono) {
        if (!hexagono) return;
        hexagono.setStyle({
            color: '#3388ff',
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0
        });
    }

    destruir() {
        this.mapa.off();

        if (this.calcoGlobal) {
            this.calcoGlobal.clearLayers();
        }

        if (this.herramientasDibujo) {
            this.mapa.removeControl(this.herramientasDibujo);
        }

        if (this.hexGrid) {
            this.hexGrid.clear();
        }

        window.calcoGlobal = null;
        window.calcoActivo = null;
    }
}

window.GestorMapa = GestorMapa;

