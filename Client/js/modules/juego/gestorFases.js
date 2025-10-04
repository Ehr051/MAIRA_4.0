// Agregar estas constantes al inicio de GestorFases
const ESTILOS_DIBUJO = {
    sector: {
        stroke: true,
        color: '#ff7800',
        weight: 2,
        opacity: 0.8,
        fill: true,
        fillColor: '#ff7800',
        fillOpacity: 0.2,
        clickable: true
    },
    zonaRoja: {
        stroke: true,
        color: '#ff0000',
        weight: 2,
        opacity: 0.8,
        fill: true,
        fillColor: '#ff0000',
        fillOpacity: 0.2,
        clickable: true
    },
    zonaAzul: {
        stroke: true,
        color: '#0000ff',
        weight: 2,
        opacity: 0.8,
        fill: true,
        fillColor: '#0000ff',
        fillOpacity: 0.2,
        clickable: true
    }
};

// Modificar el método inicializarHerramientasDibujo


class GestorFases extends GestorBase {
    constructor() {
        super();
        this.fase = 'preparacion';
        this.subfase = 'definicion_sector';
        this.sectorDefinido = false;
        this.zonasDespliegue = {
            azul: null,
            rojo: null
        };
        this.herramientasDibujo = {};
        this.sectorTemporal = null;
        this.sectorConfirmado = false;
        this.zonaPendiente = null;
        this.dibujandoZona = null;
        this.jugadores = [];
        this.director = null;
        this.esDirectorTemporal = false;
        this.primerJugador = null;
        this.zonasLayers = {}; // Añadido para manejar las capas de zonas
        this.zonasDefinidas = {};
        this.zonasDespliegue = {};
        this.zonasLayers = {};
        this.elementosVisibles = {
            sector: null,
            zonaRoja: null,
            zonaAzul: null
        };

        // Inicializar herramientas de dibujo cuando el mapa esté listo
        this.inicializarHerramientasCuandoMapaListo();
    }

    /**
     * Inicializa las herramientas de dibujo cuando el mapa esté disponible
     */
    inicializarHerramientasCuandoMapaListo() {
        // Esperar a que el mapa esté disponible
        const intentarInicializar = () => {
            if (window.mapa && window.calcoActivo) {
                this.inicializarHerramientasDibujo();
                this.configurarEventos();
                console.log('✅ Herramientas de dibujo inicializadas automáticamente');
            } else {
                // Reintentar en 500ms
                setTimeout(intentarInicializar, 500);
            }
        };

        // Iniciar el proceso de inicialización
        setTimeout(intentarInicializar, 1000);
    }

    // Función auxiliar para obtener el jugador propietario correcto
    obtenerJugadorPropietario() {
        if (window.gestorTurnos && window.gestorTurnos.obtenerJugadorPropietario) {
            return window.gestorTurnos.obtenerJugadorPropietario();
        }
        return window.userId;
    }

    // Función auxiliar para emitir eventos al servidor solo en modo online
    emitirEventoServidor(evento, datos) {
        if (this.gestorJuego?.gestorComunicacion?.socket?.connected) {
            this.gestorJuego.gestorComunicacion.socket.emit(evento, datos);
            return true;
        } else {
            console.log(`🎮 Modo local: omitiendo evento ${evento} al servidor`);
            return false;
        }
    }

    
    // Métodos auxiliares para el manejo de eventos remotos
    enviarEstadoActual() {
        const estado = {
            fase: this.fase,
            subfase: this.subfase,
            sectorConfirmado: this.sectorConfirmado,
            sector: this.sectorLayer ? {
                bounds: this.sectorJuego.toBBoxString(),
                coordenadas: this.sectorLayer.getLatLngs()
            } : null,
            zonas: Object.fromEntries(
                Object.entries(this.zonasLayers).map(([equipo, layer]) => [
                    equipo,
                    layer ? {
                        coordenadas: layer.getLatLngs(),
                        bounds: layer.getBounds()
                    } : null
                ])
            ),
            jugadores: this.jugadores,
            timestamp: new Date().toISOString()
        };
    
        this.gestorJuego?.gestorComunicacion?.socket.emit('estadoActual', {
            estado,
            partidaCodigo: window.codigoPartida,
            jugadorId: window.userId
        });
    }
    

    
    // En gestorFases.js
    actualizarSectorRemoto(datos) {
        console.log('[FASES] Inicio actualizarSectorRemoto:', datos);
    
        try {
            // 1. Validaciones
            if (!window.calcoActivo) {
                console.error('[FASES] calcoActivo no disponible');
                return false;
            }
    
            if (!datos.coordenadas) {
                console.error('[FASES] Datos de coordenadas no válidos:', datos);
                return false;
            }
    
            // 2. Limpiar sector existente
            if (this.sectorLayer) {
                window.calcoActivo.removeLayer(this.sectorLayer);
                this.sectorLayer = null;
            }
    
            // 3. Crear y configurar nuevo sector
            this.sectorLayer = L.polygon(datos.coordenadas, ESTILOS_DIBUJO.sector);
            this.sectorLayer.addTo(window.calcoActivo);
            
            // 4. Actualizar estado
            this.sectorJuego = this.sectorLayer.getBounds();
            this.sectorDefinido = true;
            this.sectorConfirmado = true;
            this.sectorTemporal = null;
            this.dibujandoSector = false;
    
            // 5. Zoom al sector
            window.mapa.flyToBounds(this.sectorJuego, {
                padding: [50, 50],
                duration: 0.5
            });
    
            console.log('[FASES] Sector actualizado correctamente');
            return true;
    
        } catch (error) {
            console.error('[FASES] Error crítico actualizando sector:', error);
            return false;
        }
    }
    
        actualizarZonaRemota(zonaData) {
        const equipo = zonaData.equipo;
        if (!equipo) {
            console.error('[GestorFases] Error: Zona sin equipo definido');
            return false;
        }
    
        try {
            // Limpiar zona anterior si existe
            if (this.zonasLayers[equipo]) {
                window.calcoActivo.removeLayer(this.zonasLayers[equipo]);
                this.zonasLayers[equipo] = null;
            }
    
            // Crear nueva zona
            const estiloZona = {
                color: equipo === 'azul' ? '#0000ff' : '#ff0000',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.2,
                ...zonaData.estilo
            };
    
            // Crear polígono y agregarlo al mapa
            this.zonasLayers[equipo] = L.polygon(zonaData.coordenadas, estiloZona);
            
            // Actualizar estado
            this.zonasDefinidas[equipo] = true;
            this.zonasDespliegue[equipo] = zonaData.bounds;
    
            // Controlar visibilidad según roles - AQUÍ ESTÁ EL ERROR
            const esDirector = this.esDirector(window.userId);
            const esMiEquipo = window.equipoJugador === equipo;
    
            // Siempre mostrar la zona, con diferente opacidad según permisos
            this.zonasLayers[equipo].addTo(window.calcoActivo);
            if (esDirector || esMiEquipo) {
                this.zonasLayers[equipo].setStyle({ opacity: 1, fillOpacity: 0.2 });
            } else {
                this.zonasLayers[equipo].setStyle({ opacity: 0.5, fillOpacity: 0.1 });
            }
    
            console.log(`[GestorFases] Zona ${equipo} actualizada. Director: ${esDirector}, MiEquipo: ${esMiEquipo}`);
            
            return true;
        } catch (error) {
            console.error('[GestorFases] Error actualizando zona remota:', error);
            return false;
        }
    }

    habilitarZonaAzul() {
        // Limpiar botones anteriores
        this.limpiarInterfazAnterior();
        
        this.mostrarMensajeAyuda('Zona roja confirmada. Ahora puede definirse la zona azul.');
        this.actualizarBotonesFase();
    }
    
    actualizarEstadoCompleto(datos) {
        const estado = datos.estado;
        
        // Actualizar fase y subfase
        this.fase = estado.fase;
        this.subfase = estado.subfase;
        
        // Actualizar sector si existe
        if (estado.sector) {
            this.actualizarSectorRemoto(estado.sector);
        }
        
        // Actualizar zonas si existen
        if (estado.zonas) {
            Object.entries(estado.zonas).forEach(([equipo, zonaData]) => {
                if (zonaData) {
                    this.actualizarZonaRemota({ equipo, ...zonaData });
                }
            });
        }
        
        // Actualizar estado de jugadores
        this.jugadores = estado.jugadores;
        
        // Actualizar interfaz
        this.actualizarInterfazFase({
            nuevaFase: estado.fase,
            nuevaSubfase: estado.subfase,
            timestamp: estado.timestamp
        });
    }

    // Métodos de inicialización y configuración
    async inicializar(config) {
        try {
            console.log('Inicializando GestorFases con config:', config);
            
            // Validar configuración
            this.validarConfiguracion(config);
            this.config = config; // Guardar configuración para usarla en otras funciones
            this.jugadores = config.jugadores;
            this.gestorJuego = config.gestorJuego;
            
            // Establecer director desde configuración si está disponible
            if (config.director) {
                this.director = config.director;
                this.esDirectorTemporal = false;
                console.log('👑 Director establecido desde configuración:', this.director);
            } else {
                // Determinar director automáticamente
                this.establecerDirector();
            }
            
            await this.inicializarHerramientasDibujo();
            this.configurarEventos();
            
            // Crear interfaz inicial
            this.crearInterfazFases();
            
            // Iniciar en fase de preparación
            this.cambiarFase('preparacion', 'definicion_sector');
            
            this.configurarEventosSocket();
            return true;
        } catch (error) {
            console.error('Error en inicialización de GestorFases:', error);
            return false;
        }
    }

    // Métodos de gestión de jugadores
    obtenerJugadorActual() {
        if (!window.userId) return null;
        return this.jugadores.find(j => j.id === window.userId);
    }

    esDirector(jugadorId) {
        return (this.director && this.director.id === jugadorId) ||
               (this.esDirectorTemporal && this.primerJugador && this.primerJugador.id === jugadorId);
    }


    async inicializarHerramientasDibujo() {
        if (!window.mapa) {
            throw new Error('Mapa no inicializado');
        }
    
        try {
            this.herramientasDibujo = {
                sector: new L.Draw.Polygon(window.mapa, {
                    showArea: true,
                    shapeOptions: ESTILOS_DIBUJO.sector
                }),
                zonaRoja: new L.Draw.Polygon(window.mapa, {
                    showArea: true,
                    shapeOptions: ESTILOS_DIBUJO.zonaRoja
                }),
                zonaAzul: new L.Draw.Polygon(window.mapa, {
                    showArea: true,
                    shapeOptions: ESTILOS_DIBUJO.zonaAzul
                })
            };
    
            

            // Asegurarse de que los estilos se apliquen al crear
            window.mapa.on(L.Draw.Event.CREATED, (e) => {
                const tipo = this.dibujandoSector ? 'sector' : 
                            this.dibujandoZona === 'rojo' ? 'zonaRoja' : 'zonaAzul';
                e.layer.setStyle(ESTILOS_DIBUJO[tipo]);
            });
    
            console.log('Herramientas de dibujo inicializadas');
        } catch (error) {
            console.error('Error al inicializar herramientas de dibujo:', error);
            throw error;
        }
    }

    /**
     * Maneja clicks normales en el mapa para mostrar menú radial
     */
    manejarClickMapa(e) {
        console.log('🎯 Click en mapa detectado:', e.latlng);

        try {
            // Si MiRadial está disponible, mostrar menú radial
            if (window.MiRadial && typeof window.MiRadial.mostrarMenu === 'function') {
                const point = window.mapa.latLngToContainerPoint(e.latlng);
                window.MiRadial.mostrarMenu(point.x, point.y, 'mapa', e.latlng);
                console.log('📋 Menú radial mostrado en posición:', point);
                return;
            }

            // Si no hay MiRadial, intentar mostrar info básica del hexágono
            if (window.HexGrid) {
                const hexagono = window.HexGrid.getHexagonAt(e.latlng);
                if (hexagono) {
                    console.log('🔸 Hexágono clickeado:', hexagono);
                    // Aquí podríamos mostrar info del hexágono o marcarlo
                    if (window.HexGrid.selectHexagon) {
                        window.HexGrid.selectHexagon(hexagono.key, hexagono.polygon);
                    }
                } else {
                    console.log('📍 Click en posición sin hexágono:', e.latlng);
                }
            }

        } catch (error) {
            console.error('❌ Error manejando click en mapa:', error);
        }
    }

    finalizarDefinicionZonas() {
        console.log('[GestorFases] Finalizando definición de zonas');
        
        // 1. Limpiar interfaz
        const botonesConfirmacion = document.querySelectorAll('.botones-confirmacion-zona, .botones-confirmacion-sector');
        botonesConfirmacion.forEach(elem => elem.remove());
    
        const panelFases = document.getElementById('panel-fases');
        if (panelFases) {
            panelFases.innerHTML = '';
        }
    
        // 2. Cambiar fase localmente
        this.cambiarFase('preparacion', 'despliegue');
    
        // 3. Emitir evento al servidor
        if (this.gestorJuego?.gestorComunicacion) {
            this.gestorJuego.gestorComunicacion.socket.emit('inicioDespliegue', {
                jugadorId: window.userId,
                zonasConfirmadas: this.zonasConfirmadas
            });
        }
    
        // 4. Actualizar interfaz
        this.actualizarInterfazDespliegue();
        // Actualizar interfaz
        this.actualizarBotonesFase();
    }
    
    

// Añadir método para debug que podemos llamar para verificar emisiones
verificarSincronizacion() {
    const estado = {
        fase: this.fase,
        subfase: this.subfase,
        sectorConfirmado: this.sectorConfirmado,
        zonasDefinidas: Object.keys(this.zonasDespliegue).filter(k => this.zonasDespliegue[k]),
        sectorVisible: !!this.sectorLayer,
        socket: !!this.gestorJuego?.gestorComunicacion?.socket?.connected
    };
    console.log('Estado sincronización:', estado);
}
limpiarInterfazAnterior() {
    // Limpiar paneles de confirmación
    const confirmaciones = document.querySelectorAll(
        '.botones-confirmacion-zona, .botones-confirmacion-sector'
    );
    confirmaciones.forEach(elem => elem.remove());

    // Limpiar panel de control de fases
    const panelFases = document.getElementById('panel-fases');
    if (panelFases) {
        panelFases.innerHTML = '';
    }

    // Deshabilitar herramientas de dibujo
    Object.values(this.herramientasDibujo).forEach(herramienta => {
        if (herramienta?.disable) {
            herramienta.disable();
        }
    });
}
    establecerDirector() {
        this.director = this.jugadores.find(j => j.rol === 'director');
        this.esDirectorTemporal = !this.director;
        
        if (this.esDirectorTemporal) {
            // En modo local, el director temporal es siempre el primer jugador
            if (this.config && this.config.modoJuego === 'local') {
                this.primerJugador = this.jugadores[0];
            } else {
                // En modo online, preferir el equipo azul
                this.primerJugador = this.jugadores.find(j => j.equipo === 'azul') || this.jugadores[0];
            }
            
            if (this.primerJugador) {
                this.primerJugador.rolTemporal = 'director';
                console.log('Director temporal establecido:', this.primerJugador);
            }
        }
    }

    puedeDefinirSector(jugadorId) {
        return this.esDirector(jugadorId) && 
               this.fase === 'preparacion' && 
               this.subfase === 'definicion_sector';
    }

    puedeDefinirZonas(jugadorId) {
        return this.esDirector(jugadorId) && 
               this.fase === 'preparacion' && 
               this.subfase === 'definicion_zonas' &&
               this.sectorConfirmado;
    }

    // Métodos de interfaz y mensajes
    mostrarMensajeAyuda(mensaje) {
        if (this.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
            this.gestorJuego.gestorInterfaz.mostrarMensaje(mensaje);
        } else {
            console.log('Mensaje de ayuda:', mensaje);
        }
    }

    // Métodos de manejo de dibujo y herramientas
    async inicializarHerramientasDibujo() {
        if (!window.mapa) {
            throw new Error('Mapa no inicializado');
        }

        try {
            this.herramientasDibujo = {
                sector: new L.Draw.Polygon(window.mapa, {
                    showArea: true,
                    shapeOptions: {
                        stroke: true,
                        color: '#ff7800',
                        weight: 2,
                        opacity: 0.8,
                        fill: false,
                        clickable: true,
                        editable: true
                    }
                }),
                zonaRoja: new L.Draw.Polygon(window.mapa, {
                    showArea: true,
                    shapeOptions: {
                        stroke: true,
                        color: '#ff0000',
                        weight: 2,
                        opacity: 0.8,
                        fill: true,
                        fillColor: '#ff0000',
                        fillOpacity: 0.1,
                        clickable: true
                    }
                }),
                zonaAzul: new L.Draw.Polygon(window.mapa, {
                    showArea: true,
                    shapeOptions: {
                        stroke: true,
                        color: '#0000ff',
                        weight: 2,
                        opacity: 0.8,
                        fill: true,
                        fillColor: '#0000ff',
                        fillOpacity: 0.1,
                        clickable: true
                    }
                })
            };

            console.log('Herramientas de dibujo inicializadas');
        } catch (error) {
            console.error('Error al inicializar herramientas de dibujo:', error);
            throw error;
        }
    }

    configurarEventos() {
        if (window.mapa) {
            window.mapa.on(L.Draw.Event.CREATED, this.manejarDibujoCreado.bind(this));
            window.mapa.on(L.Draw.Event.DRAWSTART, this.manejarInicioDibujo.bind(this));
            window.mapa.on(L.Draw.Event.DRAWSTOP, this.manejarFinDibujo.bind(this));
        }
    }

    

    manejarInicioDibujo(e) {
        const mensaje = this.dibujandoSector ? 
            'Dibujando sector de juego...' :
            `Dibujando zona de despliegue ${this.dibujandoZona}...`;
        this.mostrarMensajeAyuda(mensaje);
    }

    // Métodos de manejo de hexágonos
    desactivarHexagonosInteractivos() {
        // Remover la clase hex-interactive de todos los hexágonos
        const hexagons = document.querySelectorAll('.hex-cell');
        hexagons.forEach(hex => {
            hex.classList.remove('hex-interactive');
        });
        console.log('🔸 Hexágonos desactivados para definición de sector/zona');
    }

    reactivarHexagonosInteractivos() {
        // Solo reactivar si estamos en modo de juego que requiere hexágonos interactivos
        if (this.fase === 'combate' || window.modoJuego === 'combate') {
            const hexagons = document.querySelectorAll('.hex-cell');
            hexagons.forEach(hex => {
                hex.classList.add('hex-interactive');
            });
            console.log('🔸 Hexágonos reactivados para modo combate');
        }
    }

    // Métodos de manejo de sector
    iniciarDefinicionSector() {
        if (!this.puedeDefinirSector(window.userId)) {
            this.mostrarMensajeAyuda('No tienes permisos para definir el sector');
            return;
        }

        // Limpiar sector anterior
        if (this.sectorLayer) {
            window.calcoActivo.removeLayer(this.sectorLayer);
            this.sectorLayer = null;
        }

        // Desactivar hexágonos para evitar interferencia con clicks
        this.desactivarHexagonosInteractivos();

        // Activar herramienta de dibujo
        if (this.herramientasDibujo.sector) {
            this.dibujandoSector = true;
            this.dibujandoZona = null;
            this.herramientasDibujo.sector.enable();
            this.mostrarMensajeAyuda('Dibuja un polígono para definir el sector de juego');
        }
    }

iniciarDefinicionZona(equipo) {
    if (!this.sectorConfirmado) {
        this.mostrarMensajeAyuda('Primero debe confirmarse el sector');
        return false;
    }

    if (equipo === 'azul' && !this.zonasDespliegue.rojo) {
        this.mostrarMensajeAyuda('Primero debe definirse la zona roja');
        return false;
    }

    const herramienta = this.herramientasDibujo[equipo === 'rojo' ? 'zonaRoja' : 'zonaAzul'];
    if (!herramienta) return false;

    // Desactivar hexágonos para evitar interferencia con clicks
    this.desactivarHexagonosInteractivos();

    this.zonaPendiente = equipo;
    this.dibujandoZona = equipo;
    herramienta.enable();

    this.mostrarMensajeAyuda(`Dibuja la zona de despliegue para el equipo ${equipo}`);
    return true;
}

procesarDibujoZona(layer) {
    if (this.sectorConfirmado && this.dibujandoZona) {
        console.log('Procesando dibujo de zona:', {
            equipo: this.dibujandoZona,
            layer: layer
        });

        // Verificar que esté dentro del sector
        const zonaBounds = layer.getBounds();
        if (!this.validarZonaEnSector(zonaBounds)) {
            this.mostrarMensajeAyuda('La zona debe estar dentro del sector de juego');
            window.calcoActivo.removeLayer(layer);
            return;
        }

        this.zonaTemporalLayer = layer;
        this.zonaTemporalLayer.addTo(window.calcoActivo);

        // Crear contenedor si no existe
        let contenedor = document.querySelector('.botones-confirmacion-zona');
        if (!contenedor) {
            contenedor = document.createElement('div');
            contenedor.className = 'botones-confirmacion-zona';
            document.getElementById('panel-fases').appendChild(contenedor);
        }

        // Actualizar botones
        contenedor.innerHTML = `
            <button id="btn-confirmar-zona-${this.dibujandoZona}" class="btn btn-success">
                Confirmar Zona ${this.dibujandoZona}
            </button>
            <button id="btn-cancelar-zona" class="btn btn-danger">
                Cancelar
            </button>
        `;

        // Configurar eventos
        document.getElementById(`btn-confirmar-zona-${this.dibujandoZona}`).onclick = () => {
            console.log('Click en confirmar zona:', this.dibujandoZona);
            this.confirmarZona(this.dibujandoZona);
        };

        document.getElementById('btn-cancelar-zona').onclick = () => {
            this.cancelarDibujoZona();
        };

        console.log('Botones de confirmación actualizados para:', this.dibujandoZona);
    }
}

cancelarDibujoZona() {
    if (this.zonaTemporalLayer) {
        window.calcoActivo.removeLayer(this.zonaTemporalLayer);
        this.zonaTemporalLayer = null;
    }
    
    this.dibujandoZona = null;
    
    // Limpiar botones
    const contenedor = document.querySelector('.botones-confirmacion-zona');
    if (contenedor) {
        contenedor.innerHTML = '';
    }
    
    this.actualizarBotonesFase();
}

actualizarBotonesConfirmacionZona(equipo) {
    const contenedor = document.querySelector('.botones-confirmacion-zona');
    if (!contenedor) return;

    contenedor.innerHTML = `
        <button id="btn-confirmar-zona-${equipo}" class="btn btn-success">
            Confirmar Zona ${equipo}
        </button>
        <button id="btn-cancelar-zona" class="btn btn-danger">
            Cancelar
        </button>
    `;

    // Configurar eventos
    document.getElementById(`btn-confirmar-zona-${equipo}`).onclick = () => {
        console.log('Confirmando zona:', {
            equipo,
            zonaTemporalLayer: this.zonaTemporalLayer
        });
        this.confirmarZona(equipo);
    };

    document.getElementById('btn-cancelar-zona').onclick = () => {
        this.cancelarDibujoZona();
    };
}

confirmarZona(equipo) {
    console.log('Confirmando zona:', equipo);
    
    if (!this.zonaTemporalLayer) {
        this.mostrarMensajeAyuda('No hay zona para confirmar');
        return false;
    }

    try {
        // Crear datos de la zona
        const zonaData = {
            tipo: 'zona',
            equipo: equipo,
            coordenadas: this.zonaTemporalLayer.getLatLngs()[0],
            bounds: this.zonaTemporalLayer.getBounds(),
            estilo: equipo === 'azul' ? 
                { color: '#0000ff', weight: 2, opacity: 0.8, fill: true, fillColor: '#0000ff', fillOpacity: 0.2 } :
                { color: '#ff0000', weight: 2, opacity: 0.8, fill: true, fillColor: '#ff0000', fillOpacity: 0.2 }
        };

        console.log('Emitiendo zonaConfirmada con datos:', zonaData);
        
        // Emitir al servidor SOLO en modo online
        this.emitirEventoServidor('zonaConfirmada', {
            zona: zonaData,
            jugadorId: window.userId,
            partidaCodigo: window.codigoPartida,
            cambiarFase: equipo === 'azul'  // Agregar esta flag
        });

        // Actualizar localmente
        this.zonasLayers[equipo] = this.zonaTemporalLayer;
        this.zonasDespliegue[equipo] = zonaData.bounds;
        this.zonaTemporalLayer = null;
        this.dibujandoZona = null;

        // Si es zona azul, finalizar definición de zonas
        if (equipo === 'azul') {
            console.log('Zona azul confirmada, cambiando a fase despliegue');
            this.cambiarFase('preparacion', 'despliegue');
        }
        this.actualizarBotonesFase();
        return true;
    } catch (error) {
        console.error('Error al confirmar zona:', error);
        this.mostrarMensajeAyuda('Error al confirmar la zona');
        return false;
    }
}

configurarEventosSocket() {
    const socket = this.gestorJuego?.gestorComunicacion?.socket;
    if (!socket) return;

    socket.on('sectorConfirmado', (datos) => {
        console.log('[GestorFases] Sector confirmado recibido:', datos);
        if (datos.jugadorId !== window.userId) {
            this.sectorDefinido = true;
            this.sectorConfirmado = true;
            this.actualizarInterfaz();
        }
    });
    
    socket.on('zonaConfirmada', (datos) => {
        console.log('[GestorFases] Zona confirmada recibida:', datos);
        
        if (datos.jugadorId !== window.userId) {
            this.actualizarZonaRemota(datos.zona);
            // No actualizamos interfaz aquí, se hace en actualizarZonaRemota
        }
    });
    
    socket.on('zonaConfirmada', (datos) => {
        console.log('[GestorFases] Zona confirmada recibida:', datos);
        if (datos.jugadorId !== window.userId) {
            this.actualizarZonaRemota(datos.zona);
        }
        
        // Si es zona azul, cambiar a fase despliegue
        if (datos.zona.equipo === 'azul') {
            console.log('Zona azul confirmada, cambiando a fase despliegue');
            this.cambiarFase('preparacion', 'despliegue');
        }
    });

    socket.on('combateIniciado', (data) => {
        console.log('Recibido evento combateIniciado:', data);
        const partidaCodigo = data.partidaCodigo || data.partida_codigo;
        if (partidaCodigo === window.codigoPartida) {
            console.log('🚀 Combate iniciado - Cambiando a fase combate');
            this.fase = 'combate';
            this.subfase = 'turno';
            this.gestorJuego?.gestorTurnos?.inicializarTurnos();
            this.actualizarBotonesFase();
            
            // Actualizar UI
            if (this.gestorJuego?.gestorInterfaz) {
                this.gestorJuego.gestorInterfaz.actualizarInterfazFase('combate');
            }
        }
    });
}

procesarZonaConfirmada(datos) {
    const esDirector = this.esDirector(window.userId);
    const esEquipoCorrespondiente = datos.zona.equipo === window.equipoJugador;

    if (esDirector || esEquipoCorrespondiente) {
        this.actualizarZonaRemota(datos.zona);
        if (esDirector) {
            if (datos.zona.equipo === 'rojo') {
                this.habilitarZonaAzul();
            } else if (datos.zona.equipo === 'azul') {
                this.finalizarDefinicionZonas();
            }
        }
    }
}


    validarConfiguracion(config) {
        if (!config || !Array.isArray(config.jugadores) || config.jugadores.length === 0) {
            throw new Error("Configuración inválida: La lista de jugadores es obligatoria");
        }
    }

    validarZonaEnSector(bounds) {
        if (!this.sectorJuego) return false;
        return this.sectorJuego.contains(bounds);
    }


    actualizarFaseRemota(datos) {
        if (datos.timestamp <= this.ultimaActualizacion) return;
        
        this.fase = datos.nuevaFase;
        this.subfase = datos.nuevaSubfase;
        this.actualizarInterfazFase(datos);
        this.ultimaActualizacion = datos.timestamp;
    }

    actualizarInterfazFase(datos) {
        // Actualizar estado interno
        this.fase = datos.nuevaFase;
        this.subfase = datos.nuevaSubfase;
    
        // Actualizar mensajes según la fase
        if (!this.esDirector(window.userId)) {
            switch (datos.nuevaFase) {
                case 'preparacion':
                    switch (datos.nuevaSubfase) {
                        case 'definicion_sector':
                            this.gestorJuego.gestorInterfaz.mostrarMensaje(
                                'El director está definiendo el sector de juego'
                            );
                            break;
                        case 'definicion_zonas':
                            this.gestorJuego.gestorInterfaz.mostrarMensaje(
                                'El director está definiendo las zonas de despliegue'
                            );
                            break;
                        case 'despliegue':
                            this.gestorJuego.gestorInterfaz.mostrarMensaje(
                                'Fase de despliegue - Despliega tus unidades en tu zona asignada'
                            );
                            break;
                    }
                    break;
                case 'combate':
                    this.gestorJuego.gestorInterfaz.mostrarMensaje(
                        'Fase de combate iniciada'
                    );
                    break;
            }
        }
    
        // Forzar actualización de interfaz completa
        this.gestorJuego?.gestorInterfaz?.actualizarInterfazCompleta();
    
        // Notificar a otros gestores
        this.emisorEventos.emit('faseCambiada', datos);
    }

// 1. En gestorFases.js - Modificar confirmarSector()
confirmarSector() {
    if (!this.puedeDefinirSector(window.userId)) {
        this.mostrarMensajeAyuda('No tienes permisos para definir el sector');
        return false;
    }

    try {
        if (!this.sectorTemporal && !this.sectorLayer) {
            this.mostrarMensajeAyuda('No hay sector para confirmar');
            return false;
        }

        // 1. Preparar y guardar el sector localmente
        const layerParaConfirmar = this.sectorLayer || this.sectorTemporal;
        this.sectorLayer = layerParaConfirmar;
        this.sectorJuego = this.sectorLayer.getBounds();
        
        // 2. Configurar el sector
        if (this.sectorLayer.editing) {
            this.sectorLayer.editing.disable();
        }
        this.sectorLayer.setStyle({
            color: '#ff7800',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.2,
            interactive: false
        });

        // 3. Actualizar estado local
        this.sectorDefinido = true;
        this.sectorConfirmado = true;
        this.sectorTemporal = null;
        this.dibujandoSector = false;

        // Reactivar hexágonos si es necesario
        this.reactivarHexagonosInteractivos();

        // 4. Emitir al servidor
        if (this.gestorJuego?.gestorComunicacion?.socket) {
            this.gestorJuego.gestorComunicacion.socket.emit('sectorConfirmado', {
                
                coordenadas: this.sectorLayer.getLatLngs(),
                bounds: this.sectorJuego.toBBoxString(),
                jugadorId: window.userId,
                partidaCodigo: window.codigoPartida,
                cambiarFase: true
            });
        }

        // 5. Actualizar interfaz local
        this.cambiarFase('preparacion', 'definicion_zonas');
        this.actualizarBotonesFase();
        
        return true;

    } catch (error) {
        console.error('Error al confirmar sector:', error);
        this.mostrarMensajeAyuda('Error al confirmar el sector');
        return false;
    }
}

// Modificar el manejador de sectorConfirmado
manejarSectorConfirmado(datos) {
    console.log('sectorConfirmado recibido:', datos);
    
    if (datos.jugadorId === window.userId) return;

    try {
        // 1. Actualizar el sector físicamente
        const exito = this.actualizarSectorRemoto(datos);
        if (!exito) return;

        // 2. Si se debe cambiar fase, hacerlo
        if (datos.cambiarFase) {
            // Cambiar fase
            this.cambiarFase('preparacion', 'definicion_zonas');
            
            // Actualizar interfaz
            this.actualizarBotonesFase();
            
            // Actualizar mensaje según rol
            const esDirector = this.esDirector(window.userId);
            const mensaje = esDirector ? 
                'Define la zona de despliegue del equipo rojo' : 
                'El director está definiendo las zonas de despliegue';
            this.mostrarMensajeAyuda(mensaje);
        }
    } catch (error) {
        console.error('Error procesando sectorConfirmado:', error);
    }
}

actualizarBotonesFase() {
    // ⚠️ FUNCIÓN DESACTIVADA - REEMPLAZADA POR SISTEMA DE PANELES UNIFICADO
    console.log('🔧 actualizarBotonesFase() desactivada - usando Sistema de Paneles Unificado');
    
    // Solo logear el estado para debug
    console.log('Estado de fase:', {
        fase: this.fase,
        subfase: this.subfase,
        esDirector: this.esDirector(window.userId),
        sectorConfirmado: this.sectorConfirmado,
        zonasDefinidas: this.zonasDespliegue
    });
    
    // Delegar al Sistema de Paneles Unificado
    if (window.panelJuegoUnificado && window.panelJuegoUnificado.actualizarEstado) {
        window.panelJuegoUnificado.actualizarEstado({
            fase: this.fase,
            subfase: this.subfase,
            esDirector: this.esDirector(window.userId),
            sectorConfirmado: this.sectorConfirmado,
            zonasDefinidas: this.zonasDespliegue
        });
    }
    
    return; // ❌ NO CREAR PANEL OBSOLETO

    // Limpiar panel y listeners anteriores
    const botonesAnteriores = panelFases.querySelectorAll('button');
    botonesAnteriores.forEach(btn => {
        const nuevoBtn = btn.cloneNode(true);
        if (btn.parentNode) {
            btn.parentNode.replaceChild(nuevoBtn, btn);
        }
    });
    panelFases.innerHTML = '';

    // Fase actual
    const faseActual = document.createElement('div');
    faseActual.className = 'fase-actual';
    faseActual.textContent = `Fase: ${this.fase} - ${this.subfase}`;
    panelFases.appendChild(faseActual);

    // Contenedor de botones
    const botonesFase = document.createElement('div');
    botonesFase.className = 'botones-fase';
    
    // Generar contenido según fase
    let contenido = '';
    if (this.fase === 'preparacion') {
        switch (this.subfase) {
            case 'definicion_sector':
                if (esDirector) {
                    contenido = `
                        <button class="btn-control" id="btn-definir-sector" ${this.dibujandoSector ? 'disabled' : ''}>
                            <i class="fas fa-draw-polygon"></i>
                            <span>Definir Sector</span>
                        </button>
                        ${this.sectorTemporal || this.sectorLayer ? 
                            '<button class="btn-control" id="btn-confirmar-sector"><i class="fas fa-check"></i><span>Confirmar Sector</span></button>' : 
                            ''}
                    `;
                } else {
                    contenido = '<div class="estado-fase">El director está definiendo el sector de juego...</div>';
                }
                break;

            case 'definicion_zonas':
                if (esDirector) {
                    contenido = `
                        <button class="btn-control zona-roja" id="btn-zona-roja"
                            ${this.zonasDespliegue.rojo ? 'disabled' : ''}>
                            <i class="fas fa-square" style="color: #f44336;"></i>
                            <span>Definir Zona Roja</span>
                        </button>
                        <button class="btn-control zona-azul" id="btn-zona-azul"
                            ${!this.zonasDespliegue.rojo || this.zonasDespliegue.azul ? 'disabled' : ''}>
                            <i class="fas fa-square" style="color: #2196F3;"></i>
                            <span>Definir Zona Azul</span>
                        </button>
                    `;
                } else {
                    contenido = '<div class="estado-fase">El director está definiendo las zonas de despliegue...</div>';
                }
                break;
            case 'despliegue':
                // ✅ REMOVER BOTÓN DUPLICADO - El botón se maneja en gestorInterfaz
                contenido = '<div class="estado-fase">Fase de despliegue - Tu turno</div>';
                break;
        }
    }

    botonesFase.innerHTML = contenido;
    panelFases.appendChild(botonesFase);

    // Reconfigurar eventos con seguridad adicional
    requestAnimationFrame(() => {
        this.configurarEventosBotones();
    });
}

cambiarFase(fase, subfase) {
    console.log(`Cambiando fase a: ${fase}, subfase: ${subfase}`);
    
    // Limpiar estado anterior
    this.limpiarEstadoFaseAnterior(this.fase, this.subfase);
    
    // Actualizar estado
    this.fase = fase;
    this.subfase = subfase;
    
    // Emitir evento de cambio de fase
    this.emisorEventos.emit('cambioFase', fase, subfase);
    
    // Notificar al gestor de turnos sobre el cambio de fase
    if (this.gestorJuego?.gestorTurnos?.actualizarSegunFase) {
        console.log(`[GestorFases] Notificando cambio de fase a GestorTurnos: ${fase}/${subfase}`);
        this.gestorJuego.gestorTurnos.actualizarSegunFase(fase, subfase);
    }
    
    // Si es fase despliegue, actualizar interfaz específica
    if (subfase === 'despliegue') {
        console.log('Iniciando interfaz de despliegue');
        this.actualizarInterfazDespliegue();
    }
    
    // Actualizar interfaz general
    this.actualizarBotonesFase();
}

actualizarInterfazDespliegue() {
    console.log('Actualizando interfaz despliegue');
    const panelFases = document.getElementById('panel-fases');
    if (!panelFases) return;

    panelFases.innerHTML = `
        <div class="fase-actual">
            <h3>Fase: Preparación - Despliegue</h3>
            <p>Despliega tus unidades en tu zona asignada</p>
        </div>
    `;

    // NO crear botón aquí - se maneja en gestorInterfaz
}

limpiarEstadoFaseAnterior(faseAnterior, subfaseAnterior) {
    // Deshabilitar todas las herramientas de dibujo
    Object.values(this.herramientasDibujo).forEach(herramienta => {
        if (herramienta?.disable) {
            herramienta.disable();
        }
    });

    // Limpiar estado temporal
    if (subfaseAnterior === 'definicion_sector') {
        this.sectorTemporal = null;
        this.dibujandoSector = false;
        // Reactivar hexágonos al cambiar de subfase
        this.reactivarHexagonosInteractivos();
    } else if (subfaseAnterior === 'definicion_zonas') {
        this.zonaTemporalLayer = null;
        this.dibujandoZona = null;
        this.zonaPendiente = null;
        // Reactivar hexágonos al cambiar de subfase de zonas
        this.reactivarHexagonosInteractivos();
    }

    // Limpiar cualquier botón de confirmación existente
    const confirmacionSector = document.querySelector('.botones-confirmacion-sector');
    const confirmacionZona = document.querySelector('.botones-confirmacion-zona');
    if (confirmacionSector) confirmacionSector.remove();
    if (confirmacionZona) confirmacionZona.remove();
}


validarFaseActual() {
    console.log('Estado actual:', {
        fase: this.fase,
        subfase: this.subfase,
        sectorConfirmado: this.sectorConfirmado,
        zonasConfirmadas: Object.keys(this.zonasDespliegue).filter(k => this.zonasDespliegue[k]),
        esDirector: this.esDirector(window.userId)
    });
}

    // Añadir método para debug
    mostrarEstadoActual() {
        console.log('Estado actual de la fase:', {
            fase: this.fase,
            subfase: this.subfase,
            sectorConfirmado: this.sectorConfirmado,
            zonasConfirmadas: this.zonasDespliegue,
            director: this.director?.username,
            timestamp: new Date().toISOString()
        });
    }

    actualizarVisibilidadZonas() {
            const esDirector = this.esDirector(window.userId);
    
            Object.entries(this.zonasLayers).forEach(([equipo, layer]) => {
                if (!layer) return;
    
                // Director ve todas las zonas
                if (esDirector) {
                    layer.setStyle({ opacity: 1, fillOpacity: 0.2 });
                    return;
                }
    
                // Jugadores solo ven su zona
                if (equipo === window.equipoJugador) {
                    layer.setStyle({ opacity: 1, fillOpacity: 0.2 });
                } else {
                    layer.setStyle({ opacity: 0, fillOpacity: 0 });
                }
            });
        }
    

    actualizarInterfaz() {
        this.actualizarBotonesFase();
        console.log('Interfaz actualizada');
        if (this.gestorJuego?.gestorInterfaz) {
            this.gestorJuego.gestorInterfaz.actualizarInterfazCompleta();
        }
    }

    crearInterfazFases() {
        // ⚠️ FUNCIÓN DESACTIVADA - REEMPLAZADA POR SISTEMA DE PANELES UNIFICADO
        console.log('🔧 crearInterfazFases() desactivada - usando Sistema de Paneles Unificado');
        
        // No crear panel obsoleto - el Sistema de Paneles Unificado maneja esto
        return;

        // Agregar estilos
        const estilos = document.createElement('style');
        estilos.textContent = `
            .panel-control {
                position: fixed;
                top: 20px;
                left: 20px;
                background: white;
                padding: 10px;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                z-index: 1000;
            }
            .panel-control button {
                margin: 5px;
                padding: 8px 15px;
                border: none;
                border-radius: 3px;
                background: #2196F3;
                color: white;
                cursor: pointer;
            }
            .panel-control button:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            .fase-actual {
                font-weight: bold;
                margin-bottom: 10px;
            }
            .botones-confirmacion,
            .botones-confirmacion-zona {
                margin-top: 10px;
                display: flex;
                gap: 10px;
            }
            .btn-confirmar {
                background: #4CAF50;
            }
            .btn-cancelar {
                background: #f44336;
            }
        `;
        document.head.appendChild(estilos);

        this.actualizarBotonesFase();
    }


    obtenerBotonesFase(esDirector, jugador) {
        if (this.fase === 'preparacion') {
            switch (this.subfase) {
                case 'definicion_sector':
                    if (esDirector || this.esDirectorTemporal && this.primerJugador?.id === jugador?.id) {
                        return `
                            <button id="btn-definir-sector">Definir Sector</button>
                            ${this.sectorTemporal ? '<button id="btn-confirmar-sector">Confirmar Sector</button>' : ''}
                        `;
                    } else {
                        return `<div class="estado-fase">El director está definiendo el sector de juego...</div>`;
                    }
                    break;
                case 'definicion_zonas':
                    if (esDirector || this.esDirectorTemporal) {
                        return `
                            <button id="btn-zona-roja" ${this.zonasDespliegue.rojo ? 'disabled' : ''}>
                                Definir Zona Roja
                            </button>
                            <button id="btn-zona-azul" ${!this.zonasDespliegue.rojo || this.zonasDespliegue.azul ? 'disabled' : ''}>
                                Definir Zona Azul
                            </button>
                            ${this.zonasDespliegue.azul && this.zonasDespliegue.rojo ? '<button id="btn-iniciar-despliegue">Iniciar Despliegue</button>' : ''}
                        `;
                    }
                    break;
                case 'despliegue':
                    return `
                        <!-- Botón manejado por gestorInterfaz -->
                    `;
            }
        }
        return '';
    }

    configurarEventosBotones() {
        const btnDefinirSector = document.getElementById('btn-definir-sector');
        if (btnDefinirSector) {
            btnDefinirSector.onclick = () => this.iniciarDefinicionSector();
        }

        const btnConfirmarSector = document.getElementById('btn-confirmar-sector');
        if (btnConfirmarSector) {
            btnConfirmarSector.onclick = () => this.confirmarSector();
        }

        const btnZonaRoja = document.getElementById('btn-zona-roja');
        if (btnZonaRoja) {
            btnZonaRoja.onclick = () => {
                console.log('Iniciando definición zona roja');
                this.iniciarDefinicionZona('rojo');
            };
        }

        const btnZonaAzul = document.getElementById('btn-zona-azul');
        if (btnZonaAzul) {
            btnZonaAzul.onclick = () => {
                console.log('Iniciando definición zona azul');
                this.iniciarDefinicionZona('azul');
            };
        }

        const btnIniciarDespliegue = document.getElementById('btn-iniciar-despliegue');
        if (btnIniciarDespliegue) {
            btnIniciarDespliegue.onclick = () => this.iniciarDespliegue();
        }

        // Botón listo manejado por gestorInterfaz
    }

    mostrarBotonFinalizarFase() {
        const container = document.querySelector('.botones-fase');
        if (container && !document.getElementById('btn-finalizar-fase')) {
            const btn = document.createElement('button');
            btn.id = 'btn-finalizar-fase';
            btn.className = 'btn-success';
            btn.textContent = 'Iniciar Fase de Despliegue';
            btn.onclick = () => this.iniciarDespliegue();
            container.appendChild(btn);
        }
    }

    configurarNuevaFase() {
        switch(this.fase) {
            case 'preparacion':
                if (!this.sectorConfirmado && this.subfase === 'definicion_sector') {
                    this.mostrarMensajeAyuda('Define el sector de juego');
                }
                break;
            case 'combate':
                this.iniciarFaseCombate();
                break;
        }
    }
    actualizarBotonesConfirmacionSector() {
        // Primero eliminar botones de confirmación existentes si los hay
        const confirmacionExistente = document.querySelector('.botones-confirmacion-sector');
        if (confirmacionExistente) {
            confirmacionExistente.remove();
        }

        if (!this.sectorTemporal) return;

        const botonesContainer = document.createElement('div');
        botonesContainer.className = 'botones-confirmacion-sector';
        botonesContainer.innerHTML = `
            <div class="mensaje-confirmacion">¿Confirmar este sector?</div>
            <div class="botones">
                <button class="btn-confirmar">Confirmar Sector</button>
                <button class="btn-cancelar">Cancelar</button>
            </div>
        `;

        // Agregar estilos específicos si no existen
        if (!document.getElementById('estilos-confirmacion')) {
            const estilos = document.createElement('style');
            estilos.id = 'estilos-confirmacion';
            estilos.textContent = `
                .botones-confirmacion-sector,
                .botones-confirmacion-zona {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: white;
                    padding: 15px;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    z-index: 1000;
                    text-align: center;
                }
                .mensaje-confirmacion {
                    margin-bottom: 10px;
                    font-weight: bold;
                }
                .botones {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                }
                .btn-confirmar, 
                .btn-cancelar {
                    padding: 8px 15px;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    color: white;
                    font-weight: bold;
                }
                .btn-confirmar {
                    background-color: #4CAF50;
                }
                .btn-confirmar:hover {
                    background-color: #45a049;
                }
                .btn-cancelar {
                    background-color: #f44336;
                }
                .btn-cancelar:hover {
                    background-color: #da190b;
                }
            `;
            document.head.appendChild(estilos);
        }

        // Agregar eventos
        const btnConfirmar = botonesContainer.querySelector('.btn-confirmar');
        const btnCancelar = botonesContainer.querySelector('.btn-cancelar');

        btnConfirmar.addEventListener('click', () => {
            this.confirmarSector();
            botonesContainer.remove();
        });

        btnCancelar.addEventListener('click', () => {
            if (this.sectorTemporal) {
                window.calcoActivo.removeLayer(this.sectorTemporal);
                this.sectorTemporal = null;
            }
            this.dibujandoSector = false;

            // Reactivar hexágonos cuando se cancela la definición
            this.reactivarHexagonosInteractivos();

            botonesContainer.remove();
            // Reactivar el botón de definir sector
            this.actualizarBotonesFase();
        });

        document.body.appendChild(botonesContainer);
    }


// Esta función debe reemplazar la implementación actual en GestorFases
validarElementosJugador(jugadorId) {
    const elementos = this.obtenerElementosJugador(jugadorId);
    
    // Verificar si hay elementos
    if (elementos.length === 0) {
        console.warn(`[GestorFases] No se encontraron elementos para el jugador ${jugadorId}`);
        if (this.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
            this.gestorJuego.gestorInterfaz.mostrarMensaje(
                'Debe desplegar al menos un elemento antes de marcar como listo',
                'warning'
            );
        }
        return false;
    }
    
    // Para diagnóstico, mostrar todos los elementos y sus propiedades
    console.group(`[GestorFases] Detalle de los ${elementos.length} elementos para jugador ${jugadorId}`);
    elementos.forEach((elem, i) => {
        const esEquipo = elem.options?.sidc?.charAt(4) === 'E';
        console.log(`Elemento #${i+1}:`, {
            tipo: elem.options?.tipo || 'no definido',
            designacion: elem.options?.designacion || 'no definido',
            dependencia: elem.options?.dependencia || 'no definido',
            magnitud: elem.options?.magnitud || 'no definido',
            sidc: elem.options?.sidc || 'no definido',
            esEquipo
        });
    });
    console.groupEnd();
    
    // Verificar cada elemento según su tipo
    const elementosIncompletos = elementos.filter(elem => {
        // Si no tiene opciones, está incompleto
        if (!elem.options) return true;
        
        // En modo local, ser más flexible con la validación
        if (this.configuracion?.modoJuego === 'local') {
            // Solo verificar que tenga tipo y sidc
            return !elem.options.tipo || 
                   elem.options.tipo === "desconocido" || 
                   elem.options.tipo === "" ||
                   !elem.options.sidc;
        }
        
        // Para modo online, usar validación completa
        const esEquipo = elem.options.sidc?.charAt(4) === 'E';
        
        // Verificar el tipo - "desconocido" no es válido
        const tipoInvalido = !elem.options.tipo || 
                            elem.options.tipo === "desconocido" || 
                            elem.options.tipo === "";
        
        // Para unidades normales, verificar todos los campos
        if (!esEquipo) {
            return !elem.options.designacion || 
                   !elem.options.dependencia ||
                   tipoInvalido ||
                   !elem.options.magnitud || 
                   elem.options.magnitud === '-';
        } 
        // Para equipos, no verificamos magnitud
        else {
            return !elem.options.designacion || 
                   !elem.options.dependencia ||
                   tipoInvalido;
        }
    });
    
    if (elementosIncompletos.length > 0) {
        console.warn(`[GestorFases] Elementos incompletos encontrados: ${elementosIncompletos.length}`);
        elementosIncompletos.forEach((elem, i) => {
            const esEquipo = elem.options?.sidc?.charAt(4) === 'E';
            console.warn(`Elemento incompleto #${i+1}:`, {
                esEquipo,
                designacion: elem.options?.designacion || 'falta',
                dependencia: elem.options?.dependencia || 'falta',
                tipo: elem.options?.tipo || 'falta',
                magnitud: esEquipo ? 'no aplicable' : (elem.options?.magnitud || 'falta')
            });
        });
        
        if (this.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
            this.gestorJuego.gestorInterfaz.mostrarMensaje(
                'Todos los elementos deben tener los campos requeridos correctamente definidos (tipo, designación, dependencia y magnitud para unidades)',
                'warning'
            );
        }
        return false;
    }
    
    console.log(`[GestorFases] Validación de elementos para jugador ${jugadorId}: true (${elementos.length} elementos)`);
    return true;
}

// Implementación de obtenerElementosJugador si aún no la has añadido
obtenerElementosJugador(jugadorId) {
    const elementos = [];
    
    // Buscar en el calco activo
    if (window.calcoActivo) {
        window.calcoActivo.eachLayer(layer => {
            // Verificar si el layer tiene las propiedades necesarias y pertenece al jugador
            if (layer.options && 
                (layer.options.jugadorId === jugadorId || layer.options.jugador === jugadorId)) {
                elementos.push(layer);
            }
        });
    }
    
    console.log(`[GestorFases] Elementos encontrados para jugador ${jugadorId}: ${elementos.length}`);
    return elementos;
}


    
    actualizarBotonListo() {
            const btnListo = document.getElementById('btn-listo-despliegue');
            if (!btnListo) return;
    
            const elementosValidos = this.validarElementosJugador(window.userId);
            btnListo.disabled = !elementosValidos;
    
            if (!elementosValidos) {
                this.mostrarMensajeAyuda(
                    'Antes de marcar como listo, asegúrese que todos los elementos desplegados tengan:\n' +
                    '- Magnitud (Sección, Compañía, etc)\n' +
                    '- Designación (1ra Sec, 2da Cia, etc)\n' +
                    '- Dependencia (Unidad superior)'
                );
            }
        }
    
        

marcarJugadorListo() {
    try {
        // Validar elementos
        const elementos = this.obtenerElementosJugador(window.userId);
        if (!elementos || elementos.length === 0) {
            this.gestorJuego?.gestorInterfaz?.mostrarMensaje(
                'Debe desplegar al menos un elemento',
                'error'
            );
            return false;
        }

        // Validar datos completos
        const elementosValidos = elementos.every(elem => 
            elem.tipo && 
            elem.magnitud && 
            elem.designacion && 
            elem.dependencia
        );

        if (!elementosValidos) {
            this.gestorJuego?.gestorInterfaz?.mostrarMensaje(
                'Complete todos los datos de los elementos',
                'error'
            );
            return false;
        }

        // Marcar jugador como listo
        const jugadorActual = this.jugadores.find(j => j.id === window.userId);
        if (jugadorActual) {
            jugadorActual.listo = true;
            console.log(`[GestorFases] Jugador ${window.userId} marcado como listo`);
        }

        // En modo local, emitir evento pero no al servidor
        this.emitirEventoServidor('jugadorListo', {
            jugadorId: window.userId,
            partidaCodigo: window.codigoPartida,
            elementos: elementos
        });

        // Verificar si todos están listos o si estamos en modo local
        if (this.gestorJuego?.configuracion?.modoJuego === 'local' || this.todosJugadoresListos()) {
            console.log('[GestorFases] Condiciones cumplidas para iniciar combate');
            // Pequeño delay para que se actualice la interfaz
            setTimeout(() => {
                this.iniciarFaseCombate();
            }, 500);
        }

        return true;
    } catch (error) {
        console.error('[GestorFases] Error al marcar jugador listo:', error);
        return false;
    }
}

// Método simplificado para verificar si todos los jugadores están listos
todosJugadoresListos() {
    const resultado = this.jugadores.every(j => j.listo === true);
    console.log('[GestorFases] Todos los jugadores listos:', resultado);
    return resultado;
}

    iniciarFaseCombate() {
        console.log('Iniciando fase de combate');
        
        // En modo local, no verificar todos los jugadores
        if (this.gestorJuego?.configuracion?.modoJuego !== 'local' && !this.todosJugadoresListos()) {
            console.warn('No todos los jugadores están listos');
            return;
        }

        // Emitir al servidor (solo en modo online)
        this.emitirEventoServidor('iniciarCombate', {
            partidaCodigo: window.codigoPartida,
            timestamp: new Date().toISOString()
        });

        // Cambiar fase localmente
        this.fase = 'combate';
        this.subfase = 'turno';
        
        console.log('[GestorFases] Cambiando a fase combate e inicializando turnos');
        
        // Inicializar sistema de turnos
        this.gestorJuego?.gestorTurnos?.inicializarTurnos();
        
        // Actualizar interfaz de combate
        this.actualizarInterfazCombate();
        
        // Actualizar interfaz
        this.actualizarBotonesFase();
    }


    iniciarDespliegue() {
            if (!this.zonasDespliegue.azul || !this.zonasDespliegue.rojo) {
                this.mostrarMensajeAyuda('Deben definirse ambas zonas antes de iniciar el despliegue');
                return false;
            }

            this.subfase = 'despliegue';
            this.actualizarInterfazCompleta();
            this.mostrarMensajeAyuda('Fase de despliegue iniciada');

            return true;
        }

    actualizarPermisosSegunFase(datos) {
            const { nuevaFase, nuevaSubfase } = datos;
            const jugadorActual = this.obtenerJugadorActual();
            
            if (!jugadorActual) return;
            
            switch (nuevaFase) {
                case 'preparacion':
                    switch (nuevaSubfase) {
                        case 'definicion_sector':
                            this.mostrarMensajeEstadoSegunRol(jugadorActual);
                            this.actualizarVisibilidadElementos('sector');
                            break;
                        case 'definicion_zonas':
                            this.mostrarMensajeEstadoSegunRol(jugadorActual);
                            this.actualizarVisibilidadElementos('zonas');
                            break;
                        case 'despliegue':
                            this.actualizarVisibilidadElementos('despliegue');
                            break;
                    }
                    break;
                case 'combate':
                    this.actualizarVisibilidadElementos('combate');
                    break;
            }
        }

    mostrarMensajeEstadoSegunRol(jugador) {
            if (this.esDirector(jugador.id) || 
                (this.esDirectorTemporal && this.primerJugador.id === jugador.id)) {
                // El director ve los botones de acción
                return;
            }

            // Los demás jugadores ven mensajes de estado
            let mensaje = '';
            switch (this.subfase) {
                case 'definicion_sector':
                    mensaje = 'El director está definiendo el sector de juego...';
                    break;
                case 'definicion_zonas':
                    mensaje = 'El director está definiendo las zonas de despliegue...';
                    break;
            }
            
            if (mensaje) {
                this.mostrarMensajeAyuda(mensaje);
            }
        }

    actualizarVisibilidadElementos(contexto) {
            switch (contexto) {
                case 'sector':
                    if (this.sectorLayer) {
                        // El sector es visible para todos una vez confirmado
                        this.sectorLayer.setStyle({
                            opacity: 1,
                            fillOpacity: 0.2
                        });
                        // Emitir a todos los jugadores
                        this.emitirCambioElemento('sector', this.sectorLayer);
                    }
                    break;
                
                case 'zonas':
                    // Mostrar zonas solo a los equipos correspondientes
                    Object.entries(this.zonasLayers).forEach(([equipo, layer]) => {
                        const esEquipoJugador = this.obtenerJugadorActual()?.equipo === equipo;
                        const esDirector = this.esDirector(window.userId) || this.esDirectorTemporal;
                        
                        if (layer) {
                            if (esEquipoJugador || esDirector) {
                                layer.setStyle({
                                    opacity: 1,
                                    fillOpacity: 0.2
                                });
                            } else {
                                layer.setStyle({
                                    opacity: 0,
                                    fillOpacity: 0
                                });
                            }
                            
                            // Emitir solo al equipo correspondiente
                            this.emitirCambioElemento('zona', layer, equipo);
                        }
                    });
                    break;

                case 'despliegue':
                    // En fase de despliegue, solo mostrar elementos del jugador actual
                    if (window.calcoActivo) {
                        const jugadorActualId = window.gestorTurnos?.obtenerJugadorPropietario?.() || window.userId;
                        
                        window.calcoActivo.eachLayer(layer => {
                            // Solo procesar elementos militares que tienen jugador asignado
                            if (layer.options && (layer.options.jugador || layer.options.jugadorId)) {
                                const propietario = layer.options.jugador || layer.options.jugadorId;
                                
                                if (propietario === jugadorActualId) {
                                    // Elemento del jugador actual: visible y editable
                                    if (layer.setStyle) {
                                        layer.setStyle({ opacity: 1 });
                                    }
                                    layer.options.draggable = true;
                                } else {
                                    // Elemento de otro jugador: semi-transparente y no editable
                                    if (layer.setStyle) {
                                        layer.setStyle({ opacity: 0.3 });
                                    }
                                    layer.options.draggable = false;
                                }
                            }
                        });
                    }
                    break;

                case 'combate':
                    // En combate, todos los elementos son visibles pero solo editables por su propietario
                    if (window.calcoActivo) {
                        const jugadorActualId = window.gestorTurnos?.obtenerJugadorPropietario?.() || window.userId;
                        
                        window.calcoActivo.eachLayer(layer => {
                            if (layer.options && (layer.options.jugador || layer.options.jugadorId)) {
                                // Todos los elementos son visibles
                                if (layer.setStyle) {
                                    layer.setStyle({ opacity: 1 });
                                }
                                
                                // Solo editables por su propietario
                                const propietario = layer.options.jugador || layer.options.jugadorId;
                                layer.options.draggable = (propietario === jugadorActualId);
                            }
                        });
                    }
                    break;
            }
        }

    emitirCambioElemento(tipo, elemento, equipo = null) {
            if (!this.gestorJuego?.gestorComunicacion?.socket) return;

            const datos = {
                tipo,
                coordenadas: elemento instanceof L.Marker ? 
                    elemento.getLatLng() : 
                    elemento.getLatLngs(),
                estilo: elemento.options,
                equipo
            };

            if (equipo) {
                // Emitir solo al equipo específico
                this.gestorJuego.gestorComunicacion.socket.emit('elementoEquipo', {
                    ...datos,
                    equipoDestino: equipo
                });
            } else {
                // Emitir a todos
                this.gestorJuego.gestorComunicacion.socket.emit('elementoGlobal', datos);
            }
        }

        // Modificar procesarDibujoSector
    procesarDibujoSector(layer) {
            if (!this.puedeDefinirSector(window.userId)) {
                this.mostrarMensajeAyuda('No tienes permisos para definir el sector');
                if (layer) {
                    window.calcoActivo.removeLayer(layer);
                }
                return;
            }
            
            this.sectorTemporal = layer;
            this.sectorTemporal.addTo(window.calcoActivo);
            this.actualizarBotonesConfirmacionSector();
        }



        

        // En GestorFases
    manejarFinDibujo() {
        if (this.dibujandoSector) {
            this.actualizarBotonesConfirmacionSector();
        } else if (this.dibujandoZona) {
            this.actualizarBotonesConfirmacionZona(this.dibujandoZona);
        }
    }

    manejarDibujoCreado(e) {
        console.log('Manejando dibujo:', {
            dibujandoSector: this.dibujandoSector,
            dibujandoZona: this.dibujandoZona,
            sectorConfirmado: this.sectorConfirmado
        });

        const layer = e.layer;
        if (this.dibujandoSector && !this.sectorConfirmado) {
            this.procesarDibujoSector(layer);
        } else if (this.dibujandoZona && this.sectorConfirmado) {
            this.procesarDibujoZona(layer);
        } else {
            // Si llegamos aquí es un estado inválido
            window.calcoActivo.removeLayer(layer);
            this.mostrarMensajeAyuda('Estado inválido para dibujo');
        }
    }


    destruir() {
        // Limpiar eventos
        window.mapa?.off(L.Draw.Event.CREATED);
        window.mapa?.off(L.Draw.Event.DRAWSTART);
        window.mapa?.off(L.Draw.Event.DRAWSTOP);

        // Deshabilitar herramientas
        Object.values(this.herramientasDibujo).forEach(herramienta => {
            if (herramienta && herramienta.disable) {
                herramienta.disable();
            }
        });

        // Limpiar capas
        if (this.sectorLayer) this.sectorLayer.remove();
        if (this.sectorTemporal) this.sectorTemporal.remove();
        Object.values(this.zonasLayers || {}).forEach(layer => {
            if (layer) layer.remove();
        });

        const panelFases = document.getElementById('panel-fases');
        if (panelFases) {
            panelFases.remove();
        }

        super.destruir();
    }

    actualizarInterfazCombate() {
        console.log('[GestorFases] Actualizando interfaz para fase de combate');
        
        // Cambiar el menú radial al modo combate
        if (window.miRadial && typeof window.miRadial.cambiarModo === 'function') {
            window.miRadial.cambiarModo('combate');
            console.log('[GestorFases] Menú radial cambiado a modo combate');
        }
        
        // Actualizar panel de juego
        if (this.gestorJuego?.gestorInterfaz?.actualizarPanelJuego) {
            this.gestorJuego.gestorInterfaz.actualizarPanelJuego();
        }
        
        // Ocultar botones de preparación y mostrar controles de combate
        this.actualizarBotonesFase();
    }

    /**
     * Confirma que las zonas de despliegue han sido definidas
     */
    confirmarZonas() {
        console.log('🎯 Confirmando zonas de despliegue...');

        // Verificar que ambas zonas estén definidas
        const zonaRoja = this.zonasLayers?.rojo || this.zonasDespliegue?.rojo;
        const zonaAzul = this.zonasLayers?.azul || this.zonasDespliegue?.azul;

        if (!zonaRoja || !zonaAzul) {
            this.mostrarMensajeAyuda('Debes definir ambas zonas de despliegue (roja y azul)');
            return false;
        }

        try {
            // Cambiar directamente a fase de despliegue
            this.cambiarFase('despliegue', 'inicial');
            this.actualizarBotonesFase();

            // Emitir evento para actualizar panel inferior
            this.emisorEventos.emit('cambioFase', 'despliegue', 'inicial');

            this.mostrarMensajeAyuda('Zonas confirmadas - Iniciando despliegue por equipos');
            return true;

        } catch (error) {
            console.error('Error al confirmar zonas:', error);
            this.mostrarMensajeAyuda('Error al confirmar las zonas');
            return false;
        }
    }

    /**
     * Confirma el despliegue de un equipo específico
     */
    confirmarDespliegueEquipo(equipo) {
        console.log(`✅ Confirmando despliegue del equipo ${equipo}`);

        if (!this.desplieguesConfirmados) {
            this.desplieguesConfirmados = { azul: false, rojo: false };
        }

        this.desplieguesConfirmados[equipo] = true;

        // Verificar si todos los equipos han confirmado
        const todosConfirmados = Object.values(this.desplieguesConfirmados).every(confirmado => confirmado);

        if (todosConfirmados) {
            // Todos los equipos han confirmado - iniciar combate
            console.log('🎯 Todos los equipos han confirmado despliegue - Iniciando combate');
            this.avanzarFase();
        } else {
            // Esperar al otro equipo
            this.mostrarMensajeAyuda(`Equipo ${equipo} ha confirmado despliegue - Esperando al otro equipo...`);

            // Emitir evento para actualizar panel
            this.emisorEventos.emit('cambioFase', 'despliegue', 'esperando_equipos');
        }

        return true;
    }

    /**
     * Avanza automáticamente a la siguiente fase del juego
     */
    avanzarFase() {
        console.log('⏭️ Avanzando fase automáticamente...');

        try {
            const faseActual = this.fase.toLowerCase();
            let nuevaFase, nuevaSubfase;

            switch (faseActual) {
                case 'preparacion':
                case 'planeamiento':
                    // De preparación a despliegue
                    nuevaFase = 'despliegue';
                    nuevaSubfase = 'inicial';
                    break;

                case 'despliegue':
                    // De despliegue a combate
                    nuevaFase = 'combate';
                    nuevaSubfase = 'inicial';
                    this.iniciarTurnosCombate();
                    break;

                case 'combate':
                    // De combate a evaluación
                    nuevaFase = 'evaluacion';
                    nuevaSubfase = 'inicial';
                    break;

                case 'evaluacion':
                    // De evaluación de vuelta a preparación (nuevo turno)
                    nuevaFase = 'preparacion';
                    nuevaSubfase = 'definicion_sector';
                    break;

                default:
                    console.warn('Fase desconocida:', faseActual);
                    return false;
            }

            // Cambiar fase
            this.cambiarFase(nuevaFase, nuevaSubfase);
            this.actualizarBotonesFase();

            // Emitir evento para actualizar panel inferior
            this.emisorEventos.emit('cambioFase', nuevaFase, nuevaSubfase);

            console.log(`✅ Fase avanzada: ${this.fase} - ${this.subfase}`);
            return true;

        } catch (error) {
            console.error('Error al avanzar fase:', error);
            return false;
        }
    }

    /**
     * Inicia el sistema de turnos para la fase de combate
     */
    iniciarTurnosCombate() {
        console.log('⚔️ Iniciando sistema de turnos para combate...');

        // Inicializar estado de turnos por equipos
        this.turnosEquipos = {
            azul: { jugadores: [], turnoActual: 0, ordenesPendientes: [] },
            rojo: { jugadores: [], turnoActual: 0, ordenesPendientes: [] }
        };

        // Obtener jugadores de cada equipo
        if (this.gestorJuego?.configuracion?.jugadores) {
            this.gestorJuego.configuracion.jugadores.forEach(jugador => {
                if (jugador.equipo === 'azul') {
                    this.turnosEquipos.azul.jugadores.push(jugador);
                } else if (jugador.equipo === 'rojo') {
                    this.turnosEquipos.rojo.jugadores.push(jugador);
                }
            });
        }

        // Iniciar con el primer equipo (azul)
        this.equipoTurnoActual = 'azul';
        this.jugadorTurnoActual = 0;

        // Iniciar turno del primer jugador
        this.iniciarTurnoJugador();

        // Actualizar interfaz de combate
        this.actualizarInterfazCombate();
    }

    /**
     * Inicia el turno de un jugador específico
     */
    iniciarTurnoJugador() {
        const equipo = this.turnosEquipos[this.equipoTurnoActual];
        const jugador = equipo.jugadores[this.jugadorTurnoActual];

        if (!jugador) {
            console.warn('No hay jugador para el turno actual');
            return;
        }

        console.log(`🎯 Turno del jugador: ${jugador.nombre} (${this.equipoTurnoActual})`);

        // Actualizar panel inferior con información del turno
        if (window.panelInferiorUnificado) {
            window.panelInferiorUnificado.estado.jugadorActual = jugador;
            window.panelInferiorUnificado.actualizarInfoTurno();
        }

        // Iniciar temporizador de turno
        this.iniciarTemporizadorTurno();

        // Mostrar mensaje
        this.mostrarMensajeAyuda(`Turno de ${jugador.nombre} (${this.equipoTurnoActual}). Usa el menú radial para dar órdenes.`);
    }

    /**
     * Finaliza el turno del jugador actual y ejecuta órdenes si es el último del equipo
     */
    finalizarTurnoJugador() {
        console.log('🏁 Finalizando turno del jugador actual...');

        // Cancelar temporizador
        if (this.temporizadorTurno) {
            clearInterval(this.temporizadorTurno);
            this.temporizadorTurno = null;
        }

        const equipo = this.turnosEquipos[this.equipoTurnoActual];

        // Verificar si hay más jugadores en el equipo
        if (this.jugadorTurnoActual < equipo.jugadores.length - 1) {
            // Pasar al siguiente jugador del mismo equipo
            this.jugadorTurnoActual++;
            this.iniciarTurnoJugador();
        } else {
            // Último jugador del equipo - ejecutar órdenes y pasar al otro equipo
            console.log(`🎯 Fin del turno del equipo ${this.equipoTurnoActual} - Ejecutando órdenes...`);
            this.ejecutarOrdenesEquipo(this.equipoTurnoActual);

            // Cambiar al otro equipo
            this.equipoTurnoActual = this.equipoTurnoActual === 'azul' ? 'rojo' : 'azul';
            this.jugadorTurnoActual = 0;

            // Pequeña pausa antes de iniciar el siguiente equipo
            setTimeout(() => {
                this.iniciarTurnoJugador();
            }, 2000);
        }
    }

    /**
     * Ejecuta todas las órdenes pendientes de un equipo
     */
    ejecutarOrdenesEquipo(equipo) {
        const ordenes = this.turnosEquipos[equipo].ordenesPendientes;
        console.log(`⚔️ Ejecutando ${ordenes.length} órdenes del equipo ${equipo}`);

        // Aquí iría la lógica para ejecutar las órdenes
        // Por ahora, solo limpiamos las órdenes pendientes
        this.turnosEquipos[equipo].ordenesPendientes = [];

        this.mostrarMensajeAyuda(`Órdenes del equipo ${equipo} ejecutadas`);
    }

    /**
     * Inicia el temporizador para el turno actual
     */
    iniciarTemporizadorTurno() {
        // Cancelar temporizador anterior
        if (this.temporizadorTurno) {
            clearInterval(this.temporizadorTurno);
        }

        // Duración por defecto (5 minutos)
        this.tiempoRestanteTurno = 300; // segundos
        this.temporizadorTurno = setInterval(() => {
            this.tiempoRestanteTurno--;

            if (this.tiempoRestanteTurno <= 0) {
                // Tiempo agotado - pasar turno automáticamente
                this.pasarTurnoAutomatico();
            } else {
                // Actualizar display de tiempo
                this.actualizarDisplayTiempo();
            }
        }, 1000);
    }

    /**
     * Pasa el turno automáticamente cuando se agota el tiempo
     */
    pasarTurnoAutomatico() {
        console.log('⏰ Tiempo agotado - pasando turno automáticamente...');

        if (this.temporizadorTurno) {
            clearInterval(this.temporizadorTurno);
            this.temporizadorTurno = null;
        }

        // Usar el nuevo sistema de turnos
        this.finalizarTurnoJugador();
    }

    /**
     * Registra una orden dada por un jugador durante su turno
     */
    registrarOrdenJugador(jugadorId, orden) {
        if (this.fase !== 'combate') return false;

        const equipo = this.equipoTurnoActual;
        const jugadorActual = this.turnosEquipos[equipo].jugadores[this.jugadorTurnoActual];

        if (!jugadorActual || jugadorActual.id !== jugadorId) {
            console.warn('Intento de registrar orden fuera de turno');
            return false;
        }

        // Agregar orden a la lista pendiente del equipo
        this.turnosEquipos[equipo].ordenesPendientes.push({
            jugador: jugadorId,
            orden: orden,
            timestamp: Date.now()
        });

        console.log(`📝 Orden registrada para ${jugadorActual.nombre}:`, orden);
        return true;
    }

    /**
     * Actualiza el display del tiempo restante
     */
    actualizarDisplayTiempo() {
        const minutos = Math.floor(this.tiempoRestanteTurno / 60);
        const segundos = this.tiempoRestanteTurno % 60;
        const tiempoFormateado = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

        // Actualizar panel inferior si existe
        if (window.panelInferiorUnificado && window.panelInferiorUnificado.estado) {
            window.panelInferiorUnificado.estado.tiempoRestante = tiempoFormateado;
            window.panelInferiorUnificado.actualizarTiempo();
        }

        // Cambiar color según urgencia
        if (this.tiempoRestanteTurno <= 30) {
            // Últimos 30 segundos - mostrar mensaje urgente
            const equipo = this.equipoTurnoActual;
            const jugador = this.turnosEquipos[equipo].jugadores[this.jugadorTurnoActual];
            if (jugador) {
                this.mostrarMensajeAyuda(`¡${this.tiempoRestanteTurno} segundos, ${jugador.nombre}!`, 'warning');
            }
        }
    }
}

window.GestorFases = GestorFases;