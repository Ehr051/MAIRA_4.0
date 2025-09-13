/**
 * RELOJ CENTRAL FIJO - MAIRA 4.0
 * =============================
 * Componente siempre visible en la parte superior central
 * Reemplaza los indicadores dispersos de turno/timer
 */

class RelojCentralFijo {
    constructor() {
        this.elemento = null;
        this.timerInterval = null;
        this.datos = {
            turno: 1,
            jugadorActivo: 'Jugador 1',
            fase: 'Planificación',
            subfase: 'Despliegue',
            tiempoRestante: 300, // segundos
            timerActivo: false
        };
        
        this.inicializar();
        console.log('🕒 Reloj Central Fijo inicializado');
    }

    inicializar() {
        this.crearElemento();
        this.posicionar();
        this.actualizar();
        this.configurarEventos();
    }

    crearElemento() {
        // Remover reloj existente si existe
        const existente = document.getElementById('relojCentralFijo');
        if (existente) existente.remove();

        this.elemento = document.createElement('div');
        this.elemento.id = 'relojCentralFijo';
        this.elemento.className = 'reloj-central-fijo';
        
        this.elemento.innerHTML = `
            <div class="reloj-container">
                <div class="reloj-principal">
                    <div class="turno-info">
                        <span class="turno-numero">Turno ${this.datos.turno}</span>
                        <span class="jugador-activo">${this.datos.jugadorActivo}</span>
                    </div>
                    <div class="fase-info">
                        <span class="fase-actual">${this.datos.fase}</span>
                        <span class="subfase-actual">${this.datos.subfase}</span>
                    </div>
                    <div class="timer-info">
                        <span class="tiempo-restante" id="tiempoRestante">05:00</span>
                        <!-- ✅ Botón play eliminado - tiempo controlado por gestor de turnos -->
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.elemento);
    }

    posicionar() {
        const estilos = `
            .reloj-central-fijo {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 900;
                background: rgba(0, 20, 40, 0.9);
                border: 2px solid #4a90e2;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
                backdrop-filter: blur(5px);
                font-family: 'Courier New', monospace;
                user-select: none;
                transition: all 0.3s ease;
                /* ✅ Reposicionado abajo, z-index menor para no tapar menús */
            }

            .reloj-central-fijo:hover {
                background: var(--color-militar-secundario, rgba(0, 25, 50, 0.98));
                border-color: var(--color-militar-acento-hover, #5aa3f0);
                box-shadow: var(--sombra-militar-intensa, 0 6px 25px rgba(74, 144, 226, 0.4));
            }

            .reloj-container {
                padding: 8px 16px;
            }

            .reloj-principal {
                display: flex;
                align-items: center;
                gap: 16px;
                color: #ffffff;
                font-size: 12px;
            }

            .turno-info {
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 80px;
            }

            .turno-numero {
                font-weight: bold;
                font-size: 14px;
                color: #4a90e2;
            }

            .jugador-activo {
                font-size: 10px;
                color: #a0c4ff;
            }

            .fase-info {
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 100px;
                border-left: 1px solid #4a90e2;
                border-right: 1px solid #4a90e2;
                padding: 0 12px;
            }

            .fase-actual {
                font-weight: bold;
                font-size: 13px;
                color: #ffd700;
                text-transform: uppercase;
            }

            .subfase-actual {
                font-size: 10px;
                color: #ffea80;
            }

            .timer-info {
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 70px;
                /* ✅ Centrado sin botón */
            }

            .tiempo-restante {
                font-weight: bold;
                font-size: 16px;
                color: #00ff88;
                font-family: 'Courier New', monospace;
            }

            .tiempo-restante.warning {
                color: #ff9500;
                animation: pulse 1s infinite;
            }

            .tiempo-restante.critical {
                color: #ff4444;
                animation: pulse 0.5s infinite;
            }

            .btn-timer {
                background: transparent;
                border: 1px solid #4a90e2;
                color: #4a90e2;
                border-radius: 4px;
                padding: 4px 6px;
                cursor: pointer;
                font-size: 10px;
                transition: all 0.2s ease;
            }

            .btn-timer:hover {
                background: #4a90e2;
                color: white;
            }

            .btn-timer.active {
                background: #00ff88;
                border-color: #00ff88;
                color: #000;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }

            /* Responsive */
            @media (max-width: 768px) {
                .reloj-central-fijo {
                    top: 50px;
                    transform: translateX(-50%) scale(0.9);
                }
                
                .reloj-principal {
                    gap: 12px;
                }
            }
        `;

        // Agregar estilos si no existen
        if (!document.getElementById('estilosRelojCentral')) {
            const style = document.createElement('style');
            style.id = 'estilosRelojCentral';
            style.textContent = estilos;
            document.head.appendChild(style);
        }
    }

    actualizar() {
        if (!this.elemento) return;

        const turnoNumero = this.elemento.querySelector('.turno-numero');
        const jugadorActivo = this.elemento.querySelector('.jugador-activo');
        const faseActual = this.elemento.querySelector('.fase-actual');
        const subfaseActual = this.elemento.querySelector('.subfase-actual');
        const tiempoRestante = this.elemento.querySelector('.tiempo-restante');
        const btnTimer = this.elemento.querySelector('.btn-timer');

        if (turnoNumero) turnoNumero.textContent = `Turno ${this.datos.turno}`;
        if (jugadorActivo) jugadorActivo.textContent = this.datos.jugadorActivo;
        if (faseActual) faseActual.textContent = this.datos.fase;
        if (subfaseActual) subfaseActual.textContent = this.datos.subfase;
        
        if (tiempoRestante) {
            const minutos = Math.floor(this.datos.tiempoRestante / 60);
            const segundos = this.datos.tiempoRestante % 60;
            tiempoRestante.textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
            
            // Cambiar color según tiempo restante
            tiempoRestante.className = 'tiempo-restante';
            if (this.datos.tiempoRestante <= 30) {
                tiempoRestante.classList.add('critical');
            } else if (this.datos.tiempoRestante <= 60) {
                tiempoRestante.classList.add('warning');
            }
        }

        if (btnTimer) {
            const icon = btnTimer.querySelector('i');
            if (this.datos.timerActivo) {
                icon.className = 'fas fa-pause';
                btnTimer.classList.add('active');
            } else {
                icon.className = 'fas fa-play';
                btnTimer.classList.remove('active');
            }
        }
    }

    configurarEventos() {
        // Escuchar eventos del juego para actualizar datos
        document.addEventListener('cambioTurno', (e) => {
            this.datos.turno = e.detail.turno;
            this.datos.jugadorActivo = e.detail.jugador;
            this.actualizar();
        });

        document.addEventListener('cambioFase', (e) => {
            this.datos.fase = e.detail.fase;
            this.datos.subfase = e.detail.subfase || '';
            this.actualizar();
        });

        document.addEventListener('actualizarTimer', (e) => {
            this.datos.tiempoRestante = e.detail.tiempo;
            this.actualizar();
        });
    }

    // Métodos públicos para controlar el reloj
    setTurno(turno, jugador) {
        this.datos.turno = turno;
        this.datos.jugadorActivo = jugador;
        this.actualizar();
    }

    setFase(fase, subfase = '') {
        this.datos.fase = fase;
        this.datos.subfase = subfase;
        this.actualizar();
    }

    setTiempo(segundos) {
        this.datos.tiempoRestante = Math.max(0, segundos);
        this.actualizar();
    }

    toggleTimer() {
        this.datos.timerActivo = !this.datos.timerActivo;
        
        if (this.datos.timerActivo) {
            this.iniciarTimer();
        } else {
            this.pararTimer();
        }
    }

    iniciarTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            if (this.datos.tiempoRestante > 0) {
                this.datos.tiempoRestante--;
                this.actualizar();
            } else {
                this.pararTimer();
                // Emitir evento de tiempo agotado
                document.dispatchEvent(new CustomEvent('tiempoAgotado', {
                    detail: { turno: this.datos.turno, jugador: this.datos.jugadorActivo }
                }));
            }
        }, 1000);
    }

    pararTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.datos.timerActivo = false;
        this.actualizar();
    }

    destruir() {
        this.pararTimer();
        if (this.elemento) {
            this.elemento.remove();
        }
        const estilos = document.getElementById('estilosRelojCentral');
        if (estilos) estilos.remove();
    }
}

// Instancia global
let relojCentral = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    relojCentral = new RelojCentralFijo();
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RelojCentralFijo;
}
