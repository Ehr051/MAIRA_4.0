/**
 * PANEL JUEGO UNIFICADO - MAIRA 4.0
 * =====================================
 * Reemplaza todos los paneles separados de turnos, fases, juego, etc.
 * UN SOLO PANEL DINÁMICO que cambia según el contexto del juego
 */

class PanelJuegoUnificado {
    constructor() {
        this.panel = null;
        this.contenido = null;
        this.header = null;
        this.estadoActual = null;
        this.datosJuego = {
            turno: 1,
            fase: 'planificacion',
            jugadorActivo: 'Jugador 1',
            tiempoRestante: 300,
            partida: null
        };
        
        // Datos del elemento/unidad seleccionada
        this.elementoSeleccionado = null;
        this.datosElemento = {
            tipo: null,
            nombre: null,
            combustible: 100,
            personal: 100,
            municion: 100,
            moral: 100,
            daños: 0,
            estado: 'operacional',
            posicion: null,
            comandante: null
        };
        
        this.inicializar();
        console.log('🎮 Panel Juego Unificado inicializado');
    }

    inicializar() {
        this.panel = document.getElementById('panelJuegoUnificado');
        if (!this.panel) {
            console.error('❌ Panel unificado no encontrado en HTML');
            return;
        }

        this.crearEstructura();
        this.configurarEventos();
    }

    crearEstructura() {
        this.panel.innerHTML = `
            <div class="header">
                <span class="titulo">Estado del Juego</span>
                <button class="cerrar" onclick="panelUnificado.ocultar()">✕</button>
            </div>
            <div class="contenido">
                <div id="contenido-dinamico">
                    <!-- Contenido dinámico según el estado -->
                </div>
            </div>
        `;

        this.header = this.panel.querySelector('.header .titulo');
        this.contenido = this.panel.querySelector('#contenido-dinamico');
    }

    configurarEventos() {
        // Detectar cambios de estado del juego
        document.addEventListener('cambioEstadoJuego', (event) => {
            this.actualizarEstado(event.detail);
        });

        // Detectar cambios de turno
        document.addEventListener('cambioTurno', (event) => {
            this.actualizarTurno(event.detail);
        });

        // Auto-ocultar al hacer clic fuera
        document.addEventListener('click', (event) => {
            if (this.panel.classList.contains('activo') && 
                !this.panel.contains(event.target) && 
                !event.target.closest('.mostrar-panel')) {
                this.ocultar();
            }
        });
    }

    mostrar(estado = 'general') {
        this.estadoActual = estado;
        this.panel.classList.add('activo');
        this.actualizarContenido();
    }

    ocultar() {
        this.panel.classList.remove('activo');
        this.estadoActual = null;
    }

    alternar(estado = 'general') {
        if (this.panel.classList.contains('activo') && this.estadoActual === estado) {
            this.ocultar();
        } else {
            this.mostrar(estado);
        }
    }

    actualizarContenido() {
        if (!this.estadoActual) return;

        switch (this.estadoActual) {
            case 'general':
                this.mostrarEstadoGeneral();
                break;
            case 'turno':
                this.mostrarControlTurno();
                break;
            case 'fase':
                this.mostrarControlFase();
                break;
            case 'partida':
                this.mostrarInfoPartida();
                break;
            case 'elemento':
                this.mostrarInfoElemento();
                break;
            case 'unidad':
                this.mostrarInfoUnidad();
                break;
            default:
                this.mostrarEstadoGeneral();
        }
    }

    mostrarEstadoGeneral() {
        this.header.textContent = 'Estado del Juego';
        
        this.contenido.innerHTML = `
            <div class="estado-turno">Turno ${this.datosJuego.turno}</div>
            
            <div class="info-item">
                <span class="info-label">Fase:</span>
                <span class="info-value">${this.capitalizarFase(this.datosJuego.fase)}</span>
            </div>
            
            <div class="info-item">
                <span class="info-label">Jugador Activo:</span>
                <span class="info-value">${this.datosJuego.jugadorActivo}</span>
            </div>
            
            <div class="reloj-turno">${this.formatearTiempo(this.datosJuego.tiempoRestante)}</div>
            
            <div class="botones-accion">
                <button class="boton-accion" onclick="panelUnificado.mostrar('turno')">
                    <i class="fas fa-clock"></i> Control de Turno
                </button>
                <button class="boton-accion" onclick="panelUnificado.mostrar('fase')">
                    <i class="fas fa-list"></i> Control de Fase
                </button>
                <button class="boton-accion" onclick="panelUnificado.mostrar('partida')">
                    <i class="fas fa-info-circle"></i> Info Partida
                </button>
            </div>
        `;
    }

    mostrarControlTurno() {
        this.header.textContent = 'Control de Turno';
        
        this.contenido.innerHTML = `
            <div class="estado-turno">Turno ${this.datosJuego.turno}</div>
            
            <div class="reloj-turno ${this.datosJuego.tiempoRestante < 60 ? 'tiempo-urgente' : ''}">
                ${this.formatearTiempo(this.datosJuego.tiempoRestante)}
            </div>
            
            <div class="info-item">
                <span class="info-label">Jugador Activo:</span>
                <span class="info-value">${this.datosJuego.jugadorActivo}</span>
            </div>
            
            <div class="botones-accion">
                <button class="boton-accion" onclick="this.pasarTurno()">
                    <i class="fas fa-forward"></i> Pasar Turno
                </button>
                <button class="boton-accion" onclick="this.extenderTiempo()">
                    <i class="fas fa-plus-circle"></i> +60 segundos
                </button>
                <button class="boton-accion peligro" onclick="this.finalizarTurno()">
                    <i class="fas fa-stop"></i> Finalizar Turno
                </button>
                <button class="boton-accion" onclick="panelUnificado.mostrar('general')">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
        `;
    }

    mostrarControlFase() {
        this.header.textContent = 'Control de Fase';
        
        const fases = ['planificacion', 'despliegue', 'combate', 'resolucion'];
        const faseActual = this.datosJuego.fase;
        
        this.contenido.innerHTML = `
            <div class="info-item">
                <span class="info-label">Fase Actual:</span>
                <span class="info-value">${this.capitalizarFase(faseActual)}</span>
            </div>
            
            <div style="margin: 20px 0;">
                <strong>Cambiar a:</strong>
            </div>
            
            <div class="botones-accion">
                ${fases.map(fase => `
                    <button class="boton-accion ${fase === faseActual ? 'activo' : ''}" 
                            onclick="this.cambiarFase('${fase}')"
                            ${fase === faseActual ? 'disabled' : ''}>
                        <i class="fas fa-${this.getIconoFase(fase)}"></i> ${this.capitalizarFase(fase)}
                    </button>
                `).join('')}
                
                <button class="boton-accion" onclick="panelUnificado.mostrar('general')">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
        `;
    }

    mostrarInfoPartida() {
        this.header.textContent = 'Información de Partida';
        
        this.contenido.innerHTML = `
            <div class="info-item">
                <span class="info-label">Código:</span>
                <span class="info-value">${this.datosJuego.partida?.codigo || 'N/A'}</span>
            </div>
            
            <div class="info-item">
                <span class="info-label">Jugadores:</span>
                <span class="info-value">${this.datosJuego.partida?.jugadores?.length || 0}</span>
            </div>
            
            <div class="info-item">
                <span class="info-label">Estado:</span>
                <span class="info-value">${this.datosJuego.partida?.estado || 'Desconocido'}</span>
            </div>
            
            <div class="botones-accion">
                <button class="boton-accion" onclick="this.guardarPartida()">
                    <i class="fas fa-save"></i> Guardar Partida
                </button>
                <button class="boton-accion" onclick="this.exportarEstado()">
                    <i class="fas fa-download"></i> Exportar Estado
                </button>
                <button class="boton-accion peligro" onclick="this.abandonarPartida()">
                    <i class="fas fa-sign-out-alt"></i> Abandonar Partida
                </button>
                <button class="boton-accion" onclick="panelUnificado.mostrar('general')">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
        `;
    }

    mostrarInfoElemento() {
        if (!this.elementoSeleccionado) {
            this.mostrarEstadoGeneral();
            return;
        }

        const datos = this.datosElemento;
        this.header.textContent = `${datos.tipo} - ${datos.nombre}`;
        
        this.contenido.innerHTML = `
            <div class="info-elemento-header">
                <div class="elemento-icono">
                    <i class="fas fa-${this.getIconoElemento(datos.tipo)}"></i>
                </div>
                <div class="elemento-estado ${datos.estado}">
                    ${this.capitalizarEstado(datos.estado)}
                </div>
            </div>

            <div class="seccion">
                <div class="seccion-titulo">Estado Operacional</div>
                
                <div class="barra-recurso combustible">
                    <div class="recurso-label">
                        <i class="fas fa-gas-pump"></i> Combustible
                    </div>
                    <div class="barra-progreso">
                        <div class="barra-fill" style="width: ${datos.combustible}%"></div>
                        <span class="barra-valor">${datos.combustible}%</span>
                    </div>
                </div>

                <div class="barra-recurso municion">
                    <div class="recurso-label">
                        <i class="fas fa-bomb"></i> Munición
                    </div>
                    <div class="barra-progreso">
                        <div class="barra-fill" style="width: ${datos.municion}%"></div>
                        <span class="barra-valor">${datos.municion}%</span>
                    </div>
                </div>

                <div class="barra-recurso personal">
                    <div class="recurso-label">
                        <i class="fas fa-users"></i> Personal
                    </div>
                    <div class="barra-progreso">
                        <div class="barra-fill" style="width: ${datos.personal}%"></div>
                        <span class="barra-valor">${datos.personal}%</span>
                    </div>
                </div>

                <div class="barra-recurso moral">
                    <div class="recurso-label">
                        <i class="fas fa-heart"></i> Moral
                    </div>
                    <div class="barra-progreso">
                        <div class="barra-fill" style="width: ${datos.moral}%"></div>
                        <span class="barra-valor">${datos.moral}%</span>
                    </div>
                </div>
            </div>

            <div class="seccion">
                <div class="seccion-titulo">Información Táctica</div>
                
                <div class="info-item">
                    <span class="info-label">Comandante:</span>
                    <span class="info-value">${datos.comandante || 'No asignado'}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Daños:</span>
                    <span class="info-value ${datos.daños > 50 ? 'critico' : datos.daños > 25 ? 'moderado' : 'normal'}">
                        ${datos.daños}%
                    </span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Posición:</span>
                    <span class="info-value">${datos.posicion ? `${datos.posicion.lat.toFixed(4)}, ${datos.posicion.lng.toFixed(4)}` : 'Desconocida'}</span>
                </div>
            </div>

            <div class="botones-accion">
                <button class="boton-accion" onclick="this.reabastecerElemento()">
                    <i class="fas fa-truck"></i> Reabastecer
                </button>
                <button class="boton-accion" onclick="this.repararElemento()">
                    <i class="fas fa-wrench"></i> Reparar
                </button>
                <button class="boton-accion" onclick="this.moverElemento()">
                    <i class="fas fa-arrows-alt"></i> Mover
                </button>
                <button class="boton-accion" onclick="panelUnificado.mostrar('general')">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
        `;
    }

    mostrarInfoUnidad() {
        // Similar a mostrarInfoElemento pero para unidades completas
        this.mostrarInfoElemento(); // Por ahora usa la misma lógica
    }

    // Métodos de actualización
    actualizarEstado(nuevoEstado) {
        Object.assign(this.datosJuego, nuevoEstado);
        if (this.panel.classList.contains('activo')) {
            this.actualizarContenido();
        }
    }

    actualizarTurno(datosTurno) {
        this.datosJuego.turno = datosTurno.numero;
        this.datosJuego.jugadorActivo = datosTurno.jugador;
        this.datosJuego.tiempoRestante = datosTurno.tiempo || 300;
        
        if (this.panel.classList.contains('activo')) {
            this.actualizarContenido();
        }
    }

    // Métodos de acción
    pasarTurno() {
        if (typeof window.gestorTurnos !== 'undefined') {
            window.gestorTurnos.pasarTurno();
        } else {
            console.log('🎮 Pasar turno solicitado');
            // Emitir evento para otros sistemas
            document.dispatchEvent(new CustomEvent('solicitarPasarTurno'));
        }
    }

    finalizarTurno() {
        if (confirm('¿Estás seguro de que quieres finalizar este turno?')) {
            this.pasarTurno();
        }
    }

    extenderTiempo() {
        this.datosJuego.tiempoRestante += 60;
        this.actualizarContenido();
        
        // Emitir evento para sincronizar con otros sistemas
        document.dispatchEvent(new CustomEvent('tiempoExtendido', {
            detail: { nuevoTiempo: this.datosJuego.tiempoRestante }
        }));
    }

    cambiarFase(nuevaFase) {
        this.datosJuego.fase = nuevaFase;
        this.actualizarContenido();
        
        // Emitir evento para otros sistemas
        document.dispatchEvent(new CustomEvent('cambioFase', {
            detail: { fase: nuevaFase }
        }));
    }

    // Métodos utilitarios
    capitalizarFase(fase) {
        const fases = {
            'planificacion': 'Planificación',
            'despliegue': 'Despliegue', 
            'combate': 'Combate',
            'resolucion': 'Resolución'
        };
        return fases[fase] || fase;
    }

    getIconoFase(fase) {
        const iconos = {
            'planificacion': 'clipboard-list',
            'despliegue': 'chess-board',
            'combate': 'fire',
            'resolucion': 'check-circle'
        };
        return iconos[fase] || 'circle';
    }

    formatearTiempo(segundos) {
        const minutos = Math.floor(segundos / 60);
        const segs = segundos % 60;
        return `${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
    }

    getIconoElemento(tipo) {
        const iconos = {
            'tanque': 'tank',
            'mecanizado': 'truck-military',
            'artilleria': 'cannon',
            'infanteria': 'running',
            'camion': 'truck',
            'helicoptero': 'helicopter',
            'avion': 'plane',
            'comando': 'star'
        };
        return iconos[tipo?.toLowerCase()] || 'square';
    }

    capitalizarEstado(estado) {
        const estados = {
            'operacional': 'Operacional',
            'dañado': 'Dañado',
            'critico': 'Crítico',
            'fuera_combate': 'Fuera de Combate',
            'en_reparacion': 'En Reparación'
        };
        return estados[estado] || estado;
    }

    // Métodos de interacción con elementos
    seleccionarElemento(elemento) {
        this.elementoSeleccionado = elemento;
        
        // Actualizar datos del elemento
        if (elemento && elemento.propiedades) {
            Object.assign(this.datosElemento, elemento.propiedades);
        }
        
        this.mostrar('elemento');
        
        console.log('🎯 Elemento seleccionado:', elemento);
    }

    reabastecerElemento() {
        if (!this.elementoSeleccionado) return;
        
        // Simular reabastecimiento
        this.datosElemento.combustible = Math.min(100, this.datosElemento.combustible + 25);
        this.datosElemento.municion = Math.min(100, this.datosElemento.municion + 30);
        
        this.actualizarContenido();
        
        // Emitir evento para otros sistemas
        document.dispatchEvent(new CustomEvent('elementoReabastecido', {
            detail: { elemento: this.elementoSeleccionado }
        }));
    }

    repararElemento() {
        if (!this.elementoSeleccionado) return;
        
        // Simular reparación
        this.datosElemento.daños = Math.max(0, this.datosElemento.daños - 20);
        if (this.datosElemento.daños === 0) {
            this.datosElemento.estado = 'operacional';
        }
        
        this.actualizarContenido();
        
        // Emitir evento para otros sistemas
        document.dispatchEvent(new CustomEvent('elementoReparado', {
            detail: { elemento: this.elementoSeleccionado }
        }));
    }

    moverElemento() {
        if (!this.elementoSeleccionado) return;
        
        // Activar modo de movimiento
        document.dispatchEvent(new CustomEvent('activarModoMovimiento', {
            detail: { elemento: this.elementoSeleccionado }
        }));
        
        this.ocultar();
        console.log('🚶 Modo movimiento activado para:', this.elementoSeleccionado);
    }
}

/**
 * CONTROLADOR DE HUD - Sistema profesional de interfaz
 */
class ControladorHUD {
    constructor() {
        this.hudOculto = false;
        this.inicializarEventos();
    }

    inicializarEventos() {
        // Tecla H para ocultar/mostrar HUD completo
        document.addEventListener('keydown', (event) => {
            if (event.key && event.key.toLowerCase() === 'h' && !event.ctrlKey && !event.altKey) {
                this.alternarHUD();
            }
        });

        // ESC para cerrar paneles
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (panelUnificado && panelUnificado.panel.classList.contains('activo')) {
                    panelUnificado.ocultar();
                }
            }
        });
    }

    alternarHUD() {
        this.hudOculto = !this.hudOculto;
        
        if (this.hudOculto) {
            document.body.classList.add('hud-oculto');
            console.log('🎮 HUD oculto - Vista completa del mapa');
        } else {
            document.body.classList.remove('hud-oculto');
            console.log('🎮 HUD visible - Controles disponibles');
        }
    }

    mostrarHUD() {
        this.hudOculto = false;
        document.body.classList.remove('hud-oculto');
    }

    ocultarHUD() {
        this.hudOculto = true;
        document.body.classList.add('hud-oculto');
    }
}

// Instancia global del panel unificado y controlador HUD
let panelUnificado;
let controladorHUD;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    panelUnificado = new PanelJuegoUnificado();
    controladorHUD = new ControladorHUD();
    
    // Crear botón de control HUD si no existe
    if (!document.querySelector('.hud-toggle')) {
        const botonHUD = document.createElement('button');
        botonHUD.className = 'hud-toggle';
        botonHUD.textContent = 'HUD ON/OFF';
        botonHUD.addEventListener('click', () => controladorHUD.alternarHUD());
        document.body.appendChild(botonHUD);
    }
    
    // Hacer disponible globalmente
    window.panelUnificado = panelUnificado;
    window.panelJuegoUnificado = panelUnificado; // Alias para compatibilidad
    window.controladorHUD = controladorHUD;
    
    console.log('✅ Sistema HUD profesional inicializado');
    console.log('💡 Presiona H para ocultar/mostrar HUD completo');
    console.log('💡 Presiona ESC para cerrar paneles');
});

// Funciones globales para compatibilidad
window.mostrarPanelUnificado = (estado = 'general') => {
    if (panelUnificado) panelUnificado.mostrar(estado);
};

window.ocultarPanelUnificado = () => {
    if (panelUnificado) panelUnificado.ocultar();
};

window.alternarHUD = () => {
    if (controladorHUD) controladorHUD.alternarHUD();
};

// Función para ser llamada desde menú radial
window.mostrarInformacionElemento = (elemento) => {
    if (panelUnificado) {
        panelUnificado.seleccionarElemento(elemento);
    }
};

// Función de prueba para forzar inicio de combate
window.forzarInicioCombate = () => {
    console.log('🛡️ FORZANDO INICIO DE COMBATE...');
    
    // Buscar gestorTurnos global
    if (window.gestorJuego?.gestorTurnos) {
        window.gestorJuego.gestorTurnos.transicionACombate();
        console.log('✅ Combate iniciado vía gestorTurnos');
    } else if (window.gestorTurnos) {
        window.gestorTurnos.transicionACombate();
        console.log('✅ Combate iniciado vía gestorTurnos global');
    } else {
        console.warn('⚠️ gestorTurnos no disponible');
        
        // Iniciar manualmente elementos básicos
        document.getElementById('indicador-turno').textContent = 'Turno 1 - COMBATE INICIADO';
        document.getElementById('timer-turno').textContent = '05:00';
        
        // Simular cambio de panel unificado
        if (window.panelUnificado) {
            window.panelUnificado.datosJuego.fase = 'combate';
            console.log('✅ Panel unificado actualizado a combate');
        }
    }
};

// Función para simular datos de ejemplo
window.simularElementoEjemplo = () => {
    const elementoEjemplo = {
        propiedades: {
            tipo: 'tanque',
            nombre: 'TAM-01 "Puma"',
            combustible: 65,
            personal: 85,
            municion: 40,
            moral: 92,
            daños: 15,
            estado: 'operacional',
            posicion: { lat: -34.6037, lng: -58.3816 },
            comandante: 'Tte. García, M.'
        }
    };
    
    window.mostrarInformacionElemento(elementoEjemplo);
};

// ⏸️ FUNCIÓN DESHABILITADA - No crear elementos automáticamente
window.crearElementosPrueba = () => {
    console.log('⏸️ Creación de elementos de prueba DESHABILITADA - Juego iniciará limpio');
    return;
    
    /*
    if (!window.sistemaZoom) {
        console.warn('⚠️ Sistema de zoom no inicializado aún');
        return;
    }
    
    const elementosPrueba = [
        {
            id: 'tank-001',
            tipo: 'tanque',
            nombre: 'TAM-01 "Puma"',
            posicion: [-34.6037, -58.3816],
            efectivos: '4/4',
            bando: 'azul',
            combustible: 85,
            municion: 60,
            daños: 5,
            estado: 'operacional'
        },
        {
            id: 'mech-001', 
            tipo: 'mecanizado',
            nombre: 'M-113 "Falcon"',
            posicion: [-34.6047, -58.3826],
            efectivos: '12/12',
            bando: 'azul',
            combustible: 45,
            municion: 75,
            daños: 25,
            estado: 'dañado'
        },
        {
            id: 'art-001',
            tipo: 'artilleria', 
            nombre: 'CITER "Thunder"',
            posicion: [-34.6027, -58.3806],
            efectivos: '8/8',
            bando: 'azul',
            combustible: 90,
            municion: 35,
            daños: 0,
            estado: 'operacional'
        },
        {
            id: 'inf-001',
            tipo: 'infanteria',
            nombre: 'Escuadra Alpha',
            posicion: [-34.6057, -58.3836], 
            efectivos: '9/12',
            bando: 'azul',
            combustible: 100,
            municion: 80,
            daños: 20,
            estado: 'operacional'
        }
    ];
    
    elementosPrueba.forEach(elemento => {
        window.sistemaZoom.agregarElemento(elemento.id, elemento);
    });
    
    console.log('🎮 Elementos de prueba creados:', elementosPrueba.length);
    */
};

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PanelJuegoUnificado, ControladorHUD };
}
