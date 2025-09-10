/**
 * PlaneamientoManager - Gestión de elementos y funcionalidades del módulo de Planeamiento
 */

class PlaneamientoManager {
    constructor() {
        this.elementos = new Map();
        this.socket = null;
        this.elementoSeleccionado = null;
        this.modoEdicion = false;
        console.log('🎯 PlaneamientoManager inicializado');
    }

    inicializar() {
        console.log('🎯 Inicializando módulo de Planeamiento');
        this.configurarSocket();
        this.configurarEventos();
        this.cargarElementosLocales();
    }

    configurarSocket() {
        // Usar socket global si está disponible
        if (window.socket) {
            this.socket = window.socket;
            this.configurarEventosSocket();
            console.log('✅ Socket conectado para Planeamiento');
        } else {
            console.warn('⚠️ Socket no disponible - trabajando en modo local');
        }
    }

    configurarEventos() {
        try {
            this.configurarBotones();
            this.configurarEventosSocket();
        } catch (error) {
            console.error('❌ Error en configuración de eventos:', error);
        }
    }

    configurarEventosSocket() {
        if (!this.socket) return;

        // Escuchar eventos del servidor
        this.socket.on('elementoGuardado', (data) => {
            console.log('✅ Elemento guardado:', data);
            this.actualizarElementoEnMapa(data);
        });

        this.socket.on('elementosActualizados', (data) => {
            console.log('🔄 Elementos actualizados:', data);
            this.cargarElementos(data.elementos);
        });

        this.socket.on('elementoEliminado', (data) => {
            console.log('🗑️ Elemento eliminado:', data);
            this.eliminarElementoDelMapa(data.id);
        });
    }

    // ✅ EVENTOS CRÍTICOS FALTANTES
    guardarElemento(elemento) {
        if (!this.socket) {
            console.warn('⚠️ No hay conexión socket - guardando localmente');
            this.guardarElementoLocal(elemento);
            return;
        }

        const elementoData = {
            id: elemento.id || this.generarId(),
            tipo: elemento.tipo,
            posicion: elemento.posicion,
            propiedades: elemento.propiedades,
            usuario_id: window.userId,
            timestamp: new Date().toISOString()
        };

        console.log('💾 Guardando elemento:', elementoData);
        this.socket.emit('guardarElemento', elementoData);
    }

    cargarElementos() {
        if (!this.socket) {
            console.warn('⚠️ No hay conexión socket - cargando elementos locales');
            this.cargarElementosLocales();
            return;
        }

        console.log('📥 Solicitando elementos del servidor');
        this.socket.emit('cargarElementos', {
            usuario_id: window.userId,
            timestamp: new Date().toISOString()
        });
    }

    actualizarPosicion(elementoId, nuevaPosicion) {
        if (!this.socket) {
            console.warn('⚠️ No hay conexión socket - actualizando localmente');
            return;
        }

        const data = {
            elemento_id: elementoId,
            posicion: nuevaPosicion,
            usuario_id: window.userId,
            timestamp: new Date().toISOString()
        };

        console.log('📍 Actualizando posición:', data);
        this.socket.emit('actualizarPosicion', data);
    }

    eliminarElemento(elementoId) {
        if (!this.socket) {
            console.warn('⚠️ No hay conexión socket - eliminando localmente');
            this.eliminarElementoLocal(elementoId);
            return;
        }

        const data = {
            elemento_id: elementoId,
            usuario_id: window.userId,
            timestamp: new Date().toISOString()
        };

        console.log('🗑️ Eliminando elemento:', data);
        this.socket.emit('eliminarElemento', data);
    }

    // ✅ ALMACENAMIENTO LOCAL PARA MODO OFFLINE
    guardarElementoLocal(elemento) {
        try {
            const elementosGuardados = JSON.parse(localStorage.getItem('maira_elementos_planeamiento') || '[]');
            elementosGuardados.push(elemento);
            localStorage.setItem('maira_elementos_planeamiento', JSON.stringify(elementosGuardados));
            console.log('💾 Elemento guardado localmente');
        } catch (error) {
            console.error('❌ Error guardando elemento local:', error);
        }
    }

    eliminarElementoLocal(elementoId) {
        try {
            let elementosGuardados = JSON.parse(localStorage.getItem('maira_elementos_planeamiento') || '[]');
            elementosGuardados = elementosGuardados.filter(el => el.id !== elementoId);
            localStorage.setItem('maira_elementos_planeamiento', JSON.stringify(elementosGuardados));
            console.log('🗑️ Elemento eliminado localmente');
        } catch (error) {
            console.error('❌ Error eliminando elemento local:', error);
        }
    }

    cargarElementosLocales() {
        const elementos = JSON.parse(localStorage.getItem('maira_elementos_planeamiento') || '[]');
        this.cargarElementos(elementos);
    }

    cargarElementos(elementos) {
        elementos.forEach(elemento => {
            this.elementos.set(elemento.id, elemento);
            this.mostrarElementoEnMapa(elemento);
        });
        console.log(`✅ Cargados ${elementos.length} elementos`);
    }

    // ✅ UTILIDADES
    generarId() {
        return 'elemento_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    mostrarElementoEnMapa(elemento) {
        // Integración con el mapa principal
        if (window.mapaManager) {
            window.mapaManager.agregarElemento(elemento);
        }
    }

    actualizarElementoEnMapa(elemento) {
        if (window.mapaManager) {
            window.mapaManager.actualizarElemento(elemento);
        }
    }

    eliminarElementoDelMapa(elementoId) {
        if (window.mapaManager) {
            window.mapaManager.eliminarElemento(elementoId);
        }
    }

    configurarBotones() {
        // Configurar botones de la interfaz
        const btnGuardar = document.getElementById('btn-guardar-elemento');
        if (btnGuardar) {
            btnGuardar.addEventListener('click', () => {
                if (this.elementoSeleccionado) {
                    this.guardarElemento(this.elementoSeleccionado);
                }
            });
        }
    }
}

// Inicializar automáticamente
let planeamientoManager;
document.addEventListener('DOMContentLoaded', () => {
    planeamientoManager = new PlaneamientoManager();
    planeamientoManager.inicializar();
});

// Exportar para uso global
window.planeamientoManager = planeamientoManager;
