# 🧪 Ejemplo de Uso - Sistema Híbrido de Vegetación

Este archivo contiene ejemplos prácticos de cómo usar el sistema híbrido de vegetación.

## 📝 Ejemplo Básico

```javascript
// 1. Crear instancia de VegetationService
const vegetationService = new VegetationService();

// 2. Inicializar con configuración
const useTIF = true; // Usar archivos GeoTIFF
const satelliteAnalyzer = window.satelliteAnalyzer; // Analizador satelital

await vegetationService.initialize(useTIF, satelliteAnalyzer);

// 3. Obtener NDVI para una coordenada
const lat = -34.6037; // Buenos Aires
const lon = -58.3816;
const normX = 0.5; // Coordenada normalizada X (centro)
const normY = 0.5; // Coordenada normalizada Y (centro)

const ndvi = await vegetationService.getNDVI(lat, lon, normX, normY);
console.log(`NDVI en (${lat}, ${lon}): ${ndvi}`);

// 4. Clasificar tipo de vegetación
const vegType = vegetationService.classifyVegetationType(ndvi);
console.log(`Tipo de vegetación: ${vegType}`);
```

## 🎯 Ejemplo Completo con TerrainGenerator

```javascript
// === CONFIGURACIÓN INICIAL ===
const config = {
    resolution: 50,
    verticalScale: 2.0,
    realWorldSize: 1500,
    vegetationDensity: 0.25
};

// === CREAR SERVICIOS ===
const elevationService = new ElevationService();
await elevationService.initialize(true);

const vegetationService = new VegetationService();
await vegetationService.initialize(true, satelliteAnalyzer);

// === CREAR TERRAIN GENERATOR ===
const terrainGenerator = new TerrainGenerator3D(config);
terrainGenerator.initialize(
    elevationService,
    vegetationService,
    window.maira3DSystem,
    satelliteAnalyzer
);

// === GENERAR TERRENO ===
const bounds = L.latLngBounds(
    L.latLng(-34.61, -58.39),
    L.latLng(-34.60, -58.38)
);

const result = await terrainGenerator.generateTerrain(bounds, {
    includeVegetation: true,
    includeRoads: true,
    includeBuildings: true,
    includeWater: true
});

// === AGREGAR A ESCENA ===
scene.add(result.terrain);
result.vegetation.forEach(vegObj => scene.add(vegObj));

// === VER ESTADÍSTICAS ===
const stats = vegetationService.getStats();
console.log('📊 Estadísticas de Vegetación:');
console.log(`   Total queries: ${stats.total}`);
console.log(`   Desde imagen satelital: ${stats.fromSatellite} (${stats.percentages.satellite}%)`);
console.log(`   Desde TIF: ${stats.fromTIF} (${stats.percentages.tif}%)`);
console.log(`   Procedural: ${stats.fromProcedural} (${stats.percentages.procedural}%)`);
```

## 🔄 Ejemplo de Cambio de Fuente de Datos

```javascript
// Inicializar solo con análisis satelital (sin TIF)
await vegetationService.initialize(false, satelliteAnalyzer);

// Obtener NDVI - usará imagen satelital o procedural
let ndvi = await vegetationService.getNDVI(lat, lon, normX, normY);
console.log('NDVI (sin TIF):', ndvi);

// Reinicializar con TIF habilitado
await vegetationService.initialize(true, satelliteAnalyzer);

// Ahora intentará: Imagen → TIF → Procedural
ndvi = await vegetationService.getNDVI(lat, lon, normX, normY);
console.log('NDVI (con TIF):', ndvi);
```

## 📈 Ejemplo de Análisis de Estadísticas

```javascript
// Resetear estadísticas
vegetationService.resetStats();

// Generar terreno
const result = await terrainGenerator.generateTerrain(bounds, {
    includeVegetation: true
});

// Analizar fuentes utilizadas
const stats = vegetationService.getStats();

if (stats.percentages.satellite > 50) {
    console.log('✅ Buena cobertura de imagen satelital');
} else if (stats.percentages.tif > 50) {
    console.log('✅ Datos TIF disponibles');
} else {
    console.log('⚠️ Principalmente procedural - verificar disponibilidad de datos');
}

// Log detallado
console.table([
    { Fuente: 'Imagen Satelital', Queries: stats.fromSatellite, Porcentaje: stats.percentages.satellite + '%' },
    { Fuente: 'TIF', Queries: stats.fromTIF, Porcentaje: stats.percentages.tif + '%' },
    { Fuente: 'Procedural', Queries: stats.fromProcedural, Porcentaje: stats.percentages.procedural + '%' }
]);
```

## 🎨 Ejemplo de Clasificación Personalizada

```javascript
// Obtener distribución de tipos de vegetación
const points = result.points;
const distribution = {
    grass: 0,
    bush: 0,
    tree_medium: 0,
    tree_tall: 0,
    none: 0
};

points.forEach(point => {
    const vegType = vegetationService.classifyVegetationType(point.ndvi);
    if (vegType === null) {
        distribution.none++;
    } else {
        distribution[vegType]++;
    }
});

console.log('🌿 Distribución de vegetación:');
console.log(`   Pasto: ${distribution.grass} (${(distribution.grass/points.length*100).toFixed(1)}%)`);
console.log(`   Arbustos: ${distribution.bush} (${(distribution.bush/points.length*100).toFixed(1)}%)`);
console.log(`   Árboles medianos: ${distribution.tree_medium} (${(distribution.tree_medium/points.length*100).toFixed(1)}%)`);
console.log(`   Árboles altos: ${distribution.tree_tall} (${(distribution.tree_tall/points.length*100).toFixed(1)}%)`);
console.log(`   Sin vegetación: ${distribution.none} (${(distribution.none/points.length*100).toFixed(1)}%)`);
```

## 🐛 Ejemplo de Debug

```javascript
// Habilitar logs detallados (1 de cada 100 se logea automáticamente)
// Puedes forzar log de cada query temporalmente:

const originalGetNDVI = vegetationService.getNDVI.bind(vegetationService);
vegetationService.getNDVI = async function(lat, lon, normX, normY) {
    const ndvi = await originalGetNDVI(lat, lon, normX, normY);
    const vegType = this.classifyVegetationType(ndvi);
    console.debug(`NDVI=${ndvi.toFixed(3)} → ${vegType || 'sin veg'} at (${lat.toFixed(5)}, ${lon.toFixed(5)})`);
    return ndvi;
};

// Generar terreno con logs completos
await terrainGenerator.generateTerrain(bounds, {
    includeVegetation: true
});

// Restaurar función original
vegetationService.getNDVI = originalGetNDVI;
```

## 🔍 Ejemplo de Verificación de Worker

```javascript
// Verificar si el worker está funcionando
if (vegetationService.worker) {
    console.log('✅ Worker de vegetación activo');
    
    // Obtener stats del worker
    try {
        const workerStats = await vegetationService.sendWorkerMessage('getStats', {});
        console.log('📊 Worker stats:', workerStats);
    } catch (error) {
        console.error('❌ Error obteniendo stats del worker:', error);
    }
    
    // Limpiar caché del worker
    await vegetationService.sendWorkerMessage('clearCache', {});
    console.log('🧹 Caché del worker limpiado');
} else {
    console.log('⚠️ Worker de vegetación no disponible - usando procedural');
}
```

## 📊 Ejemplo de Comparación de Fuentes

```javascript
// Comparar NDVI de diferentes fuentes para la misma coordenada

const lat = -34.6037;
const lon = -58.3816;
const normX = 0.5;
const normY = 0.5;

// 1. Desde imagen satelital
const ndviSatellite = await vegetationService.getNDVIFromSatelliteImage(normX, normY);
console.log(`NDVI (Imagen): ${ndviSatellite}`);

// 2. Desde TIF (si disponible)
let ndviTIF = null;
if (vegetationService.worker) {
    try {
        const tileUrl = vegetationService.getTileUrlForCoords(lat, lon);
        const result = await vegetationService.sendWorkerMessage('getVegetation', {
            coords: { lat, lng: lon },
            tileUrl
        });
        ndviTIF = result.ndvi;
        console.log(`NDVI (TIF): ${ndviTIF}`);
    } catch (error) {
        console.log('NDVI (TIF): No disponible');
    }
}

// 3. Procedural
const ndviProcedural = vegetationService.getProceduralNDVI(lat, lon);
console.log(`NDVI (Procedural): ${ndviProcedural}`);

// Comparar
console.log('\n🔍 Comparación:');
if (ndviSatellite !== null) {
    console.log(`   Precisión imagen: ALTA ⭐⭐⭐⭐⭐`);
}
if (ndviTIF !== null) {
    console.log(`   Precisión TIF: ALTA ⭐⭐⭐⭐`);
}
console.log(`   Precisión procedural: MEDIA ⭐⭐`);
```

## 🎮 Ejemplo Interactivo en HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Vegetación Interactivo</title>
</head>
<body>
    <h1>🌿 Test Sistema Híbrido de Vegetación</h1>
    
    <div>
        <label>
            <input type="checkbox" id="useTIF" checked>
            Usar datos TIF
        </label>
    </div>
    
    <div>
        <label>Latitud: <input type="number" id="lat" value="-34.6037" step="0.0001"></label>
        <label>Longitud: <input type="number" id="lon" value="-58.3816" step="0.0001"></label>
    </div>
    
    <button onclick="testNDVI()">Obtener NDVI</button>
    
    <pre id="output"></pre>
    
    <script>
        let vegetationService;
        
        async function init() {
            vegetationService = new VegetationService();
            const useTIF = document.getElementById('useTIF').checked;
            await vegetationService.initialize(useTIF, null);
            console.log('VegetationService inicializado');
        }
        
        async function testNDVI() {
            const lat = parseFloat(document.getElementById('lat').value);
            const lon = parseFloat(document.getElementById('lon').value);
            
            const ndvi = await vegetationService.getNDVI(lat, lon);
            const vegType = vegetationService.classifyVegetationType(ndvi);
            const stats = vegetationService.getStats();
            
            const output = `
NDVI: ${ndvi.toFixed(4)}
Tipo: ${vegType || 'Sin vegetación'}

Estadísticas:
- Imagen satelital: ${stats.fromSatellite} (${stats.percentages.satellite}%)
- TIF: ${stats.fromTIF} (${stats.percentages.tif}%)
- Procedural: ${stats.fromProcedural} (${stats.percentages.procedural}%)
            `;
            
            document.getElementById('output').textContent = output;
        }
        
        init();
    </script>
</body>
</html>
```

## 📚 Referencias

- **Documentación completa:** `docs/SISTEMA_VEGETACION_HIBRIDO.md`
- **Código fuente:** `Client/js/services/VegetationService.js`
- **Worker:** `Client/js/workers/vegetation.worker.js`
- **Test integrado:** `test-terrain-from-map.html`
