
/**
 * INTEGRACIÓN SISTEMA HUB - MAIRA 4.0
 * ===================================
 * Conecta el reloj central con los paneles unificados
 * y adapta el comportamiento para el nuevo enfoque
 */

class IntegracionSistemaHub {
    constructor() {
        this.relojCentral = null;
        this.panelUnificado = null;
        this.controlesMinimizados = null;
        
        this.inicializar();
        console.log('🔗 Integración Sistema HUB inicializada');
    }

    inicializar() {
        // Esperar a que los componentes estén listos
        this.esperarComponentes().then(() => {
            this.conectarComponentes();
            this.configurarEventos();
            this.crearControlesMinimizados();
            this.sincronizarEstados();
        });
    }

    async esperarComponentes() {
        // Esperar hasta que el reloj central esté disponible
        while (!window.relojCentral) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Esperar hasta que el panel unificado esté disponible
        while (!window.panelUnificado) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.relojCentral = window.relojCentral;
        this.panelUnificado = window.panelUnificado;
    }

    conectarComponentes() {
        // Conectar eventos del reloj con el panel
        this.relojCentral.elemento.addEventListener('click', (e) => {
            if (e.target.closest('.reloj-container')) {
                this.mostrarHubEstado();
            }
        });

        // Conectar cambios de fase con el reloj
        document.addEventListener('cambioFase', (e) => {
            this.relojCentral.setFase(e.detail.fase, e.detail.subfase);
        });

        // Conectar cambios de turno con el reloj
        document.addEventListener('cambioTurno', (e) => {
            this.relojCentral.setTurno(e.detail.turno, e.detail.jugador);
        });
    }

    configurarEventos() {
        // ESC para mostrar/ocultar HUB de estado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.toggleHubEstado();
            }
        });

        // Clicks en elementos del mapa para mostrar HUB de unidad
        document.addEventListener('unidadSeleccionada', (e) => {
            this.mostrarHubUnidad(e.detail);
        });

        // Click derecho para HUB de comandos
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('#mapa')) {
                e.preventDefault();
                this.mostrarHubComandos(e.clientX, e.clientY);
            }
        });

        // Sincronización con timer del juego
        if (window.gestorJuego?.gestorTurnos) {
            window.gestorJuego.gestorTurnos.onTiempoActualizado = (tiempo) => {
                this.relojCentral.setTiempo(tiempo);
            };
        }
    }

    crearControlesMinimizados() {
        // Crear botón flotante minimalista para acceso rápido a funciones
        this.controlesMinimizados = document.createElement('div');
        this.controlesMinimizados.id = 'controlesMinimizados';
        this.controlesMinimizados.className = 'controles-minimizados';
        
        this.controlesMinimizados.innerHTML = `
            <div class="controles-container">
                <button class="control-btn" onclick="integraHub.finalizarTurno()" title="Finalizar Turno">
                    <i class="fas fa-forward"></i>
                </button>
                <button class="control-btn" onclick="integraHub.mostrarOrdenes()" title="Órdenes (O)">
                    <i class="fas fa-clipboard-list"></i>
                </button>
                <button class="control-btn debug" onclick="integraHub.forzarCombate()" title="DEBUG: Forzar Combate">
                    <i class="fas fa-skull-crossbones"></i>
                </button>
            </div>
        `;

        // Agregar estilos
        this.agregarEstilosControles();
        
        document.body.appendChild(this.controlesMinimizados);
    }

    agregarEstilosControles() {
        const estilos = `
            .controles-minimizados {
                position: fixed;
                top: 50%;
                right: 20px;
                transform: translateY(-50%);
                z-index: var(--z-controles-mapa, 500);
                display: flex;
                flex-direction: column;
                gap: 8px;
                opacity: 0.7;
                transition: var(--transicion-normal, all 0.3s ease);
            }

            .controles-minimizados:hover {
                opacity: 1;
            }

            .control-btn {
                width: 48px;
                height: 48px;
                background: var(--bg-overlay-militar, rgba(10, 25, 47, 0.95));
                border: var(--border-militar, 1px solid #64ffda);
                border-radius: var(--radio-border, 8px);
                color: var(--color-militar-texto, #e6f1ff);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                transition: var(--transicion-rapida, all 0.2s ease);
                backdrop-filter: var(--blur-backdrop, blur(10px));
            }

            .control-btn:hover {
                background: var(--color-militar-acento, #64ffda);
                color: var(--color-militar-principal, #0a192f);
                transform: translateX(-4px);
                box-shadow: var(--sombra-militar, 0 4px 20px rgba(100, 255, 218, 0.3));
            }

            .control-btn.debug {
                border-color: var(--color-militar-rojo, #ff4444);
                opacity: 0.6;
            }

            .control-btn.debug:hover {
                background: var(--color-militar-rojo, #ff4444);
                color: white;
            }

            @media (max-width: 768px) {
                .controles-minimizados {
                    right: 10px;
                    bottom: 100px;
                    top: auto;
                    transform: none;
                    flex-direction: row;
                }
                
                .control-btn {
                    width: 40px;
                    height: 40px;
                    font-size: 14px;
                }
            }
        `;

        if (!document.getElementById('estilosControlesMinimizados')) {
            const style = document.createElement('style');
            style.id = 'estilosControlesMinimizados';
            style.textContent = estilos;
            document.head.appendChild(style);
        }
    }

    // Métodos públicos para controlar HUBs
    mostrarHubEstado() {
        this.panelUnificado.mostrar('estado');
        this.panelUnificado.actualizarContenido({
            tipo: 'estado',
            turno: this.relojCentral.datos.turno,
            jugador: this.relojCentral.datos.jugadorActivo,
            fase: this.relojCentral.datos.fase,
            subfase: this.relojCentral.datos.subfase,
            tiempo: this.relojCentral.datos.tiempoRestante
        });
    }

    toggleHubEstado() {
        if (this.panelUnificado.panel.classList.contains('activo')) {
            this.panelUnificado.ocultar();
        } else {
            this.mostrarHubEstado();
        }
    }

    mostrarHubUnidad(datosUnidad) {
        this.panelUnificado.mostrar('unidad');
        this.panelUnificado.actualizarContenido({
            tipo: 'unidad',
            ...datosUnidad
        });
    }

    mostrarHubComandos(x, y) {
        this.panelUnificado.mostrar('comandos');
        this.panelUnificado.posicionarEn(x, y);
        this.panelUnificado.actualizarContenido({
            tipo: 'comandos',
            posicion: { x, y }
        });
    }

    // Métodos de control del juego
    finalizarTurno() {
        if (window.gestorJuego?.gestorTurnos) {
            window.gestorJuego.gestorTurnos.finalizarTurno();
        } else {
            console.log('🎮 Simulando finalización de turno...');
            // Simular cambio de turno
            const nuevoTurno = this.relojCentral.datos.turno + 1;
            const nuevoJugador = this.relojCentral.datos.jugadorActivo === 'Jugador 1' ? 'Jugador 2' : 'Jugador 1';
            
            document.dispatchEvent(new CustomEvent('cambioTurno', {
                detail: { turno: nuevoTurno, jugador: nuevoJugador }
            }));
            
            // Resetear timer
            this.relojCentral.setTiempo(300);
        }
    }

    mostrarOrdenes() {
        this.panelUnificado.mostrar('ordenes');
        this.panelUnificado.actualizarContenido({
            tipo: 'ordenes',
            ordenes: ['Mover a posición', 'Establecer defensa', 'Reconocimiento']
        });
    }

    forzarCombate() {
        if (typeof forzarInicioCombate === 'function') {
            forzarInicioCombate();
        } else {
            console.log('🎯 DEBUG: Forzando inicio de combate...');
            document.dispatchEvent(new CustomEvent('cambioFase', {
                detail: { fase: 'Combate', subfase: 'Movimiento' }
            }));
        }
    }

    sincronizarEstados() {
        // Sincronizar estado inicial con datos existentes del juego
        if (window.gestorJuego) {
            const estadoJuego = window.gestorJuego.obtenerEstado?.() || {};
            
            if (estadoJuego.turno) {
                this.relojCentral.setTurno(estadoJuego.turno, estadoJuego.jugadorActivo);
            }
            
            if (estadoJuego.fase) {
                this.relojCentral.setFase(estadoJuego.fase, estadoJuego.subfase);
            }
            
            if (estadoJuego.tiempoRestante) {
                this.relojCentral.setTiempo(estadoJuego.tiempoRestante);
            }
        }
    }

    destruir() {
        if (this.controlesMinimizados) {
            this.controlesMinimizados.remove();
        }
        
        const estilos = document.getElementById('estilosControlesMinimizados');
        if (estilos) estilos.remove();
    }
}

// Instancia global
let integraHub = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        integraHub = new IntegracionSistemaHub();
    }, 1000); // Dar tiempo a que otros componentes se inicialicen
});

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntegracionSistemaHub;
}
