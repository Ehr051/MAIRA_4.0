class GestorCarga extends GestorBase {
    constructor() {
        super();
        this.estado = {
            cargando: false,
            progreso: 0,
            mensaje: '',
            tareaActual: '',
            totalTareas: 0,
            tareasCompletadas: 0,
            errores: [],
            tiempoInicio: null,
            tiempoMinimo: 3000 // 3 segundos mínimo de carga
        };

        this.contenedor = null;
        this.progresoBarra = null;
        this.textoMensaje = null; 
        this.timeoutOcultar = null;
    }

    async ocultar() {
        if (!this.estado.cargando) return;

        const tiempoTranscurrido = Date.now() - this.estado.tiempoInicio;
        const tiempoRestante = Math.max(0, this.estado.tiempoMinimo - tiempoTranscurrido);

        if (tiempoRestante > 0) {
            await new Promise(resolve => {
                this.timeoutOcultar = setTimeout(resolve, tiempoRestante);
            });
        }

        this.estado.cargando = false;
        const duracion = Math.floor((Date.now() - this.estado.tiempoInicio) / 1000);
        this.emisorEventos.emit('cargaFinalizada', { duracion });

        if (this.contenedor) {
            this.contenedor.style.opacity = '0';
            setTimeout(() => {
                if (!this.estado.cargando) {
                    this.contenedor.style.display = 'none';
                }
            }, 500);
        }
    }

    mostrar(mensaje = 'Cargando...') {
        if (this.timeoutOcultar) {
            clearTimeout(this.timeoutOcultar);
            this.timeoutOcultar = null;
        }
    
        this.estado = {
            ...this.estado,
            cargando: true,
            mensaje,
            tiempoInicio: Date.now(),
            progreso: 0
        };
    
        if (this.contenedor) {
            this.contenedor.style.display = 'flex'; // Explícitamente flex, no solo 'block'
            this.contenedor.style.opacity = '1';
            this.actualizarInterfaz();
        }
    
        this.emisorEventos.emit('cargaIniciada', { mensaje });
    }

    destruir() {
        if (this.timeoutOcultar) {
            clearTimeout(this.timeoutOcultar);
        }
        super.destruir();
    }

    async inicializar() {
        console.log('Inicializando GestorCarga...');
        
        this.configurarEventos();
        
        this.contenedor = document.querySelector('.loading-container');
        // Ahora progresoBarra apunta directamente al elemento con id "progreso"
        this.progresoBarra = document.getElementById('progreso');
        this.textoMensaje = document.getElementById('loadingText');
        this.porcentajeTexto = document.getElementById('porcentajeCarga');
    
        if (!this.contenedor || !this.progresoBarra || !this.textoMensaje) {
            console.error('No se encontraron todos los elementos de carga necesarios');
            return false;
        }
    
        this.contenedor.classList.add('con-transicion');
        this.ocultar();
        
        return true;
    }

    configurarEventos() {
        this.emisorEventos.on('cargaFinalizada', (datos) => {
            console.log('Carga finalizada, duración:', datos.duracion, 'segundos');
            if (this.contenedor) {
                this.ocultar();
            }
        });
    }

    actualizarProgreso(porcentaje, tarea = '') {
        console.log(`Actualizando progreso: ${porcentaje}%, tarea: ${tarea}`);
        
        this.estado.progreso = Math.min(100, Math.max(0, porcentaje));
        
        if (tarea) {
            this.estado.tareaActual = tarea;
        }
    
        // El elemento con id "progreso" ahora es la barra de progreso
        if (this.progresoBarra) {
            this.progresoBarra.style.transition = 'width 0.3s ease-out';
            this.progresoBarra.style.width = `${this.estado.progreso}%`;
            
            // Actualiza también el texto del porcentaje
            const porcentajeTexto = document.getElementById('porcentajeCarga');
            if (porcentajeTexto) {
                porcentajeTexto.textContent = `${Math.round(this.estado.progreso)}%`;
            }
        }
    
        this.actualizarInterfaz();
        
        this.emisorEventos.emit('progresoActualizado', {
            progreso: this.estado.progreso,
            tarea: this.estado.tareaActual
        });
    }

    actualizarInterfaz() {
        if (this.progresoBarra) {
            this.progresoBarra.style.width = `${this.estado.progreso}%`;
        }
        if (this.porcentajeTexto) {
            this.porcentajeTexto.textContent = `${Math.round(this.estado.progreso)}%`;
        }
        if (this.textoMensaje) {
            this.textoMensaje.textContent = this.estado.tareaActual || this.estado.mensaje;
        }
    }

    obtenerDuracionCarga() {
        if (!this.estado.tiempoInicio) {
            return 0;
        }
        const duracion = Date.now() - this.estado.tiempoInicio;
        return Math.round(duracion / 1000);
    }

    resetearEstado() {
        this.estado = {
            cargando: false,
            progreso: 0,
            mensaje: '',
            tareaActual: '',
            totalTareas: 0,
            tareasCompletadas: 0,
            errores: [],
            tiempoInicio: null,
            tiempoMinimo: 3000
        };
    }
}

window.GestorCarga = GestorCarga;