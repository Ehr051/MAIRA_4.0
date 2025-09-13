// elevationHandler.js - MAIRA v4.0 - SOLO GITHUB RELEASES
// Configurado para usar exclusivamente GitHub Release v4.0

// 🚀 BASE URL para GitHub Release v4.0 - USANDO PROXY FLASK PARA EVITAR CORS
const ELEVATION_HANDLERS_GITHUB_BASE = '/api/github-proxy';

// Variables de estado del elevation handler
let elevationTileIndex;
let elevationHandlerIndiceCargado = false;

// 🔧 URLs de manifest - SOLO GITHUB RELEASE v4.0
const ELEVATION_INDEX_URLS = [
  // 🚀 ÚNICA FUENTE: Manifest del release v4.0 VÍA PROXY
  `${ELEVATION_HANDLERS_GITHUB_BASE}/release_manifest.json`
];

// 🚀 NUEVA ESTRATEGIA: Cargar desde release_manifest.json
const cargarIndiceElevationTiles = new Promise((resolve, reject) => {
  console.log('🔄 Cargando release_manifest.json desde GitHub Release v4.0...');
  
  // Función para intentar cargar desde URLs del manifest
  const intentarCarga = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} para ${url}`);
    }
    return response.json();
  };
  
  // Cargar manifest v4.0
  (async () => {
    let lastError = null;
    
    for (const url of ELEVATION_INDEX_URLS) {
      try {
        console.log(`📡 Cargando manifest desde: ${url}`);
        const manifest = await intentarCarga(url);
        
        console.log('🎯 Manifest v4.0 cargado:', manifest);
        
        // Transformar manifest v4.0 a formato interno
        elevationTileIndex = {
          version: manifest.version,
          files: manifest.files,
          total_size_mb: manifest.total_size_mb
        };
        
        elevationHandlerIndiceCargado = true;
        console.log('✅ Manifest v4.0 procesado correctamente');
        resolve();
        return;
        
      } catch (error) {
        console.error(`❌ Error cargando manifest:`, error);
        lastError = error;
      }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    console.error('❌ No se pudo cargar el manifest v4.0');
    reject(lastError);
  })();
});

// Función principal para cargar datos de elevación
async function cargarDatosElevacion(bounds) {
  if (!elevationHandlerIndiceCargado) {
    console.warn('Esperando a que el manifest v4.0 se cargue...');
    await cargarIndiceElevationTiles;
  }

  if (!elevationTileIndex) {
    console.warn('El manifest v4.0 no se ha cargado aún.');
    return null;
  }

  try {
    console.log('🗺️ Cargando datos de elevación desde GitHub Release v4.0');
    
    // NUEVA ESTRATEGIA: Descargar y extraer tar.gz completo
    const altimetriaData = await extractAllTilesFromTarGz();
    
    if (altimetriaData) {
      console.log('✅ Datos de elevación cargados desde release v4.0');
      return altimetriaData;
    } else {
      console.error('❌ No se pudieron cargar datos de elevación');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error cargando datos de elevación:', error);
    return null;
  }
}

// 🚀 NUEVA: Función para descargar y extraer tar.gz completo
async function extractAllTilesFromTarGz() {
  try {
    console.log('📦 Descargando maira_altimetria_tiles.tar.gz desde release v4.0');
    
    const tarGzUrl = `${ELEVATION_HANDLERS_GITHUB_BASE}/maira_altimetria_tiles.tar.gz`;
    console.log(`📡 Descargando desde: ${tarGzUrl}`);
    
    const response = await fetch(tarGzUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} descargando altimetría`);
    }
    
    const tarGzData = await response.arrayBuffer();
    console.log(`✅ Altimetría descargada: ${(tarGzData.byteLength / 1024 / 1024).toFixed(1)}MB`);
    
    // Extraer todos los tiles del tar.gz
    const extractedTiles = await extractAllFilesFromTarGz(tarGzData);
    
    if (extractedTiles && extractedTiles.length > 0) {
      console.log(`✅ Extraídos ${extractedTiles.length} tiles de altimetría`);
      return extractedTiles;
    } else {
      throw new Error('No se pudieron extraer tiles del archivo');
    }
    
  } catch (error) {
    console.error('❌ Error descargando altimetría:', error);
    return null;
  }
}

// 🔧 Función para extraer TODOS los archivos de tar.gz
async function extractAllFilesFromTarGz(tarGzData) {
  try {
    console.log('🔍 Extrayendo TODOS los archivos de tar.gz');
    
    // Cargar pako.js si no está disponible
    if (typeof pako === 'undefined') {
      console.log('📦 Cargando pako.js para decompresión...');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js');
    }
    
    // Descomprimir gzip
    console.log('🗜️ Descomprimiendo gzip...');
    const tarData = pako.inflate(new Uint8Array(tarGzData));
    console.log(`✅ Datos descomprimidos: ${(tarData.byteLength / 1024 / 1024).toFixed(1)}MB`);
    
    // Parsear archivo TAR y extraer todos los archivos
    const extractedFiles = parseTarAndExtractAll(tarData);
    
    console.log(`✅ Procesados ${extractedFiles.length} archivos del TAR`);
    return extractedFiles;
    
  } catch (error) {
    console.error('❌ Error extrayendo archivos de tar.gz:', error);
    return null;
  }
}

// 🔧 Parser TAR simple para extraer todos los archivos
function parseTarAndExtractAll(tarData) {
  const files = [];
  let offset = 0;
  
  try {
    while (offset < tarData.length) {
      // Leer header TAR (512 bytes)
      if (offset + 512 > tarData.length) break;
      
      const header = tarData.slice(offset, offset + 512);
      
      // Extraer nombre de archivo
      const nameBytes = header.slice(0, 100);
      let name = '';
      for (let i = 0; i < nameBytes.length && nameBytes[i] !== 0; i++) {
        name += String.fromCharCode(nameBytes[i]);
      }
      
      if (!name) break; // Final del archivo
      
      // Extraer tamaño de archivo
      const sizeBytes = header.slice(124, 136);
      let sizeStr = '';
      for (let i = 0; i < sizeBytes.length && sizeBytes[i] !== 0; i++) {
        sizeStr += String.fromCharCode(sizeBytes[i]);
      }
      const size = parseInt(sizeStr.trim(), 8) || 0;
      
      offset += 512; // Saltar header
      
      // Extraer contenido del archivo
      if (size > 0 && name.endsWith('.tif')) {
        const fileData = tarData.slice(offset, offset + size);
        files.push({
          name: name,
          data: fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength),
          size: size
        });
        console.log(`📄 Extraído: ${name} (${(size / 1024).toFixed(1)}KB)`);
      }
      
      // Avanzar al siguiente archivo (padding a 512 bytes)
      offset += Math.ceil(size / 512) * 512;
    }
    
    console.log(`✅ Extraídos ${files.length} archivos .tif del TAR`);
    return files;
    
  } catch (error) {
    console.error('❌ Error parseando TAR:', error);
    return [];
  }
}

// 🔧 Función auxiliar para cargar scripts dinámicamente
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Función para obtener elevación en un punto específico
async function obtenerElevacionEnPunto(lat, lon) {
  try {
    // Asegurar que los datos estén cargados
    if (!elevationHandlerIndiceCargado) {
      await cargarIndiceElevationTiles;
    }
    
    const tiles = await cargarDatosElevacion({
      north: lat + 0.01,
      south: lat - 0.01,
      east: lon + 0.01,
      west: lon - 0.01
    });
    
    if (!tiles || tiles.length === 0) {
      console.warn(`No se encontraron tiles para lat=${lat}, lon=${lon}`);
      return null;
    }
    
    // Procesar tiles y obtener elevación
    for (const tile of tiles) {
      try {
        const tiff = await GeoTIFF.fromArrayBuffer(tile.data);
        const image = await tiff.getImage();
        const rasters = await image.readRasters();
        const metadata = await image.getFileDirectory();
        
        // Calcular si el punto está dentro de este tile
        const tiepoint = metadata.ModelTiepoint;
        const scale = metadata.ModelPixelScale;
        
        if (tiepoint && scale) {
          const pixelX = Math.floor((lon - tiepoint[3]) / scale[0]);
          const pixelY = Math.floor((tiepoint[4] - lat) / scale[1]);
          
          if (pixelX >= 0 && pixelX < image.getWidth() && pixelY >= 0 && pixelY < image.getHeight()) {
            const elevation = rasters[0][pixelY * image.getWidth() + pixelX];
            
            if (elevation && elevation !== -9999) {
              console.log(`✅ Elevación encontrada: ${elevation}m en (${lat}, ${lon})`);
              return elevation;
            }
          }
        }
        
      } catch (error) {
        console.warn(`⚠️ Error procesando tile ${tile.name}:`, error);
        continue;
      }
    }
    
    console.warn(`No se encontró elevación válida para lat=${lat}, lon=${lon}`);
    return null;
    
  } catch (error) {
    console.error('❌ Error obteniendo elevación:', error);
    return null;
  }
}

// Exponer funciones globalmente
window.elevationHandler = {
  cargarDatosElevacion,
  obtenerElevacionEnPunto,
  cargarIndiceElevationTiles
};

console.log('🚀 ElevationHandler v4.0 cargado - Solo GitHub Releases');
