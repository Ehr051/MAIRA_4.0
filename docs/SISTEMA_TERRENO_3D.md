# 🏔️ Sistema de Generación de Terreno 3D - MAIRA 4.0

## 📋 Índice
1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Metodología](#metodología)
4. [Configuración](#configuración)
5. [API](#api)
6. [Ejemplos de Uso](#ejemplos-de-uso)
7. [Optimización](#optimización)

---

## 🎯 Visión General

El sistema de generación de terreno 3D de MAIRA utiliza **muestreo de puntos** combinando:
- **DEM (Digital Elevation Model)** para alturas reales
- **NDVI (Normalized Difference Vegetation Index)** para vegetación
- **Interpolación de malla** para superficie suave

### Ventajas vs Análisis de Imagen Satelital

| Característica | Muestreo de Puntos | Análisis de Imagen |
|---------------|-------------------|-------------------|
| **Precisión topográfica** | ✅ Alturas reales del DEM | ⚠️ Estimación visual |
| **Vegetación** | ✅ NDVI científico | ⚠️ Detección de color |
| **Rendimiento** | ✅ Solo puntos necesarios | ❌ Procesar toda la imagen |
| **Datos ya disponibles** | ✅ Tenemos DEM + NDVI | ❌ Requiere imágenes |
| **Precisión militar** | ✅ Medidas exactas | ⚠️ Aproximado |

---

## 🏗️ Arquitectura

```
TerrainGenerator3D
├── generatePointGrid()         → Crear grid uniforme de puntos
├── enrichPointsWithData()      → Obtener altura + NDVI para cada punto
├── createTerrainMesh()         → Generar malla 3D con THREE.js
├── addVegetationLayer()        → Colocar vegetación según NDVI
└── Helpers
    ├── ndviToVegetationType()  → NDVI → grass/bush/tree
    ├── getColorByElevation()   → Color según altura
    └── latLonToLocal()         → Coordenadas geográficas → 3D
```

### Flujo de Datos

```
1. BOUNDS (Leaflet)
   ↓
2. POINT GRID (lat/lon)
   ↓
3. ENRICH DATA
   ├── HeightmapHandler.getElevation() → Altura
   └── VegetationHandler.getNDVI()     → NDVI
   ↓
4. TERRAIN MESH (THREE.js)
   ├── Vértices con altura
   ├── Colores según elevación
   └── Normales para iluminación
   ↓
5. VEGETATION LAYER
   ├── Filtrar puntos con NDVI > umbral
   ├── Determinar tipo (grass/bush/tree)
   └── Colocar modelos 3D
```

---

## 📐 Metodología

### 1. Muestreo de Puntos

Se genera un **grid uniforme** de puntos dentro de los bounds:

```javascript
// Resolución: 50 puntos por lado = 2,500 puntos totales
const points = generatePointGrid(bounds, 50);

// Cada punto tiene:
{
  lat: -34.5234,
  lon: -58.4567,
  gridX: 25,  // Posición en grid
  gridY: 30
}
```

### 2. Enriquecimiento de Datos

Para cada punto se obtienen datos reales:

```javascript
const enrichedPoint = {
  lat: -34.5234,
  lon: -58.4567,
  elevation: 125.5,        // Metros sobre nivel del mar (DEM)
  ndvi: 0.67,              // Índice de vegetación [0-1]
  vegetationType: 'tree_medium'  // Tipo determinado por NDVI
};
```

### 3. Mapeo NDVI → Vegetación

| NDVI | Tipo | Descripción |
|------|------|-------------|
| 0.0 - 0.2 | null | Sin vegetación (tierra, roca) |
| 0.2 - 0.4 | grass | Pasto, césped |
| 0.4 - 0.6 | bush | Arbustos, matorrales |
| 0.6 - 0.75 | tree_medium | Árboles medianos |
| 0.75 - 1.0 | tree_tall | Árboles altos, bosque denso |

### 4. Generación de Malla

Se crea una **PlaneGeometry** con resolución igual al número de puntos:

```javascript
const geometry = new THREE.PlaneGeometry(
  1000,  // Tamaño en metros
  1000,
  50,    // Segmentos X (resolución)
  50     // Segmentos Y
);

// Aplicar alturas a vértices
vertices[i*3 + 2] = elevation * verticalScale;
```

### 5. Colores por Elevación

```javascript
const colorMap = {
  water: 0x0066cc,      // < 0m
  beach: 0xf4e7b8,      // 0-2m
  grass: 0x7cbc4b,      // 2-50m
  forest: 0x2d5016,     // 50-100m
  mountain: 0x8b7355,   // 100-200m
  snow: 0xffffff        // > 200m
};
```

---

## ⚙️ Configuración

### Parámetros Principales

```javascript
const config = {
  // Resolución del grid
  resolution: 50,           // 50x50 = 2,500 puntos
  minResolution: 20,        // Mínimo recomendado
  maxResolution: 500,       // Máximo (cuidado con rendimiento)
  
  // Escala vertical
  verticalScale: 2.0,       // Exageración de alturas
  
  // Tamaño real
  realWorldSize: 1000,      // Metros (1km)
  
  // Vegetación
  vegetationDensity: 0.3,   // 30% de puntos con vegetación
  vegetationMinNDVI: 0.2,   // NDVI mínimo para vegetación
  
  // Umbrales NDVI
  ndviThresholds: {
    grass: { min: 0.2, max: 0.4 },
    bush: { min: 0.4, max: 0.6 },
    tree_medium: { min: 0.6, max: 0.75 },
    tree_tall: { min: 0.75, max: 1.0 }
  }
};
```

### Recomendaciones de Resolución

| Área | Resolución | Puntos | Distancia entre puntos |
|------|-----------|--------|------------------------|
| 1 km² | 50 × 50 | 2,500 | 20m |
| 4 km² | 100 × 100 | 10,000 | 20m |
| 9 km² | 150 × 150 | 22,500 | 20m |
| 16 km² | 200 × 200 | 40,000 | 20m |

⚠️ **Nota:** Resoluciones > 200 pueden causar problemas de rendimiento

---

## 🔧 API

### Constructor

```javascript
const terrainGen = new TerrainGenerator3D(config);
```

### initialize()

```javascript
terrainGen.initialize(
  heightmapHandler,   // Handler de elevaciones
  vegetationHandler,  // Handler de NDVI
  maira3DSystem       // Sistema 3D MAIRA
);
```

### generateTerrain()

```javascript
const result = await terrainGen.generateTerrain(bounds, options);

// Retorna:
{
  terrain: THREE.Mesh,          // Malla de terreno
  vegetation: Array<Object3D>,  // Objetos de vegetación
  points: Array<Point>,         // Puntos enriquecidos
  stats: {
    points: 2500,
    elevation: { min: 0, max: 150, avg: 75 },
    ndvi: { min: 0.1, max: 0.9, avg: 0.5 },
    vegetation: { total: 750, density: 30 }
  }
}
```

### clear()

```javascript
terrainGen.clear();  // Libera memoria y recursos
```

### updateConfig()

```javascript
terrainGen.updateConfig({
  resolution: 100,
  vegetationDensity: 0.5
});
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Terreno Básico

```javascript
// Crear generador
const terrainGen = new TerrainGenerator3D({
  resolution: 50,
  verticalScale: 2.0,
  realWorldSize: 1000
});

// Inicializar
terrainGen.initialize(
  window.heightmapHandler,
  window.vegetationHandler,
  window.maira3DSystem
);

// Generar para área del mapa
const result = await terrainGen.generateTerrain(
  mapa.getBounds(),
  { includeVegetation: true }
);

// Agregar a escena THREE.js
scene.add(result.terrain);
result.vegetation.forEach(veg => scene.add(veg));
```

### Ejemplo 2: Terreno de Alta Resolución

```javascript
const terrainGen = new TerrainGenerator3D({
  resolution: 150,          // Mayor detalle
  verticalScale: 1.5,       // Menos exageración
  realWorldSize: 2000,      // Área más grande
  vegetationDensity: 0.5    // Más vegetación
});

// ... resto igual
```

### Ejemplo 3: Solo Terreno (Sin Vegetación)

```javascript
const result = await terrainGen.generateTerrain(
  bounds,
  { includeVegetation: false }  // Omitir vegetación
);
```

### Ejemplo 4: Terreno Procedural (Sin Datos Reales)

```javascript
// Si no hay heightmapHandler ni vegetationHandler,
// el sistema genera datos procedurales automáticamente
const terrainGen = new TerrainGenerator3D();
terrainGen.initialize(null, null, maira3DSystem);

const result = await terrainGen.generateTerrain(bounds);
// Usa algoritmos de noise para altura y NDVI
```

---

## 🚀 Optimización

### Rendimiento

1. **Ajustar resolución según área:**
   ```javascript
   const area = calculateArea(bounds);  // km²
   const resolution = Math.min(200, Math.sqrt(area) * 50);
   ```

2. **LOD (Level of Detail):**
   ```javascript
   // Alta resolución cerca de la cámara
   // Baja resolución lejos
   if (distanceToCamera < 500) resolution = 100;
   else resolution = 50;
   ```

3. **Lazy loading de vegetación:**
   ```javascript
   // Solo cargar vegetación visible
   vegetationDensity = distanceToCamera > 1000 ? 0.1 : 0.3;
   ```

### Memoria

1. **Limpiar terreno anterior:**
   ```javascript
   terrainGen.clear();  // Antes de generar nuevo
   ```

2. **Limitar vegetación:**
   ```javascript
   const maxVegetation = 1000;
   if (vegetation.length > maxVegetation) {
     vegetation = vegetation.slice(0, maxVegetation);
   }
   ```

3. **Usar geometrías compartidas:**
   ```javascript
   // Reusar misma geometría para múltiples árboles
   const treeGeometry = new THREE.ConeGeometry(1, 3, 8);
   trees.forEach(pos => {
     const tree = new THREE.Mesh(treeGeometry, material);
     tree.position.copy(pos);
   });
   ```

### Calidad Visual

1. **Aumentar vertical scale en terrenos planos:**
   ```javascript
   if (elevationRange < 20) verticalScale = 5.0;
   ```

2. **Texturizar terreno:**
   ```javascript
   const texture = textureLoader.load('terrain_texture.jpg');
   material.map = texture;
   ```

3. **Agregar sombras:**
   ```javascript
   terrain.receiveShadow = true;
   vegetation.forEach(obj => obj.castShadow = true);
   ```

---

## 📊 Comparación de Enfoques

### Muestreo de Puntos (Implementado) ✅

**Pros:**
- ✅ Datos científicos precisos (DEM + NDVI)
- ✅ Control fino sobre resolución
- ✅ Eficiente para áreas grandes
- ✅ Ya tenemos los datos necesarios
- ✅ Ideal para simulación militar

**Contras:**
- ❌ Requiere datos DEM y NDVI
- ❌ No captura detalles < resolución

### Análisis de Imagen Satelital ⚠️

**Pros:**
- ✅ Textura visual realista
- ✅ Detección automática de features

**Contras:**
- ❌ Requiere procesamiento de imágenes pesado
- ❌ Alturas aproximadas, no precisas
- ❌ Necesita imágenes de alta resolución
- ❌ Más lento para generar

---

## 🎯 Roadmap Futuro

### Fase 2: Mejoras
- [ ] Texturizado automático desde satélite
- [ ] LOD dinámico según distancia
- [ ] Cacheo de terrenos generados
- [ ] Streaming de chunks grandes

### Fase 3: Features Avanzadas
- [ ] Detección de edificios y caminos
- [ ] Ríos y cuerpos de agua dinámicos
- [ ] Sistema de clima (nieve, lluvia)
- [ ] Deformación de terreno en tiempo real

---

## 📚 Referencias

- **DEM:** Digital Elevation Model (datos de elevación)
- **NDVI:** Normalized Difference Vegetation Index
- **THREE.js:** Biblioteca 3D WebGL
- **PlaneGeometry:** Geometría de plano subdividido

---

**Autor:** MAIRA Team  
**Fecha:** 4 de octubre de 2025  
**Versión:** 1.0.0
