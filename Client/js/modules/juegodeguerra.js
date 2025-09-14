/**
 * MAIRA 4.0 - Módulo de Juego de Guerra
 * Funciones extraídas de juegodeguerra.html para arquitectura modular
 */

class SistemaJuegoGuerra {
    constructor() {
        this.configuracion = {
            modoZoom: 'estrategico',
            nivelZoom: 1,
            panelActivo: null,
            faseActual: 'preparacion',
            turnoActual: 1
        };
        
        this.gestores = {
            interfaz: null,
            fases: null,
            turnos: null,
            paneles: null
        };
        
        this.inicializado = false;
    }

    /**
     * Inicializa el sistema de juego de guerra
     */
    inicializar() {
        try {
            console.log('⚔️ Inicializando Sistema de Juego de Guerra...');
            
            // Verificar dependencias
            this.verificarDependencias();
            
            // Configurar eventos
            this.configurarEventos();
            
            // Inicializar gestores
            this.inicializarGestores();
            
            // Configurar sistema de paneles
            this.configurarSistemaPaneles();
            
            this.inicializado = true;
            console.log('✅ Sistema de Juego de Guerra inicializado');
            
            return true;
        } catch (error) {
            console.error('❌ Error inicializando Sistema de Juego de Guerra:', error);
            throw error;
        }
    }

    /**
     * Verifica que las dependencias estén disponibles
     */
    verificarDependencias() {
        const dependencias = [
            'L', // Leaflet
            'THREE', // Three.js
            'jQuery',
            'window.JuegoDeGuerra'
        ];
        
        const faltantes = dependencias.filter(dep => {
            const existe = dep.split('.').reduce((obj, key) => obj && obj[key], window);
            return !existe;
        });
        
        if (faltantes.length > 0) {
            console.warn('⚠️ Dependencias faltantes:', faltantes);
        }
    }

    /**
     * Configura eventos específicos del juego de guerra
     */
    configurarEventos() {
        // Control por gestos
        const btnControlGestos = document.getElementById('btnControlGestos');
        if (btnControlGestos) {
            btnControlGestos.addEventListener('click', (e) => {
                e.preventDefault();
                this.descargarDetectorGestos();
            });
        }

        // Eventos de cambio de fase
        document.addEventListener('faseCambiada', (event) => {
            this.manejarCambioFase(event.detail);
        });

        // Eventos de zoom
        document.addEventListener('zoomCambiado', (event) => {
            this.manejarCambioZoom(event.detail);
        });

        console.log('✅ Eventos de juego de guerra configurados');
    }

    /**
     * Inicializa los gestores del juego
     */
    inicializarGestores() {
        // Integrar con gestores existentes
        if (window.GestorInterfaz) {
            this.gestores.interfaz = window.GestorInterfaz;
        }
        
        if (window.GestorFases) {
            this.gestores.fases = window.GestorFases;
        }
        
        if (window.GestorTurnos) {
            this.gestores.turnos = window.GestorTurnos;
        }

        console.log('✅ Gestores integrados:', Object.keys(this.gestores));
    }

    /**
     * Configura el sistema de paneles unificado
     */
    configurarSistemaPaneles() {
        if (typeof inicializarSistemaPaneles === 'function') {
            try {
                this.gestores.paneles = inicializarSistemaPaneles('game-container');
                console.log('✅ Sistema de paneles configurado para juego de guerra');
                
                // Activar panel por defecto
                this.gestores.paneles.activarPanel('mapa');
                
            } catch (error) {
                console.warn('⚠️ Error configurando sistema de paneles:', error);
            }
        }
    }

    /**
     * Maneja cambios de fase del juego
     */
    manejarCambioFase(nuevaFase) {
        this.configuracion.faseActual = nuevaFase;
        
        // Actualizar interfaz según la fase
        switch (nuevaFase) {
            case 'preparacion':
                this.configurarInterfazPreparacion();
                break;
            case 'reconocimiento':
                this.configurarInterfazReconocimiento();
                break;
            case 'combate':
                this.configurarInterfazCombate();
                break;
            case 'consolidacion':
                this.configurarInterfazConsolidacion();
                break;
        }
        
        console.log(`🎯 Fase cambiada a: ${nuevaFase}`);
    }

    /**
     * Maneja cambios de zoom
     */
    manejarCambioZoom(nuevoZoom) {
        this.configuracion.nivelZoom = nuevoZoom.nivel;
        this.configuracion.modoZoom = nuevoZoom.modo;
        
        // Ajustar interfaz según el zoom
        this.ajustarInterfazSegunZoom(nuevoZoom);
        
        console.log(`🔍 Zoom cambiado: ${nuevoZoom.modo} (${nuevoZoom.nivel})`);
    }

    /**
     * Configura interfaz para fase de preparación
     */
    configurarInterfazPreparacion() {
        // Mostrar herramientas de planeamiento
        this.mostrarHerramientasPlaneamiento();
        
        // Habilitar edición de unidades
        this.habilitarEdicionUnidades(true);
        
        // Panel recomendado: planeamiento
        if (this.gestores.paneles) {
            this.gestores.paneles.activarPanel('unidades');
        }
    }

    /**
     * Configura interfaz para fase de reconocimiento
     */
    configurarInterfazReconocimiento() {
        // Mostrar herramientas de reconocimiento
        this.mostrarHerramientasReconocimiento();
        
        // Panel recomendado: inteligencia
        if (this.gestores.paneles) {
            this.gestores.paneles.activarPanel('inteligencia');
        }
    }

    /**
     * Configura interfaz para fase de combate
     */
    configurarInterfazCombate() {
        // Mostrar herramientas de combate
        this.mostrarHerramientasCombate();
        
        // Restringir edición de unidades
        this.habilitarEdicionUnidades(false);
        
        // Panel recomendado: comunicaciones
        if (this.gestores.paneles) {
            this.gestores.paneles.activarPanel('comunicaciones');
        }
    }

    /**
     * Configura interfaz para fase de consolidación
     */
    configurarInterfazConsolidacion() {
        // Mostrar herramientas de evaluación
        this.mostrarHerramientasEvaluacion();
        
        // Panel recomendado: informes
        if (this.gestores.paneles) {
            this.gestores.paneles.activarPanel('informes');
        }
    }

    /**
     * Ajusta interfaz según el nivel de zoom
     */
    ajustarInterfazSegunZoom(zoom) {
        switch (zoom.modo) {
            case 'estrategico':
                this.mostrarElementosEstrategicos();
                break;
            case 'operacional':
                this.mostrarElementosOperacionales();
                break;
            case 'tactico':
                this.mostrarElementosTacticos();
                break;
        }
    }

    /**
     * Muestra herramientas de planeamiento
     */
    mostrarHerramientasPlaneamiento() {
        const herramientas = [
            'crear-unidad',
            'crear-objetivo',
            'trazar-ruta',
            'zona-operacion'
        ];
        
        this.toggleHerramientas(herramientas, true);
    }

    /**
     * Muestra herramientas de reconocimiento
     */
    mostrarHerramientasReconocimiento() {
        const herramientas = [
            'medir-distancia',
            'vista-3d',
            'perfil-elevacion'
        ];
        
        this.toggleHerramientas(herramientas, true);
    }

    /**
     * Muestra herramientas de combate
     */
    mostrarHerramientasCombate() {
        const herramientas = [
            'calcular-fuego',
            'evaluar-daños',
            'coordinar-movimiento'
        ];
        
        this.toggleHerramientas(herramientas, true);
    }

    /**
     * Muestra herramientas de evaluación
     */
    mostrarHerramientasEvaluacion() {
        const herramientas = [
            'generar-informe',
            'analizar-resultados',
            'planificar-siguiente'
        ];
        
        this.toggleHerramientas(herramientas, true);
    }

    /**
     * Habilita/deshabilita herramientas específicas
     */
    toggleHerramientas(herramientas, habilitar) {
        herramientas.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.disabled = !habilitar;
                elemento.style.opacity = habilitar ? '1' : '0.5';
            }
        });
    }

    /**
     * Habilita/deshabilita edición de unidades
     */
    habilitarEdicionUnidades(habilitar) {
        const elementosUnidades = document.querySelectorAll('.unidad-editable');
        elementosUnidades.forEach(elemento => {
            if (habilitar) {
                elemento.classList.add('editable');
            } else {
                elemento.classList.remove('editable');
            }
        });
    }

    /**
     * Muestra elementos estratégicos
     */
    mostrarElementosEstrategicos() {
        document.querySelectorAll('.elemento-estrategico').forEach(el => {
            el.style.display = 'block';
        });
        document.querySelectorAll('.elemento-tactico').forEach(el => {
            el.style.display = 'none';
        });
    }

    /**
     * Muestra elementos operacionales
     */
    mostrarElementosOperacionales() {
        document.querySelectorAll('.elemento-operacional').forEach(el => {
            el.style.display = 'block';
        });
    }

    /**
     * Muestra elementos tácticos
     */
    mostrarElementosTacticos() {
        document.querySelectorAll('.elemento-tactico').forEach(el => {
            el.style.display = 'block';
        });
        document.querySelectorAll('.elemento-estrategico').forEach(el => {
            el.style.display = 'none';
        });
    }

    /**
     * Descarga el detector de gestos
     */
    async descargarDetectorGestos() {
        const btnControlGestos = document.getElementById('btnControlGestos');
        
        try {
            const confirmacion = confirm(
                '🤚 MAIRA Detector de Gestos\n\n' +
                '¿Deseas descargar e instalar el detector de gestos en tu PC?\n\n' +
                '✅ Control por gestos para cualquier programa\n' +
                '✅ Mesa de proyección interactiva\n' +
                '✅ Integración con MAIRA Web\n\n' +
                'Se descargará un archivo ZIP con instalador automático.'
            );
            
            if (!confirmacion) return;
            
            const mensajeOriginal = btnControlGestos?.innerHTML || '';
            if (btnControlGestos) {
                btnControlGestos.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Descargando...';
                btnControlGestos.disabled = true;
            }
            
            const response = await fetch('/api/download-gesture-detector');
            
            if (!response.ok) {
                throw new Error(`Error en descarga: ${response.status}`);
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'MAIRA_Detector_Gestos.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            setTimeout(() => {
                alert(
                    '📦 ¡Descarga completada!\n\n' +
                    '📋 Próximos pasos:\n' +
                    '1. Busca el archivo "MAIRA_Detector_Gestos.zip" en Descargas\n' +
                    '2. Extrae el archivo ZIP\n' +
                    '3. Ejecuta "maira_gestos.py" (doble click)\n' +
                    '4. Sigue las instrucciones en pantalla\n\n' +
                    '💡 El detector funcionará con MAIRA y cualquier otro programa.'
                );
            }, 500);
            
        } catch (error) {
            console.error('Error descargando detector de gestos:', error);
            alert('❌ Error al descargar el detector de gestos.\nVerifica tu conexión e intenta nuevamente.');
        } finally {
            if (btnControlGestos) {
                btnControlGestos.innerHTML = mensajeOriginal;
                btnControlGestos.disabled = false;
            }
        }
    }

    /**
     * Obtiene el estado actual del sistema
     */
    obtenerEstado() {
        return {
            inicializado: this.inicializado,
            configuracion: { ...this.configuracion },
            gestoresDisponibles: Object.keys(this.gestores).filter(key => this.gestores[key] !== null)
        };
    }

    /**
     * Actualiza la configuración del sistema
     */
    actualizarConfiguracion(nuevaConfig) {
        this.configuracion = { ...this.configuracion, ...nuevaConfig };
        
        // Aplicar cambios según la nueva configuración
        if (nuevaConfig.faseActual) {
            this.manejarCambioFase(nuevaConfig.faseActual);
        }
        
        if (nuevaConfig.nivelZoom || nuevaConfig.modoZoom) {
            this.manejarCambioZoom({
                nivel: nuevaConfig.nivelZoom || this.configuracion.nivelZoom,
                modo: nuevaConfig.modoZoom || this.configuracion.modoZoom
            });
        }
    }
}

// Funciones globales para retrocompatibilidad
window.SistemaJuegoGuerra = SistemaJuegoGuerra;
window.sistemaJG = null;

window.inicializarSistemaJuegoGuerra = function() {
    try {
        if (window.sistemaJG) {
            console.log('Sistema de juego de guerra ya inicializado');
            return window.sistemaJG;
        }
        
        window.sistemaJG = new SistemaJuegoGuerra();
        window.sistemaJG.inicializar();
        
        return window.sistemaJG;
    } catch (error) {
        console.error('❌ Error inicializando sistema de juego de guerra:', error);
        throw error;
    }
};

// Función global para descargar detector de gestos
window.descargarDetectorGestos = function() {
    if (window.sistemaJG) {
        return window.sistemaJG.descargarDetectorGestos();
    } else {
        console.error('Sistema de juego de guerra no inicializado');
    }
};

console.log('✅ Sistema de Juego de Guerra modular cargado');
