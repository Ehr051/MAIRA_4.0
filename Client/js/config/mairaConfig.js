/**
 * MAIRA 4.0 - Configuración Central del Sistema
 * ============================================
 * Configuración centralizada para todo el sistema MAIRA
 */

/**
 * 🌍 MAIRA 4.0 - Configuración Global de Datos
 * 
 * URLs reales de GitHub Releases y CDN para producción
 * Basado en la configuración real de elevationHandler y vegetacionHandler
 */

// 🚀 CONFIGURACIÓN PRINCIPAL - GITHUB RELEASES
const MAIRA_DATA_CONFIG = {
    // Elevación - Basado en elevationHandler.js
    elevation: {
        github_releases: [
            'https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/master_mini_tiles_index.json',
            'https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/'
        ],
        fallback_urls: [
            'https://raw.githubusercontent.com/Ehr051/MAIRA-4.0/main/Client/Libs/datos_argentina/Altimetria_Mini_Tiles/',
            'https://cdn.jsdelivr.net/gh/Ehr051/MAIRA-4.0@main/Client/Libs/datos_argentina/Altimetria_Mini_Tiles/'
        ],
        proxy_base: '/api/proxy/github'
    },

    // Vegetación - Basado en vegetacionhandler.js  
    vegetation: {
        github_releases: 'https://github.com/Ehr051/MAIRA-4.0/releases/download/v4.0',
        fallback_urls: [
            'https://raw.githubusercontent.com/Ehr051/MAIRA-4.0/main/Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/',
            'https://cdn.jsdelivr.net/gh/Ehr051/MAIRA-4.0@main/Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/'
        ],
        tar_file: 'maira_vegetacion_tiles.tar.gz',
        index_file: 'vegetation_master_index.json'
    },

    // ⚠️ TRANSITABILIDAD NO EXISTE - Los handlers no la usan
    // transitability: NO DISPONIBLE

    // 🌐 CDN y Proxy
    proxy: {
        github_base: '/api/proxy/github',
        cdn_base: 'https://cdn.jsdelivr.net/gh/Ehr051/MAIRA-4.0@main/',
        raw_github: 'https://raw.githubusercontent.com/Ehr051/MAIRA-4.0/main/'
    }
};

// 📊 INFORMACIÓN DE TILES
const TILE_CONFIG = {
    size: 256,
    format: 'png',
    max_zoom: 18,
    min_zoom: 8
};

// 🔄 FUNCIONES DE ACCESO
function getElevationUrls() {
    return {
        primary: MAIRA_DATA_CONFIG.elevation.github_releases,
        fallback: MAIRA_DATA_CONFIG.elevation.fallback_urls
    };
}

function getVegetationUrls() {
    return {
        primary: `${MAIRA_DATA_CONFIG.vegetation.github_releases}/${MAIRA_DATA_CONFIG.vegetation.tar_file}`,
        fallback: MAIRA_DATA_CONFIG.vegetation.fallback_urls,
        index: `${MAIRA_DATA_CONFIG.vegetation.github_releases}/${MAIRA_DATA_CONFIG.vegetation.index_file}`
    };
}

// 🌍 EXPORTAR AL SCOPE GLOBAL
window.MAIRA_DATA_CONFIG = MAIRA_DATA_CONFIG;
window.TILE_CONFIG = TILE_CONFIG;
window.getElevationUrls = getElevationUrls;
window.getVegetationUrls = getVegetationUrls;

console.log('✅ MAIRA Data Config cargado - URLs de GitHub Releases configuradas');
console.log('📊 Configuración disponible en: window.MAIRA_DATA_CONFIG');
