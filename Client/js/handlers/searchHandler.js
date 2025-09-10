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

            // Crear control de geocoding con configuración mejorada
            this.searchControl = L.Control.geocoder({
                defaultMarkGeocode: false,
                placeholder: 'Buscar lugar...',
                errorMessage: 'No se encontró el lugar',
                showResultIcons: true,
                expanded: true, // ✅ Expandido por defecto para escritura inmediata
                position: 'topright',
                // ✅ Configuración para búsqueda automática al escribir
                suggest: true,
                suggestMinLength: 3, // Buscar después de 3 caracteres
                suggestTimeout: 250, // Delay de 250ms para evitar muchas requests
                queryMinLength: 2, // Mínimo 2 caracteres para búsqueda
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
            
            // ✅ CONFIGURACIÓN ADICIONAL: Auto-activar al escribir
            setTimeout(() => {
                const searchInput = document.querySelector('.leaflet-control-geocoder-form input');
                if (searchInput) {
                    // Foco automático en el input
                    searchInput.focus();
                    
                    // Evento para búsqueda automática al escribir
                    let searchTimeout;
                    searchInput.addEventListener('input', (e) => {
                        const query = e.target.value.trim();
                        
                        // Limpiar timeout anterior
                        if (searchTimeout) clearTimeout(searchTimeout);
                        
                        // Buscar automáticamente después de 500ms de pausa en escritura
                        if (query.length >= 3) {
                            searchTimeout = setTimeout(() => {
                                console.log(`🔍 Búsqueda automática: "${query}"`);
                                this.searchControl.options.geocoder.geocode(query, (results) => {
                                    if (results && results.length > 0) {
                                        // Mostrar sugerencias automáticamente
                                        this.searchControl._geocodeResultList(results);
                                    }
                                });
                            }, 500);
                        }
                    });
                    
                    console.log('✅ Búsqueda automática configurada');
                }
            }, 100);
            
            this.isInitialized = true;
            
            console.log('✅ Búsqueda de lugares inicializada correctamente con auto-activación');
            return true;
            
        } catch (error) {
            console.error('❌ Error inicializando búsqueda de lugares:', error);
            return false;
        }
    }

    /**
     * Búsqueda básica sin geocoder con auto-activación
     */
    initializeBasicSearch() {
        try {
            console.log('🔍 Inicializando búsqueda básica...');
            
            // Crear un control básico de búsqueda
            const BasicSearchControl = L.Control.extend({
                onAdd: function(map) {
                    const container = L.DomUtil.create('div', 'leaflet-control-search');
                    container.innerHTML = `
                        <div style="background: white; padding: 5px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                            <input type="text" id="basic-search-input" placeholder="Buscar lugar..." 
                                   style="padding: 8px; border: 1px solid #ccc; border-radius: 3px; width: 200px;">
                            <button id="basic-search-btn" style="padding: 8px; margin-left: 2px; background: #007ACC; color: white; border: none; border-radius: 3px; cursor: pointer;">🔍</button>
                            <div id="basic-search-results" style="max-height: 200px; overflow-y: auto; margin-top: 5px; display: none;"></div>
                        </div>
                    `;
                    
                    const input = container.querySelector('#basic-search-input');
                    const button = container.querySelector('#basic-search-btn');
                    const resultsDiv = container.querySelector('#basic-search-results');
                    
                    let searchTimeout;
                    
                    const performSearch = async (query) => {
                        if (!query || query.length < 3) {
                            resultsDiv.style.display = 'none';
                            return;
                        }
                        
                        try {
                            console.log(`🔍 Búsqueda básica: "${query}"`);
                            
                            // Usar Nominatim directamente
                            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
                            const results = await response.json();
                            
                            if (results && results.length > 0) {
                                resultsDiv.innerHTML = results.map((result, index) => 
                                    `<div class="search-result" data-lat="${result.lat}" data-lon="${result.lon}" 
                                          style="padding: 5px; cursor: pointer; border-bottom: 1px solid #eee; hover: background: #f0f0f0;">
                                        📍 ${result.display_name}
                                    </div>`
                                ).join('');
                                
                                resultsDiv.style.display = 'block';
                                
                                // Event listeners para resultados
                                resultsDiv.querySelectorAll('.search-result').forEach(item => {
                                    item.addEventListener('click', () => {
                                        const lat = parseFloat(item.dataset.lat);
                                        const lon = parseFloat(item.dataset.lon);
                                        
                                        // Centrar mapa
                                        window.mapa.setView([lat, lon], 15);
                                        
                                        // Agregar marcador temporal
                                        const marker = L.marker([lat, lon])
                                            .addTo(window.mapa)
                                            .bindPopup(`📍 ${item.textContent.replace('📍 ', '')}`)
                                            .openPopup();
                                        
                                        // Remover marcador después de 10 segundos
                                        setTimeout(() => {
                                            if (window.mapa.hasLayer(marker)) {
                                                window.mapa.removeLayer(marker);
                                            }
                                        }, 10000);
                                        
                                        // Ocultar resultados
                                        resultsDiv.style.display = 'none';
                                        input.value = '';
                                    });
                                });
                            } else {
                                resultsDiv.innerHTML = '<div style="padding: 5px;">No se encontraron resultados</div>';
                                resultsDiv.style.display = 'block';
                            }
                        } catch (error) {
                            console.error('Error en búsqueda básica:', error);
                            resultsDiv.innerHTML = '<div style="padding: 5px; color: red;">Error en la búsqueda</div>';
                            resultsDiv.style.display = 'block';
                        }
                    };
                    
                    // ✅ AUTO-BÚSQUEDA AL ESCRIBIR
                    input.addEventListener('input', (e) => {
                        const query = e.target.value.trim();
                        
                        // Limpiar timeout anterior
                        if (searchTimeout) clearTimeout(searchTimeout);
                        
                        // Búsqueda automática después de 500ms de pausa
                        if (query.length >= 3) {
                            searchTimeout = setTimeout(() => performSearch(query), 500);
                        } else {
                            resultsDiv.style.display = 'none';
                        }
                    });
                    
                    // Búsqueda al hacer click en botón
                    button.addEventListener('click', () => performSearch(input.value.trim()));
                    
                    // Búsqueda al presionar Enter
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            performSearch(input.value.trim());
                        }
                    });
                    
                    // Ocultar resultados al hacer click fuera
                    document.addEventListener('click', (e) => {
                        if (!container.contains(e.target)) {
                            resultsDiv.style.display = 'none';
                        }
                    });
                    
                    // Auto-focus
                    setTimeout(() => input.focus(), 100);
                    
                    return container;
                }
            });
            
            new BasicSearchControl({ position: 'topright' }).addTo(window.mapa);
            this.isInitialized = true;
            
            console.log('✅ Búsqueda básica inicializada con auto-activación');
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

// ✅ EXPORTAR FUNCIÓN GLOBAL PARA COMPATIBILIDAD - INMEDIATO Y ROBUSTO
function initializeBuscarLugar() {
    return searchHandler.initializeBuscarLugar();
}

// ✅ ASEGURAR DISPONIBILIDAD GLOBAL INMEDIATA
window.initializeBuscarLugar = initializeBuscarLugar;
window.searchHandler = searchHandler;

// ✅ VERIFICACIÓN ROBUSTA - Si hay problemas de timing
setTimeout(() => {
    if (typeof window.initializeBuscarLugar !== 'function') {
        console.warn('⚠️ initializeBuscarLugar no disponible, re-exportando...');
        window.initializeBuscarLugar = initializeBuscarLugar;
    }
}, 50);

// ✅ EXPORTAR PARA MAIRA NAMESPACE
if (!window.MAIRA) window.MAIRA = {};
if (!window.MAIRA.Handlers) window.MAIRA.Handlers = {};
window.MAIRA.Handlers.Search = searchHandler;

console.log('✅ SearchHandler cargado - initializeBuscarLugar disponible globalmente');

// 🚫 AUTO-INICIALIZACIÓN DESACTIVADA PARA PLANEAMIENTO
// El módulo planeamiento ya tiene su propio campo de búsqueda en el menú
// No crear controles duplicados en el mapa
console.log('ℹ️ Auto-inicialización desactivada - usar initializeBuscarLugar() manualmente si es necesario');
