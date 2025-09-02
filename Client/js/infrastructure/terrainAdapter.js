// elevationHandler.js - Adaptado para manejar el nuevo sistema de tiles v3.0

// URL base para GitHub Releases mini-tiles v3.0
const GITHUB_RELEASES_BASE = '/api/proxy/github';

    // URLs de fallback para GitHub Releases
    const MINI_TILES_FALLBACK_URLS = [
        'https://github.com/lucianoiam/maira-tiles/releases/download/v1.0/mini_tiles_',
        'https://raw.githubusercontent.com/lucianoiam/maira-tiles/main/Client/Libs/datos_argentina/Elevacion_Mini_Tiles/',
        'https://cdn.jsdelivr.net/gh/lucianoiam/maira-tiles@main/Client/Libs/datos_argentina/Elevacion_Mini_Tiles/'
    ];

// Ruta para tiles clásicos (legacy)
const TILE_FOLDER_PATH = 'Client/Libs/datos_argentina/Altimetria_Legacy';

// Índice de tiles
let tileIndex;
let indiceCargado = false;

// Cargar el índice de tiles al iniciar
const cargarIndiceTiles = new Promise((resolve, reject) => {
  console.log('🔄 Intentando cargar master_mini_tiles_index.json...');
  
  // Función para intentar cargar desde una URL
  const intentarCarga = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} para ${url}`);
    }
    return response.json();
  };
  
  // Lista de URLs para intentar
  const urls = [
    `${GITHUB_RELEASES_BASE}/master_mini_tiles_index.json`,
    ...MINI_TILES_FALLBACK_URLS.map(url => `${url}master_mini_tiles_index.json`)
  ];
  
  // Intentar cargar desde cada URL secuencialmente
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
          tileIndex = data;
          indiceCargado = true;
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
          tileIndex = data.tiles;
          indiceCargado = true;
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
  if (!indiceCargado) {
    console.warn('Esperando a que el índice de tiles se cargue.');
    await cargarIndiceTiles;
  }

  if (!tileIndex) {
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
      
      // Primero intentar extraer el tile si es necesario
      await extractTileIfNeeded(tile);
      
        // URLs a intentar en orden de preferencia
        const urlsToTry = [
          `Client/Libs/datos_argentina/Altimetria_Mini_Tiles/${tile.provincia}/tiles/${tile.filename}`,
          `Client/Libs/datos_argentina/Altimetria_Mini_Tiles/${tile.provincia}/${tile.filename}`,
          `https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@main/Client/Libs/datos_argentina/Altimetria_Mini_Tiles/${tile.provincia}/${tile.filename}`,
          `https://raw.githubusercontent.com/Ehr051/MAIRA/main/Client/Libs/datos_argentina/Altimetria_Mini_Tiles/${tile.provincia}/${tile.filename}`
        ];      // Intentar cargar desde cada URL
      for (const url of urlsToTry) {
        try {
          console.log(`📍 Intentando cargar tile desde: ${url}`);
          const tileData = await loadTileData(url);
          if (tileData) {
            console.log(`✅ Tile cargado exitosamente desde: ${url}`);
            return tileData;
          }
        } catch (error) {
          console.warn(`⚠️ Error cargando desde ${url}:`, error.message);
          continue;
        }
      }
      
      console.error(`❌ No se pudo cargar el tile desde ninguna URL para ${tile.filename}`);
      return null;
    } else {
      // Formato clásico
      tilePath = `${TILE_FOLDER_PATH}/${tile.filename}`;
      
      // Cargar los datos de elevación del tile encontrado
      const tileData = await loadTileData(tilePath);
      return tileData;
    }
  } catch (error) {
    console.error('Error al cargar datos de elevación:', error);
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
  if (tileIndex && tileIndex.provincias) {
    const tile = await buscarTileEnProvincias(bounds);
    if (tile) return tile;
  }
  
  // Búsqueda en formato clásico
  for (const tileKey in tileIndex) {
    const tile = tileIndex[tileKey];
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
  const masterIndex = tileIndex;
  
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

  if (!indiceCargado) {
    console.warn('Esperando a que el índice de tiles se cargue.');
    await cargarIndiceTiles;
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
    indiceCargado: !!indiceCargado,
    tileIndex: tileIndex ? 'Cargado' : 'No cargado',
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

// Función para extraer automáticamente un tile si es necesario
async function extractTileIfNeeded(tile) {
  try {
    if (!tile.tar_file) {
      // No hay información de archivo TAR, saltar extracción
      return;
    }
    
    console.log(`🔧 Verificando si necesita extraer: ${tile.filename} desde ${tile.tar_file}`);
    
    const response = await fetch('/api/extract-tile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provincia: tile.provincia,
        tile_filename: tile.filename,
        tar_filename: tile.tar_file
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ ${result.message}: ${tile.filename}`);
    } else {
      console.warn(`⚠️ Error extrayendo tile: ${result.message}`);
    }
  } catch (error) {
    console.error(`❌ Error en extractTileIfNeeded para ${tile.filename}:`, error);
  }
}


// ✅ ESTRUCTURA MAIRA PARA ELEVACIÓN
window.MAIRA = window.MAIRA || {};
window.MAIRA.Elevacion = {
    instancia: window.elevationHandler,
    
    // ✅ API PRINCIPAL
    inicializar: async function() {
        try {
            await cargarIndiceTiles;  // Esperar carga índice
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
