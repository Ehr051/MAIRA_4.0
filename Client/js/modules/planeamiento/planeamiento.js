// planeamiento.js - Eventos y funcionalidades del módulo de Planeamiento

class PlaneamientoManager {
    constructor() {
        this.socket = null;
        this.elementos = new Map();
        this.elementoSeleccionado = null;
        this.modoEdicion = false;
    }

    inicializar() {
        console.log('🎯 Inicializando módulo de Planeamiento');
        this.configurarSocket();
        this.configurarEventos();
        this.cargarElementosGuardados();
    }

    configurarSocket() {
        if (typeof socket !== 'undefined' && socket) {
            this.socket = socket;
            this.configurarEventosSocket();
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

    // Métodos auxiliares
    generarId() {
        return 'elem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    guardarElementoLocal(elemento) {
        const elementos = JSON.parse(localStorage.getItem('planeamiento_elementos') || '[]');
        elementos.push(elemento);
        localStorage.setItem('planeamiento_elementos', JSON.stringify(elementos));
    }

    cargarElementosLocales() {
        const elementos = JSON.parse(localStorage.getItem('planeamiento_elementos') || '[]');
        this.cargarElementos(elementos);
    }

    cargarElementos(elementos) {
        console.log(`📋 Cargando ${elementos.length} elementos`);
        elementos.forEach(elem => this.actualizarElementoEnMapa(elem));
    }

    actualizarElementoEnMapa(elemento) {
        // Implementar lógica específica del mapa
        console.log('🗺️ Actualizando elemento en mapa:', elemento);
    }

    eliminarElementoDelMapa(elementoId) {
        // Implementar lógica de eliminación del mapa
        console.log('🗺️ Eliminando elemento del mapa:', elementoId);
    }

    eliminarElementoLocal(elementoId) {
        const elementos = JSON.parse(localStorage.getItem('planeamiento_elementos') || '[]');
        const elementosFiltrados = elementos.filter(e => e.id !== elementoId);
        localStorage.setItem('planeamiento_elementos', JSON.stringify(elementosFiltrados));
    }

    configurarEventos() {
        // Configurar eventos de interfaz
        document.addEventListener('DOMContentLoaded', () => {
            this.configurarBotones();
        });
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
