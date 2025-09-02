/**
 * Dependency Manager para MAIRA
 * Gestiona dependencias desde CDN con fallback a node_modules local
 */

class DependencyManager {
    constructor() {
        this.cdnMap = {
            // Librerías principales
            'leaflet': 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
            'leaflet-css': 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
            
            // Plugins de Leaflet
            'leaflet-draw': 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js',
            'leaflet-draw-css': 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css',
            'leaflet-fullscreen': 'https://unpkg.com/leaflet-fullscreen@1.0.2/Control.FullScreen.js',
            'leaflet-fullscreen-css': 'https://unpkg.com/leaflet-fullscreen@1.0.2/Control.FullScreen.css',
            'leaflet-control-geocoder': 'https://unpkg.com/leaflet-control-geocoder@2.4.0/dist/Control.Geocoder.js',
            'leaflet-control-geocoder-css': 'https://unpkg.com/leaflet-control-geocoder@2.4.0/dist/Control.Geocoder.css',
            'leaflet-easybutton': 'https://unpkg.com/leaflet-easybutton@2.4.0/src/easy-button.js',
            'leaflet-easybutton-css': 'https://unpkg.com/leaflet-easybutton@2.4.0/src/easy-button.css',
            'leaflet-markercluster': 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js',
            'leaflet-markercluster-css': 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css',
            'leaflet-markercluster-default-css': 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css',
            
            // Milsymbol para símbolos militares
            'milsymbol': 'https://unpkg.com/milsymbol@2.2.0/dist/milsymbol.js',
            
            // D3 para visualizaciones
            'd3': 'https://unpkg.com/d3@7.8.4/dist/d3.min.js',
            
            // Socket.IO
            'socket.io-client': 'https://unpkg.com/socket.io-client@4.8.0/dist/socket.io.min.js',
            
            // Proj4 para proyecciones
            'proj4': 'https://unpkg.com/proj4@2.12.1/dist/proj4.js'
        };
        
        this.localFallbacks = {
            'leaflet': '../node_modules/leaflet/dist/leaflet.js',
            'milsymbol': '../node_modules/milsymbol/dist/milsymbol.js',
            'd3': '../node_modules/d3/dist/d3.min.js'
        };
        
        this.loadedDependencies = new Set();
        this.loadingPromises = new Map();
    }

    /**
     * Carga una dependencia con fallback automático
     */
    async loadDependency(name, type = 'script') {
        if (this.loadedDependencies.has(name)) {
            return true;
        }

        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }

        const loadPromise = this.loadDependencyInternal(name, type);
        this.loadingPromises.set(name, loadPromise);

        try {
            const result = await loadPromise;
            this.loadedDependencies.add(name);
            return result;
        } finally {
            this.loadingPromises.delete(name);
        }
    }

    /**
     * Carga interna con fallback
     */
    async loadDependencyInternal(name, type) {
        const cdnUrl = this.cdnMap[name];
        const localPath = this.localFallbacks[name];

        // Intentar CDN primero
        if (cdnUrl) {
            try {
                await this.loadFromUrl(cdnUrl, type);
                console.log(`✅ ${name} cargado desde CDN`);
                return true;
            } catch (error) {
                console.warn(`⚠️ Fallo CDN para ${name}:`, error.message);
            }
        }

        // Fallback a local si existe
        if (localPath) {
            try {
                await this.loadFromUrl(localPath, type);
                console.log(`✅ ${name} cargado desde local`);
                return true;
            } catch (error) {
                console.warn(`⚠️ Fallo local para ${name}:`, error.message);
            }
        }

        throw new Error(`No se pudo cargar ${name} desde ninguna fuente`);
    }

    /**
     * Carga un archivo desde una URL
     */
    loadFromUrl(url, type) {
        return new Promise((resolve, reject) => {
            if (type === 'css') {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = url;
                link.onload = resolve;
                link.onerror = reject;
                document.head.appendChild(link);
            } else {
                const script = document.createElement('script');
                script.src = url;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            }
        });
    }

    /**
     * Carga múltiples dependencias en orden
     */
    async loadDependencies(dependencies) {
        for (const dep of dependencies) {
            if (typeof dep === 'string') {
                await this.loadDependency(dep);
            } else {
                await this.loadDependency(dep.name, dep.type);
            }
        }
    }

    /**
     * Carga dependencias básicas de MAIRA
     */
    async loadMAIRADependencies() {
        const coreDependencies = [
            { name: 'leaflet-css', type: 'css' },
            'leaflet',
            { name: 'leaflet-draw-css', type: 'css' },
            'leaflet-draw',
            { name: 'leaflet-fullscreen-css', type: 'css' },
            'leaflet-fullscreen',
            { name: 'leaflet-control-geocoder-css', type: 'css' },
            'leaflet-control-geocoder',
            { name: 'leaflet-easybutton-css', type: 'css' },
            'leaflet-easybutton',
            { name: 'leaflet-markercluster-css', type: 'css' },
            { name: 'leaflet-markercluster-default-css', type: 'css' },
            'leaflet-markercluster',
            'milsymbol',
            'd3',
            'proj4'
        ];

        console.log('🔧 Cargando dependencias principales de MAIRA...');
        
        try {
            await this.loadDependencies(coreDependencies);
            console.log('✅ Todas las dependencias cargadas correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error cargando dependencias:', error);
            throw error;
        }
    }

    /**
     * Verifica si una dependencia está disponible
     */
    isDependencyLoaded(name) {
        return this.loadedDependencies.has(name);
    }

    /**
     * Obtiene estadísticas de carga
     */
    getStats() {
        return {
            loaded: Array.from(this.loadedDependencies),
            loading: Array.from(this.loadingPromises.keys()),
            total: Object.keys(this.cdnMap).length
        };
    }
}

// Instancia global
window.dependencyManager = new DependencyManager();

// Función de conveniencia
window.loadMAIRADependencies = () => window.dependencyManager.loadMAIRADependencies();

console.log('🚀 Dependency Manager inicializado');

// Export para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DependencyManager;
}
