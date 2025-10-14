/**
 * Panel Inferior Unificado - Estilo Total War Rome 3
 * Restaura la funcionalidad del gestorInterfaz eliminada y proporciona
 * una interfaz unificada para el control del juego
 */

class PanelInferiorUnificado {
    constructor() {
        this.panel = null;
        this.estado = {
            fase: null,
            subFase: null,
            turno: null,
            tiempoRestante: this.obtenerDuracionTurnoInicial(), // Obtener duración real del turno
            jugadorActual: null
            // pausado y velocidad eliminados - duración fija por turno
        };
        this.timers = new Map();
        this.controlActivo = 'btnDefinirSector';
    }

    /**
     * Obtiene la duración inicial del turno desde los datos de la partida
     */
    obtenerDuracionTurnoInicial() {
        try {
            // Intentar obtener datos de la partida desde sessionStorage primero
            let datosPartida = null;
            const datosSession = sessionStorage.getItem('datosPartidaActual');
            if (datosSession) {
                const parsed = JSON.parse(datosSession);
                datosPartida = parsed.partidaActual || parsed;
            }

            // Si no está en sessionStorage, intentar localStorage
            if (!datosPartida) {
                const datosLocal = localStorage.getItem('datosPartida');
                if (datosLocal) {
                    datosPartida = JSON.parse(datosLocal);
                }
            }

            // Si no está en localStorage, intentar configuración temporal
            if (!datosPartida) {
                const configTemp = localStorage.getItem('configuracionPartidaTemporal');
                if (configTemp) {
                    datosPartida = { configuracion: JSON.parse(configTemp) };
                }
            }

            // Si no hay datos de partida, usar valor por defecto
            if (!datosPartida || !datosPartida.configuracion) {
                console.log('⚠️ No se encontraron datos de partida, usando duración por defecto');
                console.log('Datos encontrados:', datosPartida);
                return '10:00';
            }

            // Obtener duración del turno (en segundos o minutos)
            let duracionTurno = datosPartida.configuracion.duracionTurno;
            if (!duracionTurno) {
                console.log('⚠️ Duración del turno no especificada, usando valor por defecto');
                return '10:00';
            }

            // Convertir a número si es string
            duracionTurno = parseInt(duracionTurno);

            // Si es menor a 100, asumir que está en minutos y convertir a segundos
            if (duracionTurno < 100) {
                duracionTurno *= 60;
            }

            // Convertir segundos a formato MM:SS
            const minutos = Math.floor(duracionTurno / 60);
            const segundos = duracionTurno % 60;

            const tiempoFormateado = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
            console.log(`⏱️ Duración inicial del turno: ${tiempoFormateado} (${duracionTurno}s)`);

            return tiempoFormateado;

        } catch (error) {
            console.error('❌ Error obteniendo duración del turno:', error);
            return '10:00'; // Valor por defecto en caso de error
        }
    }

    /**
     * Inicializa el panel inferior unificado
     */
    inicializar() {
        try {
            console.log('🎮 Inicializando Panel Inferior Unificado...');
            
            this.panel = document.getElementById('panelInferiorUnificado');
            if (!this.panel) {
                console.error('❌ Panel inferior unificado no encontrado');
                return false;
            }

            // Limpiar elementos duplicados o obsoletos
            this.limpiarElementosObsoletos();

            this.configurarEventListeners();
            this.inicializarControles();
            this.inicializarMinimapa();
            
            // Conectar con gestores para datos reales
            this.conectarConGestores();
            
            // Inicializar con estado del gestor de fases si existe
            if (window.gestorFases) {
                this.estado.fase = window.gestorFases.fase || 'preparacion';
                this.estado.subFase = window.gestorFases.subfase || 'definicion_sector';
            }
            
            this.actualizarDisplay();
            
            // Inicializar controles con el estado actual
            this.actualizarControlesPorFase(this.estado.fase, this.estado.subFase);
            
            console.log('✅ Panel Inferior Unificado inicializado correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error al inicializar Panel Inferior Unificado:', error);
            return false;
        }
    }

    /**
     * Configura los event listeners para todos los botones
     */
    configurarEventListeners() {
        // Controles principales dinámicos se configuran en generarBotonesDinamicos()
        
        // Configurar controles estáticos si existen
        this.configurarBotonSiguienteFase();
    }


    /**
     * Configura el botón Siguiente Fase
     */
    configurarBotonSiguienteFase() {
        const btn = document.getElementById('btnSiguienteFase');
        if (!btn) return;

        btn.addEventListener('click', () => {
            console.log('⏭️ Avanzando a siguiente fase...');
            
            // Integrar con el sistema de fases existente
            if (window.gestorFases && window.gestorFases.avanzarFase) {
                window.gestorFases.avanzarFase();
            } else if (window.gestorTurnos && window.gestorTurnos.siguienteTurno) {
                window.gestorTurnos.siguienteTurno();
            } else {
                // Fallback: avanzar manualmente
                this.avanzarFaseManual();
            }
        });
    }

    /**
     * Activa un control específico visualmente
     */
    activarControl(controlId) {
        // Desactivar todos los controles
        document.querySelectorAll('.btn-control').forEach(btn => {
            btn.classList.remove('activo');
        });

        // Activar el control seleccionado
        const control = document.getElementById(controlId);
        if (control) {
            control.classList.add('activo');
            this.controlActivo = controlId;
        }
    }

    /**
     * Inicializa los controles según el estado actual del juego
     */
    inicializarControles() {
        // Los controles se inicializan dinámicamente en actualizarControlesPorFase()
        // No se necesita lógica específica de inicialización estática
        console.log('🎮 Controles dinámicos listos para inicialización por fase');
    }

    /**
     * Actualiza el estado del panel y refresca los controles
     */
    actualizarEstado(fase, subFase = null, turno = null) {
        this.estado.fase = fase;
        this.estado.subFase = subFase || this.estado.subFase;
        if (turno !== null) {
            this.estado.turno = turno;
        }
        this.actualizarDisplay();
        this.actualizarControlesPorFase(fase, subFase);
    }

    /**
     * Actualiza la información mostrada en el panel
     */
    actualizarDisplay() {
        this.actualizarInfoFase();
        this.actualizarTiempo();
        this.actualizarInfoTurno();
    }

    /**
     * Actualiza la información de fase y turno
     */
    actualizarInfoFase() {
        const faseNumero = document.querySelector('.fase-numero');
        const faseNombre = document.querySelector('.fase-nombre');
        const turnoNumero = document.querySelector('.turno-numero');

        if (faseNumero) faseNumero.textContent = `FASE ${this.obtenerNumeroFase()}`;
        if (faseNombre && this.estado.fase && typeof this.estado.fase === 'string') faseNombre.textContent = this.estado.fase.toUpperCase();
        if (turnoNumero && this.estado.fase === 'combate') {
            turnoNumero.textContent = this.estado.jugadorActual ? `TURNO: ${this.estado.jugadorActual.nombre || 'Jugador'}` : 'TURNO';
        } else if (turnoNumero) {
            turnoNumero.textContent = this.estado.turno || '1';
        }
    }

    /**
     * Actualiza la información de turno durante combate
     */
    actualizarInfoTurno() {
        if (this.estado.fase !== 'combate') return;

        const turnoInfo = document.querySelector('.turno-info');
        if (!turnoInfo) {
            // Crear elemento de información de turno si no existe
            const panel = document.getElementById('panelInferiorUnificado');
            if (panel) {
                const turnoDiv = document.createElement('div');
                turnoDiv.className = 'turno-info';
                turnoDiv.innerHTML = `
                    <div class="jugador-actual">Jugador: <span class="jugador-nombre">-</span></div>
                    <div class="equipo-actual">Equipo: <span class="equipo-nombre">-</span></div>
                `;
                panel.appendChild(turnoDiv);
            }
        }

        // Actualizar información
        const jugadorNombre = document.querySelector('.jugador-nombre');
        const equipoNombre = document.querySelector('.equipo-nombre');

        if (jugadorNombre && this.estado.jugadorActual) {
            jugadorNombre.textContent = this.estado.jugadorActual.nombre || 'Desconocido';
        }
        if (equipoNombre && this.estado.jugadorActual) {
            equipoNombre.textContent = this.estado.jugadorActual.equipo || 'Desconocido';
        }
    }

    /**
     * Muestra información específica de turno durante combate
     */
    mostrarInfoTurnoCombate() {
        this.actualizarInfoTurno();
        this.mostrarMensajeTemporary('Usa el menú radial para dar órdenes a tus unidades', 'info');
    }

    /**
     * Actualiza el display de tiempo
     */
    actualizarTiempo() {
        const tiempoValor = document.querySelector('.tiempo-valor');
        if (tiempoValor && this.estado.tiempoRestante) {
            tiempoValor.textContent = this.estado.tiempoRestante;
            
            // Cambiar color según tiempo restante
            const tiempoStr = String(this.estado.tiempoRestante);
            const minutos = parseInt(tiempoStr.split(':')[0]);
            
            if (!isNaN(minutos)) {
                if (minutos <= 2) {
                    tiempoValor.style.color = '#FF4444';
                    tiempoValor.style.textShadow = '0 0 10px rgba(255, 68, 68, 0.8)';
                } else if (minutos <= 5) {
                    tiempoValor.style.color = '#FFB800';
                    tiempoValor.style.textShadow = '0 0 10px rgba(255, 184, 0, 0.8)';
                } else {
                    tiempoValor.style.color = '#00FF00';
                    tiempoValor.style.textShadow = '0 0 5px rgba(0, 255, 0, 0.3)';
                }
            }
        }
    }

    /**
     * Obtiene el número de fase actual
     */
    obtenerNumeroFase() {
        const fases = {
            'PLANEAMIENTO': 1,
            'DESPLIEGUE': 2,
            'COMBATE': 3,
            'EVALUACION': 4
        };
        return fases[this.estado.fase] || 1;
    }

    /**
     * Avanza a la siguiente fase manualmente
     */
    avanzarFaseManual() {
        const fases = ['PLANEAMIENTO', 'DESPLIEGUE', 'COMBATE', 'EVALUACION'];
        const indiceActual = fases.indexOf(this.estado.fase);
        const siguienteFase = fases[(indiceActual + 1) % fases.length];
        
        this.cambiarFase(siguienteFase);
        
        if (siguienteFase === 'PLANEAMIENTO') {
            this.estado.turno++;
        }
    }

    /**
     * Cambia la fase actual
     */
    cambiarFase(nuevaFase) {
        this.estado.fase = nuevaFase;
        this.actualizarDisplay();
        
        console.log(`🎮 Fase cambiada a: ${nuevaFase}`);
        this.mostrarMensajeTemporary(`Fase: ${nuevaFase}`, 'success');

        // Comunicar cambio a otros sistemas
        if (window.gestorInterfaz && window.gestorInterfaz.actualizarInterfazFase) {
            window.gestorInterfaz.actualizarInterfazFase(nuevaFase);
        }
    }

    /**
     * Actualiza el estado del panel desde sistemas externos
     */
    actualizarEstado(nuevoEstado) {
        Object.assign(this.estado, nuevoEstado);
        this.actualizarDisplay();
    }

    /**
     * Muestra un mensaje temporal
     */
    mostrarMensajeTemporary(mensaje, tipo = 'info') {
        // Crear elemento de mensaje temporal
        const msgElement = document.createElement('div');
        msgElement.className = `mensaje-temporal ${tipo}`;
        msgElement.style.cssText = `
            position: fixed;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 2000;
            animation: fadeInOut 3s ease-in-out forwards;
        `;

        // Colores según tipo
        const colores = {
            'info': 'background: rgba(33, 150, 243, 0.9); color: white;',
            'success': 'background: rgba(76, 175, 80, 0.9); color: white;',
            'warning': 'background: rgba(255, 152, 0, 0.9); color: white;',
            'error': 'background: rgba(244, 67, 54, 0.9); color: white;'
        };

        msgElement.style.cssText += colores[tipo] || colores.info;
        msgElement.textContent = mensaje;

        document.body.appendChild(msgElement);

        // Remover después de 3 segundos
        setTimeout(() => {
            msgElement.remove();
        }, 3000);
    }

    /**
     * Oculta el panel
     */
    ocultar() {
        if (this.panel) {
            this.panel.classList.add('oculto');
        }
    }

    /**
     * Muestra el panel
     */
    mostrar() {
        if (this.panel) {
            this.panel.classList.remove('oculto');
        }
    }

    /**
     * Limpia elementos obsoletos que puedan estar generándose dinámicamente
     */
    limpiarElementosObsoletos() {
        // Elementos a eliminar por ID
        const elementosObsoletos = [
            'panel-vista-3d',
            'btn-vista-3d-tactica'
        ];

        elementosObsoletos.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                console.log(`🧹 Eliminando elemento obsoleto: ${id}`);
                elemento.remove();
            }
        });

        // Eliminar elementos por clase o atributos específicos
        const elementosPorClase = document.querySelectorAll('.btn-vista-3d, .panel-vista-3d');
        elementosPorClase.forEach(elemento => {
            console.log('🧹 Eliminando elemento obsoleto por clase');
            elemento.remove();
        });

        // Verificar periódicamente y eliminar si se vuelven a crear
        this.iniciarLimpiezaPeriodica();
    }

    /**
     * Inicia limpieza periódica de elementos obsoletos
     */
    iniciarLimpiezaPeriodica() {
        setInterval(() => {
            const panelObsoleto = document.getElementById('panel-vista-3d');
            if (panelObsoleto) {
                console.log('🧹 Limpieza automática: eliminando panel-vista-3d');
                panelObsoleto.remove();
            }
        }, 2000); // Verificar cada 2 segundos
    }

    // === NUEVAS FUNCIONES DINÁMICAS ===

    /**
     * Actualiza los controles según la fase actual del juego
     */
    actualizarControlesPorFase(fase = null, subFase = null) {
        const contenedor = document.getElementById('controlesPrincipales');
        if (!contenedor) return;

        // Obtener estado real del gestor de fases si está disponible
        let estadoReal = null;
        if (window.gestorFases) {
            estadoReal = {
                fase: window.gestorFases.fase,
                subFase: window.gestorFases.subfase,
                sectorConfirmado: window.gestorFases.sectorConfirmado,
                zonasDefinidas: window.gestorFases.zonasDefinidas || {},
                esDirector: window.gestorFases.esDirector(window.userId)
            };
            console.log('🎮 Estado real del gestor de fases:', estadoReal);
        }

        // Usar estado real si está disponible, sino usar parámetros o estado interno
        const faseActual = estadoReal?.fase || fase || this.estado.fase || 'preparacion';
        const subFaseActual = estadoReal?.subFase || subFase || this.estado.subFase || 'definicion_sector';

        // Actualizar estado interno para consistencia
        this.estado.fase = faseActual;
        this.estado.subFase = subFaseActual;

        console.log('🎛️ Actualizando controles para fase:', faseActual, 'subfase:', subFaseActual);

        let botones = [];

        switch(faseActual.toLowerCase()) {
            case 'preparacion':
            case 'planeamiento':
                // Solo mostrar botones si el usuario es director
                if (estadoReal && !estadoReal.esDirector) {
                    botones = [
                        { id: 'btnEsperando', icon: 'fa-clock', text: 'Esperando al director...', action: () => {} }
                    ];
                } else {
                    // Lógica progresiva basada en el estado real
                    if (!estadoReal?.sectorConfirmado) {
                        // Fase inicial: definir sector
                        botones = [
                            { id: 'btnDefinirSector', icon: 'fa-crosshairs', text: 'Delimitar Sector', action: () => this.definirSector() },
                            { id: 'btnConfirmarSector', icon: 'fa-check', text: 'Confirmar Sector', action: () => this.confirmarSector() }
                        ];
                    } else if (!estadoReal?.zonasDefinidas?.rojo || !estadoReal?.zonasDefinidas?.azul) {
                        // Sector confirmado, definir zonas
                        botones = [];
                        if (!estadoReal?.zonasDefinidas?.rojo) {
                            botones.push({ id: 'btnDefinirZonaRoja', icon: 'fa-square', text: 'Zona Roja', action: () => this.definirZonaRoja() });
                        }
                        if (!estadoReal?.zonasDefinidas?.azul) {
                            botones.push({ id: 'btnDefinirZonaAzul', icon: 'fa-square', text: 'Zona Azul', action: () => this.definirZonaAzul() });
                        }
                        botones.push({ id: 'btnConfirmarZonas', icon: 'fa-check', text: 'Confirmar Zonas', action: () => this.confirmarZonas() });
                    } else {
                        // Zonas definidas, pasar automáticamente a despliegue
                        console.log('🏁 Zonas completas, cambiando a despliegue...');
                        if (window.gestorFases) {
                            window.gestorFases.cambiarFase('preparacion', 'despliegue');
                        }
                        this.estado.fase = 'despliegue';
                        this.estado.subFase = 'inicial';
                        this.actualizarControlesPorFase();
                        return;
                    }
                }
                break;

            case 'despliegue':
                if (subFaseActual === 'esperando_equipos') {
                    botones = [
                        { id: 'btnEsperandoEquipos', icon: 'fa-clock', text: 'Esperando equipos...', action: () => {} }
                    ];
                } else {
                    // Solo confirmar despliegue - elementos se agregan desde menú "Agregar Elemento"
                    botones = [
                        { id: 'btnConfirmarDespliegue', icon: 'fa-check', text: 'Confirmar Despliegue', action: () => this.confirmarDespliegue() }
                    ];
                }
                // Mostrar elementos del jugador durante despliegue
                this.mostrarElementosJugador(true);
                break;

            case 'combate':
                // Solo terminar turno - órdenes se dan desde mapa/menú radial
                botones = [
                    { id: 'btnTerminarTurno', icon: 'fa-check', text: 'Terminar Turno', action: () => this.terminarTurno() }
                ];
                break;

            default:
                botones = [
                    { id: 'btnDefault', icon: 'fa-question', text: 'Estado Desconocido', action: () => {} }
                ];
        }

        // Limpiar contenedor y crear botones
        contenedor.innerHTML = '';
        botones.forEach(boton => {
            const btnElement = document.createElement('button');
            btnElement.id = boton.id;
            btnElement.className = 'btn-control-principal';
            btnElement.innerHTML = `<i class="${boton.icon}"></i><span>${boton.text}</span>`;
            btnElement.onclick = boton.action;
            contenedor.appendChild(btnElement);
        });

        console.log(`🎛️ Controles actualizados: ${botones.length} botones para ${faseActual}/${subFaseActual}`);
    }

    /**
     * Genera botones dinámicos en el contenedor de controles
     */
    generarBotonesDinamicos(botones) {
        const contenedor = document.getElementById('controlesPrincipales');
        if (!contenedor) return;

        contenedor.innerHTML = '';

        botones.forEach(boton => {
            const btnElement = document.createElement('button');
            btnElement.id = boton.id;
            btnElement.className = 'btn-control-principal';
            btnElement.innerHTML = `<i class="${boton.icon}"></i><span>${boton.text}</span>`;
            btnElement.onclick = boton.action;
            contenedor.appendChild(btnElement);
        });
    }

    /**
     * Muestra u oculta la barra de elementos del jugador
     */
    mostrarElementosJugador(mostrar) {
        const contenedor = document.getElementById('elementosJugadores');
        if (!contenedor) return;

        if (mostrar) {
            contenedor.classList.add('visible');
            this.cargarElementosJugador();
        } else {
            contenedor.classList.remove('visible');
        }
    }

    /**
     * Carga y muestra los elementos del jugador actual
     */
    cargarElementosJugador() {
        const contenedor = document.getElementById('elementosJugadores');
        if (!contenedor) return;

        // TODO: Conectar con gestorUnidades para obtener elementos reales
        // Por ahora, simulamos elementos basados en el equipo del jugador
        const equipoJugador = window.equipoJugador || 'azul';
        const elementos = this.obtenerElementosPorEquipo(equipoJugador);

        contenedor.innerHTML = '';

        if (elementos.length === 0) {
            contenedor.innerHTML = '<div class="no-elementos">No hay elementos disponibles</div>';
            return;
        }

        elementos.forEach(elemento => {
            const elementDiv = document.createElement('div');
            elementDiv.className = `elemento-jugador card ${elemento.estado} ${this.estado.fase === 'combate' ? 'combate-mode' : ''}`;
            elementDiv.id = elemento.id;
            elementDiv.onclick = () => this.seleccionarElemento(elemento.id);

            if (this.estado.fase === 'combate' || this.estado.fase === 'despliegue') {
                // Modo cards detalladas para combate y despliegue
                elementDiv.innerHTML = `
                    <div class="card-header">
                        <div class="elemento-icono">
                            <i class="fas ${elemento.icono}"></i>
                        </div>
                        <div class="elemento-cantidad">${elemento.cantidad}</div>
                        <div class="elemento-estado-badge ${elemento.estado}">${this.traducirEstado(elemento.estado)}</div>
                    </div>
                    <div class="card-body">
                        <div class="elemento-nombre">${elemento.nombre}</div>
                        <div class="elemento-tipo">${elemento.tipo}</div>
                        <div class="elemento-stats">
                            <div class="stat salud">
                                <i class="fas fa-heart"></i> ${elemento.salud}%
                            </div>
                            <div class="stat municion">
                                <i class="fas fa-bullet"></i> ${elemento.municion}%
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // Modo compacto para otras fases
                elementDiv.innerHTML = `
                    <div class="elemento-icono">
                        <i class="fas ${elemento.icono}"></i>
                    </div>
                    <div class="elemento-info">
                        <div class="elemento-nombre">${elemento.nombre}</div>
                        <div class="elemento-cantidad">${elemento.cantidad}</div>
                    </div>
                `;
            }

            contenedor.appendChild(elementDiv);
        });

        console.log(`📋 Cargados ${elementos.length} elementos para el equipo ${equipoJugador}`);
    }

    /**
     * Obtiene elementos del jugador desde el gestor de unidades
     * Los elementos se agregan durante la fase de despliegue desde el menú "Agregar Elemento"
     */
    obtenerElementosPorEquipo(equipo) {
        // Intentar obtener elementos reales del gestor de unidades
        if (window.gestorUnidades && window.gestorUnidades.obtenerUnidadesPorEquipo) {
            return window.gestorUnidades.obtenerUnidadesPorEquipo(equipo);
        }

        // Si no hay gestor disponible, intentar obtener desde sessionStorage
        try {
            const datosPartida = sessionStorage.getItem('datosPartidaActual');
            if (datosPartida) {
                const parsed = JSON.parse(datosPartida);
                const partida = parsed.partidaActual || parsed;
                if (partida.elementos && partida.elementos[equipo]) {
                    return partida.elementos[equipo];
                }
            }
        } catch (error) {
            console.warn('Error obteniendo elementos desde sessionStorage:', error);
        }

        // Retornar vacío - los elementos se agregan durante despliegue
        return [];
    }

    /**
     * Selecciona un elemento del jugador
     */
    seleccionarElemento(elementoId) {
        // Desseleccionar todos
        document.querySelectorAll('.elemento-jugador').forEach(el => {
            el.classList.remove('seleccionado');
        });

        // Seleccionar el actual
        const elemento = document.getElementById(elementoId);
        if (elemento) {
            elemento.classList.add('seleccionado');
            console.log(`🎯 Elemento seleccionado: ${elementoId}`);
            
            // Comunicar selección al mapa
            if (window.map && window.gestorElementos) {
                window.gestorElementos.seleccionarEnMapa(elementoId);
            }
        }
    }

    /**
     * Traduce estados de elementos a texto legible
     */
    traducirEstado(estado) {
        const traducciones = {
            'listo': 'Listo',
            'moviendo': 'En movimiento',
            'combate': 'En combate',
            'herido': 'Herido',
            'destruido': 'Destruido'
        };
        return traducciones[estado] || estado;
    }

    /**
     * Inicializa el minimapa
     */
    inicializarMinimapa() {
        const minimapa = document.querySelector('.minimapa');
        if (!minimapa) return;

        // El minimapa solo refleja la vista actual del mapa principal
        // Los controles de vista están en el menú principal (no duplicados)
        console.log('🗺️ Minimapa inicializado - sin controles duplicados');
    }

    /**
     * Configurar controles de vista eliminados - funcionalidad ya existe en menú principal
     * El minimapa solo muestra la vista actual sin controles duplicados
     */

    // === ACCIONES DE BOTONES DINÁMICOS ===

    definirSector() {
        console.log('🎯 Definiendo sector...');
        if (window.gestorFases && window.gestorFases.iniciarDefinicionSector) {
            window.gestorFases.iniciarDefinicionSector();
        }
        this.mostrarMensajeTemporary('Haz clic en el mapa para delimitar el sector', 'info');
    }

    confirmarSector() {
        console.log('✅ Confirmando sector...');
        if (window.gestorFases && window.gestorFases.confirmarSector) {
            window.gestorFases.confirmarSector();
        } else {
            // Transición automática a definición de zonas
            this.estado.subFase = 'definicion_zonas';
            this.actualizarControlesPorFase(this.estado.fase, this.estado.subFase);
        }
        this.mostrarMensajeTemporary('Sector confirmado - Define las zonas de despliegue', 'success');
    }

    definirZonaRoja() {
        console.log('🔴 Definiendo zona roja...');
        if (window.gestorFases && window.gestorFases.iniciarDefinicionZona) {
            window.gestorFases.iniciarDefinicionZona('rojo');
        }
        this.mostrarMensajeTemporary('Selecciona el área de la zona roja', 'info');
    }

    definirZonaAzul() {
        console.log('🔵 Definiendo zona azul...');
        if (window.gestorFases && window.gestorFases.iniciarDefinicionZona) {
            window.gestorFases.iniciarDefinicionZona('azul');
        }
        this.mostrarMensajeTemporary('Selecciona el área de la zona azul', 'info');
    }

    confirmarZonas() {
        console.log('🎯 Confirmando zonas...');
        if (window.gestorFases && window.gestorFases.confirmarZonas) {
            const resultado = window.gestorFases.confirmarZonas();
            if (resultado) {
                // Transición automática a despliegue
                this.estado.fase = 'despliegue';
                this.estado.subFase = 'inicial';
                this.actualizarControlesPorFase(this.estado.fase, this.estado.subFase);
                this.mostrarMensajeTemporary('Zonas confirmadas - Iniciando despliegue por equipos', 'success');
            }
        } else {
            // Fallback: cambiar fase localmente
            this.estado.fase = 'despliegue';
            this.estado.subFase = 'inicial';
            this.actualizarControlesPorFase(this.estado.fase, this.estado.subFase);
            this.mostrarMensajeTemporary('Zonas confirmadas - Iniciando despliegue por equipos', 'success');
        }
    }

    confirmarPlaneamiento() {
        console.log('✅ Confirmando planeamiento...');
        // Transición automática a fase de despliegue
        if (window.gestorFases && window.gestorFases.avanzarFase) {
            window.gestorFases.avanzarFase();
        } else {
            // Fallback: cambiar fase localmente
            this.estado.fase = 'despliegue';
            this.estado.subFase = 'inicial';
            this.actualizarControlesPorFase(this.estado.fase, this.estado.subFase);
        }
        this.mostrarMensajeTemporary('Planeamiento confirmado - Iniciando despliegue', 'success');
    }

    cancelarPlaneamiento() {
        console.log('❌ Cancelando planeamiento...');
        this.actualizarControlesPorFase('preparacion', 'inicial');
        this.mostrarMensajeTemporary('Planeamiento reiniciado', 'warning');
    }

    desplegarTropas() {
        console.log('👥 Desplegando tropas...');
        this.mostrarMensajeTemporary('Selecciona posiciones para tus unidades', 'info');
    }

    gestionarFormaciones() {
        console.log('🎖️ Gestionando formaciones...');
        this.mostrarMensajeTemporary('Panel de formaciones activado', 'info');
    }

    confirmarDespliegue() {
        console.log('✅ Confirmando despliegue del equipo...');

        // Verificar si estamos en modo local
        const modoJuego = window.gestorJuego?.estado?.modoJuego || 'local';

        if (modoJuego === 'local') {
            // En modo local, pasar directamente al combate
            console.log('🎮 Modo local: Iniciando combate directamente');
            this.mostrarMensajeTemporary('Despliegue confirmado - Iniciando combate', 'success');

            // Cambiar a fase de combate
            this.estado.fase = 'combate';
            this.estado.subFase = 'inicial';
            this.estado.turno = 1;

            // Inicializar primer turno
            if (window.gestorTurnos && window.gestorTurnos.iniciarCombate) {
                window.gestorTurnos.iniciarCombate();
            }

            // Actualizar interfaz
            this.actualizarControlesPorFase(this.estado.fase, this.estado.subFase);
            this.actualizarDisplay();

        } else {
            // Modo online: esperar confirmación de todos los equipos
            if (window.gestorFases && window.gestorFases.confirmarDespliegueEquipo) {
                window.gestorFases.confirmarDespliegueEquipo(window.equipoJugador);
            } else {
                this.mostrarMensajeTemporary('Despliegue confirmado - Esperando otros equipos...', 'info');
                this.estado.subFase = 'esperando_equipos';
                this.actualizarControlesPorFase(this.estado.fase, this.estado.subFase);
            }
        }
    }

    darOrdenes() {
        console.log('📢 Dando órdenes...');
        this.mostrarMensajeTemporary('Selecciona unidad y destino', 'info');
    }

    gestionBatalla() {
        console.log('⚔️ Gestión de batalla...');
        if (window.location.pathname.includes('juegodeguerra.html')) {
            window.location.href = 'gestionbatalla.html';
        }
    }

    pasarTurno() {
        console.log('⏭️ Pasando turno manualmente...');
        if (window.gestorTurnos && window.gestorTurnos.siguienteTurno) {
            window.gestorTurnos.siguienteTurno();
        } else if (window.gestorFases && window.gestorFases.pasarTurnoAutomatico) {
            window.gestorFases.pasarTurnoAutomatico();
        } else {
            this.mostrarMensajeTemporary('Pasando turno...', 'info');
        }
    }

    verResultados() {
        console.log('📊 Mostrando resultados...');
        this.mostrarMensajeTemporary('Calculando resultados de batalla...', 'info');
    }

    siguienteTurno() {
        console.log('⏭️ Siguiente turno...');
        this.estado.turno++;
        this.actualizarControlesPorFase('preparacion', 'inicial');
        this.actualizarDisplay();
        this.mostrarMensajeTemporary(`Turno ${this.estado.turno} iniciado`, 'success');
    }

    // === INTEGRACIÓN CON GESTORES REALES ===

    /**
     * Conecta con los gestores del sistema para obtener datos reales
     */
    conectarConGestores() {
        try {
            // Suscribirse a eventos del GestorFases
            if (window.gestorFases && window.gestorFases.emisorEventos) {
                window.gestorFases.emisorEventos.on('cambioFase', (fase, subfase) => {
                    console.log(`🎮 Evento cambioFase recibido: ${fase} - ${subfase}`);
                    this.actualizarEstado(fase, subfase);
                });
            }

            // Suscribirse a eventos del GestorTurnos
            if (window.gestorTurnos && window.gestorTurnos.emisorEventos) {
                window.gestorTurnos.emisorEventos.on('cambioTurno', (turno, jugador) => {
                    this.estado.turno = turno;
                    this.estado.jugadorActual = jugador;
                    this.actualizarDisplay();
                    console.log(`⏰ Turno actualizado: ${turno} - Jugador: ${jugador}`);
                });
            }

            // Suscribirse a eventos del GestorJuego
            if (window.gestorJuego && window.gestorJuego.emisorEventos) {
                window.gestorJuego.emisorEventos.on('estadoActualizado', (estado) => {
                    if (estado.fase || estado.subfase) {
                        this.actualizarEstado(estado.fase, estado.subfase, estado.turno);
                    }
                });
            }

            console.log('✅ Panel conectado con gestores del sistema');
        } catch (error) {
            console.error('❌ Error conectando con gestores:', error);
        }
    }

    /**
     * Obtiene el estado inicial de todos los gestores
     */
    obtenerEstadoInicialGestores() {
        // Obtener estado inicial del GestorFases
        if (window.gestorFases) {
            this.estado.fase = window.gestorFases.fase || 'preparacion';
            this.estado.subFase = window.gestorFases.subfase || 'definicion_sector';
        }

        // Obtener estado inicial del GestorTurnos
        if (window.gestorTurnos) {
            this.estado.turno = window.gestorTurnos.turnoActual || 1;
            this.estado.jugadorActual = window.gestorTurnos.jugadorActual || null;
            this.estado.tiempoRestante = this.formatearTiempo(window.gestorTurnos.tiempoRestante || 900); // 15 min por defecto
        }

        // Actualizar interfaz con datos reales
        this.actualizarControlesPorFase(this.estado.fase, this.estado.subFase);
        this.actualizarDisplay();
    }

    /**
     * Formatea tiempo en segundos a formato MM:SS
     */
    formatearTiempo(segundos) {
        const minutos = Math.floor(segundos / 60);
        const segs = segundos % 60;
        return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }

    /**
     * Actualiza elementos del jugador desde el gestor de unidades
     */
    actualizarElementosJugadorDesdeGestor(unidades) {
        const contenedor = document.getElementById('elementosJugadores');
        if (!contenedor || !unidades) return;

        contenedor.innerHTML = '';

        unidades.forEach(unidad => {
            const elementDiv = document.createElement('div');
            elementDiv.className = `elemento-jugador ${unidad.estado || 'listo'}`;
            elementDiv.id = unidad.id;
            elementDiv.innerHTML = `
                <div class="elemento-icono">
                    <i class="fas ${this.obtenerIconoUnidad(unidad.tipo)}"></i>
                </div>
                <div class="elemento-info">
                    <div class="elemento-nombre">${unidad.nombre || unidad.id}</div>
                    <div class="elemento-tipo">${unidad.tipo || 'Unidad'}</div>
                    <div class="elemento-estado">${this.traducirEstado(unidad.estado || 'listo')}</div>
                </div>
            `;
            
            elementDiv.addEventListener('click', () => {
                this.seleccionarElemento(unidad.id);
                // Comunicar selección al gestor de unidades
                if (window.gestorUnidades && window.gestorUnidades.seleccionarUnidad) {
                    window.gestorUnidades.seleccionarUnidad(unidad.id);
                }
            });
            
            contenedor.appendChild(elementDiv);
        });
    }

    /**
     * Obtiene el icono apropiado para cada tipo de unidad
     */
    obtenerIconoUnidad(tipo) {
        const iconos = {
            'infanteria': 'fa-users',
            'blindado': 'fa-tank',
            'artilleria': 'fa-cannon',
            'reconocimiento': 'fa-binoculars',
            'apoyo': 'fa-toolbox',
            'comando': 'fa-star',
            'defensa': 'fa-shield-alt'
        };
        return iconos[tipo?.toLowerCase()] || 'fa-circle';
    }

    /**
     * Sincroniza el estado del panel con un gestor específico
     */
    sincronizarConGestor(nombreGestor, estado) {
        if (!window[nombreGestor]) {
            console.warn(`⚠️ Gestor ${nombreGestor} no disponible`);
            return;
        }

        try {
            const gestor = window[nombreGestor];
            
            switch (nombreGestor) {
                case 'gestorFases':
                    if (estado.fase) this.estado.fase = estado.fase;
                    if (estado.subfase) this.estado.subFase = estado.subfase;
                    this.actualizarControlesPorFase(this.estado.fase, this.estado.subFase);
                    break;

                case 'gestorTurnos':
                    if (estado.turno) this.estado.turno = estado.turno;
                    if (estado.tiempoRestante) this.estado.tiempoRestante = this.formatearTiempo(estado.tiempoRestante);
                    if (estado.jugadorActual) this.estado.jugadorActual = estado.jugadorActual;
                    this.actualizarDisplay();
                    break;

                case 'gestorUnidades':
                    if (estado.unidades) this.actualizarElementosJugadorDesdeGestor(estado.unidades);
                    break;
            }

            console.log(`🔄 Sincronizado con ${nombreGestor}:`, estado);
        } catch (error) {
            console.error(`❌ Error al sincronizar con ${nombreGestor}:`, error);
        }
    }

    /**
     * Fuerza una actualización completa desde todos los gestores
     */
    forzarActualizacionCompleta() {
        console.log('🔄 Forzando actualización completa...');
        this.obtenerEstadoInicialGestores();
        
        // Actualizar elementos del jugador si hay unidades
        if (window.gestorUnidades && window.gestorUnidades.obtenerUnidades) {
            const unidades = window.gestorUnidades.obtenerUnidades();
            if (unidades && unidades.length > 0) {
                this.actualizarElementosJugadorDesdeGestor(unidades);
            }
        }
    }

    /**
     * Conecta el panel con los gestores cuando estén disponibles
     */
    conectarGestores() {
        console.log('🔗 Conectando Panel Inferior Unificado con gestores...');
        
        try {
            // Obtener estado inicial de todos los gestores
            this.obtenerEstadoInicialGestores();
            
            // Configurar listeners para cambios en gestores
            this.configurarListenersGestores();
            
            // Actualizar controles iniciales
            this.actualizarControlesPorFase('preparacion', 'inicial');
            
            console.log('✅ Panel Inferior Unificado conectado exitosamente');
        } catch (error) {
            console.error('❌ Error conectando panel con gestores:', error);
        }
    }

    /**
     * Configura listeners para eventos de los gestores
     */
    configurarListenersGestores() {
        console.log('👂 Configurando listeners para gestores...');
        
        // Listener para cambios de fase (evento personalizado)
        document.addEventListener('cambioFase', (event) => {
            console.log('📡 Panel recibió cambio de fase:', event.detail);
            this.actualizarControlesPorFase(event.detail.fase, event.detail.subfase);
        });
        
        // Listener para cambios de turno (evento personalizado)
        document.addEventListener('cambioTurno', (event) => {
            console.log('📡 Panel recibió cambio de turno:', event.detail);
            this.actualizarPanelTurno(event.detail);
        });
        
        // Listener para actualizaciones de unidades (evento personalizado)
        document.addEventListener('unidadesActualizadas', (event) => {
            console.log('📡 Panel recibió actualización de unidades:', event.detail?.length || 'datos');
            this.actualizarElementosJugadorDesdeGestor(event.detail);
        });
        
        console.log('✅ Listeners de gestores configurados');
    }

    /**
     * Actualiza el panel cuando cambia el turno
     */
    actualizarPanelTurno(datos) {
        console.log('🔄 Actualizando panel de turno:', datos);
        
        try {
            // Actualizar indicador de turno si existe
            const turnoElement = document.getElementById('turnoActual');
            if (turnoElement && datos.jugadorActual) {
                turnoElement.textContent = `Turno: ${datos.jugadorActual}`;
            }
            
            // Actualizar temporizador si existe
            const tiempoElement = document.getElementById('tiempoRestante');
            if (tiempoElement && datos.tiempoRestante) {
                tiempoElement.textContent = `Tiempo: ${datos.tiempoRestante}s`;
            }
            
            // Cambiar estilo visual según el turno del jugador actual
            this.actualizarEstiloTurno(datos.jugadorActual);
            
        } catch (error) {
            console.error('❌ Error actualizando panel de turno:', error);
        }
    }

    /**
     * Actualiza el estilo visual según el turno actual
     */
    actualizarEstiloTurno(jugadorActual) {
        const panel = document.getElementById('panelInferiorUnificado');
        if (!panel) return;
        
        // Remover clases de turno anteriores
        panel.classList.remove('turno-rojo', 'turno-azul', 'turno-espera');
        
        // Agregar clase según el turno
        if (jugadorActual) {
            if (jugadorActual.toLowerCase().includes('rojo')) {
                panel.classList.add('turno-rojo');
            } else if (jugadorActual.toLowerCase().includes('azul')) {
                panel.classList.add('turno-azul');
            }
        } else {
            panel.classList.add('turno-espera');
        }
    }

    /**
     * Actualiza el panel con el estado general del juego (llamado por gestorInterfaz)
     */
    actualizarEstadoJuego(estado) {
        console.log('🎮 Panel Inferior actualizando estado del juego:', estado);
        
        try {
            // Actualizar controles por fase si hay información de fase
            if (estado.fase && estado.subfase) {
                this.actualizarControlesPorFase(estado.fase, estado.subfase);
            }
            
            // Actualizar información de turno si existe
            if (estado.jugadorActual || estado.tiempoRestante) {
                this.actualizarPanelTurno({
                    jugadorActual: estado.jugadorActual,
                    tiempoRestante: estado.tiempoRestante
                });
            }
            
            // Actualizar elementos del jugador si hay unidades
            if (estado.unidades) {
                this.actualizarElementosJugadorDesdeGestor(estado.unidades);
            }
            
        } catch (error) {
            console.error('❌ Error actualizando estado del juego en panel:', error);
        }
    }
}

// Inicialización automática cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando Panel Inferior Unificado inmediatamente...');
    
    // Inicializar el panel inmediatamente
    window.panelInferiorUnificado = new PanelInferiorUnificado();
    if (window.panelInferiorUnificado.inicializar()) {
        console.log('✅ Panel Inferior Unificado inicializado (esperando gestores para conectar)');
        
        // Función para conectar con gestores cuando estén listos
        const conectarGestores = () => {
            const gestoresListos = 
                window.gestorFases && 
                window.gestorTurnos && 
                window.gestorJuego &&
                window.gestorInterfaz;

            if (gestoresListos) {
                console.log('✅ Gestores detectados, conectando Panel Inferior Unificado...');
                
                // Conectar el panel con los gestores
                if (window.panelInferiorUnificado && typeof window.panelInferiorUnificado.conectarGestores === 'function') {
                    window.panelInferiorUnificado.conectarGestores();
                }
                
                // Notificar a otros sistemas que el panel está listo
                window.dispatchEvent(new CustomEvent('panelInferiorListo', {
                    detail: { panel: window.panelInferiorUnificado }
                }));
                
                console.log('✅ Panel Inferior Unificado conectado y listo');
            } else {
                // Reintentar en 500ms
                setTimeout(conectarGestores, 500);
            }
        };
        
        // Iniciar conexión con gestores después de un breve delay
        setTimeout(conectarGestores, 100);
    } else {
        console.error('❌ Error inicializando Panel Inferior Unificado');
    }
});

// Agregar estilos para animaciones
const estilosAnimaciones = document.createElement('style');
estilosAnimaciones.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        20% { opacity: 1; transform: translateX(-50%) translateY(0); }
        80% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
`;
document.head.appendChild(estilosAnimaciones);

// Exportar para uso global
window.PanelInferiorUnificado = PanelInferiorUnificado;
