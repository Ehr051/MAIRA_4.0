// optimized_tiles_system.js
// Sistema optimizado de tiles sin banners de emergencia

(function() {
    console.log('🗺️ Inicializando sistema optimizado de tiles...');

    // Evitar que se creen banners de emergencia
    window.hideTilesBanner = function() {
        const banner = document.getElementById('tiles-status-banner');
        if (banner) {
            banner.remove();
            document.body.style.paddingTop = '0px';
        }
    };

    // Ocultar cualquier banner existente al cargar
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            window.hideTilesBanner();
        }, 100);
    });

    // Interceptar y optimizar las funciones de estado
    window.updateTilesStatus = function(message, type) {
        // Solo log en console, no banners visuales
        if (type === 'success') {
            console.log('✅ Tiles:', message);
        } else if (type === 'warning') {
            console.warn('⚠️ Tiles:', message);
        } else {
            console.info('ℹ️ Tiles:', message);
        }
    };

    // Optimización del MiniTilesLoader
    if (window.MiniTilesLoader) {
        const originalLoader = window.MiniTilesLoader;
        
        window.MiniTilesLoader = class extends originalLoader {
            constructor() {
                super();
                console.log('🚀 MiniTilesLoader optimizado inicializado');
                
                // URLs optimizadas para producción
                this.baseUrls = [
                    'https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/',
                    '../../mini_tiles_github/',
                    'https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@main/mini_tiles_github/'
                ];
            }

            async initialize() {
                try {
                    await super.initialize();
                    console.log('✅ Sistema de tiles optimizado listo');
                } catch (error) {
                    console.warn('⚠️ Fallback a sistema básico de tiles');
                    this.initializeFallback();
                }
            }

            initializeFallback() {
                // Sistema básico de fallback sin alertas visuales
                this.masterIndex = {
                    total_provincias: 6,
                    total_tar_files: 12,
                    provincias: ['norte', 'centro_norte', 'centro', 'sur', 'patagonia', 'otros']
                };
                console.log('🔄 Sistema de fallback activado');
            }
        };
    }

    // Mejorar la función de carga de elevación
    if (typeof window.cargarDatosElevacion === 'undefined') {
        window.cargarDatosElevacion = async function(bounds) {
            try {
                // Intentar cargar datos reales primero
                const response = await fetch('/api/elevation-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bounds)
                });
                
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                console.warn('🌄 Usando datos de elevación simulados');
            }
            
            // Fallback a datos simulados mejorados
            return generateImprovedMockElevation(bounds);
        };
    }

    function generateImprovedMockElevation(bounds) {
        const { north, south, east, west } = bounds;
        const elevations = [];
        
        const step = Math.min((north - south) / 20, (east - west) / 20);
        
        for (let lat = south; lat <= north; lat += step) {
            for (let lng = west; lng <= east; lng += step) {
                let elevation = calculateArgentineElevation(lat, lng);
                elevations.push([lng, lat, elevation]);
            }
        }
        
        return elevations;
    }

    function calculateArgentineElevation(lat, lng) {
        // Modelo mejorado de elevación para Argentina
        let elevation = 0;
        
        // Cordillera de los Andes (oeste)
        if (lng < -65) {
            const andesIntensity = Math.abs(lng + 70) / 5;
            elevation = Math.sin(lat * 0.1) * 2000 * andesIntensity + 1500;
        }
        // Patagonia (sur)
        else if (lat < -35) {
            elevation = Math.random() * 800 + 200 + Math.abs(lat + 50) * 10;
        }
        // Pampa húmeda (centro-este)
        else if (lat > -40 && lng > -65) {
            elevation = Math.random() * 300 + 50;
        }
        // Mesopotamia (noreste)
        else if (lat > -30 && lng > -60) {
            elevation = Math.random() * 200 + 30;
        }
        // Noroeste
        else {
            elevation = Math.random() * 1500 + 500;
        }
        
        return Math.max(0, Math.round(elevation));
    }

    console.log('✅ Sistema optimizado de tiles configurado');
})();
