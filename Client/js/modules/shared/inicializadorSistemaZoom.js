/**
 * INICIALIZADOR SISTEMA ZOOM Y FORMACIONES - MAIRA 4.0
 * ====================================================
 * Inicializa todos los sistemas necesarios para el zoom multi-nivel
 * y formaciones militares
 */

// Sistema de inicialización integrado
class InicializadorSistemaZoom {
    constructor() {
        this.sistemas = {
            modelos3D: false,
            mapper: false,
            formaciones: false,
            zoom: false
        };
    }

    /**
     * Inicialización completa del sistema
     */
    async inicializar(mapa) {
        console.log('🚀 Inicializando sistema zoom y formaciones...');

        try {
            // 1. Inicializar modelos 3D
            await this.inicializarModelos3D();

            // 2. Inicializar mapper de elementos
            this.inicializarElementoMapper();

            // 3. Inicializar sistema de formaciones
            this.inicializarSistemaFormaciones();

            // 4. Inicializar sistema de zoom
            this.inicializarSistemaZoom(mapa);

            console.log('✅ Sistema zoom y formaciones inicializado completamente');
            return true;

        } catch (error) {
            console.error('❌ Error inicializando sistema:', error);
            return false;
        }
    }

    /**
     * Inicializar sistema de modelos 3D
     */
    async inicializarModelos3D() {
        if (this.sistemas.modelos3D) return;

        try {
            if (window.inicializarModelos3DManager) {
                await window.inicializarModelos3DManager();
                this.sistemas.modelos3D = true;
                console.log('✅ Modelos 3D inicializados');
            } else {
                console.warn('⚠️ inicializarModelos3DManager no disponible');
            }
        } catch (error) {
            console.error('❌ Error inicializando modelos 3D:', error);
        }
    }

    /**
     * Inicializar mapper de elementos 3D
     */
    inicializarElementoMapper() {
        if (this.sistemas.mapper) return;

        try {
            if (window.inicializarElementoMapper) {
                window.inicializarElementoMapper();
                this.sistemas.mapper = true;
                console.log('✅ Mapper de elementos inicializado');
            } else {
                console.warn('⚠️ inicializarElementoMapper no disponible');
            }
        } catch (error) {
            console.error('❌ Error inicializando mapper:', error);
        }
    }

    /**
     * Inicializar sistema de formaciones militares
     */
    inicializarSistemaFormaciones() {
        if (this.sistemas.formaciones) return;

        try {
            if (window.inicializarSistemaFormaciones) {
                window.inicializarSistemaFormaciones();
                this.sistemas.formaciones = true;
                console.log('✅ Sistema de formaciones inicializado');
            } else {
                console.warn('⚠️ inicializarSistemaFormaciones no disponible');
            }
        } catch (error) {
            console.error('❌ Error inicializando formaciones:', error);
        }
    }

    /**
     * Inicializar sistema de zoom multi-nivel
     */
    inicializarSistemaZoom(mapa) {
        if (this.sistemas.zoom) return;

        try {
            if (window.inicializarSistemaZoom) {
                const sistemaZoom = window.inicializarSistemaZoom(mapa);
                this.sistemas.zoom = true;
                console.log('✅ Sistema zoom multi-nivel inicializado');
                return sistemaZoom;
            } else {
                console.warn('⚠️ inicializarSistemaZoom no disponible');
            }
        } catch (error) {
            console.error('❌ Error inicializando sistema zoom:', error);
        }

        return null;
    }

    /**
     * Verificar estado de inicialización
     */
    obtenerEstado() {
        return { ...this.sistemas };
    }

    /**
     * Resetear sistemas
     */
    resetear() {
        this.sistemas = {
            modelos3D: false,
            mapper: false,
            formaciones: false,
            zoom: false
        };
        console.log('🔄 Sistemas reseteados');
    }
}

// Instancia global
let inicializadorSistemaZoom;

// Función de inicialización global
window.inicializarSistemaZoomCompleto = async (mapa) => {
    if (!inicializadorSistemaZoom) {
        inicializadorSistemaZoom = new InicializadorSistemaZoom();
    }

    return await inicializadorSistemaZoom.inicializar(mapa);
};

// Función para verificar estado
window.verificarEstadoSistemas = () => {
    if (inicializadorSistemaZoom) {
        return inicializadorSistemaZoom.obtenerEstado();
    }
    return null;
};

// Función para resetear
window.resetearSistemasZoom = () => {
    if (inicializadorSistemaZoom) {
        inicializadorSistemaZoom.resetear();
    }
};

console.log('📦 Inicializador sistema zoom y formaciones cargado');
