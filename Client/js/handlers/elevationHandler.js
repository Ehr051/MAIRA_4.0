// elevationHandler.js - Adaptado para manejar el nuevo sistema de tiles v4.0

// 🎯 NUEVA ESTRATEGIA: Usar archivos tar.gz locales tanto en desarrollo como en Render
const ELEVATION_LOCAL_BASE = 'Client/Libs/datos_argentina/Altimetria_Mini_Tiles';

// 🔧 URLs de índices principales - ESTRATEGIA JSON LOCAL + TAR.GZ RELEASE
const ELEVATION_INDEX_URLS = [
  // 🎯 SOLO JSON LOCAL: Para saber QUÉ buscar en el release
  'Client/Libs/datos_argentina/Altimetria_Mini_Tiles/master_mini_tiles_index.json',
  './Client/Libs/datos_argentina/Altimetria_Mini_Tiles/master_mini_tiles_index.json',
  '/Client/Libs/datos_argentina/Altimetria_Mini_Tiles/master_mini_tiles_index.json'
];

// Configuración de las provincias con sus archivos tar.gz locales
const ELEVATION_PROVINCES_CONFIG = {
    centro: {
        base_path: `${ELEVATION_LOCAL_BASE}/centro`,
        tar_count: 15,
        tiles_count: 1488
    },
    centro_norte: {
        base_path: `${ELEVATION_LOCAL_BASE}/centro_norte`,
        tar_count: 17,
        tiles_count: 1653
    },
    norte: {
        base_path: `${ELEVATION_LOCAL_BASE}/norte`,
        tar_count: 33,
        tiles_count: 3268
    },
    patagonia: {
        base_path: `${ELEVATION_LOCAL_BASE}/patagonia`,
        tar_count: 16,
        tiles_count: 1508
    },
    sur: {
        base_path: `${ELEVATION_LOCAL_BASE}/sur`,
        tar_count: 16,
        tiles_count: 1584
    }
};

// 🚀 ESTRATEGIA FINAL: JSON LOCAL + TAR.GZ RELEASE
const ELEVATION_RELEASE_ASSETS = {
    TAR_GZ: `${ELEVATION_HANDLERS_GITHUB_BASE}/maira_altimetria_tiles.tar.gz`,
    MANIFEST: `${ELEVATION_HANDLERS_GITHUB_BASE}/release_manifest.json`
};

        // URLs de fallback para ELEVATION HANDLER - MANIFEST v4.0 COMPATIBLE
// Solo se necesita para compatibilidad con código legacy
const ELEVATION_TILES_FALLBACK_URLS = [ELEVATION_HANDLERS_GITHUB_BASE];// Ruta para tiles clásicos (legacy) - ELEVATION HANDLER
const ELEVATION_TILE_FOLDER_PATH = 'Client/Libs/datos_argentina/Altimetria_Legacy';

// Índice de tiles
// Variables de estado específicas del elevation handler
let elevationTileIndex;
let elevationHandlerIndiceCargado = false;

// 🚀 Cargar el índice desde archivos locales - COMPATIBLE LOCAL + RENDER
const cargarIndiceElevationTiles = new Promise((resolve, reject) => {
  console.log('🔄 Cargando master_mini_tiles_index.json desde archivos locales...');
  
  // Función para intentar cargar desde URLs locales
  const intentarCarga = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} para ${url}`);
    }
    return response.json();
  };
  
    // 🎯 URLs locales para el índice - COMPATIBLES LOCAL + RENDER
    const urls = ELEVATION_INDEX_URLS;  // Intentar cargar desde cada URL secuencialmente
  (async () => {
    let lastError = null;
    
    for (const url of urls) {
      try {
        console.log(`📡 Intentando cargar desde: ${url}`);
        const data = await intentarCarga(url);
        
        console.log('🎯 Índice cargado exitosamente desde:', url);
        
        // Validar la estructura del índice
        if (data.provincias && typeof data.provincias === 'object') {
          // Es el formato de mini-tiles
          console.log('✅ Formato mini-tiles detectado');
          elevationTileIndex = data;
          elevationHandlerIndiceCargado = true;
          console.log('Índice de tiles cargado correctamente.');
          resolve();
          return;
        } else if (data.tiles && typeof data.tiles === 'object') {
          // Es el formato anterior
          console.log('✅ Formato tiles clásico detectado');
          for (const key in data.tiles) {
            const tile = data.tiles[key];
            if (!tile.filename || !tile.bounds || typeof tile.bounds !== 'object') {
              throw new Error(`El tile con clave '${key}' no tiene la estructura correcta.`);
            }
          }
          elevationTileIndex = data.tiles;
          elevationHandlerIndiceCargado = true;
          console.log('Índice de tiles cargado correctamente.');
          resolve();
          return;
        } else {
          throw new Error('El índice no tiene la estructura esperada (ni provincias ni tiles).');
        }
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Error cargando desde ${url}:`, error.message);
        continue; // Intentar siguiente URL
      }
    }
    
    // Si llegamos aquí, todas las URLs fallaron
    console.error('❌ Error cargando desde todas las URLs:', lastError);
    generarIndiceNuevo();
    reject(lastError);
  })();
});

// Función para generar un nuevo índice de tiles
function generarIndiceNuevo() {
  console.warn('Generando un nuevo índice de tiles debido a una estructura incorrecta.');
  // Aquí se podría agregar lógica para generar el índice dinámicamente si es posible.
  // Por ahora, simplemente se informa al usuario.
}

// Función para cargar datos de elevación
async function cargarDatosElevacion(bounds) {
  if (!elevationHandlerIndiceCargado) {
    console.warn('Esperando a que el índice de tiles se cargue.');
    await cargarIndiceElevationTiles;
  }

  if (!elevationTileIndex) {
    console.warn('El índice de tiles no se ha cargado aún.');
    return null;
  }

  try {
    // Buscar el tile que corresponde a la región especificada (ahora es async)
    const tile = await buscarTileCorrespondiente(bounds);

    if (!tile) {
      console.warn('No se encontró un tile correspondiente a la región especificada.');
      return null;
    }

    // Construir ruta del tile dependiendo del formato
    let tilePath;
    if (tile.provincia) {
      // Formato mini-tiles: intentar múltiples URLs
      console.log(`🗂️ Tile en formato mini-tiles: ${tile.filename} (provincia: ${tile.provincia})`);
      
      // 🚀 ESTRATEGIA v4.0: SOLO GitHub Release tar.gz (JSON local solo para índices)
      console.log(`🎯 ÚNICA ESTRATEGIA: Extraer ${tile.filename} de GitHub Release tar.gz`);
      const releaseExtracted = await extractTileFromManifestTarGz(tile);
      
      if (releaseExtracted) {
        try {
          console.log(`📦 Procesando tile extraído de GitHub Release: ${tile.filename}`);
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
          };
        } catch (error) {
          console.error(`❌ Error procesando tile de GitHub Release para ${tile.filename}:`, error);
        }
      }
      
      // ❌ Si llegamos aquí, GitHub Release falló
      console.error(`❌ No se pudo cargar el tile ${tile.filename} desde GitHub Release`);
      console.error(`🔧 DIAGNÓSTICO: Verificar que el archivo esté en ${ELEVATION_HANDLERS_GITHUB_BASE}`);
      return null;
    } else {
      // Formato clásico
      tilePath = `${ELEVATION_TILE_FOLDER_PATH}/${tile.filename}`;
      
      // Cargar los datos de elevación del tile encontrado
      const tileData = await loadTileData(tilePath);
      return tileData;
    }
  } catch (error) {
    console.error('Error al cargar datos de elevación:', error);
    return null;
  }
}

// 🚀 Función para extraer tile de GitHub Release v4.0 - URLs CONFIRMADAS
async function extractTileFromManifestTarGz(tileInfo) {
  try {
    console.log(`📦 Extrayendo ${tileInfo.filename} de GitHub Release v4.0`);
    
    // URL CONFIRMADA del tar.gz en GitHub Release
    const tarGzUrl = ELEVATION_RELEASE_ASSETS.TAR_GZ;
    
    console.log(`📡 Descargando desde: ${tarGzUrl}`);
    const response = await fetch(tarGzUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} descargando release`);
    }
    
    const tarGzData = await response.arrayBuffer();
    console.log(`✅ Release descargado: ${(tarGzData.byteLength / 1024 / 1024).toFixed(1)}MB`);
    
    // Extraer archivo específico del tar.gz
    const extractedTif = await extractFileFromTarGz(tarGzData, tileInfo.filename);
    
    if (extractedTif) {
      console.log(`✅ Tile extraído: ${tileInfo.filename}`);
      return extractedTif;
    } else {
      throw new Error(`Tile ${tileInfo.filename} no encontrado en release`);
    }
    
  } catch (error) {
    console.error(`❌ Error extrayendo ${tileInfo.filename}:`, error);
    return null;
  }
}

// 🔧 Función para extraer archivos REALES de tar.gz - IMPLEMENTACIÓN CON PAKO.JS
async function extractFileFromTarGz(tarGzData, targetFilename) {
  try {
    console.log(`🔍 Extrayendo REAL ${targetFilename} de tar.gz de ${(tarGzData.byteLength / 1024 / 1024).toFixed(1)}MB`);
    
    // Cargar pako.js si no está disponible
    if (typeof pako === 'undefined') {
      console.log('📦 Cargando pako.js para descompresión...');
      await loadScript('/node_modules/pako/dist/pako.min.js');
    }
    
    // Descomprimir gzip usando pako
    console.log('🔧 Descomprimiendo gzip...');
    const tarData = pako.ungzip(new Uint8Array(tarGzData));
    console.log(`✅ Descomprimido: ${(tarData.length / 1024 / 1024).toFixed(1)}MB`);
    
    // Parsear tar para encontrar el archivo específico
    const extractedFile = await extractFromTar(tarData, targetFilename);
    
    if (extractedFile) {
      console.log(`✅ TIF REAL extraído: ${targetFilename} (${(extractedFile.byteLength / 1024).toFixed(1)}KB)`);
      return extractedFile;
    } else {
      throw new Error(`Archivo ${targetFilename} no encontrado en tar`);
    }
    
  } catch (error) {
    console.error(`❌ Error extrayendo TIF real ${targetFilename}:`, error);
    
    // Fallback: intentar interpretar como tar sin gzip
    try {
      console.log('🔄 Intentando como tar sin compresión...');
      const extractedFile = await extractFromTar(new Uint8Array(tarGzData), targetFilename);
      if (extractedFile) {
        console.log(`✅ TIF REAL extraído (tar directo): ${targetFilename}`);
        return extractedFile;
      }
    } catch (fallbackError) {
      console.error('❌ Fallback también falló:', fallbackError);
    }
    
    return null;
  }
}

// 🔧 Función para cargar script dinámicamente
async function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 🔧 Función para extraer archivo específico de datos TAR
async function extractFromTar(tarData, targetFilename) {
  try {
    console.log(`🔍 Buscando ${targetFilename} en TAR de ${(tarData.length / 1024 / 1024).toFixed(1)}MB`);
    
    let offset = 0;
    const tarBuffer = tarData.buffer || tarData;
    
    while (offset < tarBuffer.byteLength - 512) {
      // Leer header TAR (512 bytes)
      const header = new Uint8Array(tarBuffer, offset, 512);
      
      // NUL header indicates end
      if (header[0] === 0) break;
      
      // Extraer nombre del archivo (primeros 100 bytes, null-terminated)
      let filename = '';
      for (let i = 0; i < 100 && header[i] !== 0; i++) {
        filename += String.fromCharCode(header[i]);
      }
      
      // Extraer tamaño del archivo (bytes 124-135, octal)
      let sizeStr = '';
      for (let i = 124; i < 136 && header[i] !== 0 && header[i] !== 32; i++) {
        sizeStr += String.fromCharCode(header[i]);
      }
      
      const fileSize = parseInt(sizeStr.trim(), 8) || 0;
      
      console.log(`📁 Encontrado en TAR: ${filename} (${fileSize} bytes)`);
      
      // Si es el archivo que buscamos
      if (filename === targetFilename || filename.endsWith('/' + targetFilename)) {
        const dataOffset = offset + 512;
        const fileData = tarBuffer.slice(dataOffset, dataOffset + fileSize);
        console.log(`✅ Archivo TIF real encontrado: ${filename} (${fileSize} bytes)`);
        return fileData;
      }
      
      // Avanzar al siguiente archivo (512 bytes de header + tamaño del archivo, redondeado a 512)
      const blockSize = Math.ceil((512 + fileSize) / 512) * 512;
      offset += blockSize;
    }
    
    console.warn(`⚠️ Archivo ${targetFilename} no encontrado en TAR`);
    return null;
    
  } catch (error) {
    console.error(`❌ Error parseando TAR:`, error);
    return null;
  }
}

// Función para cargar un archivo GeoTIFF
async function loadTileData(tilePath) {
  try {
    const response = await fetch(tilePath);
    if (!response.ok) {
      throw new Error(`Error al cargar el tile: ${tilePath}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();
    const rasters = await image.readRasters();
    const metadata = await image.getFileDirectory();

    console.log(`Tile cargado desde: ${tilePath}`, metadata);
    return {
      data: rasters[0],
      width: image.getWidth(),
      height: image.getHeight(),
      tiepoint: metadata.ModelTiepoint,
      scale: metadata.ModelPixelScale,
    };
  } catch (error) {
    console.error('Error al cargar el archivo GeoTIFF:', error);
    return null;
  }
}

// Función para buscar el tile correspondiente en el índice de tiles
async function buscarTileCorrespondiente(bounds) {
  
  // Si tenemos índice maestro de mini-tiles, necesitamos cargar la provincia apropiada
  if (elevationTileIndex && elevationTileIndex.provincias) {
    const tile = await buscarTileEnProvincias(bounds);
    if (tile) return tile;
  }
  
  // Búsqueda en formato clásico
  for (const tileKey in elevationTileIndex) {
    const tile = elevationTileIndex[tileKey];
    if (!tile.bounds) {
      continue;
    }
    const { north, south, east, west } = tile.bounds;

    if (
      bounds.north <= north &&
      bounds.south >= south &&
      bounds.east <= east &&
      bounds.west >= west
    ) {
      console.log(`🎯 Tile encontrado: ${tileKey}`);
      return tile;
    }
  }
  
  console.log(`❌ No se encontró tile para bounds:`, bounds);
  return null;
}

// Nueva función para buscar tiles en provincias del formato mini-tiles
async function buscarTileEnProvincias(bounds) {
  const masterIndex = elevationTileIndex;
  
  // Determinar qué provincia puede contener estas coordenadas
  const lat = (bounds.north + bounds.south) / 2;
  const lng = (bounds.east + bounds.west) / 2;
  
  // Lógica simple para determinar provincia basada en coordenadas
  let provinciaTarget = 'centro'; // Buenos Aires está en centro
  
  if (lat < -42) {
    provinciaTarget = 'sur';
  } else if (lat < -36) {
    provinciaTarget = 'centro';
  } else if (lat < -30) {
    provinciaTarget = 'centro_norte';
  } else {
    provinciaTarget = 'norte';
  }
  
  // Si no está en patagonia, verificar longitud para centro/centro_norte
  if (lat > -42 && lat < -30 && lng < -65) {
    provinciaTarget = 'centro_norte';
  }
  
  console.log(`🌍 Buscando en provincia: ${provinciaTarget} para coordenadas lat:${lat.toFixed(3)}, lng:${lng.toFixed(3)}`);
  
  // Cargar índice provincial si no está en cache
  if (!window.provincialIndexes) {
    window.provincialIndexes = {};
  }
  
  if (!window.provincialIndexes[provinciaTarget]) {
    try {
      // Construir URL del índice provincial
      let provincialUrl;
      
      // Intentar URL local primero
      provincialUrl = `Client/Libs/datos_argentina/Altimetria_Mini_Tiles/${provinciaTarget}/${provinciaTarget}_mini_tiles_index.json`;
      
      console.log(`📡 Cargando índice provincial desde: ${provincialUrl}`);
      
      try {
        const response = await fetch(provincialUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} para ${provincialUrl}`);
        }
        
        const provincialData = await response.json();
        if (!provincialData.tiles) {
          throw new Error(`Índice provincial ${provinciaTarget} no tiene tiles`);
        }
        
        window.provincialIndexes[provinciaTarget] = provincialData.tiles;
        console.log(`✅ Índice provincial ${provinciaTarget} cargado: ${Object.keys(provincialData.tiles).length} tiles`);
        
      } catch (localError) {
        // Si falla local, intentar GitHub CDN
        console.log(`⚠️ Error con URL local, intentando GitHub CDN...`);
        provincialUrl = `https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@main/Client/Libs/datos_argentina/Altimetria_Mini_Tiles/${provinciaTarget}/${provinciaTarget}_mini_tiles_index.json`;
        
        const response = await fetch(provincialUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} para ${provincialUrl}`);
        }
        
        const provincialData = await response.json();
        if (!provincialData.tiles) {
          throw new Error(`Índice provincial ${provinciaTarget} no tiene tiles`);
        }
        
        window.provincialIndexes[provinciaTarget] = provincialData.tiles;
        console.log(`✅ Índice provincial ${provinciaTarget} cargado desde GitHub: ${Object.keys(provincialData.tiles).length} tiles`);
      }
      
    } catch (error) {
      console.error(`❌ Error cargando índice provincial ${provinciaTarget}:`, error);
      return null;
    }
  }
  
  // Buscar en el índice provincial
  const provincialTiles = window.provincialIndexes[provinciaTarget];
  for (const tileKey in provincialTiles) {
    const tile = provincialTiles[tileKey];
    if (!tile.bounds) continue;
    
    const { north, south, east, west } = tile.bounds;
    
    if (
      bounds.north <= north &&
      bounds.south >= south &&
      bounds.east <= east &&
      bounds.west >= west
    ) {
      console.log(`🎯 Tile encontrado en ${provinciaTarget}: ${tileKey}`);
      return {
        ...tile,
        provincia: provinciaTarget,
        tileKey: tileKey
      };
    }
  }
  
  console.log(`❌ No se encontró tile en provincia ${provinciaTarget} para bounds:`, bounds);
  return null;
}

// Inicializar los datos de elevación
async function inicializarDatosElevacion(bounds) {
  console.log('Inicializando datos de elevación con bounds:', bounds);
  const datosElevacion = await cargarDatosElevacion(bounds);
  if (datosElevacion) {
    console.log('Datos de elevación cargados correctamente.');
  } else {
    console.warn('Los datos de elevación no se pudieron cargar o no están disponibles.');
  }
}



// ✅ FUNCIÓN AUXILIAR MEJORADA CON CACHÉ:
async function procesarElevacionDirecto(puntosInterpolados) {
    console.log('🔧 Procesando elevación directamente');
    
    const resultados = [];
    let distanciaAcumulada = 0;
    
    // Caché para evitar consultas repetitivas
    const cache = new Map();
    
    for (let i = 0; i < puntosInterpolados.length; i++) {
        const punto = puntosInterpolados[i];
        
        // Calcular distancia acumulada
        if (i > 0) {
            const puntoAnterior = puntosInterpolados[i - 1];
            const distanciaParcial = L.latLng(puntoAnterior.lat, puntoAnterior.lng)
                .distanceTo(L.latLng(punto.lat, punto.lng));
            distanciaAcumulada += distanciaParcial;
        }
        
        // Crear clave de caché con precisión reducida para evitar consultas duplicadas
        const cacheKey = `${punto.lat.toFixed(6)}_${punto.lng.toFixed(6)}`;
        
        // Obtener elevación usando caché o elevationHandler
        let elevation = 0;
        try {
            if (cache.has(cacheKey)) {
                elevation = cache.get(cacheKey);
            } else if (window.elevationHandler?.obtenerElevacion) {
                elevation = await window.elevationHandler.obtenerElevacion(punto.lat, punto.lng);
                if (!isFinite(elevation)) elevation = 0;
                cache.set(cacheKey, elevation);
            }
        } catch (error) {
            console.warn(`Error obteniendo elevación para punto ${i}:`, error);
            elevation = 0;
        }
        
        resultados.push({
            distancia: Math.round(distanciaAcumulada),
            elevation: elevation,
            lat: punto.lat,
            lng: punto.lng,
            pendiente: 0
        });
    }
    
    // Calcular pendientes
    for (let i = 1; i < resultados.length; i++) {
        const actual = resultados[i];
        const anterior = resultados[i - 1];
        const distanciaParcial = actual.distancia - anterior.distancia;
        const elevacionParcial = actual.elevation - anterior.elevation;
        
        if (distanciaParcial > 0) {
            actual.pendiente = (elevacionParcial / distanciaParcial) * 100;
            // Limitar pendientes extremas
            if (Math.abs(actual.pendiente) > 100) {
                actual.pendiente = Math.sign(actual.pendiente) * 100;
            }
        }
    }
    
    console.log(`✅ Procesamiento directo completado: ${resultados.length} puntos`);
    return resultados;
}

// ✅ NUEVA FUNCIÓN - Fallback sin worker
function procesarDatosElevacionDirecto(data) {
  console.warn('Procesando elevación directamente (sin worker)');
  const { ruta, datosElevacion } = data;
  const perfil = [];
  let distanciaAcumulada = 0;

  for (let i = 0; i < ruta.length; i++) {
    const punto = ruta[i];

    // Calcular distancia desde punto anterior
    if (i > 0) {
      const puntoAnterior = ruta[i - 1];
      const R = 6371000; // Radio Tierra en metros
      const dLat = ((punto.lat - puntoAnterior.lat) * Math.PI) / 180;
      const dLng = ((punto.lng - puntoAnterior.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((puntoAnterior.lat * Math.PI) / 180) *
          Math.cos((punto.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanciaAcumulada += R * c;
    }

    // Calcular elevación usando datos del tile
    const { data, width, height, tiepoint, scale } = datosElevacion;
    const x = Math.round((punto.lng - tiepoint[3]) / scale[0]);
    const y = Math.round((tiepoint[4] - punto.lat) / scale[1]);

    let elevation = null;
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const rawElevation = data[y * width + x];
      if (rawElevation !== undefined && !isNaN(rawElevation)) {
        elevation = parseFloat(rawElevation.toFixed(2));
      }
    }

    perfil.push({
      lat: punto.lat,
      lng: punto.lng,
      elevation: elevation,
      distancia: Math.round(distanciaAcumulada),
      indice: i,
    });
  }

  return perfil;
}



// Función para calcular los bounds de una ruta
function calcularBoundsRuta(ruta) {
  let north = -Infinity;
  let south = Infinity;
  let east = -Infinity;
  let west = Infinity;

  ruta.forEach((punto) => {
    if (punto.lat > north) north = punto.lat;
    if (punto.lat < south) south = punto.lat;
    if (punto.lng > east) east = punto.lng;
    if (punto.lng < west) west = punto.lng;
  });

  return { north, south, east, west };
}

// Función para obtener la elevación de una coordenada
async function obtenerElevacion(lat, lon) {
  if (!isFinite(lat) || !isFinite(lon)) {
    console.warn('Coordenadas inválidas en obtenerElevacion:', lat, lon);
    return null;
  }

  if (!elevationHandlerIndiceCargado) {
    console.warn('Esperando a que el índice de tiles se cargue.');
    await cargarIndiceElevationTiles;
  }

  const bounds = { north: lat, south: lat, east: lon, west: lon };
  const tileData = await cargarDatosElevacion(bounds);
  
  if (!tileData) {
    console.warn(`No se pudieron cargar los datos del tile para lat=${lat}, lon=${lon}`);
    return null;
  }

  const { data, width, height, tiepoint, scale } = tileData;
  const x = Math.round((lon - tiepoint[3]) / scale[0]);
  const y = Math.round((tiepoint[4] - lat) / scale[1]);

  if (x < 0 || x >= width || y < 0 || y >= height) {
    console.log(`Coordenadas fuera de rango: lat=${lat}, lon=${lon}`);
    return null;
  }

  const elevation = data[y * width + x];
  if (elevation === undefined || isNaN(elevation)) {
    console.warn(`Elevación inválida para lat=${lat}, lon=${lon}`);
    return null;
  }

  return parseFloat(elevation.toFixed(2));
}

// Función para obtener el estado del sistema (agregada para evitar errores)
function obtenerEstadoSistema() {
  return {
    elevationHandlerIndiceCargado: !!elevationHandlerIndiceCargado,
    tileIndex: elevationTileIndex ? 'Cargado' : 'No cargado',
  };
}

async function calcularPerfilElevacion(ruta) {
  try {
    console.log('Calculando perfil de elevación para la ruta:', ruta);
    
    // ✅ USAR PROCESAMIENTO DIRECTO EN LUGAR DEL WORKER:
    const bounds = calcularBoundsRuta(ruta);
    const datosElevacion = await cargarDatosElevacion(bounds);

    if (!datosElevacion) {
      console.warn('No se pudieron cargar los datos de elevación para el perfil.');
      return null;
    }

    // ✅ USAR FUNCIÓN DE herramientasP.js:
    if (window.procesarElevacionDirecto) {
        const perfil = await window.procesarElevacionDirecto(ruta);
        console.log('Perfil de elevación calculado correctamente.');
        return perfil;
    } else {
        // ✅ FALLBACK LOCAL:
        const perfil = await procesarDatosElevacionDirecto({ ruta, datosElevacion });
        console.log('Perfil de elevación calculado correctamente.');
        return perfil;
    }
    
  } catch (error) {
    console.error('Error al calcular el perfil de elevación:', error);
    return null;
  }
}

// REEMPLAZAR procesarDatosElevacion línea ~620:

async function procesarDatosElevacion(puntosInterpolados) {
    try {
        // 🚀 SUPER DEBUGGER - ENTRADA
        console.group('🚀 SUPER DEBUGGER - procesarDatosElevacion');
        console.log('📥 ENTRADA - puntosInterpolados:', puntosInterpolados);
        console.log('📏 Cantidad de puntos:', puntosInterpolados?.length);
        console.log('📍 Primer punto:', puntosInterpolados?.[0]);
        console.log('📍 Último punto:', puntosInterpolados?.[puntosInterpolados?.length - 1]);
        
        // ✅ VALIDACIÓN MEJORADA:
        console.log('🔍 Validando datos de entrada:', {
            puntosInterpolados: !!puntosInterpolados,
            esArray: Array.isArray(puntosInterpolados),
            length: puntosInterpolados?.length,
            primerPunto: puntosInterpolados?.[0]
        });
        
        if (!puntosInterpolados || !Array.isArray(puntosInterpolados) || puntosInterpolados.length === 0) {
            console.error('❌ FALLO EN VALIDACIÓN: Datos de puntos inválidos o vacíos');
            throw new Error('Datos de puntos inválidos o vacíos');
        }
        
        // ✅ VALIDAR ESTRUCTURA DE PUNTOS:
        const puntoValido = puntosInterpolados[0];
        if (!puntoValido || typeof puntoValido.lat !== 'number' || typeof puntoValido.lng !== 'number') {
            console.error('❌ FALLO EN VALIDACIÓN: Estructura de puntos inválida', puntoValido);
            throw new Error('Estructura de puntos inválida - faltan lat/lng');
        }
        
        console.log(`✅ Procesando ${puntosInterpolados.length} puntos de elevación`);
        
        // 🎯 USAR PROCESAMIENTO DIRECTO (sin worker)
        console.log('🔧 Usando procesamiento directo de elevación');
        const resultados = await procesarElevacionDirecto(puntosInterpolados);
        
        console.log('✅ Procesamiento directo completado:', resultados.length, 'puntos');
        console.groupEnd();
        
        return resultados;

    } catch (error) {
        console.error('💥 ERROR CRÍTICO EN procesarDatosElevacion:', error);
        console.error('🔍 Stack trace:', error.stack);
        console.error('📥 Datos de entrada que causaron el error:', puntosInterpolados);
        console.log('🔄 Intentando procesamiento sin worker como fallback...');
        
        // Fallback sin worker
        console.group('🆘 MODO FALLBACK');
        try {
            const fallbackData = puntosInterpolados.map((punto, index) => {
                const resultado = {
                    distancia: punto.distanciaAcumulada || index * 100,
                    elevation: 0,
                    lat: punto.lat,
                    lng: punto.lng
                };
                console.log(`🔄 Fallback punto ${index}:`, resultado);
                return resultado;
            });
            console.log('✅ Fallback completado exitosamente');
            console.groupEnd();
            console.groupEnd(); // Cerrar el grupo principal
            return fallbackData;
        } catch (fallbackError) {
            console.error('💥 ERROR TAMBIÉN EN FALLBACK:', fallbackError);
            console.error('🔍 Stack fallback:', fallbackError.stack);
            console.groupEnd();
            console.groupEnd(); // Cerrar el grupo principal
            throw fallbackError;
        }
    }
}

// Exponer funciones necesarias en el objeto global
window.elevationHandler = {
  cargarDatosElevacion,
  inicializarDatosElevacion,
  procesarDatosElevacion,
  calcularPerfilElevacion,
  obtenerElevacion,
  obtenerEstadoSistema,
};

// Función para extraer dinámicamente un tile desde GitHub Releases o local
async function extractTileIfNeeded(tile) {
  try {
    if (!tile.tar_file) {
      // No hay información de archivo TAR, saltar extracción
      return null;
    }
    
    console.log(`🔧 Extrayendo tile dinámicamente: ${tile.filename} desde ${tile.tar_file}`);
    
    // 🎯 URLs de tar.gz locales - COMPATIBLE LOCAL + RENDER
    const provinceConfig = ELEVATION_PROVINCES_CONFIG[tile.provincia];
    if (!provinceConfig) {
      console.warn(`❌ Configuración no encontrada para provincia: ${tile.provincia}`);
      return null;
    }
    
    const tarUrls = [
      // PRIORIDAD 1: Archivos tar.gz locales (compatibles con Render)
      `${provinceConfig.base_path}/${tile.tar_file}`,
      `/${provinceConfig.base_path}/${tile.tar_file}`,
      `./${provinceConfig.base_path}/${tile.tar_file}`
    ];
    
    for (const tarUrl of tarUrls) {
      try {
        console.log(`📦 Intentando descargar tar.gz: ${tarUrl}`);
        const response = await fetch(tarUrl);
        
        if (response.ok) {
          const tarData = await response.arrayBuffer();
          console.log(`✅ Tar.gz descargado: ${tarUrl} (${tarData.byteLength} bytes)`);
          
          // Extraer el archivo específico del tar.gz
          const extractedTif = await extractFileFromTar(tarData, tile.filename);
          
          if (extractedTif) {
            console.log(`✅ TIF extraído exitosamente: ${tile.filename}`);
            return extractedTif;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error con ${tarUrl}:`, error.message);
        continue;
      }
    }
    
    console.warn(`⚠️ No se pudo extraer ${tile.filename} de ningún tar.gz`);
    return null;
    
  } catch (error) {
    console.error(`❌ Error en extractTileIfNeeded para ${tile.filename}:`, error);
    return null;
  }
}

// Función para extraer un archivo específico de un TAR
async function extractFileFromTar(tarData, targetFilename) {
  try {
    console.log(`🔍 Buscando ${targetFilename} en TAR de ${tarData.byteLength} bytes`);
    
    const dataView = new DataView(tarData);
    let offset = 0;
    
    while (offset < tarData.byteLength - 512) {
      // Leer header TAR (512 bytes)
      const nameBytes = new Uint8Array(tarData, offset, 100);
      let filename = '';
      for (let i = 0; i < 100 && nameBytes[i] !== 0; i++) {
        filename += String.fromCharCode(nameBytes[i]);
      }
      
      // Leer tamaño del archivo (octal en bytes 124-135)
      const sizeBytes = new Uint8Array(tarData, offset + 124, 11);
      let sizeStr = '';
      for (let i = 0; i < 11 && sizeBytes[i] !== 0 && sizeBytes[i] !== 32; i++) {
        sizeStr += String.fromCharCode(sizeBytes[i]);
      }
      
      const fileSize = parseInt(sizeStr.trim(), 8) || 0;
      offset += 512; // Saltar header
      
      if (filename === targetFilename || filename.endsWith('/' + targetFilename)) {
        console.log(`✅ Archivo encontrado en TAR: ${filename} (${fileSize} bytes)`);
        return tarData.slice(offset, offset + fileSize);
      }
      
      // Saltar al siguiente archivo (alineado a 512 bytes)
      const paddedSize = Math.ceil(fileSize / 512) * 512;
      offset += paddedSize;
    }
    
    console.warn(`⚠️ Archivo ${targetFilename} no encontrado en TAR`);
    return null;
    
  } catch (error) {
    console.error('❌ Error extrayendo de TAR:', error);
    return null;
  }
}


// ✅ ESTRUCTURA MAIRA PARA ELEVACIÓN
window.MAIRA = window.MAIRA || {};
window.MAIRA.Elevacion = {
    instancia: window.elevationHandler,
    
    // ✅ API PRINCIPAL
    inicializar: async function() {
        try {
            await cargarIndiceElevationTiles;  // Esperar carga índice
            console.log('✅ MAIRA.Elevacion inicializado');
            return true;
        } catch (error) {
            console.warn('⚠️ Error inicializando MAIRA.Elevacion:', error);
            return false;
        }
    },
    
    analisis: {
        // ✅ OBTENER ELEVACIÓN INDIVIDUAL
        punto: async function(lat, lng) {
            return await window.elevationHandler.obtenerElevacion(lat, lng);
        },
        
        // ✅ PERFIL COMPLETO DE RUTA
        ruta: async function(puntos) {
            try {
                const perfil = await window.elevationHandler.calcularPerfilElevacion(puntos);
                if (perfil) {
                    return {
                        perfil: perfil,
                        estadisticas: this.estadisticas(perfil),
                        distanciaTotal: perfil[perfil.length - 1]?.distancia || 0
                    };
                }
                return null;
            } catch (error) {
                console.error('Error calculando perfil de ruta:', error);
                return null;
            }
        },
        
        // ✅ ESTADÍSTICAS DE ELEVACIÓN
        estadisticas: function(perfil) {
            if (!Array.isArray(perfil) || perfil.length === 0) return null;
            
            const elevaciones = perfil
                .map(p => p.elevation)
                .filter(e => e !== null && !isNaN(e));
            
            if (elevaciones.length === 0) return null;
            
            const minima = Math.min(...elevaciones);
            const maxima = Math.max(...elevaciones);
            const promedio = elevaciones.reduce((a, b) => a + b, 0) / elevaciones.length;
            const desnivel = maxima - minima;
            
            return {
                elevacion: {
                    minima: minima.toFixed(2),
                    maxima: maxima.toFixed(2),
                    promedio: promedio.toFixed(2),
                    desnivel: desnivel.toFixed(2)
                },
                muestras: elevaciones.length,
                cobertura: (elevaciones.length / perfil.length * 100).toFixed(1) + '%'
            };
        }
    },
    
    utilidades: {
        // ✅ INFORMACIÓN DEL SISTEMA
        info: function() {
            const estado = window.elevationHandler.obtenerEstadoSistema();
            return {
                version: '1.0.0',
                estado: estado,
                workerDisponible: typeof Worker !== 'undefined',
                geoTIFFDisponible: typeof GeoTIFF !== 'undefined'
            };
        }
    },
    
    integracion: {
        // ✅ CONECTAR CON VEGETACIÓN
        conectarConVegetacion: function() {
            if (window.MAIRA?.Vegetacion) {
                console.log('🔗 Elevación integrada con Vegetación');
                return true;
            }
            return false;
        }
    },
    
    // Función para limpiar caché - SOLUCIÓN PARA PERFORMANCEOPTIMIZER
    clearCache: function() {
        console.log('🧹 Limpiando caché de elevation handler...');
        try {
            // Limpiar datos de elevación en memoria
            if (window.elevationData) {
                window.elevationData = null;
            }
            
            // Limpiar caché de tiles si existe
            if (window.tileCache) {
                window.tileCache.clear();
            }
            
            // Reset del índice si es necesario
            elevationHandlerIndiceCargado = false;
            
            console.log('✅ Caché de elevation handler limpiado');
            return true;
        } catch (error) {
            console.warn('⚠️ Error limpiando caché elevation handler:', error);
            return false;
        }
    },
    
    version: '1.0.0'
};
// ✅ AUTO-INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await window.MAIRA.Elevacion.inicializar();
        
        // Conectar con otros módulos
        setTimeout(() => {
            window.MAIRA.Elevacion.integracion.conectarConVegetacion();
        }, 1500);
        
    } catch (error) {
        console.warn('⚠️ Error inicializando MAIRA.Elevacion:', error);
    }
});
