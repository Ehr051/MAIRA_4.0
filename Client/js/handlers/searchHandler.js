/**
 * 🔍 SEARCH HANDLER
 * Módulo refactorizado para búsqueda de lugares (extraído de herramientasP.js)
 * Maneja la funcionalidad de buscar lugares geográficos
 */

class SearchHandler {
    constructor() {
        this.searchControl = null;
        this.isInitialized = false;
        console.log('✅ SearchHandler inicializado');
    }

    /**
     * Inicializar búsqueda de lugares
     * FUNCIÓN ORIGINAL: initializeBuscarLugar del viejo herramientasP.js
     */
    initializeBuscarLugar() {
        try {
            console.log('🔍 Inicializando búsqueda de lugares...');
            
            // Verificar que el mapa esté disponible - USAR VARIABLE CORRECTA
            if (!window.mapa) {
                console.error('❌ Mapa no disponible para búsqueda');
                return false;
            }

            // Verificar dependencias
            if (typeof L === 'undefined') {
                console.error('❌ Leaflet no disponible para búsqueda');
                return false;
            }

            if (typeof L.Control === 'undefined' || typeof L.Control.Geocoder === 'undefined') {
                console.warn('⚠️ L.Control.Geocoder no disponible, usando búsqueda básica');
                return this.initializeBasicSearch();
            }

            // Crear control de geocoding
            this.searchControl = L.Control.geocoder({
                defaultMarkGeocode: false,
                placeholder: 'Buscar lugar...',
                errorMessage: 'No se encontró el lugar',
                showResultIcons: true,
                expanded: false,
                position: 'topright',
                geocoder: new L.Control.Geocoder.Nominatim({
                    serviceUrl: 'https://nominatim.openstreetmap.org/',
                    htmlTemplate: function(r) {
                        const parts = r.name.split(',');
                        return parts[0] + '<br><small>' + parts.slice(1).join(', ') + '</small>';
                    }
                })
            });

            // Event listener para resultados de búsqueda
            this.searchControl.on('markgeocode', (e) => {
                const result = e.geocode;
                console.log('📍 Lugar encontrado:', result);
                
                // Centrar mapa en resultado
                window.mapa.setView(result.center, 15);
                
                // Agregar marcador temporal
                const marker = L.marker(result.center)
                    .addTo(window.mapa)
                    .bindPopup(`📍 ${result.name}`)
                    .openPopup();
                
                // Remover marcador después de 10 segundos
                setTimeout(() => {
                    if (window.mapa.hasLayer(marker)) {
                        window.mapa.removeLayer(marker);
                    }
                }, 10000);
                
                console.log('✅ Búsqueda completada y marcador agregado');
            });

            // Agregar control al mapa
            this.searchControl.addTo(window.mapa);
            this.isInitialized = true;
            
            console.log('✅ Búsqueda de lugares inicializada correctamente');
            return true;
            
        } catch (error) {
            console.error('❌ Error inicializando búsqueda de lugares:', error);
            return false;
        }
    }

    /**
     * Búsqueda básica sin geocoder
     */
    initializeBasicSearch() {
        try {
            console.log('🔍 Inicializando búsqueda básica...');
            
            // Crear un control básico de búsqueda
            const BasicSearchControl = L.Control.extend({
                onAdd: function(map) {
                    const container = L.DomUtil.create('div', 'leaflet-control-search');
                    container.innerHTML = `
                        <input type="text" placeholder="Buscar lugar..." 
                               style="padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                        <button style="padding: 5px; margin-left: 2px;">🔍</button>
                    `;
                    
                    const input = container.querySelector('input');
                    const button = container.querySelector('button');
                    
                    const search = () => {
                        const query = input.value.trim();
                        if (query) {
                            alert(`Búsqueda básica: "${query}"\nFuncionalidad completa requiere L.Control.Geocoder`);
                        }
                    };
                    
                    button.addEventListener('click', search);
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') search();
                    });
                    
                    return container;
                }
            });
            
            new BasicSearchControl({ position: 'topright' }).addTo(window.mapa);
            this.isInitialized = true;
            
            console.log('✅ Búsqueda básica inicializada');
            return true;
            
        } catch (error) {
            console.error('❌ Error inicializando búsqueda básica:', error);
            return false;
        }
    }

    /**
     * Limpiar búsqueda
     */
    cleanup() {
        try {
            if (this.searchControl && window.mapa && window.mapa.hasLayer(this.searchControl)) {
                window.mapa.removeControl(this.searchControl);
            }
            this.searchControl = null;
            this.isInitialized = false;
            console.log('✅ SearchHandler limpiado');
        } catch (error) {
            console.error('❌ Error limpiando SearchHandler:', error);
        }
    }

    /**
     * Verificar estado
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            hasControl: !!this.searchControl,
            mapAvailable: !!window.mapa
        };
    }
}

// ✅ CREAR INSTANCIA GLOBAL
const searchHandler = new SearchHandler();

// ✅ EXPORTAR FUNCIÓN GLOBAL PARA COMPATIBILIDAD
window.initializeBuscarLugar = function() {
    return searchHandler.initializeBuscarLugar();
};

// ✅ EXPORTAR PARA MAIRA NAMESPACE
if (!window.MAIRA) window.MAIRA = {};
if (!window.MAIRA.Handlers) window.MAIRA.Handlers = {};
window.MAIRA.Handlers.Search = searchHandler;

console.log('✅ SearchHandler cargado - initializeBuscarLugar disponible globalmente');

// 🚫 AUTO-INICIALIZACIÓN DESACTIVADA PARA PLANEAMIENTO
// El módulo planeamiento ya tiene su propio campo de búsqueda en el menú
// No crear controles duplicados en el mapa
console.log('ℹ️ Auto-inicialización desactivada - usar initializeBuscarLugar() manualmente si es necesario');
