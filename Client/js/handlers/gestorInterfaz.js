class GestorInterfaz extends GestorBase {
    constructor() {
        super();
        this.contenedores = {
            principal: null,
            botones: null,
            panelTurno: null,
            panelEstado: null,
            mensajes: null
        };
        this.mensajesTimeout = 5000;
    }

    async inicializar(config) {
        try {
            console.log('Inicializando GestorInterfaz...');
            this.gestorJuego = config.gestorJuego;
            
            this.crearEstructuraBase();
            this.configurarEstilos();
            this.configurarEventosBasicos();

            return true;
        } catch (error) {
            console.error('Error al inicializar GestorInterfaz:', error);
            return false;
        }
    }

    crearEstructuraBase() {
        // Panel principal
        const interfaz = document.createElement('div');
        interfaz.id = 'interfaz-juego';
        interfaz.className = 'interfaz-contenedor';
        // 🔧 FIX: Asegurar z-index para interfaz principal
        interfaz.style.zIndex = '1050';
        interfaz.style.position = 'relative';
        
        // Panel de mensajes
        const mensajes = document.createElement('div');
        mensajes.id = 'mensajes-container';
        mensajes.className = 'mensajes-container';
        // 🔧 FIX: Z-index para mensajes
        mensajes.style.zIndex = '1040';
        mensajes.style.position = 'relative';
        
        // Panel de estado del juego
        const panelEstado = document.createElement('div');
        panelEstado.id = 'estado-juego';
        panelEstado.className = 'panel-estado';
        // 🔧 FIX: Z-index para panel de estado
        panelEstado.style.zIndex = '1030';
        panelEstado.style.position = 'relative';
        
        interfaz.appendChild(mensajes);
        interfaz.appendChild(panelEstado);
        document.body.appendChild(interfaz);

        this.contenedores = {
            principal: interfaz,
            mensajes: mensajes,
            panelEstado: panelEstado
        };
    }

    configurarEstilos() {
        const estilos = document.createElement('style');
        estilos.textContent = `
            .interfaz-contenedor {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                pointer-events: none;
                z-index: 1000;
            }
            
            .mensajes-container {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 1001;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            }
            
            .mensaje {
                padding: 10px 20px;
                border-radius: 5px;
                background: rgba(0, 0, 0, 0.8);
                color: black;
                animation: fadeInOut 5s ease-in-out;
                pointer-events: none;
            }
            
            .mensaje.error {
                background: rgba(244, 67, 54, 0.9);
            }
            
            .mensaje.success {
                background: rgba(76, 175, 80, 0.9);
            }
            
            .mensaje.warning {
                background: rgba(255, 152, 0, 0.9);
            }
            
            .panel-estado {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 10px;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                pointer-events: auto;
                min-width: 250px;
            }

            .fase-info, .subfase-info, .turno-info, .jugador-info {
                margin: 5px 0;
                padding: 5px;
                background: #f0f0f0;
                border-radius: 4px;
                font-weight: bold;
            }

            .fase-info {
                color: #2c5aa0;
            }

            .subfase-info {
                color: #5a9215;
            }

            .turno-info {
                color: #d4851a;
            }

            .jugador-info {
                color: #8b4513;
            }

            .reloj-turno {
                background: #007bff;
                color: white;
                padding: 8px;
                border-radius: 4px;
                text-align: center;
                font-weight: bold;
                font-size: 16px;
                margin: 8px 0;
                animation: pulse 1s infinite;
            }

            .reloj-turno.tiempo-critico {
                background: #dc3545;
                animation: blink 0.5s infinite;
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }

            @keyframes blink {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }

            .btn-listo-despliegue {
                background: #28a745;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 5px;
                font-weight: bold;
                cursor: pointer;
                width: 100%;
                margin-top: 10px;
                transition: background-color 0.3s;
            }

            .btn-listo-despliegue:hover {
                background: #218838;
            }

            .btn-listo-despliegue:disabled {
                background: #6c757d;
                cursor: not-allowed;
            }
            
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(-20px); }
                10% { opacity: 1; transform: translateY(0); }
                90% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-20px); }
            }
        `;
        document.head.appendChild(estilos);
    }

    mostrarMensaje(mensaje, tipo = 'info') {
        const mensajeElement = document.createElement('div');
        mensajeElement.className = `mensaje ${tipo}`;
        mensajeElement.textContent = mensaje;
        
        this.contenedores.mensajes.appendChild(mensajeElement);

        setTimeout(() => {
            mensajeElement.remove();
        }, this.mensajesTimeout);
    }

    actualizarEstadoJuego(estado) {
        if (!this.contenedores.panelEstado) return;
        
        let infoJugador = '';
        if (estado.fase === 'preparacion') {
            if (estado.subfase === 'definicion_sector' || estado.subfase === 'definicion_zonas') {
                const director = this.gestorJuego?.gestorFases?.director;
                const directorTemp = this.gestorJuego?.gestorFases?.primerJugador;
                if (director) {
                    infoJugador = `Director: ${director.username}`;
                } else if (directorTemp) {
                    infoJugador = `Director Temporal: ${directorTemp.username} (${directorTemp.equipo})`;
                }
            } else if (estado.subfase === 'despliegue') {
                // ✅ MEJORAR: Mostrar info según modo de juego
                const modoJuego = this.gestorJuego?.gestorTurnos?.modoJuego || 'online';
                if (modoJuego === 'local') {
                    // En modo local hay turnos durante el despliegue
                    const jugadorActual = estado.jugadorActual;
                    if (jugadorActual) {
                        infoJugador = `Turno de despliegue: ${jugadorActual.username} (${jugadorActual.equipo})`;
                    } else {
                        infoJugador = 'Despliegue local - Esperando turno';
                    }
                } else {
                    // En modo online todos despliegan simultáneamente
                    infoJugador = 'Todos los jugadores desplegando simultáneamente';
                }
            }
        } else if (estado.fase === 'combate') {
            const jugadorActual = estado.jugadorActual;
            if (jugadorActual) {
                infoJugador = `Jugador: ${jugadorActual.username} (${jugadorActual.equipo})`;
            }
        }

        this.contenedores.panelEstado.innerHTML = `
            <div class="fase-info">Fase: ${estado.fase}</div>
            <div class="subfase-info">Subfase: ${estado.subfase}</div>
            ${estado.fase === 'combate' ? `<div class="turno-info">Turno: ${estado.turnoActual}</div>` : ''}
            ${(estado.fase === 'preparacion' && estado.subfase === 'despliegue' && this.gestorJuego?.gestorTurnos?.modoJuego === 'local') ? 
                `<div class="turno-info">Turno de despliegue: ${estado.turnoActual || 1}</div>` : ''}
            <div class="jugador-info">${infoJugador}</div>
            ${this.crearRelojTurno(estado)}
        `;
        
        // ✅ MOSTRAR/OCULTAR BOTÓN "LISTO PARA COMBATE"
        this.mostrarBotonListoDespliegue();
    }

    actualizarInterfazFase(datos) {
        // Actualizar estado interno
        this.fase = datos.nuevaFase;
        this.subfase = datos.nuevaSubfase;
    
        // Actualizar mensajes según la fase y rol
        if (!this.gestorJuego?.gestorFases?.esDirector(window.userId)) {
            let mensaje = '';
            switch (this.subfase) {
                case 'definicion_sector':
                    mensaje = 'El director está definiendo el sector de juego';
                    break;
                case 'definicion_zonas':
                    mensaje = 'El director está definiendo las zonas de despliegue';
                    break;
                case 'despliegue':
                    mensaje = 'Fase de despliegue - Despliega tus unidades en tu zona asignada';
                    break;
                case 'combate':
                    mensaje = 'Fase de combate iniciada';
                    break;
            }
            this.mostrarMensaje(mensaje);
        }
    
        // Actualizar panel de estado
        this.actualizarEstadoJuego({
            fase: this.fase,
            subfase: this.subfase
        });
        // Force complete interface update
        this.actualizarInterfazCompleta();
    
        // Notify other managers
        this.emisorEventos.emit('faseCambiada', datos);
    }




    actualizarInterfazCompleta() {
    this.log('Actualizando interfaz completa');
    
    const estado = {
        fase: this.gestorJuego?.gestorFases?.fase,
        subfase: this.gestorJuego?.gestorFases?.subfase,
        jugadorActual: this.gestorJuego?.gestorTurnos?.obtenerJugadorActual(),
        turnoActual: this.gestorJuego?.gestorTurnos?.turnoActual,
        esDirector: this.gestorJuego?.gestorFases?.esDirector(window.userId)
    };

    if (!estado.fase) {
        this.mostrarMensaje('Error: Fase no definida', 'error');
        return;
    }

    try {
        switch(estado.fase) {
            case 'preparacion':
                this.actualizarInterfazPreparacion(estado);
                break;
            case 'combate':
                this.actualizarInterfazCombate(estado);
                break;
            case 'finalizacion':
                this.actualizarInterfazFinalizacion(estado);
                break;
            default:
                this.log(`Fase no reconocida: ${estado.fase}`, null, 'error');
                this.mostrarErrorFase();
                break;
        }

        this.actualizarEstadoJuego(estado);
        this.emisorEventos.emit('interfazActualizada', {
            ...estado,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        this.log('Error actualizando interfaz:', error, 'error');
        this.mostrarMensaje('Error actualizando la interfaz', 'error');
    }
}

actualizarInterfazPreparacion(estado) {
    switch(estado.subfase) {
        case 'definicion_sector':
            if (estado.esDirector) {
                this.mostrarControlesSector();
            } else {
                this.mostrarMensajeEspera('sector');
            }
            this.ocultarControlesZonas();
            break;
            
        case 'definicion_zonas':
            this.ocultarControlesSector();
            if (estado.esDirector) {
                this.mostrarControlesZonas();
            } else {
                this.mostrarMensajeEspera('zonas');
            }
            break;
            
        case 'despliegue':
            this.ocultarControlesZonas();
            this.actualizarPanelEstado({
                fase: estado.fase,
                subfase: 'despliegue',
                mensaje: 'Fase de despliegue - Despliega tus unidades'
            });
            this.actualizarBotonListoDespliegue(estado);
            // Auto-centrar en la zona de despliegue asignada
            this.centrarEnZonaDespliegue();
            break;
    }
}

// En gestorInterfaz.js
actualizarPanelEstado(estado) {
    const panelEstado = document.getElementById('estado-juego');
    if (!panelEstado) return;

    panelEstado.innerHTML = `
        <div class="fase-info">Fase: ${estado.fase}</div>
        <div class="subfase-info">Subfase: ${estado.subfase}</div>
        ${estado.mensaje ? `<div class="mensaje-fase">${estado.mensaje}</div>` : ''}
    `;
}

mostrarControlesZonas() {
    const panelControl = document.getElementById('panel-fases');
    if (!panelControl) return;

    if (this.gestorJuego?.gestorFases?.esDirector(window.userId)) {
        const botones = `
            <button id="btn-zona-roja" ${this.gestorJuego.gestorFases.zonasDespliegue.rojo ? 'disabled' : ''}>
                Definir Zona Roja
            </button>
            <button id="btn-zona-azul" ${!this.gestorJuego.gestorFases.zonasDespliegue.rojo || this.gestorJuego.gestorFases.zonasDespliegue.azul ? 'disabled' : ''}>
                Definir Zona Azul
            </button>
        `;
        panelControl.querySelector('.botones-fase').innerHTML = botones;
    }
}

limpiarInterfazPostZona() {
    // Eliminar paneles de confirmación
    const confirmaciones = document.querySelectorAll(
        '.botones-confirmacion-zona, .botones-confirmacion-sector'
    );
    confirmaciones.forEach(elem => elem.remove());

    // Eliminar panel de despliegue 
    const panelDespliegue = document.getElementById('controles-despliegue');
    if (panelDespliegue) {
        panelDespliegue.remove();
    }

    // Mover panel de estado a ubicación del panel de control
    const panelEstado = document.getElementById('estado-juego');
    const panelControl = document.getElementById('panel-fases');
    if (panelEstado && panelControl) {
        panelEstado.style.cssText = panelControl.style.cssText;
        panelControl.remove();
    }
}

mostrarMensajeEspera(contexto) {
    const mensajes = {
        sector: 'El director está definiendo el sector de juego',
        zonas: 'El director está definiendo las zonas de despliegue',
        despliegue: 'Esperando que todos los jugadores completen el despliegue'
    };
    this.mostrarMensaje(mensajes[contexto] || 'Esperando...', 'info');
}

    actualizarMensajesFase(fase, subfase, esDirector) {
        let mensaje = '';
        if (esDirector) {
            if (subfase === 'definicion_sector') {
                mensaje = 'Define el sector de juego';
            }
        } else {
            if (subfase === 'definicion_sector') {
                mensaje = 'El director está definiendo el sector de juego';
            }
        }
        this.mostrarMensaje(mensaje);
    }

    configurarEventosBasicos() {
        // Configurar eventos del GestorFases
        this.gestorJuego?.gestorFases?.emisorEventos.on('faseCambiada', (datos) => {
            this.actualizarInterfazCompleta();
        });

        // Configurar eventos del GestorTurnos
        if (this.gestorJuego?.gestorTurnos?.eventos) {
            this.gestorJuego.gestorTurnos.eventos.on('cambioTurno', (datos) => {
                console.log('[GestorInterfaz] 🔄 Cambio de turno detectado:', datos);
                this.actualizarInterfazCompleta();
            });
            
            this.gestorJuego.gestorTurnos.eventos.on('inicioTurnos', (datos) => {
                console.log('[GestorInterfaz] 🎮 Inicio de turnos detectado:', datos);
                this.actualizarInterfazCompleta();
            });
            
            this.gestorJuego.gestorTurnos.eventos.on('actualizacionReloj', (tiempoRestante) => {
                this.actualizarRelojTurno(tiempoRestante);
            });
        }
    }

   ocultarControlesSector() {
    // Buscar el contenedor de controles del sector si existe
    const controlesSector = document.getElementById('controles-sector');
    if (controlesSector) {
        // Ocultar el contenedor
        controlesSector.style.display = 'none';
        
        // Opcionalmente, eliminar los event listeners para liberar memoria
        const botones = controlesSector.getElementsByTagName('button');
        Array.from(botones).forEach(boton => {
            boton.replaceWith(boton.cloneNode(true));
        });
    }
}

ocultarControlesZonas() {
    // Buscar el contenedor de controles de zonas si existe
    const controlesZonas = document.getElementById('controles-zonas');
    if (controlesZonas) {
        // Ocultar el contenedor
        controlesZonas.style.display = 'none';
        
        // Opcionalmente, eliminar los event listeners
        const elementos = controlesZonas.getElementsByTagName('*');
        Array.from(elementos).forEach(elemento => {
            if (elemento.hasAttribute('onclick') || elemento.hasAttribute('onchange')) {
                elemento.replaceWith(elemento.cloneNode(true));
            }
        });
    }
}


// Método auxiliar para configurar los eventos de los controles de despliegue
configurarEventosDespliegue(contenedor) {
    // Botón de rotar unidad
    const btnRotar = contenedor.querySelector('#btn-rotar-unidad');
    if (btnRotar) {
        btnRotar.addEventListener('click', () => {
            // Implementar la lógica de rotación
            this.gestorJuego?.rotarUnidadSeleccionada();
        });
    }

    // Botón de confirmar despliegue
    const btnConfirmar = contenedor.querySelector('#btn-confirmar-despliegue');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', () => {
            // Implementar la lógica de confirmación
            this.gestorJuego?.confirmarDespliegue();
        });
    }

    // Botón de cancelar despliegue
    const btnCancelar = contenedor.querySelector('#btn-cancelar-despliegue');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            // Implementar la lógica de cancelación
            this.gestorJuego?.cancelarDespliegue();
        });
    }
}

// Método auxiliar para actualizar la lista de unidades disponibles
actualizarListaUnidadesDisponibles() {
    const listaUnidades = document.getElementById('lista-unidades');
    if (!listaUnidades) return;

    // Obtener las unidades disponibles del gestor de juego
    const unidadesDisponibles = this.gestorJuego?.obtenerUnidadesDisponibles() || [];

    // Limpiar la lista actual
    listaUnidades.innerHTML = '';

    // Añadir cada unidad a la lista
    unidadesDisponibles.forEach(unidad => {
        const elementoUnidad = document.createElement('div');
        elementoUnidad.className = 'unidad-item';
        elementoUnidad.innerHTML = `
            <span class="nombre-unidad">${unidad.nombre}</span>
            <span class="tipo-unidad">${unidad.tipo}</span>
        `;
        
        elementoUnidad.addEventListener('click', () => {
            this.gestorJuego?.seleccionarUnidadParaDespliegue(unidad);
        });

        listaUnidades.appendChild(elementoUnidad);
    });
}

    // ✅ NUEVO: Crear reloj de turno
    crearRelojTurno(estado) {
        const gestorTurnos = this.gestorJuego?.gestorTurnos;
        
        // Solo mostrar reloj si hay turnos activos
        if (!gestorTurnos || gestorTurnos.tiempoRestante === undefined) {
            return '';
        }
        
        // Mostrar en combate o en despliegue local
        const mostrarReloj = estado.fase === 'combate' || 
                           (estado.fase === 'preparacion' && estado.subfase === 'despliegue' && 
                            gestorTurnos.modoJuego === 'local');
        
        if (!mostrarReloj) {
            return '';
        }
        
        const tiempoFormateado = this.formatearTiempo(gestorTurnos.tiempoRestante);
        return `<div class="reloj-turno" id="reloj-turno">⏰ ${tiempoFormateado}</div>`;
    }

    // ✅ NUEVO: Actualizar reloj de turno
    actualizarRelojTurno(tiempoRestante) {
        const reloj = document.getElementById('reloj-turno');
        if (reloj) {
            const tiempoFormateado = this.formatearTiempo(tiempoRestante);
            reloj.textContent = `⏰ ${tiempoFormateado}`;
            
            // Cambiar color si queda poco tiempo
            if (tiempoRestante <= 30) {
                reloj.classList.add('tiempo-critico');
            } else {
                reloj.classList.remove('tiempo-critico');
            }
        }
    }

    // ✅ NUEVO: Formatear tiempo
    formatearTiempo(segundos) {
        const minutos = Math.floor(segundos / 60);
        const segs = segundos % 60;
        return `${minutos}:${segs.toString().padStart(2, '0')}`;
    }

    // ✅ NUEVO: Mostrar botón "Listo para combate" según contexto
    mostrarBotonListoDespliegue() {
        const gestorTurnos = this.gestorJuego?.gestorTurnos;
        const gestorFases = this.gestorJuego?.gestorFases;
        
        if (!gestorTurnos || !gestorFases) return;
        
        // Solo en fase de despliegue
        if (gestorFases.fase !== 'preparacion' || gestorFases.subfase !== 'despliegue') {
            this.ocultarBotonListoDespliegue();
            return;
        }
        
        // En modo online: mostrar siempre (todos despliegan simultáneamente)
        // En modo local: mostrar solo en el turno del jugador
        const modoJuego = gestorTurnos.modoJuego;
        const esJugadorActual = gestorTurnos.esJugadorActual(window.userId);
        const jugadorYaListo = gestorTurnos.jugadores.find(j => j.id === window.userId)?.despliegueListo;
        
        const deberMostrar = (modoJuego === 'online' || esJugadorActual) && !jugadorYaListo;
        
        if (deberMostrar) {
            this.crearBotonListoDespliegue();
        } else {
            this.ocultarBotonListoDespliegue();
        }
    }

    // ✅ NUEVO: Crear botón "Listo para combate"
    crearBotonListoDespliegue() {
        let boton = document.getElementById('btn-listo-despliegue');
        
        if (!boton) {
            boton = document.createElement('button');
            boton.id = 'btn-listo-despliegue';
            boton.className = 'btn-listo-despliegue';
            boton.textContent = 'Listo para combate';
            
            // Agregar al panel de estado
            const panelEstado = document.getElementById('estado-juego');
            if (panelEstado) {
                panelEstado.appendChild(boton);
            } else {
                document.body.appendChild(boton);
            }
        }
        
        boton.style.display = 'block';
        boton.disabled = false;
        boton.textContent = 'Listo para combate';
        
        // Configurar evento
        boton.onclick = () => {
            this.gestorJuego?.gestorTurnos?.marcarJugadorListo();
        };
    }

    // ✅ NUEVO: Ocultar botón "Listo para combate"
    ocultarBotonListoDespliegue() {
        const boton = document.getElementById('btn-listo-despliegue');
        if (boton) {
            boton.style.display = 'none';
        }
    }

    // ✅ NUEVO: Actualizar botón listo según el turno actual
    actualizarBotonListoDespliegue(estado) {
        const boton = document.getElementById('btn-listo-despliegue');
        if (!boton) {
            this.mostrarBotonListoDespliegue();
            return;
        }

        const jugadorActualId = this.gestorJuego?.gestorTurnos?.obtenerJugadorPropietario?.() || window.userId;
        const esElTurnoActual = jugadorActualId === (window.userId || window.gestorTurnos?.obtenerJugadorPropietario?.());
        
        // Solo mostrar el botón si es el turno del jugador actual
        if (esElTurnoActual) {
            boton.style.display = 'block';
            boton.disabled = false;
            boton.textContent = 'Listo para combate';
        } else {
            boton.style.display = 'none';
        }
    }

    centrarEnZonaDespliegue() {
        try {
            // Obtener la zona de despliegue asignada al jugador actual
            let jugadorData = null;
            
            // Intentar obtener desde gestorTurnos si está disponible
            if (window.gestorTurnos && window.gestorTurnos.obtenerJugadorActual) {
                jugadorData = window.gestorTurnos.obtenerJugadorActual();
            } else if (this.gestorJugadores && this.gestorJugadores.obtenerJugadorActual) {
                jugadorData = this.gestorJugadores.obtenerJugadorActual();
            }
            
            if (!jugadorData || !jugadorData.zonaDespliegue) {
                console.log('No se encontró zona de despliegue para el jugador actual');
                return;
            }

            const zonaDespliegue = jugadorData.zonaDespliegue;
            
            // Calcular el centro de la zona
            const centroX = (zonaDespliegue.x + zonaDespliegue.ancho / 2);
            const centroY = (zonaDespliegue.y + zonaDespliegue.alto / 2);
            
            // Centrar la cámara en la zona con un zoom apropiado
            if (this.gestorMapas && this.gestorMapas.centrarCamara) {
                // Calcular un zoom que permita ver toda la zona más un margen
                const margen = 100; // píxeles de margen
                const zoomAncho = window.innerWidth / (zonaDespliegue.ancho + margen * 2);
                const zoomAlto = window.innerHeight / (zonaDespliegue.alto + margen * 2);
                const zoomOptimo = Math.min(zoomAncho, zoomAlto, 2); // Máximo zoom 2x
                
                this.gestorMapas.centrarCamara(centroX, centroY, zoomOptimo);
                console.log(`Cámara centrada en zona de despliegue: (${centroX}, ${centroY}) con zoom ${zoomOptimo}`);
            }
        } catch (error) {
            console.error('Error al centrar en zona de despliegue:', error);
        }
    }

    destruir() {
        Object.values(this.contenedores).forEach(contenedor => {
            if (contenedor && contenedor.parentNode) {
                contenedor.parentNode.removeChild(contenedor);
            }
        });
        this.contenedores = {};
        super.destruir();
    }
}

window.GestorInterfaz = GestorInterfaz;