/**
 * PlaneamientoManager - Gestión OPTIMIZADA de elementos y funcionalidades del módulo de Planeamiento
 * Optimizado para alto rendimiento y cero delays
 */

class PlaneamientoManager {
    constructor() {
        this.elementos = new Map();
        this.elementosVisibles = new Set(); // Cache de elementos visibles
        this.socket = null;
        this.elementoSeleccionado = null;
        this.modoEdicion = false;

        // OPTIMIZACIONES DE RENDIMIENTO
        this.cacheElementos = new Map(); // Cache de elementos procesados
        this.batchUpdates = []; // Batch updates para reducir llamadas al servidor
        this.batchTimer = null;
        this.isProcessingBatch = false;

        console.log('🎯 PlaneamientoManager inicializado (OPTIMIZADO)');
    }

    inicializar() {
        console.log('🎯 Inicializando módulo de Planeamiento (OPTIMIZADO)');
        this.configurarSocket();
        this.configurarEventos();
        this.cargarElementosLocales(); // Lazy loading inicial
        this.iniciarBatchProcessor(); // Procesador de batch
    }

    // ✅ OPTIMIZACIÓN: PROCESADOR DE BATCH PARA REDUCIR LLAMADAS AL SERVIDOR
    iniciarBatchProcessor() {
        this.batchTimer = setInterval(() => {
            if (this.batchUpdates.length > 0 && !this.isProcessingBatch) {
                this.procesarBatchUpdates();
            }
        }, 500); // Procesar cada 500ms
    }

    async procesarBatchUpdates() {
        if (this.isProcessingBatch || this.batchUpdates.length === 0) return;

        this.isProcessingBatch = true;

        try {
            const updates = [...this.batchUpdates];
            this.batchUpdates = [];

            // Procesar en lotes de máximo 10 elementos
            const lotes = this.chunkArray(updates, 10);

            for (const lote of lotes) {
                await this.enviarBatchAlServidor(lote);
                await this.delay(50); // Pequeño delay entre lotes
            }

        } catch (error) {
            console.error('❌ Error procesando batch:', error);
        } finally {
            this.isProcessingBatch = false;
        }
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async enviarBatchAlServidor(lote) {
        if (!this.socket) return;

        console.log(`📦 Enviando batch de ${lote.length} elementos`);
        this.socket.emit('batchUpdateElementos', {
            updates: lote,
            usuario_id: window.userId,
            timestamp: new Date().toISOString()
        });
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

    // ✅ OPTIMIZACIÓN: GUARDAR ELEMENTO CON BATCH PROCESSING
    guardarElemento(elemento) {
        if (!elemento) return;

        // Crear datos optimizados
        const elementoData = {
            id: elemento.id || this.generarId(),
            tipo: elemento.tipo,
            posicion: elemento.posicion,
            propiedades: elemento.propiedades,
            usuario_id: window.userId,
            timestamp: new Date().toISOString(),
            accion: 'guardar'
        };

        // Cache local inmediato para UI responsiva
        this.elementos.set(elementoData.id, elementoData);
        this.cacheElementos.set(elementoData.id, elementoData);

        // Agregar al batch para envío optimizado
        this.batchUpdates.push(elementoData);

        // Si no hay socket, guardar localmente
        if (!this.socket) {
            console.warn('⚠️ No hay conexión socket - guardando localmente');
            this.guardarElementoLocal(elementoData);
            return;
        }

        console.log('💾 Elemento preparado para guardar:', elementoData.id);

        // UI Update inmediato (no esperar al servidor)
        this.mostrarElementoEnMapa(elementoData);
    }

    // ✅ OPTIMIZACIÓN: ACTUALIZAR POSICIÓN CON BATCH
    actualizarPosicion(elementoId, nuevaPosicion) {
        if (!elementoId || !nuevaPosicion) return;

        const updateData = {
            elemento_id: elementoId,
            posicion: nuevaPosicion,
            usuario_id: window.userId,
            timestamp: new Date().toISOString(),
            accion: 'actualizar_posicion'
        };

        // Update cache inmediato
        if (this.cacheElementos.has(elementoId)) {
            const elemento = this.cacheElementos.get(elementoId);
            elemento.posicion = nuevaPosicion;
            this.cacheElementos.set(elementoId, elemento);
        }

        // Agregar al batch
        this.batchUpdates.push(updateData);

        if (!this.socket) {
            console.warn('⚠️ No hay conexión socket - actualizando localmente');
            return;
        }

        console.log('📍 Posición preparada para actualizar:', elementoId);
    }

    // ✅ OPTIMIZACIÓN: ELIMINAR ELEMENTO CON BATCH
    eliminarElemento(elementoId) {
        if (!elementoId) return;

        const deleteData = {
            elemento_id: elementoId,
            usuario_id: window.userId,
            timestamp: new Date().toISOString(),
            accion: 'eliminar'
        };

        // Remover de cache inmediato
        this.elementos.delete(elementoId);
        this.cacheElementos.delete(elementoId);
        this.elementosVisibles.delete(elementoId);

        // Agregar al batch
        this.batchUpdates.push(deleteData);

        if (!this.socket) {
            console.warn('⚠️ No hay conexión socket - eliminando localmente');
            this.eliminarElementoLocal(elementoId);
            return;
        }

        console.log('🗑️ Elemento preparado para eliminar:', elementoId);

        // UI Update inmediato
        this.eliminarElementoDelMapa(elementoId);
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

    // ✅ OPTIMIZACIÓN: CARGAR ELEMENTOS LOCALES CON CACHE
    cargarElementosLocales() {
        try {
            const elementos = JSON.parse(localStorage.getItem('maira_elementos_planeamiento') || '[]');

            // Filtrar elementos válidos y actualizar cache
            const elementosValidos = elementos.filter(el => el && el.id);
            elementosValidos.forEach(el => {
                this.cacheElementos.set(el.id, el);
            });

            this.cargarElementos(elementosValidos);
            console.log(`💾 Cargados ${elementosValidos.length} elementos desde localStorage`);
        } catch (error) {
            console.error('❌ Error cargando elementos locales:', error);
            this.elementos.clear();
            this.cacheElementos.clear();
        }
    }

    // ✅ OPTIMIZACIÓN: CARGAR ELEMENTOS CON LAZY LOADING Y CACHE
    cargarElementos() {
        // Primero cargar desde cache/local para UI inmediata
        this.cargarElementosLocales();

        if (!this.socket) {
            console.warn('⚠️ No hay conexión socket - usando solo elementos locales');
            return;
        }

        // Solicitar actualización del servidor (lazy)
        console.log('📥 Solicitando actualización de elementos del servidor');
        this.socket.emit('cargarElementos', {
            usuario_id: window.userId,
            timestamp: new Date().toISOString(),
            solo_cambios: true // Solo cambios desde última carga
        });
    }

    // ✅ OPTIMIZACIÓN: CARGA EFICIENTE DE ELEMENTOS
    cargarElementos(elementos) {
        if (!elementos || !Array.isArray(elementos)) return;

        console.log(`📦 Procesando ${elementos.length} elementos...`);

        // Procesar en chunks para no bloquear UI
        this.procesarElementosEnChunks(elementos, 50);
    }

    async procesarElementosEnChunks(elementos, chunkSize) {
        const chunks = this.chunkArray(elementos, chunkSize);

        for (const chunk of chunks) {
            // Procesar chunk actual
            chunk.forEach(elemento => {
                this.elementos.set(elemento.id, elemento);
                this.cacheElementos.set(elemento.id, elemento);
            });

            // Mostrar en mapa (lazy rendering)
            this.mostrarElementosEnMapa(chunk);

            // Pequeño delay para no bloquear UI
            await this.delay(10);
        }

        console.log(`✅ Procesados ${elementos.length} elementos en ${chunks.length} chunks`);
    }

    mostrarElementosEnMapa(elementos) {
        elementos.forEach(elemento => {
            if (!this.elementosVisibles.has(elemento.id)) {
                this.mostrarElementoEnMapa(elemento);
                this.elementosVisibles.add(elemento.id);
            }
        });
    }

    // ✅ UTILIDADES
    generarId() {
        return 'elemento_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    mostrarElementoEnMapa(elemento) {
        // Integración con el mapa principal usando agregarMarcador con coordenadas
        if (window.agregarMarcador && elemento.propiedades?.sidc) {
            const latlng = L.latLng(elemento.posicion.lat, elemento.posicion.lng);
            window.agregarMarcador(elemento.propiedades.sidc, elemento.propiedades.nombre || elemento.tipo, latlng);
        } else {
            console.warn('⚠️ No se puede mostrar elemento en mapa - faltan funciones o datos');
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

    // ✅ OPTIMIZACIÓN: LIMPIEZA DE MEMORIA
    cleanup() {
        // Limpiar timers
        if (this.batchTimer) {
            clearInterval(this.batchTimer);
            this.batchTimer = null;
        }

        // Procesar último batch antes de salir
        if (this.batchUpdates.length > 0) {
            this.procesarBatchUpdates();
        }

        // Limpiar caches
        this.elementos.clear();
        this.cacheElementos.clear();
        this.elementosVisibles.clear();
        this.batchUpdates = [];

        console.log('🧹 PlaneamientoManager limpiado');
    }

    // ✅ OPTIMIZACIÓN: MÉTODO PARA FORZAR SYNC CON SERVIDOR
    forzarSync() {
        if (!this.socket) return;

        console.log('🔄 Forzando sincronización completa con servidor');
        this.socket.emit('forzarSyncElementos', {
            usuario_id: window.userId,
            elementos_locales: Array.from(this.cacheElementos.values()),
            timestamp: new Date().toISOString()
        });
    }

    // ✅ OPTIMIZACIÓN: ESTADÍSTICAS DE RENDIMIENTO
    getEstadisticas() {
        return {
            elementosTotal: this.elementos.size,
            elementosVisibles: this.elementosVisibles.size,
            elementosCache: this.cacheElementos.size,
            batchPendiente: this.batchUpdates.length,
            memoriaUsada: this.calcularMemoriaUsada()
        };
    }

    calcularMemoriaUsada() {
        // Estimación aproximada de memoria usada
        const elementosSize = this.elementos.size * 1024; // ~1KB por elemento
        const cacheSize = this.cacheElementos.size * 512; // ~0.5KB por elemento en cache
        const batchSize = this.batchUpdates.length * 256; // ~0.25KB por update pendiente

        return elementosSize + cacheSize + batchSize;
    }
}

// Inicializar automáticamente
let planeamientoManager;
document.addEventListener('DOMContentLoaded', () => {
    planeamientoManager = new PlaneamientoManager();
    planeamientoManager.inicializar();
});

// Cleanup al cerrar página
window.addEventListener('beforeunload', () => {
    if (planeamientoManager) {
        planeamientoManager.cleanup();
    }
});

// Exportar para uso global
window.planeamientoManager = planeamientoManager;
