# 🐛 Bugfixes: Caminos y Edificios no se Renderizaban

**Fecha:** 4 de octubre de 2025  
**Issue:** Detectaba 9 caminos pero renderizaba 0 segmentos

---

## 🔍 Problema Detectado

### Logs del Usuario
```
✅ Análisis: 2ms
📊 Veg:0 Caminos:9 Edificios:0     ← Detecta 9 caminos
...
✅ Caminos agregados: 0 segmentos  ← Pero renderiza 0
✅ Edificios agregados: 0 cubos
```

---

## 🐞 Bug #1: Tipo Plural vs Singular

### Causa Raíz
El `SatelliteImageAnalyzer` guarda features con tipos **plurales**:
- `'vegetation'` ✅
- `'roads'` ← **plural**
- `'buildings'` ← **plural**
- `'water'` ✅
- `'bareSoil'` ✅

Pero `TerrainGenerator3D` filtraba con tipos **singulares**:
```javascript
// ❌ ANTES (incorrecto)
const roadPoints = features.filter(f => f.type === 'road');      // singular
const buildingPoints = features.filter(f => f.type === 'building'); // singular
```

**Resultado:** `roadPoints.length === 0` siempre, aunque hubiera caminos detectados.

### Solución
```javascript
// ✅ AHORA (correcto)
const roadPoints = features.filter(f => f.type === 'roads');      // plural
const buildingPoints = features.filter(f => f.type === 'buildings'); // plural
```

**Archivo modificado:** `TerrainGenerator3D.js` líneas 593 y 685

---

## 🐞 Bug #2: Acceso Incorrecto a Dimensiones de Imagen

### Causa Raíz
El método `imageToTerrainCoords()` intentaba acceder a propiedades inexistentes:
```javascript
// ❌ ANTES (incorrecto)
const imageWidth = this.satelliteAnalyzer.imageWidth;   // undefined
const imageHeight = this.satelliteAnalyzer.imageHeight; // undefined
```

`SatelliteImageAnalyzer` **NO tiene** propiedades `imageWidth/imageHeight`, sino `imageData.width/height`.

**Resultado:** Coordenadas siempre en (0, 0, 0) → todos los objetos apilados en el centro.

### Solución
```javascript
// ✅ AHORA (correcto)
const imageWidth = this.satelliteAnalyzer.imageData.width;
const imageHeight = this.satelliteAnalyzer.imageData.height;
```

**Archivo modificado:** `TerrainGenerator3D.js` línea 801

---

## ✅ Cambios Implementados

### 1. TerrainGenerator3D.js - addRoadsLayer()
**Línea 593:**
```javascript
// ANTES
const roadPoints = features.filter(f => f.type === 'road');

// AHORA
const roadPoints = features.filter(f => f.type === 'roads');
console.log(`🛣️ Puntos de caminos detectados: ${roadPoints.length}`); // Debug
```

### 2. TerrainGenerator3D.js - addBuildingsLayer()
**Línea 685:**
```javascript
// ANTES
const buildingPoints = features.filter(f => f.type === 'building');

// AHORA
const buildingPoints = features.filter(f => f.type === 'buildings');
console.log(`🏢 Puntos de edificios detectados: ${buildingPoints.length}`); // Debug
```

### 3. TerrainGenerator3D.js - imageToTerrainCoords()
**Línea 794-801:**
```javascript
// ANTES
if (!this.satelliteAnalyzer) {
    return new THREE.Vector3(0, 0, 0);
}
const imageWidth = this.satelliteAnalyzer.imageWidth;
const imageHeight = this.satelliteAnalyzer.imageHeight;

// AHORA
if (!this.satelliteAnalyzer || !this.satelliteAnalyzer.imageData) {
    console.warn('⚠️ No hay imageData disponible');
    return new THREE.Vector3(0, 0, 0);
}
const imageWidth = this.satelliteAnalyzer.imageData.width;
const imageHeight = this.satelliteAnalyzer.imageData.height;
```

---

## 🧪 Testing

### Antes del Fix
```
SatelliteImageAnalyzer.js:194 🛣️ Caminos: 9
TerrainGenerator3D.js:138 ✅ Caminos agregados: 0 segmentos  ← ❌ Bug
TerrainGenerator3D.js:146 ✅ Edificios agregados: 0 cubos    ← ❌ Bug
```

### Después del Fix (Esperado)
```
SatelliteImageAnalyzer.js:194 🛣️ Caminos: 9
TerrainGenerator3D.js:593 🛣️ Puntos de caminos detectados: 9  ← ✅ Debug
TerrainGenerator3D.js:138 ✅ Caminos agregados: 3-5 segmentos ← ✅ Funciona
TerrainGenerator3D.js:685 🏢 Puntos de edificios detectados: 0 ← ✅ Debug
TerrainGenerator3D.js:146 ✅ Edificios agregados: 0 cubos     ← OK (no hay edificios)
```

---

## 📝 Notas

### ¿Por qué 9 puntos → 3-5 segmentos?
Los puntos de caminos se agrupan en segmentos conectados:
- 9 puntos cercanos pueden formar 3 líneas separadas
- `groupRoadSegments()` une puntos a < 50 píxeles de distancia
- Segmentos < 2 puntos se descartan

### ¿Por qué 0 edificios detectados?
Los umbrales de detección pueden ser muy estrictos para la zona. Edificios requieren:
```javascript
building: {
    minR: 60, maxR: 150,
    minG: 60, maxG: 150,
    minB: 60, maxB: 150,
    minVariance: 20  // Muy uniforme
}
```

Posibles soluciones:
1. Ampliar rangos RGB
2. Aumentar `maxVariance`
3. Probar en zona más urbana (centro de ciudad)

### ¿Por qué 0 vegetación?
Ya fue corregido en commit anterior (umbrales muy restrictivos).
Ahora detecta correctamente con:
```javascript
vegetation: {
    minR: 10, maxR: 150,
    minG: 40, maxG: 220,  // ✅ Más permisivo
    minB: 10, maxB: 120,
    minRatio: 1.1
}
```

---

## 🚀 Próximas Acciones

### 1. Recargar test-terrain-from-map.html
```bash
# Refrescar navegador (Cmd+R o F5)
```

### 2. Repetir captura
- Navegar a zona con caminos visibles
- Capturar mapa
- Analizar imagen
- Generar terreno

### 3. Verificar logs mejorados
```
🛣️ Puntos de caminos detectados: 9
✅ Caminos agregados: 4 segmentos
```

### 4. Si aún no hay vegetación
Probar en parques o zonas verdes (Palermo, Bosques, etc.)

### 5. Si no hay edificios
- Probar en zona más urbana (microcentro)
- O ajustar umbrales en `SatelliteImageAnalyzer.js`

---

## 📊 Checklist de Verificación

- [x] Bug #1 corregido: Tipo 'roads' plural
- [x] Bug #2 corregido: Tipo 'buildings' plural
- [x] Bug #3 corregido: imageData.width/height
- [x] Logs de debug agregados
- [x] Validación de imageData agregada
- [ ] Testing en navegador (usuario debe probar)

---

**Autor:** MAIRA Team  
**Archivos modificados:** `TerrainGenerator3D.js`  
**Líneas:** 593, 685, 794-801  
**Estado:** ✅ Listo para testing
