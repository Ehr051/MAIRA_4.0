/**
 * 🔍 SEARCH HANDLER
 * Módulo refactorizado para búsqueda de lugares (extraído de herramientasP.js)
 * Maneja la funcionalidad de buscar lugares geográficos
 * CORREGIDO: Solo usa el HTML existente, no crea controles adicionales
 */

class SearchHandler {
    constructor() {
        this.isInitialized = false;
        console.log('✅ SearchHandler inicializado');
    }

    /**
     * Inicializar búsqueda de lugares usando elementos HTML existentes
     */
    initializeBuscarLugar() {
        try {
            console.log('🔍 Inicializando búsqueda de lugares...');
            
            // Verificar que el mapa esté disponible
            if (!window.mapa) {
                console.error('❌ Mapa no disponible para búsqueda');
                return false;
            }

            // SIEMPRE usar búsqueda básica con el HTML existente
            console.log('🔍 Usando búsqueda básica con elementos HTML existentes');
            return this.initializeBasicSearch();
            
        } catch (error) {
            console.error('❌ Error inicializando búsqueda de lugares:', error);
            return false;
        }
    }

    /**
     * Búsqueda básica usando el HTML existente
     */
    initializeBasicSearch() {
        try {
            console.log('🔍 Inicializando búsqueda básica...');
            
            // Buscar los elementos HTML existentes
            const searchInput = document.getElementById('busquedaLugar');
            const searchButton = document.getElementById('btnBuscarLugar');
            const resultsContainer = document.getElementById('resultadosBusquedaLugar');
            
            if (!searchInput || !searchButton || !resultsContainer) {
                console.error('❌ No se encontraron los elementos HTML de búsqueda');
                return false;
            }
            
            console.log('✅ Elementos HTML de búsqueda encontrados');
            
            // Auto-activación: búsqueda al escribir
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                
                if (query.length < 3) {
                    resultsContainer.style.display = 'none';
                    resultsContainer.innerHTML = '';
                    return;
                }
                
                // Debounce para evitar muchas búsquedas
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performBasicSearch(query, resultsContainer);
                }, 300);
            });
            
            // Búsqueda al hacer click en el botón
            searchButton.addEventListener('click', (e) => {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query.length >= 3) {
                    this.performBasicSearch(query, resultsContainer);
                }
            });
            
            // Búsqueda al presionar Enter
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = searchInput.value.trim();
                    if (query.length >= 3) {
                        this.performBasicSearch(query, resultsContainer);
                    }
                }
            });
            
            // Ocultar resultados al hacer click fuera
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target) && !searchButton.contains(e.target)) {
                    resultsContainer.style.display = 'none';
                }
            });
            
            this.isInitialized = true;
            console.log('✅ Búsqueda básica inicializada con auto-activación');
            return true;
            
        } catch (error) {
            console.error('❌ Error inicializando búsqueda básica:', error);
            return false;
        }
    }

    /**
     * Realizar búsqueda usando API de Nominatim
     */
    async performBasicSearch(query, resultsContainer) {
        try {
            console.log(`🔍 Búsqueda básica: "${query}"`);
            
            // Mostrar estado de carga
            resultsContainer.innerHTML = '<li style="padding: 10px;">🔍 Buscando...</li>';
            resultsContainer.style.display = 'block';
            
            // Usar Nominatim directamente
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
            
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            
            const results = await response.json();
            
            if (results && results.length > 0) {
                resultsContainer.innerHTML = results.map((result, index) => 
                    `<li class="search-result" data-lat="${result.lat}" data-lon="${result.lon}" 
                         style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee; list-style: none;">
                        📍 ${result.display_name}
                    </li>`
                ).join('');
                
                resultsContainer.style.display = 'block';
                
                // Event listeners para resultados
                resultsContainer.querySelectorAll('.search-result').forEach(item => {
                    item.addEventListener('click', () => {
                        const lat = parseFloat(item.dataset.lat);
                        const lon = parseFloat(item.dataset.lon);
                        
                        console.log(`📍 Lugar seleccionado: ${lat}, ${lon}`);
                        
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
                        
                        // Ocultar resultados y limpiar input
                        resultsContainer.style.display = 'none';
                        const searchInput = document.getElementById('busquedaLugar');
                        if (searchInput) {
                            searchInput.value = '';
                        }
                    });
                    
                    // Hover effects
                    item.addEventListener('mouseenter', () => {
                        item.style.backgroundColor = '#f0f0f0';
                    });
                    
                    item.addEventListener('mouseleave', () => {
                        item.style.backgroundColor = '';
                    });
                });
            } else {
                resultsContainer.innerHTML = '<li style="padding: 10px; list-style: none;">❌ No se encontraron resultados</li>';
                resultsContainer.style.display = 'block';
            }
        } catch (error) {
            console.error('Error en búsqueda básica:', error);
            resultsContainer.innerHTML = '<li style="padding: 10px; color: red; list-style: none;">❌ Error en la búsqueda</li>';
            resultsContainer.style.display = 'block';
        }
    }

    /**
     * Limpiar búsqueda
     */
    cleanup() {
        try {
            this.isInitialized = false;
            console.log('✅ SearchHandler limpiado');
        } catch (error) {
            console.error('❌ Error limpiando SearchHandler:', error);
        }
    }

    /**
     * Obtener estado de inicialización
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            type: 'basic_search'
        };
    }
}

// ============================================
// INICIALIZACIÓN Y EXPORTACIÓN GLOBAL
// ============================================

// Crear instancia global
const searchHandler = new SearchHandler();

// Función global para inicializar búsqueda
function initializeBuscarLugar() {
    return searchHandler.initializeBuscarLugar();
}

// Auto-inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🔍 DOM cargado, auto-inicializando SearchHandler...');
        // NO auto-inicializar automáticamente, dejar que se llame manualmente
    });
} else {
    console.log('🔍 DOM ya cargado');
}

// Exportar al scope global con múltiples métodos
window.searchHandler = searchHandler;
window.initializeBuscarLugar = initializeBuscarLugar;

// ✅ SISTEMA ROBUSTO DE EXPORTACIÓN GLOBAL
if (typeof window !== 'undefined') {
    // Declaración inmediata
    window.initializeBuscarLugar = initializeBuscarLugar;
    
    // Verificación con timeout
    setTimeout(() => {
        if (!window.initializeBuscarLugar) {
            console.warn('⚠️ initializeBuscarLugar no detectada, re-exportando...');
            window.initializeBuscarLugar = initializeBuscarLugar;
        }
    }, 100);
}

console.log('✅ SearchHandler cargado - initializeBuscarLugar disponible globalmente');
console.log('ℹ️ Auto-inicialización desactivada - usar initializeBuscarLugar() manualmente si es necesario');
