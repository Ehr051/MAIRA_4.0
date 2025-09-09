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
            'fontawesome-css': '/node_modules/@fortawesome/fontawesome-free/css/all.min.css',
            'leaflet': '/node_modules/leaflet/dist/leaflet.js',
            'leaflet-css': '/node_modules/leaflet/dist/leaflet.css',
            
            // Plugins de Leaflet desde node_modules
            'leaflet-draw': '/node_modules/leaflet-draw/dist/leaflet.draw.js',
            'leaflet-draw-css': '/node_modules/leaflet-draw/dist/leaflet.draw.css',
            'leaflet-fullscreen': '/node_modules/leaflet-fullscreen/Control.FullScreen.js',
            'leaflet-fullscreen-css': '/node_modules/leaflet-fullscreen/dist/leaflet.fullscreen.css',
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
            
            // ========== LEAFLET PATTERN - DESDE CLIENT/LIBS ==========
            'leaflet-pattern': '../../Libs/leaflet-pattern/dist/leaflet.pattern.js',
            'leaflet-pattern-alt': '../../Libs/Leaflet.pattern-master/dist/leaflet.pattern-src.js',
            
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
            // ========== BOOTSTRAP Y JQUERY CRÍTICOS ==========
            'bootstrap-css': 'https://cdn.jsdelivr.net/npm/bootstrap@4.5.2/dist/css/bootstrap.min.css',
            'bootstrap-js': 'https://cdn.jsdelivr.net/npm/bootstrap@4.5.2/dist/js/bootstrap.min.js',
            'bootstrap': 'https://cdn.jsdelivr.net/npm/bootstrap@4.5.2/dist/js/bootstrap.bundle.min.js',
            'jquery': 'https://code.jquery.com/jquery-3.5.1.min.js',
            
            // ========== LEAFLET Y MAPAS ==========
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
            'leaflet-pattern': 'https://unpkg.com/leaflet-pattern@0.2.0/dist/leaflet.pattern.js',
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
     * Carga dependencias básicas de MAIRA con CSS específicos por módulo
     */
    async loadMAIRADependencies(moduleName = null) {
        const coreDependencies = [
            // ✅ CSS EXTERNAS PRIMERO (para que tengan MENOR prioridad)
            { name: 'bootstrap-css', type: 'css' },
            { name: 'fontawesome-css', type: 'css' },
            { name: 'leaflet-css', type: 'css' },
            { name: 'leaflet-draw-css', type: 'css' },
            { name: 'leaflet-control-geocoder-css', type: 'css' },
            { name: 'leaflet-easybutton-css', type: 'css' },
            { name: 'leaflet-markercluster-css', type: 'css' },
            { name: 'leaflet-markercluster-default-css', type: 'css' },
            
            // JavaScript básico
            'jquery',
            'bootstrap',
            'leaflet',
            'leaflet-draw',
            'leaflet-control-geocoder',
            'leaflet-easybutton',
            'leaflet-markercluster',
            'milsymbol',
            'd3',
            'proj4'
        ];

        console.log('🔧 Cargando dependencias principales de MAIRA...');
        
        try {
            await this.loadDependencies(coreDependencies);
            
            // ✅ AHORA CARGAR CSS PERSONALIZADOS DE MAIRA AL FINAL (MAYOR PRIORIDAD)
            console.log(`🎨 Cargando CSS personalizados específicos del módulo...`);
            await this.loadCustomMAIRAStyles(moduleName);
            
            console.log('✅ Todas las dependencias cargadas correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error cargando dependencias MAIRA:', error.message || error);
            console.warn('⚠️ Continuando con dependencias CDN fallback...');
            
            // No lanzar error, intentar continuar con CDN fallbacks
            return false;
        }
    }

    /**
     * ✅ NUEVA FUNCIÓN: Carga los CSS personalizados de MAIRA AL FINAL según el módulo
     */
    async loadCustomMAIRAStyles(moduleName = null) {
        // Determinar módulo actual si no se especifica
        if (!moduleName) {
            const currentPage = window.location.pathname;
            if (currentPage.includes('planeamiento.html')) {
                moduleName = 'planeamiento';
            } else if (currentPage.includes('juegodeguerra.html')) {
                moduleName = 'juegodeguerra';
            } else if (currentPage.includes('gestionbatalla.html')) {
                moduleName = 'gestionbatalla';
            } else if (currentPage.includes('CO.html')) {
                moduleName = 'organizacion';
            } else if (currentPage.includes('iniciarpartida.html')) {
                moduleName = 'iniciarpartida';
            } else if (currentPage.includes('inicioGB.html')) {
                moduleName = 'inicioGB';
            } else if (currentPage.includes('index.html') || currentPage === '/') {
                moduleName = 'index';
            } else {
                moduleName = 'default';
            }
        }

        console.log(`🎨 Cargando CSS personalizados para módulo: ${moduleName}`);

        // ✅ CSS ESPECÍFICOS POR MÓDULO (se cargan AL FINAL con mayor prioridad)
        const moduleStyles = {
            'planeamiento': [
                { name: 'planeamiento-css', url: '../../css/common/planeamiento.css' },
                { name: 'cyg-marcha-css', url: '../../css/common/CYGMarcha.css' },
                { name: 'grafico-marcha-css', url: '../../css/common/graficomarcha.css' },
                { name: 'test-buttons-css', url: '../../css/common/test-buttons.css' }
            ],
            'juegodeguerra': [
                { name: 'juego-guerra-css', url: '../../css/common/juegodeguerra.css' },
                { name: 'hexgrid-css', url: '../../css/common/hexgrid.css' },
                { name: 'cyg-marcha-css', url: '../../css/common/CYGMarcha.css' },
                { name: 'grafico-marcha-css', url: '../../css/common/graficomarcha.css' },
                { name: 'test-buttons-css', url: '../../css/common/test-buttons.css' }
            ],
            'gestionbatalla': [
                { name: 'gbatalla-css', url: '../../css/common/GBatalla.css' },
                { name: 'cyg-marcha-css', url: '../../css/common/CYGMarcha.css' },
                { name: 'grafico-marcha-css', url: '../../css/common/graficomarcha.css' },
                { name: 'test-buttons-css', url: '../../css/common/test-buttons.css' }
            ],
            'organizacion': [
                { name: 'co-css', url: '../../css/common/CO.css' },
                { name: 'miradial-css', url: '../../css/common/miradial.css' }
            ],
            'iniciarpartida': [
                { name: 'iniciarpartida-css', url: '../../css/common/iniciarpartida.css' }
            ],
            'inicioGB': [
                { name: 'iniciogb-css', url: '../../css/common/inicioGB.css' }
            ],
            'index': [
                { name: 'index-style-css', url: '../../css/modules/index/style.css' },
                { name: 'index-carrusel-css', url: '../../css/modules/index/carrusel.css' }
            ],
            'default': [
                // CSS básicos para páginas sin módulo específico
                { name: 'basic-style-css', url: '../../css/common/style.css' }
            ]
        };

        const customStyles = moduleStyles[moduleName] || moduleStyles['default'];

        for (const style of customStyles) {
            try {
                await this.loadFromUrl(style.url, 'css');
                console.log(`✅ ${style.name} cargado con mayor prioridad para ${moduleName}`);
            } catch (error) {
                console.warn(`⚠️ No se pudo cargar ${style.name} para ${moduleName}:`, error);
            }
        }
    }

    /**
     * Carga dependencias específicas de planeamiento
     */
    async loadPlaneamientoDependencies() {
        const planeamientoDependencies = [
            'leaflet-pattern-alt',  // ✅ Leaflet patterns - DEBE cargar DESPUÉS de Leaflet
            'mgrs',  // ✅ Para cuadrículas MGRS
            'leaflet-elevation',
            { name: 'leaflet-elevation-css', type: 'css' },
            'geotiff'
        ];

        console.log('🗺️ Cargando dependencias de planeamiento...');
        
        try {
            await this.loadDependencies(planeamientoDependencies);
            console.log('✅ Dependencias de planeamiento cargadas');
            return true;
        } catch (error) {
            console.error('❌ Error cargando dependencias de planeamiento:', error);
            throw error;
        }
    }

    /**
     * Carga dependencias específicas de juego de guerra
     */
    async loadJuegoDependencies() {
        const juegoDependencies = [
            'leaflet-pattern-alt',  // ✅ Leaflet patterns - DEBE cargar DESPUÉS de Leaflet
            // Agregar más dependencias específicas del juego según se necesiten
        ];

        console.log('🎮 Cargando dependencias de juego de guerra...');
        
        try {
            await this.loadDependencies(juegoDependencies);
            console.log('✅ Dependencias de juego de guerra cargadas');
            return true;
        } catch (error) {
            console.error('❌ Error cargando dependencias de juego de guerra:', error);
            throw error;
        }
    }

    /**
     * Carga dependencias específicas de gestión de batalla
     */
    async loadGestionBatallaDependencies() {
        const gestionDependencies = [
            'leaflet-pattern-alt',  // ✅ Leaflet patterns - DEBE cargar DESPUÉS de Leaflet
            // Agregar más dependencias específicas de gestión de batalla según se necesiten
        ];

        console.log('⚔️ Cargando dependencias de gestión de batalla...');
        
        try {
            await this.loadDependencies(gestionDependencies);
            console.log('✅ Dependencias de gestión de batalla cargadas');
            return true;
        } catch (error) {
            console.error('❌ Error cargando dependencias de gestión de batalla:', error);
            throw error;
        }
    }

    /**
     * Carga dependencias específicas de organización (CO)
     */
    async loadOrganizacionDependencies() {
        const organizacionDependencies = [
            'jsplumb',           // ✅ jsPlumb para conexiones en cuadros de organización
            'milsymbol',         // ✅ Símbolos militares
            // Agregar más dependencias específicas de CO según se necesiten
        ];

        console.log('🏗️ Cargando dependencias de organización...');
        
        try {
            await this.loadDependencies(organizacionDependencies);
            console.log('✅ Dependencias de organización cargadas');
            return true;
        } catch (error) {
            console.error('❌ Error cargando dependencias de organización:', error);
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

// Funciones de conveniencia con soporte para módulos específicos
window.loadMAIRADependencies = (moduleName = null) => window.dependencyManager.loadMAIRADependencies(moduleName);
window.loadPlaneamientoDependencies = () => window.dependencyManager.loadPlaneamientoDependencies();
window.loadJuegoDependencies = () => window.dependencyManager.loadJuegoDependencies();
window.loadGestionBatallaDependencies = () => window.dependencyManager.loadGestionBatallaDependencies();
window.loadOrganizacionDependencies = () => window.dependencyManager.loadOrganizacionDependencies();

console.log('🚀 Dependency Manager inicializado');

// Export para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DependencyManager;
}
