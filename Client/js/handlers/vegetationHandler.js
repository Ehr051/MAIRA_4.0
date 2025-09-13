/**
 * 🌿 VEGETATION HANDLER v4.0 - Sistema de tiles de vegetación para MAIRA
 * Manejo de datos de vegetación y NDVI desde GitHub Release v4.0
 */

// URL base para GitHub Releases v4.0 (confirmado funcionando)
const VEGETATION_HANDLERS_GITHUB_BASE = '/api/proxy/github';
const VEGETATION_LOCAL_BASE = 'Client/Libs/datos_argentina/Vegetacion_Mini_Tiles';

// Variables globales
let vegetationTileIndex;
let vegetationHandlerIndiceCargado = false;

// 🔧 URLs de índices principales - SOLO GITHUB RELEASES v4.0 CONFIRMADO
const VEGETATION_INDEX_URLS = [
  // 🚀 PRIORIDAD 1: Proxy Flask confirmado funcionando (v4.0)
  '/api/proxy/github/vegetation_master_index.json',
  
  // 🔄 FALLBACK: Índice de vegetación legacy
  'https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/vegetation_master_index.json'
];

// Configuración de las regiones de vegetación con sus archivos tar.gz
const VEGETATION_REGIONS_CONFIG = {
    batch_01: {
        base_path: `${VEGETATION_LOCAL_BASE}/vegetation_ndvi_batch_01`,
        tar_count: 8,
        tiles_count: 500
    },
    batch_02: {
        base_path: `${VEGETATION_LOCAL_BASE}/vegetation_ndvi_batch_02`,
        tar_count: 10,
        tiles_count: 650
    },
    batch_03: {
        base_path: `${VEGETATION_LOCAL_BASE}/vegetation_ndvi_batch_03`,
        tar_count: 12,
        tiles_count: 800
    }
};

// 🚀 ESTRATEGIA FINAL: Assets de GitHub Release v4.0
const VEGETATION_RELEASE_ASSETS = {
    VEGETACION_TAR_GZ: `${VEGETATION_HANDLERS_GITHUB_BASE}/maira_vegetacion_tiles.tar.gz`,
    MANIFEST: `${VEGETATION_HANDLERS_GITHUB_BASE}/vegetation_master_index.json`,
    INDEX: `${VEGETATION_HANDLERS_GITHUB_BASE}/vegetation_master_index.json`
};

// URLs de fallback para compatibilidad
const VEGETATION_TILES_FALLBACK_URLS = [VEGETATION_HANDLERS_GITHUB_BASE];

// 🚀 Cargar el índice desde GitHub Release v4.0
const cargarIndiceVegetationTiles = new Promise((resolve, reject) => {
  console.log('🌿 Cargando vegetation_master_index.json desde GitHub Release v4.0...');
  
  // Función para intentar cargar desde URLs
  const intentarCarga = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} para ${url}`);
    }
    return response.json();
  };
  
  // URLs de vegetación para el índice
  const urls = VEGETATION_INDEX_URLS;
  
  // Intentar cargar desde cada URL secuencialmente
  (async () => {
    let lastError = null;
    
    for (const url of urls) {
      try {
        console.log(`📡 Intentando cargar índice vegetación desde: ${url}`);
        const data = await intentarCarga(url);
        
        console.log('🎯 Índice vegetación cargado exitosamente desde:', url);
        
        // Validar la estructura del índice de vegetación
        if (data.batches && typeof data.batches === 'object') {
          // Es el formato de vegetación por batches
          console.log('✅ Formato vegetación por batches detectado');
          vegetationTileIndex = data;
          vegetationHandlerIndiceCargado = true;
          console.log('🌿 Índice de vegetación cargado correctamente.');
          resolve();
          return;
        } else if (data.tiles && typeof data.tiles === 'object') {
          // Es el formato anterior
          console.log('✅ Formato vegetación clásico detectado');
          for (const key in data.tiles) {
            data.tiles[key].provincia = key;
          }
          vegetationTileIndex = { batches: data.tiles };
          vegetationHandlerIndiceCargado = true;
          console.log('🌿 Índice de vegetación convertido y cargado.');
          resolve();
          return;
        } else {
          throw new Error('Estructura de índice de vegetación no reconocida');
        }
      } catch (error) {
        console.warn(`⚠️ Error cargando desde ${url}:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    console.error('❌ No se pudo cargar el índice de vegetación desde ninguna URL');
    console.error('🔧 Último error:', lastError);
    reject(lastError);
  })();
});

// Función principal para cargar datos de vegetación
async function cargarDatosVegetacion(bounds) {
  if (!vegetationHandlerIndiceCargado) {
    console.warn('🌿 Esperando a que el índice de vegetación se cargue.');
    await cargarIndiceVegetationTiles;
  }

  if (!vegetationTileIndex) {
    console.warn('🌿 El índice de vegetación no se ha cargado aún.');
    return null;
  }

  try {
    // Buscar el tile que corresponde a la región especificada
    const tile = await buscarVegetationTileCorrespondiente(bounds);

    if (!tile) {
      console.warn('🌿 No se encontró un tile de vegetación correspondiente a la región especificada.');
      return null;
    }

    // Construir ruta del tile dependiendo del formato
    console.log(`🌿 Tile en formato vegetación: ${tile.filename} (batch: ${tile.batch})`);
    
    // 🚀 ESTRATEGIA v4.1: PRIORIDAD .tif directo → tar.gz GitHub Release
    console.log(`🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)`);
    
    // PASO 1: Intentar cargar .tif directo desde release
    const directExtracted = await extractVegetationTifFromRelease(tile);
    
    if (directExtracted) {
      console.log(`✅ Vegetación cargada desde .tif directo: ${tile.filename}`);
      try {
        const tiff = await GeoTIFF.fromArrayBuffer(directExtracted);
        const image = await tiff.getImage();
        const rasters = await image.readRasters();
        const metadata = await image.getFileDirectory();

        return {
          data: rasters[0],
          width: image.getWidth(),
          height: image.getHeight(),
          tiepoint: metadata.ModelTiepoint,
          scale: metadata.ModelPixelScale,
          type: 'vegetation'
        };
      } catch (error) {
        console.error(`❌ Error procesando .tif directo vegetación para ${tile.filename}:`, error);
        // Continúa a tar.gz
      }
    }
    
    // PASO 2: Fallback a tar.gz (como v3.0 que funcionaba)
    console.log(`🔄 Fallback a tar.gz para vegetación ${tile.filename}`);
    const releaseExtracted = await extractVegetationFromManifestTarGz(tile);
    
    if (releaseExtracted) {
      try {
        console.log(`📦 Procesando vegetación extraída de GitHub Release: ${tile.filename}`);
        const tiff = await GeoTIFF.fromArrayBuffer(releaseExtracted);
        const image = await tiff.getImage();
        const rasters = await image.readRasters();
        const metadata = await image.getFileDirectory();

        return {
          data: rasters[0],
          width: image.getWidth(),
          height: image.getHeight(),
          tiepoint: metadata.ModelTiepoint,
          scale: metadata.ModelPixelScale,
          type: 'vegetation'
        };
      } catch (error) {
        console.error(`❌ Error procesando vegetación de GitHub Release para ${tile.filename}:`, error);
      }
    }
    
    // ❌ Si llegamos aquí, GitHub Release falló
    console.error(`❌ No se pudo cargar el tile de vegetación ${tile.filename} desde GitHub Release`);
    console.error(`🔧 DIAGNÓSTICO: Verificar que el archivo esté en ${VEGETATION_HANDLERS_GITHUB_BASE}`);
    return null;

  } catch (error) {
    console.error('❌ Error al cargar datos de vegetación:', error);
    return null;
  }
}

// 🌿 NUEVA: Función para extraer .tif directo desde release
async function extractVegetationTifFromRelease(tileInfo) {
  try {
    console.log(`🌿 Intentando cargar ${tileInfo.filename} directamente como .tif`);
    
    // Construir URL directa del .tif en el release
    const batch = tileInfo.batch;
    const directTifUrl = `${VEGETATION_HANDLERS_GITHUB_BASE}/${batch}/${tileInfo.filename}`;
    
    console.log(`📡 Cargando .tif directo: ${directTifUrl}`);
    
    const response = await fetch(directTifUrl);
    
    if (!response.ok) {
      console.log(`⚠️ .tif directo falló (${response.status}): ${directTifUrl}`);
      return null;
    }
    
    const tileData = await response.arrayBuffer();
    console.log(`✅ .tif vegetación cargado directamente: ${(tileData.byteLength / 1024).toFixed(1)}KB`);
    
    return tileData;
    
  } catch (error) {
    console.error(`❌ Error cargando .tif directo vegetación ${tileInfo.filename}:`, error);
    return null;
  }
}

// 🚀 Función para extraer vegetación de GitHub Release v4.0
async function extractVegetationFromManifestTarGz(tileInfo) {
  try {
    console.log(`📦 Extrayendo vegetación ${tileInfo.filename} de GitHub Release v4.0`);
    
    // URL del tar.gz en GitHub Release v4.0 (Vegetación)
    const tarGzUrl = VEGETATION_RELEASE_ASSETS.VEGETACION_TAR_GZ;
    
    console.log(`📡 Descargando vegetación desde: ${tarGzUrl}`);
    const response = await fetch(tarGzUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} descargando release vegetación`);
    }
    
    const tarGzData = await response.arrayBuffer();
    console.log(`✅ Release vegetación descargado: ${(tarGzData.byteLength / 1024 / 1024).toFixed(1)}MB`);
    
    // Extraer archivo específico del tar.gz
    const extractedTif = await extractFileFromTarGz(tarGzData, tileInfo.filename);
    
    if (extractedTif) {
      console.log(`✅ Tile vegetación extraído: ${tileInfo.filename}`);
      return extractedTif;
    } else {
      throw new Error(`Tile vegetación ${tileInfo.filename} no encontrado en release`);
    }
    
  } catch (error) {
    console.error(`❌ Error extrayendo vegetación ${tileInfo.filename}:`, error);
    return null;
  }
}

// 🔧 Función para extraer archivos de tar.gz - REUTILIZA DE ELEVATION HANDLER
async function extractFileFromTarGz(tarGzData, targetFilename) {
  try {
    console.log(`🔍 Extrayendo vegetación ${targetFilename} de tar.gz de ${(tarGzData.byteLength / 1024 / 1024).toFixed(1)}MB`);
    
    // Cargar pako.js si no está disponible
    if (typeof pako === 'undefined') {
      await loadScript('node_modules/pako/dist/pako.min.js');
    }
    
    // Descomprimir gzip
    const tarData = pako.inflate(new Uint8Array(tarGzData));
    console.log(`📂 Archivo descomprimido: ${(tarData.byteLength / 1024 / 1024).toFixed(1)}MB`);
    
    // Parsear archivo TAR
    const files = parseTarBuffer(tarData);
    console.log(`📋 Archivos en TAR: ${files.length}`);
    
    // Buscar el archivo objetivo
    const targetFile = files.find(file => 
      file.name === targetFilename || 
      file.name.endsWith(targetFilename) ||
      file.name.includes(targetFilename.replace('.tif', ''))
    );
    
    if (!targetFile) {
      console.error(`❌ Archivo ${targetFilename} no encontrado en TAR`);
      console.log(`📋 Archivos disponibles:`, files.map(f => f.name));
      return null;
    }
    
    console.log(`✅ Archivo encontrado en TAR: ${targetFile.name} (${targetFile.size} bytes)`);
    return targetFile.data;
    
  } catch (error) {
    console.error(`❌ Error extrayendo de TAR.GZ:`, error);
    return null;
  }
}

// 🔍 Función para buscar tile de vegetación correspondiente
async function buscarVegetationTileCorrespondiente(bounds) {
  if (!vegetationTileIndex) {
    console.error('❌ Índice de vegetación no cargado');
    return null;
  }

  // Calcular centro de los bounds
  const centerLat = (bounds.north + bounds.south) / 2;
  const centerLng = (bounds.east + bounds.west) / 2;

  console.log(`🌿 Buscando tile vegetación para: ${centerLat}, ${centerLng}`);

  // Buscar en todos los batches
  for (const [batchName, batchData] of Object.entries(vegetationTileIndex.batches || {})) {
    if (batchData.tiles) {
      for (const tile of batchData.tiles) {
        if (tile.bounds &&
            centerLat >= tile.bounds.south &&
            centerLat <= tile.bounds.north &&
            centerLng >= tile.bounds.west &&
            centerLng <= tile.bounds.east) {
          
          console.log(`✅ Tile vegetación encontrado: ${tile.filename} en batch ${batchName}`);
          tile.batch = batchName;
          return tile;
        }
      }
    }
  }

  console.warn(`⚠️ No se encontró tile de vegetación para coordenadas: ${centerLat}, ${centerLng}`);
  return null;
}

// Funciones auxiliares (parseTarBuffer, loadScript) - REUTILIZAR DE ELEVATION HANDLER
async function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function parseTarBuffer(buffer) {
  const files = [];
  let offset = 0;
  
  while (offset < buffer.length) {
    const header = buffer.slice(offset, offset + 512);
    
    if (header.every(byte => byte === 0)) break;
    
    const name = new TextDecoder().decode(header.slice(0, 100)).replace(/\0.*$/, '');
    const sizeOctal = new TextDecoder().decode(header.slice(124, 136)).replace(/\0.*$/, '');
    const size = parseInt(sizeOctal, 8) || 0;
    
    if (name && size > 0) {
      const data = buffer.slice(offset + 512, offset + 512 + size);
      files.push({ name, size, data });
    }
    
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  
  return files;
}

// Exponer funciones globalmente
window.cargarDatosVegetacion = cargarDatosVegetacion;
window.cargarIndiceVegetationTiles = cargarIndiceVegetationTiles;

console.log('🌿 VEGETATION HANDLER v4.0 cargado - GitHub Release confirmado funcionando');
