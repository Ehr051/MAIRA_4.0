// gestorAcciones.js

class GestorAcciones extends GestorBase {
    constructor() {
        super();
        // Estado del gestor
        this.historialAcciones = [];
        this.elementoSeleccionado = null;
        this.accionEnProceso = null;
        this.herramientasActivas = new Set();

        // Referencias a otros sistemas
        this.socket = null;
        this.mapa = null;
        this.miRadial = null;
    }

    //#region Inicialización y Configuración
    async inicializar(config) {
        console.log('Inicializando GestorAcciones...');
        
        this.socket = config.socket;
        this.gestorJuego = config.gestorJuego;
        this.mapa = window.mapa;
        this.mapa.off('contextmenu');
        this.mapa.off('dblclick');
        
        if (!this.mapa) {
            throw new Error('El mapa debe estar inicializado antes de usar GestorAcciones');
        }
        if (!window.MiRadial) {
            throw new Error('MiRadial no disponible');
        }
        this.miRadial = window.MiRadial;
        await this.inicializarMiRadial();

        try {
            await this.inicializarMiRadial();
            this.configurarEventos();
            return true;
        } catch (error) {
            console.error('Error al inicializar GestorAcciones:', error);
            throw error;
        }
    }

    configurarEventos() {
        if (this.mapa) {
            this.mapa.on('draw:created', (e) => this.manejarDibujoCreado(e));
            this.mapa.on('draw:edited', (e) => this.manejarDibujoEditado(e));
            this.mapa.on('draw:deleted', (e) => this.manejarDibujoBorrado(e));
            this.mapa.on('click', (e) => this.manejarClickMapa(e));
        }
    }


    async inicializarMiRadial() {
        try {
            console.log('Inicializando MiRadial...');
            
            if (!window.MiRadial) {
                throw new Error('MiRadial no disponible');
            }
    
            // Inicializar MiRadial con el mapa
            window.MiRadial.init(this.mapa);
            this.miRadial = window.MiRadial;
    
            // Configurar fase inicial
            this.miRadial.setFaseJuego('preparacion');
    
            // Desactivar el menú contextual por defecto
            this.mapa.on('contextmenu', (e) => {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
            });
    
            console.log('MiRadial inicializado correctamente');
        } catch (error) {
            console.error('Error al inicializar MiRadial:', error);
            throw error;
        }
    }
    

    configurarEventosElemento(marcador) {
        console.log('Configurando eventos para elemento:', marcador);
        if (!marcador) return;
    
        marcador.off('click dblclick contextmenu');
    
        // Usar solo contextmenu para el menú radial
        marcador.on('contextmenu', (e) => {
            console.log('Evento contextmenu en elemento');
            
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            
            // Actualizar elemento seleccionado
            this.elementoSeleccionado = marcador;
            window.elementoSeleccionado = marcador;
    
            // Obtener coordenadas para el menú
            const point = this.mapa.latLngToContainerPoint(e.latlng);
            
            // Asegurar que MiRadial tenga la referencia correcta
            if (window.MiRadial) {
                window.MiRadial.selectedUnit = marcador;
                window.MiRadial.selectedHex = null;
                window.MiRadial.mostrarMenu(
                    e.originalEvent.pageX,
                    e.originalEvent.pageY,
                    'elemento'
                );
            }
        });
    }


// En gestorAcciones.js
mostrarMenuContextual(e) {
    L.DomEvent.stopPropagation(e);
    L.DomEvent.preventDefault(e);

    const latlng = e.latlng;
    let elementoSeleccionado = null;

    // Buscar en todos los calcos activos
    if (window.calcoGlobal) {
        window.calcoGlobal.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                const layerLatLng = layer.getLatLng();
                if (Math.abs(layerLatLng.lat - latlng.lat) < 0.0001 && 
                    Math.abs(layerLatLng.lng - latlng.lng) < 0.0001) {
                    elementoSeleccionado = layer;
                }
            }
        });
    }

    if (elementoSeleccionado) {
        console.log("Elemento seleccionado:", elementoSeleccionado);
        // Asignar directamente al objeto MiRadial
        window.MiRadial.selectedUnit = elementoSeleccionado;
        window.MiRadial.selectedHex = null;
        this.elementoSeleccionado = elementoSeleccionado; // Para gestorAcciones
    } else {
        // Si no hay elemento, verificar el hexágono
        const hex = window.HexGrid?.getHexagonAt(latlng);
        if (hex) {
            console.log("Hexágono seleccionado:", hex);
            window.MiRadial.selectedHex = hex;
            window.MiRadial.selectedUnit = null;
            this.elementoSeleccionado = null;
        }
    }

    // Obtener coordenadas de pantalla
    const point = this.mapa.latLngToContainerPoint(latlng);
    window.MiRadial.mostrarMenu(
        e.originalEvent ? e.originalEvent.pageX : point.x,
        e.originalEvent ? e.originalEvent.pageY : point.y,
        elementoSeleccionado ? 'elemento' : 'terreno'
    );
}


    configurarEventos() {
        // Eventos del mapa
        if (this.mapa) {
            this.mapa.on('draw:created', (e) => this.manejarDibujoCreado(e));
            this.mapa.on('draw:edited', (e) => this.manejarDibujoEditado(e));
            this.mapa.on('draw:deleted', (e) => this.manejarDibujoBorrado(e));
            this.mapa.on('click', (e) => this.manejarClickMapa(e));
        }

        // Eventos de elementos
        this.configurarEventosElemento();

        // Eventos de socket si existe
        if (this.socket) {
            this.socket.on('sincronizarAccion', (accion) => {
                this.sincronizarAccionRemota(accion);
            });
        }

        // Eventos de fases
        if (this.gestorJuego?.gestorFases) {
            this.gestorJuego.gestorFases.emisorEventos.on('faseCambiada', (datos) => {
                this.actualizarPermisosSegunFase(datos);
            });
        }
    }


actualizarPermisosSegunFase(datos) {
    const { nuevaFase, nuevaSubfase } = datos;
    
    // Deshabilitar/ocultar botones de agregar según la fase
    const botonesAgregar = {
        'amigo': document.getElementById('boton-amigo'),
        'enemigo': document.getElementById('boton-enemigo')
    };

    if (nuevaFase === 'preparacion' && nuevaSubfase === 'despliegue') {
        // En fase de despliegue, solo habilitar el botón del equipo correspondiente
        if (window.equipoJugador === 'azul') {
            this.actualizarSidcPorEquipo('F');
            if (botonesAgregar.amigo) {
                botonesAgregar.amigo.disabled = false;
                botonesAgregar.enemigo.disabled = true;
            }
        } else if (window.equipoJugador === 'rojo') {
            this.actualizarSidcPorEquipo('J');
            if (botonesAgregar.enemigo) {
                botonesAgregar.amigo.disabled = true;
                botonesAgregar.enemigo.disabled = false;
            }
        }
    } else {
        // En otras fases, deshabilitar ambos botones
        Object.values(botonesAgregar).forEach(boton => {
            if (boton) boton.disabled = true;
        });
    }
}

// Método para actualizar SIDC automáticamente según equipo
actualizarSidcPorEquipo(caracter) {
    if (typeof actualizarSidc === 'function') {
        actualizarSidc(caracter);
    } else {
        console.warn('Función actualizarSidc no encontrada');
    }
}

    actualizarInterfazSegunFase(fase, subfase) {
        if (this.miRadial) {
            this.miRadial.setFaseJuego(fase);
        }
    }

    configurarEventosElementos() {
        if (this.calcoActivo) {
            this.calcoActivo.eachLayer(layer => {
                if (layer instanceof L.Marker || layer instanceof L.Path) {
                    layer.on('dblclick', (e) => {
                        L.DomEvent.stopPropagation(e);
                        window.elementoSeleccionado = layer;
                        const point = this.mapa.latLngToContainerPoint(e.latlng);
                        window.MiRadial.mostrarMenu(point.x, point.y, 'elemento');
                    });
                }
            });
        }
    }

    actualizarMenuRadialParaElemento(elemento) {
        if (!elemento) return;
        
        // Actualizar opciones del menú según el tipo de elemento
        const opciones = this.obtenerOpcionesSegunElemento(elemento);
        window.MiRadial.actualizarOpciones(opciones);
    }
    //#endregion

    //#region Manejo de Acciones
    registrarAccion(tipo, datos) {
        const accion = {
            tipo,
            datos,
            timestamp: new Date().toISOString(),
            jugadorId: window.userId,
            equipo: window.equipoJugador
        };

        // Validar la acción según la fase actual
        if (!this.validarAccion(accion)) {
            console.warn('Acción no válida en la fase actual:', accion);
            return false;
        }

        // Registrar la acción en el historial
        this.historialAcciones.push(accion);
        
        // Emitir evento local
        this.emisorEventos.emit('accionRegistrada', accion);

        // Sincronizar si estamos en modo online
        if (this.socket && this.socket.connected) {
            this.socket.emit('accionJuego', accion);
        }

        console.log('Acción registrada:', accion);
        return true;
    }

    validarAccion(accion) {
        // Validar según fase actual
        const validacionFase = this.gestorJuego?.gestorFases?.validarAccionEnFase(
            accion.tipo,
            accion.jugadorId
        );

        // Validar según turno actual
        const validacionTurno = this.gestorJuego?.gestorTurnos?.validarAccionEnTurno(
            accion.jugadorId
        );

        // Validar según tipo específico de acción
        const validacionTipo = this.validarTipoAccion(accion);

        return validacionFase && validacionTurno && validacionTipo;
    }

    validarTipoAccion(accion) {
        switch (accion.tipo) {
            case 'desplegarUnidad':
                return this.validarDespliegueUnidad(accion.datos?.posicion);
            case 'moverUnidad':
                return this.validarMovimiento(accion.datos);
            case 'atacar':
                return this.validarAtaque(accion.datos);
            default:
                console.warn('Tipo de acción no reconocido:', accion.tipo);
                return false;
        }
    }


    validarMovimiento(datos) {
        if (!datos.unidadId || !datos.destino) return false;

        // Verificar distancia de movimiento
        const unidad = this.buscarUnidad(datos.unidadId);
        if (!unidad) return false;

        const distancia = this.calcularDistancia(unidad.getLatLng(), datos.destino);
        return distancia <= this.obtenerRangoMovimiento(unidad);
    }

    validarAtaque(datos) {
        if (!datos.atacanteId || !datos.objetivoId) return false;

        const atacante = this.buscarUnidad(datos.atacanteId);
        const objetivo = this.buscarUnidad(datos.objetivoId);
        if (!atacante || !objetivo) return false;

        // Verificar rango de ataque
        const distancia = this.calcularDistancia(
            atacante.getLatLng(),
            objetivo.getLatLng()
        );
        return distancia <= this.obtenerRangoAtaque(atacante);
    }

    validarDibujo(datos) {
        // Implementar validación específica según tipo de dibujo
        return true;
    }
    //#endregion

    //#region Menú Radial
    mostrarMenuRadial(x, y, contexto = 'elemento') {
        const opciones = this.obtenerOpcionesMenuSegunContexto(contexto);
        this.miRadial.mostrarMenu(x, y, contexto, opciones);
    }

    async inicializarMiRadial() {
        try {
            if (!window.MiRadial) {
                throw new Error('MiRadial no disponible');
            }
    
            window.MiRadial.init(this.mapa, {
                modoInteraccion: 'dobleClick',
                contenidoDinamico: true,
                onSeleccionOpcion: (opcion) => {
                    this.ejecutarAccionMenuRadial(opcion);
                }
            });
            
            this.miRadial = window.MiRadial;
            console.log('MiRadial inicializado correctamente');
            
        } catch (error) {
            console.error('Error al inicializar MiRadial:', error);
            throw error;
        }
    }
    
    // Eliminar configurarEventosMenuRadial() ya que usamos onSeleccionOpcion

    obtenerOpcionesMenuSegunContexto(contexto) {
        if (contexto === 'elemento') {
            return this.obtenerOpcionesParaElemento();
        } else if (contexto === 'hexagono') {
            return this.obtenerOpcionesParaHexagono();
        }
        return [];
    }

    obtenerOpcionesParaElemento() {
        const fase = this.gestorJuego?.gestorFases?.fase;
        const subfase = this.gestorJuego?.gestorFases?.subfase;
        const elemento = this.elementoSeleccionado;

        if (!elemento) return [];

        const esPropio = elemento.options.equipo === window.equipoJugador;
        const opciones = [];

        if (fase === 'preparacion') {
            if (subfase === 'despliegue' && esPropio) {
                opciones.push(
                    { id: 'mover', titulo: 'Mover', icono: '↔' },
                    { id: 'rotar', titulo: 'Rotar', icono: '↻' },
                    { id: 'eliminar', titulo: 'Eliminar', icono: '✕' }
                );
            }
        } else if (fase === 'combate') {
            if (esPropio) {
                opciones.push(
                    { id: 'mover', titulo: 'Mover', icono: '↔' },
                    { id: 'atacar', titulo: 'Atacar', icono: '⚔' }
                );
            } else {
                opciones.push(
                    { id: 'identificar', titulo: 'Identificar', icono: '👁' }
                );
            }
        }

        return opciones;
    }

    obtenerOpcionesParaHexagono() {
        const fase = this.gestorJuego?.gestorFases?.fase;
        const subfase = this.gestorJuego?.gestorFases?.subfase;
        const opciones = [];

        if (fase === 'preparacion' && subfase === 'despliegue') {
            opciones.push(
                { id: 'marcar', titulo: 'Desplegar', icono: '⚑' }
            );
        }

        return opciones;
    }

    ejecutarAccionMenuRadial(opcion) {
        switch (opcion.id) {
            case 'mover':
                this.iniciarMovimiento();
                break;
            case 'atacar':
                this.iniciarAtaque();
                break;
            case 'rotar':
                this.rotarElemento();
                break;
            case 'eliminar':
                this.eliminarElemento();
                break;
            case 'identificar':
                this.identificarElemento();
                break;
            case 'desplegar':
                this.iniciarDespliegue();
                break;
            default:
                console.warn('Opción no implementada:', opcion.id);
        }
    }

    
    //#endregion

    //#region Acciones Específicas
    iniciarMovimiento() {
        if (!this.elementoSeleccionado) return;

        this.accionEnProceso = {
            tipo: 'mover',
            elemento: this.elementoSeleccionado
        };

        this.mapa.once('click', (e) => {
            if (this.validarMovimiento({
                unidadId: this.elementoSeleccionado.options.id,
                destino: e.latlng
            })) {
                this.registrarAccion('moverUnidad', {
                    unidadId: this.elementoSeleccionado.options.id,
                    destino: e.latlng
                });
            }
            this.accionEnProceso = null;
        });
    }

    iniciarAtaque() {
        if (!this.elementoSeleccionado) return;

        this.accionEnProceso = {
            tipo: 'atacar',
            atacante: this.elementoSeleccionado
        };

        // Esperar selección de objetivo
        this.mapa.once('click', (e) => {
            const objetivo = this.obtenerElementoEnPosicion(e.latlng);
            if (objetivo && this.validarAtaque({
                atacanteId: this.elementoSeleccionado.options.id,
                objetivoId: objetivo.options.id
            })) {
                this.registrarAccion('atacar', {
                    atacanteId: this.elementoSeleccionado.options.id,
                    objetivoId: objetivo.options.id
                });
            }
            this.accionEnProceso = null;
        });
    }



    
        crearElementoRemoto(datos) {
            if (datos.jugador === window.userId) return;
        
            try {
                const marcador = this.crearMarcadorUnidad(datos.posicion, datos);
                if (this.gestorJuego?.gestorMapa?.calcoActivo) {
                    this.gestorJuego.gestorMapa.calcoActivo.addLayer(marcador);
                    this.configurarEventosElemento(marcador); // Usar método unificado
                }
            } catch (error) {
                console.error('Error al crear elemento remoto:', error);
            }
        }

    formatearSIDC(sidc, equipo) {
        let sidcFormateado = sidc;
        if (sidc.length < 15) {
            sidcFormateado = sidc.padEnd(15, '-');
        } else if (sidc.length > 15) {
            sidcFormateado = sidc.substr(0, 15);
        }

        const sidcArray = sidcFormateado.split('');
        sidcArray[1] = equipo === 'azul' ? 'F' : 'J';
        return sidcArray.join('');
    }

    validarDespliegueUnidad(latlng) {
        // 1. Validar fase/subfase
        if (this.gestorJuego?.gestorFases?.fase !== 'preparacion' || 
            this.gestorJuego?.gestorFases?.subfase !== 'despliegue') {
            this.gestorJuego?.gestorInterfaz?.mostrarMensaje(
                'Solo puedes agregar unidades en fase de despliegue', 
                'error'
            );
            return false;
        }

        // 2. Validar equipo
        if (!window.equipoJugador) {
            this.gestorJuego?.gestorInterfaz?.mostrarMensaje(
                'Debes tener un equipo asignado', 
                'error'
            );
            return false;
        }

        // 3. Validar zona si se proporciona posición
        if (latlng) {
            const zonaEquipo = this.gestorJuego?.gestorFases?.zonasDespliegue[window.equipoJugador];
            if (!zonaEquipo || !zonaEquipo.contains(latlng)) {
                this.gestorJuego?.gestorInterfaz?.mostrarMensaje(
                    'Solo puedes desplegar en tu zona asignada',
                    'error'
                );
                return false;
            }
        }

        return true;
    }

    
        // Esta función se usaría al crear/guardar un elemento
    validarDatosElemento(elemento) {
        // Validar datos básicos
        if (!elemento.posicion || !elemento.tipo || !elemento.sidc) {
            return false;
        }

        // Validar ubicación
        if (!this.validarDespliegueUnidad(elemento.posicion)) {
            return false;
        }

        // Validar pertenencia al equipo
        if (elemento.equipo !== window.equipoJugador) {
            this.gestorJuego?.gestorInterfaz?.mostrarMensaje(
                'Solo puedes crear elementos para tu equipo',
                'error'
            );
            return false;
        }

        return true;
    }    


    validarPosicionMovimiento(latlng, elemento) {
        const zonaEquipo = this.gestorJuego?.gestorFases?.zonasDespliegue[elemento.options.equipo];
        const sector = this.gestorJuego?.gestorFases?.sectorJuego;
        
        if (!zonaEquipo?.contains(latlng) || !sector?.contains(latlng)) {
            this.gestorJuego?.gestorInterfaz?.mostrarMensaje(
                'No puedes mover la unidad fuera de los límites permitidos', 
                'warning'
            );
            return false;
        }
        return true;
    }

    emitirNuevoElemento(elemento) {
        if (this.gestorJuego?.gestorComunicacion?.socket) {
            this.gestorJuego.gestorComunicacion.socket.emit('nuevoElemento', {
                tipo: 'unidad',
                datos: {
                    id: elemento.options.id,
                    sidc: elemento.options.sidc,
                    nombre: elemento.options.nombre,
                    posicion: elemento.getLatLng(),
                    equipo: elemento.options.equipo,
                    jugador: elemento.options.jugador,
                    designacion: elemento.options.designacion,
                    asignacion: elemento.options.asignacion,
                    magnitud: elemento.options.magnitud
                }
            });
        }
    }

    emitirMovimientoElemento(elemento) {
        if (this.gestorJuego?.gestorComunicacion?.socket) {
            this.gestorJuego.gestorComunicacion.socket.emit('moverElemento', {
                id: elemento.options.id,
                posicion: elemento.getLatLng()
            });
        }
    }

    eliminarElemento() {
        if (!this.elementoSeleccionado) return;

        const confirmacion = confirm('¿Estás seguro de querer eliminar este elemento?');
        if (confirmacion) {
            this.registrarAccion('eliminarElemento', {
                elementoId: this.elementoSeleccionado.options.id
            });

            this.gestorJuego?.gestorMapa?.calcoActivo.removeLayer(this.elementoSeleccionado);
            this.elementoSeleccionado = null;
        }
    }

    identificarElemento() {
        if (!this.elementoSeleccionado) return;

        // Mostrar información del elemento
        const info = this.obtenerInformacionElemento(this.elementoSeleccionado);
        this.gestorJuego?.gestorInterfaz?.mostrarInformacionElemento(info);
    }

    iniciarDespliegue() {
        // Implementar lógica de despliegue
    }
    //#endregion

//#region Utilidades
calcularDistancia(punto1, punto2) {
    return punto1.distanceTo(punto2);
}

obtenerRangoMovimiento(unidad) {
    // Implementar según tipo de unidad
    return 1000; // metros
}

obtenerRangoAtaque(unidad) {
    // Implementar según tipo de unidad y armamento
    return 2000; // metros 
}

buscarUnidad(unidadId) {
    let unidadEncontrada = null;
    this.gestorJuego?.gestorMapa?.calcoActivo.eachLayer(layer => {
        if (layer.options && layer.options.id === unidadId) {
            unidadEncontrada = layer;
        }
    });
    return unidadEncontrada;
}

obtenerElementoEnPosicion(latlng) {
    let elementoEncontrado = null;
    const radio = 20; // pixels
    const bounds = this.mapa.getBounds();
    const point = this.mapa.latLngToContainerPoint(latlng);

    this.gestorJuego?.gestorMapa?.calcoActivo.eachLayer(layer => {
        if (layer instanceof L.Marker || layer instanceof L.Path) {
            const layerPoint = this.mapa.latLngToContainerPoint(
                layer instanceof L.Marker ? layer.getLatLng() : layer.getBounds().getCenter()
            );
            if (point.distanceTo(layerPoint) <= radio) {
                elementoEncontrado = layer;
            }
        }
    });

    return elementoEncontrado;
}


// En GestorAcciones
registrarAccion(tipo, datos) {
    if (!this.validarAccion(tipo, datos)) return false;

    const accion = {
        tipo,
        datos,
        timestamp: new Date().toISOString(),
        jugadorId: window.userId,
        equipo: window.equipoJugador
    };

    // Emitir al servidor
    if (this.gestorJuego?.gestorComunicacion?.socket) {
        this.gestorJuego.gestorComunicacion.socket.emit('accionJuego', accion);
    }

    return true;
}

// Escuchar eventos de sincronización
configurarEventosSocket() {
    const socket = this.gestorJuego?.gestorComunicacion?.socket;
    if (!socket) return;

    socket.on('elementoCreado', (datos) => {
        this.crearElementoRemoto(datos);
    });

    socket.on('elementoEliminado', (datos) => {
        this.eliminarElementoRemoto(datos);
    });

    socket.on('elementoMovido', (datos) => {
        this.moverElementoRemoto(datos);
    });

    // Solicitar estado actual al conectar
    socket.emit('solicitarEstadoPartida', {
        partidaCodigo: window.codigoPartida
    });
}

obtenerInformacionElemento(elemento) {
    if (!elemento || !elemento.options) return null;

    return {
        id: elemento.options.id,
        nombre: elemento.options.nombre,
        tipo: elemento.options.tipo,
        sidc: elemento.options.sidc,
        equipo: elemento.options.equipo,
        propietario: elemento.options.jugador,
        posicion: elemento instanceof L.Marker ? elemento.getLatLng() : elemento.getBounds().getCenter()
    };
}
//#endregion

destruir() {
    // Limpiar eventos del mapa
    if (this.mapa) {
        this.mapa.off('click');
        this.mapa.off('draw:created');
        this.mapa.off('draw:edited');
        this.mapa.off('draw:deleted');
    }

    // Limpiar eventos de socket
    if (this.socket) {
        this.socket.off('sincronizarAccion');
    }

    // Limpiar referencias
    this.elementoSeleccionado = null;
    this.accionEnProceso = null;
    this.herramientasActivas.clear();
    
    // Llamar al destructor del padre
    super.destruir();
}

manejarClickMapa(e) {
    if (this.accionEnProceso) {
        this.procesarAccionEnCurso(e);
    }
}

procesarAccionEnCurso(e) {
    switch (this.accionEnProceso.tipo) {
        case 'mover':
            this.finalizarMovimiento(e.latlng);
            break;
        case 'atacar':
            this.finalizarAtaque(e.latlng);
            break;
    }
    this.accionEnProceso = null;
}

actualizarMenuRadialParaElemento(elemento) {
    if (!elemento) return;
    
    const opciones = this.obtenerOpcionesParaElemento();
    if (this.miRadial) {
        this.miRadial.actualizarOpciones(opciones);
    }
}

manejarDibujoCreado(e) {
    console.log('Manejando dibujo creado:', e);
    if (!e.layer) return;

    const layer = e.layer;
    if (this.gestorJuego?.gestorFases?.fase === 'preparacion') {
        this.procesarDibujoPreparacion(layer);
    }
}

manejarDibujoEditado(e) {
    e.layers.eachLayer(layer => {
        if (layer.options.tipo) {
            this.registrarAccion('editarElemento', {
                id: layer.options.id,
                tipo: layer.options.tipo,
                coordenadas: layer.getLatLngs()
            });
        }
    });
}

manejarDibujoBorrado(e) {
    e.layers.eachLayer(layer => {
        if (layer.options.id) {
            this.registrarAccion('eliminarElemento', {
                id: layer.options.id
            });
        }
    });
}

finalizarMovimiento(latlng) {
    if (!this.elementoSeleccionado) return;
    
    const movimientoValido = this.validarMovimiento({
        unidadId: this.elementoSeleccionado.options.id,
        destino: latlng
    });

    if (movimientoValido) {
        this.elementoSeleccionado.setLatLng(latlng);
        this.registrarAccion('moverUnidad', {
            unidadId: this.elementoSeleccionado.options.id,
            destino: latlng
        });
    }
}

finalizarAtaque(latlng) {
    if (!this.elementoSeleccionado) return;
    
    const objetivo = this.obtenerElementoEnPosicion(latlng);
    if (!objetivo) return;

    const ataqueValido = this.validarAtaque({
        atacanteId: this.elementoSeleccionado.options.id,
        objetivoId: objetivo.options.id
    });

    if (ataqueValido) {
        this.registrarAccion('atacar', {
            atacanteId: this.elementoSeleccionado.options.id,
            objetivoId: objetivo.options.id
        });
    }
}

procesarDibujoPreparacion(layer) {
    if (this.gestorJuego?.gestorFases?.dibujandoSector) {
        this.gestorJuego.gestorFases.procesarDibujoSector(layer);
    } else if (this.gestorJuego?.gestorFases?.dibujandoZona) {
        this.gestorJuego.gestorFases.procesarDibujoZona(layer);
    }
}
}

// Exportar la clase
window.GestorAcciones = GestorAcciones;
