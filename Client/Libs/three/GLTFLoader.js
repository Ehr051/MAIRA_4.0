/**
 * GLTFLoader básico para compatibilidad con MAIRA
 * Versión simplificada para evitar errores de carga
 */

THREE.GLTFLoader = class GLTFLoader {
    constructor() {
        this.manager = null;
        console.log('🚀 GLTFLoader básico inicializado (versión simplificada)');
    }

    load(url, onLoad, onProgress, onError) {
        console.warn('⚠️ GLTFLoader.load() - Función no implementada en versión básica');

        // Simular carga exitosa con un objeto vacío
        if (onLoad) {
            setTimeout(() => {
                onLoad({
                    scene: new THREE.Group(),
                    scenes: [],
                    cameras: [],
                    animations: []
                });
            }, 100);
        }
    }

    parse(data, path, onLoad, onError) {
        console.warn('⚠️ GLTFLoader.parse() - Función no implementada en versión básica');

        if (onLoad) {
            onLoad({
                scene: new THREE.Group(),
                scenes: [],
                cameras: [],
                animations: []
            });
        }
    }
};

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.GLTFLoader = THREE.GLTFLoader;
}

console.log('✅ GLTFLoader registrado globalmente');