# 🔍 Verificación de Modelos de Vegetación

**Fecha**: 5 de octubre de 2025  
**Objetivo**: Validar que todos los modelos 3D de vegetación existan y estén correctamente mapeados.

---

## 📁 ESTRUCTURA DE DIRECTORIOS

```
Client/assets/models/
├── gbl_new/                          ← Modelos GLB (recomendado)
│   ├── AnimatedOak.glb               ✅ 81MB
│   ├── arbol alto.glb                ✅ 8.9MB
│   ├── arbusto.glb                   ✅ 44MB
│   ├── simple_grass_chunks.glb       ✅ 19MB
│   └── trees_low.glb                 ✅ 2.4MB
└── gltf_new/                         ← Modelos GLTF (legacy)
```

---

## 🗺️ MAPEO DE TIPOS → ARCHIVOS

### En `GLTFModelLoader.js`:

```javascript
this.vegetationModels = {
    'tree_tall':   'AnimatedOak.glb',        // 81MB - Árbol animado de alta calidad
    'tree_medium': 'trees_low.glb',          // 2.4MB - Árboles low poly
    'tree_oak':    'AnimatedOak.glb',        // Alias para oak tree
    'tree':        'arbol alto.glb',         // 8.9MB - Árbol genérico alto
    'bush':        'arbusto.glb',            // 44MB - Arbusto
    'grass':       'simple_grass_chunks.glb' // 19MB - Pasto en chunks
};
```

### Verificación de existencia:

| Tipo Lógico | Archivo Físico | Existe | Tamaño | Estado |
|-------------|----------------|--------|---------|--------|
| `tree_tall` | `AnimatedOak.glb` | ✅ | 81MB | OK |
| `tree_medium` | `trees_low.glb` | ✅ | 2.4MB | OK |
| `tree_oak` | `AnimatedOak.glb` | ✅ | 81MB | OK (alias) |
| `tree` | `arbol alto.glb` | ✅ | 8.9MB | OK |
| `bush` | `arbusto.glb` | ✅ | 44MB | OK |
| `grass` | `simple_grass_chunks.glb` | ✅ | 19MB | OK |

**✅ TODOS LOS MODELOS EXISTEN Y ESTÁN CORRECTAMENTE MAPEADOS**

---

## 🔄 FLUJO DE CARGA

### 1. Sistema de Clasificación
```javascript
// SatelliteImageAnalyzer.js detecta tipo por RGB
classifyVegetationType(r, g, b) {
    if (verde_oscuro) return 'forest';      // → tree_tall
    if (verde_claro)  return 'grass';       // → grass
    if (verde_medio)  return 'vegetation';  // → bush
    if (amarillento)  return 'crops';       // → bush
}
```

### 2. Mapeo de Features → Modelos 3D
```javascript
// TerrainGenerator3D.js configura densidades
const densityConfig = {
    'forest':     { type: 'tree_tall', density: 0.8 },  // AnimatedOak.glb
    'vegetation': { type: 'bush',      density: 0.6 },  // arbusto.glb
    'grass':      { type: 'grass',     density: 0.05 }, // simple_grass_chunks.glb
    'crops':      { type: 'bush',      density: 0.4 }   // arbusto.glb
};
```

### 3. Carga de Modelo
```javascript
// GLTFModelLoader.js carga archivo
async loadModel(modelName, category = 'vegetation') {
    const glbFile = this.vegetationModels[modelName]; // 'AnimatedOak.glb'
    const path = `Client/assets/models/gbl_new/${glbFile}`;
    
    this.loader.load(path, (gltf) => {
        // Cachear y retornar modelo
    });
}
```

### 4. Instancing
```javascript
// TerrainGenerator3D.js crea InstancedMesh
const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
// 1 geometría compartida para N instancias
```

---

## 🐛 POSIBLES PROBLEMAS Y SOLUCIONES

### ❌ Problema 1: "Error cargando GLB"
**Causa**: Ruta incorrecta o archivo no accesible  
**Solución**: Verificar ruta base en `GLTFModelLoader.js`:
```javascript
this.basePath = 'Client/assets/models/gbl_new/'; // ✅ Correcto
```

### ❌ Problema 2: "Modelo procedural usado como fallback"
**Causa**: Error de CORS o archivo corrupto  
**Solución**: Verificar:
1. Servidor local ejecutándose (Live Server)
2. Permisos de archivo: `chmod 644 Client/assets/models/gbl_new/*.glb`
3. Archivo no corrupto: Abrir en Blender

### ❌ Problema 3: "No se ven modelos en escena"
**Causa**: Coordenadas fuera de terreno o escala incorrecta  
**Solución**: Verificar logs:
```
⚠️ Coordenadas clampeadas: (lat, lon) → (lat_clamp, lon_clamp)
```
Indica que las instancias están siendo reubicadas.

### ❌ Problema 4: "Modelos muy grandes/lentos"
**Causa**: AnimatedOak.glb (81MB) es pesado para instancing masivo  
**Solución**: Usar `trees_low.glb` (2.4MB) para árboles distantes:
```javascript
// Cambiar en GLTFModelLoader.js
'tree_tall': 'trees_low.glb', // En lugar de AnimatedOak.glb
```

---

## 🧪 COMANDOS DE VERIFICACIÓN

### Verificar existencia de archivos:
```bash
cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0
ls -lh Client/assets/models/gbl_new/*.glb | grep -E "(AnimatedOak|trees_low|arbol alto|arbusto|simple_grass)"
```

### Verificar tamaños:
```bash
du -sh Client/assets/models/gbl_new/*.glb
```

### Verificar accesibilidad desde servidor:
```bash
# Ejecutar en navegador (consola)
fetch('Client/assets/models/gbl_new/AnimatedOak.glb', {method: 'HEAD'})
    .then(r => console.log('✅ Accesible', r.status))
    .catch(e => console.error('❌ Error', e));
```

---

## 📊 LOGS ESPERADOS (Carga Exitosa)

```
🎨 GLTFModelLoader inicializado
📦 Modelos de vegetación disponibles: (6) ['tree_tall', 'tree_medium', 'tree_oak', 'tree', 'bush', 'grass']
✅ GLTFLoader inicializado
🔍 Verificando modelos de vegetación...
  ✅ tree_tall: AnimatedOak.glb (81.0MB)
  ✅ tree_medium: trees_low.glb (2.4MB)
  ✅ tree_oak: AnimatedOak.glb (81.0MB)
  ✅ tree: arbol alto.glb (8.9MB)
  ✅ bush: arbusto.glb (44.0MB)
  ✅ grass: simple_grass_chunks.glb (19.0MB)

🎯 Modelo 'bush' mapeado a archivo: 'arbusto.glb'
📦 Cargando modelo GLB desde: Client/assets/models/gbl_new/arbusto.glb
✅ Modelo cargado: vegetation/bush (arbusto.glb) - 3 meshes, 12,450 vértices
♻️ Usando modelo cacheado: vegetation/bush (×1,942 veces)

🎨 Creando InstancedMesh para 1943 instancias de 'bush'...
  ✅ InstancedMesh creado: 1943 instancias
```

---

## 🚨 LOGS DE ERROR (Ejemplo)

```
❌ Error cargando GLB desde Client/assets/models/gbl_new/arbusto.glb:
   Tipo: error
   Mensaje: Failed to load resource: net::ERR_FILE_NOT_FOUND
   Stack: Error at GLTFLoader.load...
⚠️ Usando modelo procedural para bush
```

**Diagnóstico**:
1. Verificar que el archivo exista: `ls Client/assets/models/gbl_new/arbusto.glb`
2. Verificar servidor local activo
3. Verificar permisos: `ls -l Client/assets/models/gbl_new/arbusto.glb`

---

## 🎯 OPTIMIZACIONES RECOMENDADAS

### 1. **Usar modelos low-poly para instancing masivo**
```javascript
// Cambiar AnimatedOak (81MB) por trees_low (2.4MB)
'tree_tall': 'trees_low.glb',
'tree_medium': 'trees_low.glb',
```

**Beneficio**: 
- Carga 34× más rápida (81MB → 2.4MB)
- Memoria reducida en ~78MB por tipo
- Rendimiento mejorado (menos polígonos)

### 2. **Sistema LOD (Level of Detail)**
```javascript
// Cerca: Modelos detallados
if (distancia < 100m) usar 'AnimatedOak.glb'

// Medio: Modelos simplificados  
else if (distancia < 500m) usar 'trees_low.glb'

// Lejos: Billboards/sprites
else usar billboard 2D
```

### 3. **Caché de geometrías**
```javascript
// Ya implementado en createInstancedVegetation()
const geometry = child.geometry; // Reutilizar geometría
const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [x] **Archivos existen**: Todos los GLB están en `gbl_new/`
- [x] **Rutas correctas**: `basePath` apunta a `Client/assets/models/gbl_new/`
- [x] **Mapeo correcto**: Tipos lógicos → Archivos físicos
- [x] **Tamaños razonables**: Total ~176MB (aceptable)
- [ ] **Servidor activo**: Live Server corriendo en puerto 5501
- [ ] **Sin errores CORS**: Archivos accesibles desde JS
- [ ] **Logs de carga**: Ver confirmación de carga exitosa
- [ ] **Modelos visibles**: Verificar en escena 3D

---

## 🔧 SIGUIENTE PASO

**Ejecutar test y revisar logs**:
1. Recargar `test-terrain-from-map.html`
2. Abrir consola del navegador
3. Buscar logs de verificación:
   ```
   🔍 Verificando modelos de vegetación...
   ✅ tree_tall: AnimatedOak.glb (81.0MB)
   ```
4. Si hay errores, buscar:
   ```
   ❌ Error cargando GLB desde...
   ```

**Si no aparecen modelos**:
- Revisar coordenadas clampeadas (problema pendiente)
- Verificar que `createInstancedVegetation()` esté ejecutándose
- Comprobar que InstancedMesh se agregue a la escena

---

**Estado**: ✅ Rutas y mapeo verificados correctamente  
**Problema pendiente**: Coordenadas de instancias fuera del terreno (clampeo)  
**Próximo paso**: Corregir mapeo pixel→lat/lon→3D
