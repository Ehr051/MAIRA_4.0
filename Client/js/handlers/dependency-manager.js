/**
 * Dependency Manager para MAIRA
 * Gestiona dependencias desde CDN con fallback a node_modules local
 */

class DependencyManager {
    constructor() {
        // 🎯 PRIORIDAD 1: NODE_MODULES LOCAL (Render instala automáticamente)
        this.localPaths = {
            // Librerías principales desde node_modules
            'jquery': '/node_modules/jquery/dist/jquery.min.js',
            'bootstrap': '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
            'bootstrap-css': '/node_modules/bootstrap/dist/css/bootstrap.min.css',
            'leaflet': '/node_modules/leaflet/dist/leaflet.js',
            'leaflet-css': '/node_modules/leaflet/dist/leaflet.css',
            
            // Plugins de Leaflet desde node_modules
            'leaflet-draw': '/node_modules/leaflet-draw/dist/leaflet.draw.js',
            'leaflet-draw-css': '/node_modules/leaflet-draw/dist/leaflet.draw.css',
            'leaflet-fullscreen': '/node_modules/leaflet-fullscreen/Control.FullScreen.js',
            'leaflet-fullscreen-css': '/node_modules/leaflet-fullscreen/Control.FullScreen.css',
            'leaflet-control-geocoder': '/node_modules/leaflet-control-geocoder/dist/Control.Geocoder.js',
            'leaflet-control-geocoder-css': '/node_modules/leaflet-control-geocoder/dist/Control.Geocoder.css',
            'leaflet-easybutton': '/node_modules/leaflet-easybutton/src/easy-button.js',
            'leaflet-easybutton-css': '/node_modules/leaflet-easybutton/src/easy-button.css',
            'leaflet-markercluster': '/node_modules/leaflet.markercluster/dist/leaflet.markercluster.js',
            'leaflet-markercluster-css': '/node_modules/leaflet.markercluster/dist/MarkerCluster.css',
            'leaflet-markercluster-default-css': '/node_modules/leaflet.markercluster/dist/MarkerCluster.Default.css',
            'leaflet-geosearch': '/node_modules/leaflet-geosearch/dist/geosearch.umd.js',
            'leaflet-geosearch-css': '/node_modules/leaflet-geosearch/dist/geosearch.css',
            'leaflet-providers': '/node_modules/leaflet-providers/leaflet-providers.js',
            'leaflet-sidebar-v2': '/node_modules/leaflet-sidebar-v2/js/leaflet-sidebar.js',
            'leaflet-sidebar-v2-css': '/node_modules/leaflet-sidebar-v2/css/leaflet-sidebar.css',
            'leaflet-geometryutil': '/node_modules/leaflet-geometryutil/src/leaflet.geometryutil.js',
            'leaflet-measure': '/node_modules/leaflet-measure/dist/leaflet-measure.min.js',
            'leaflet-measure-css': '/node_modules/leaflet-measure/dist/leaflet-measure.css',
            
            // Otras librerías desde node_modules  
            'milsymbol': '/node_modules/milsymbol/dist/milsymbol.js',
            'd3': '/node_modules/d3/dist/d3.min.js',
            'socket.io-client': '/node_modules/socket.io-client/dist/socket.io.min.js',
            'proj4': '/node_modules/proj4/dist/proj4.js',
            'html2canvas': '/node_modules/html2canvas/dist/html2canvas.min.js',
            'jspdf': '/node_modules/jspdf/dist/jspdf.umd.min.js',
            'file-saver': '/node_modules/file-saver/dist/FileSaver.min.js',
            
            // ========== DEPENDENCIAS ADICIONALES DEL PACKAGE.JSON ==========
            'leaflet-bing-layer': '/node_modules/leaflet-bing-layer/leaflet-bing-layer.js',
            'leaflet-polylinedecorator': '/node_modules/leaflet-polylinedecorator/dist/leaflet.polylineDecorator.js',
            'leaflet-search': '/node_modules/leaflet-search/dist/leaflet-search.min.js',
            'leaflet-search-css': '/node_modules/leaflet-search/dist/leaflet-search.min.css',
            'leaflet-utfgrid': '/node_modules/leaflet-utfgrid/L.UTFGrid.js',
            'leaflet-googlemutant': '/node_modules/leaflet.gridlayer.googlemutant/Leaflet.GoogleMutant.js',
            'leaflet-elevation': '/node_modules/@raruto/leaflet-elevation/dist/leaflet-elevation.js',
            'leaflet-elevation-css': '/node_modules/@raruto/leaflet-elevation/dist/leaflet-elevation.css',
            'geotiff': '/node_modules/geotiff/dist-browser/geotiff.js',
            'mgrs': '/node_modules/mgrs/mgrs.js',
            'jsplumb': '/node_modules/jsplumb/dist/js/jsplumb.min.js',
            
            // ========== FONTAWESOME ==========
            'fontawesome-css': '/node_modules/@fortawesome/fontawesome-free/css/all.min.css',
            'fontawesome-js': '/node_modules/@fortawesome/fontawesome-free/js/all.min.js'
        };
        
        // 🌐 FALLBACK: CDN solo si node_modules falla
        this.cdnFallbacks = {
            'leaflet': 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
            'leaflet-css': 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
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
            'milsymbol': 'https://unpkg.com/milsymbol@2.2.0/dist/milsymbol.js',
            'd3': 'https://unpkg.com/d3@7.8.4/dist/d3.min.js',
            'socket.io-client': 'https://unpkg.com/socket.io-client@4.8.0/dist/socket.io.min.js',
            'proj4': 'https://unpkg.com/proj4@2.12.1/dist/proj4.js',
            
            // ========== FALLBACKS CDN ADICIONALES ==========
            'html2canvas': 'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js',
            'jspdf': 'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js',
            'file-saver': 'https://unpkg.com/file-saver@2.0.5/dist/FileSaver.min.js',
            'leaflet-bing-layer': 'https://unpkg.com/leaflet-bing-layer@3.3.1/leaflet-bing-layer.js',
            'leaflet-polylinedecorator': 'https://unpkg.com/leaflet-polylinedecorator@1.6.0/dist/leaflet.polylineDecorator.js',
            'leaflet-search': 'https://unpkg.com/leaflet-search@3.0.11/dist/leaflet-search.min.js',
            'leaflet-search-css': 'https://unpkg.com/leaflet-search@3.0.11/dist/leaflet-search.min.css',
            'leaflet-utfgrid': 'https://unpkg.com/leaflet-utfgrid@0.3.0/L.UTFGrid.js',
            'leaflet-googlemutant': 'https://unpkg.com/leaflet.gridlayer.googlemutant@0.13.5/Leaflet.GoogleMutant.js',
            'leaflet-elevation': 'https://unpkg.com/@raruto/leaflet-elevation@2.5.1/dist/leaflet-elevation.js',
            'leaflet-elevation-css': 'https://unpkg.com/@raruto/leaflet-elevation@2.5.1/dist/leaflet-elevation.css',
            'geotiff': 'https://unpkg.com/geotiff@2.1.3/dist-browser/geotiff.js',
            'mgrs': 'https://unpkg.com/mgrs@1.0.0/mgrs.js',
            'jsplumb': 'https://unpkg.com/jsplumb@2.15.6/dist/js/jsplumb.min.js',
            'fontawesome-css': 'https://unpkg.com/@fortawesome/fontawesome-free@7.0.1/css/all.min.css',
            'fontawesome-js': 'https://unpkg.com/@fortawesome/fontawesome-free@7.0.1/js/all.min.js'
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
        const localPath = this.localPaths[name];
        const cdnUrl = this.cdnFallbacks[name];

        // 🎯 INTENTAR NODE_MODULES PRIMERO (Render lo instala automáticamente)
        if (localPath) {
            try {
                await this.loadFromUrl(localPath, type);
                console.log(`✅ ${name} cargado desde node_modules local`);
                return true;
            } catch (error) {
                console.warn(`⚠️ ${name} falló desde node_modules, intentando CDN fallback:`, error.message);
            }
        }

        // 🌐 FALLBACK: CDN solo si node_modules falla
        if (cdnUrl) {
            try {
                await this.loadFromUrl(cdnUrl, type);
                console.log(`✅ ${name} cargado desde CDN fallback`);
                return true;
            } catch (error) {
                console.error(`❌ ${name} falló desde CDN también:`, error.message);
                throw error;
            }
        }

        throw new Error(`❌ No se encontró ruta para dependencia: ${name}`);
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
