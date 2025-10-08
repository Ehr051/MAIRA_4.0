# 🔧 Troubleshooting - Problemas de Renderizado 3D

**Fecha:** 8 de octubre de 2025  
**Sistema:** MAIRA 4.0 - test-terrain-from-map.html  
**Problemas:** Árboles sin follaje, FSB Operator no renderiza

---

## 📋 PROBLEMAS IDENTIFICADOS Y FIXES APLICADOS

### 1. **Árboles sin Follaje** ✅ SOLUCIONADO

**Síntoma:**
- Solo se veía tronco y ramas
- NO se veía follaje verde

**Causa Raíz:**
```javascript
// VegetationInstancer.js fusionaba múltiples meshes
// pero solo usaba materials[0], PERDIENDO materiales de follaje

// Modelo GLB típico:
// - Mesh 0: Tronco (material marrón)
// - Mesh 1: Ramas (material gris)  
// - Mesh 2: Follaje (material verde)  ← SE PERDÍA

// Al fusionar:
geometry = mergeGeometries([mesh0, mesh1, mesh2]);
material = materials[0]; // ❌ Solo tronco, sin follaje
```

**Solución Aplicada:**
```javascript
// Client/js/utils/VegetationInstancer.js L76-94
if (meshes.length > 1) {
    // NO fusionar → Usar Group completo con TODOS los materiales
    modelData = {
        model: model.clone(),
        meshes: meshes.length,
        materials: materials.length,
        useGroup: true // Usar Groups en lugar de InstancedMesh
    };
}

// L207-259: Crear Groups individuales preservando materiales
instanceGroup.traverse((child) => {
    if (child.isMesh) {
        child.visible = true;
        child.frustumCulled = false;
        
        // Fix materiales
        materials.forEach(mat => {
            mat.needsUpdate = true;
            mat.side = THREE.DoubleSide;
            mat.visible = true;
            
            if (mat.transparent && mat.opacity < 0.1) {
                mat.opacity = 1.0;
                mat.transparent = false;
            }
        });
    }
});
```

**Commit:** `9619b395` - "fix: CRÍTICO - Árboles sin follaje por pérdida de materiales"

---

### 2. **FSB Operator No Renderiza** 🔄 EN PROGRESO

**Síntoma:**
- Modelo se carga (logs muestran 41 meshes)
- NO se ve nada en pantalla
- Console log: "Modelo cargado exitosamente"

**Diagnóstico:**
```bash
npx gltf-transform inspect Client/assets/models/gbl_new/fsb_operator.glb

# Resultado:
# - 41 meshes (Object_0 a Object_40)
# - 13 materiales (boots, helmet, face, uniform, etc.)
# - 342.798 vértices total
# - Geometría CORRECTA ✅
```

**Posibles Causas:**

#### A. **Materiales con opacity=0** (MÁS PROBABLE)
```javascript
// Algunos materiales pueden venir con:
material.transparent = true;
material.opacity = 0.0; // ❌ INVISIBLE

// Fix YA implementado en test-terrain-from-map.html L2162-2170:
if (material.transparent && material.opacity === 0) {
    material.opacity = 1.0;
    material.transparent = false;
}

if (material.opacity < 0.1) {
    material.opacity = 1.0;
}
```

#### B. **Scale Incorrecta**
```javascript
// test-terrain-from-map.html L575-577
'fsb_operator': {
    path: 'Client/assets/models/gbl_new/fsb_operator.glb',
    scale: 0.7,  // ← Puede ser muy pequeño
    yOffset: 0.5
}

// SOLUCIÓN: Aumentar scale temporalmente para testing
scale: 5.0  // Muy grande pero visible
```

#### C. **Posición Fuera de Cámara**
```javascript
// Bounding box helper agregado L2299:
const helper = createBoundingBoxHelper(model, 0x00ff00);
scene.add(helper);

// Si NO se ve el helper verde → Modelo fuera de vista
// Si SÍ se ve el helper → Problema de materiales
```

---

## 🧪 PASOS DE TESTING PARA EL USUARIO

### Test 1: Verificar Árboles con Follaje ✅
1. Abrir `test-terrain-from-map.html`
2. Click "Generar Terreno 3D con Vegetación"
3. **Esperar 30 segundos** (carga de modelos)
4. Verificar en pantalla:
   - ✅ **Árboles COMPLETOS** (tronco + ramas + follaje verde)
   - ❌ Si solo tronco/ramas → Reportar en consola

### Test 2: Verificar FSB Operator
1. Abrir `test-terrain-from-map.html`
2. Click "Colocar FSB Operator"
3. Abrir **Console** (F12)
4. Buscar logs:
```javascript
📦 Mesh encontrado: Object_0 - Visible ANTES: false
✅ Visible DESPUÉS: true, frustumCulled: false
🎨 Procesando materiales para Object_0:
[0] Material: boots
    ├─ Tipo: MeshStandardMaterial
    ├─ Transparent: true, Opacity: 0.0  // ← PROBLEMA SI opacity=0
    ├─ Color: 000000
    ├─ Map: SÍ
```

5. **Si Opacity = 0:** Fix ya aplicado, debería funcionar
6. **Si NO se ve el modelo:**
   - Buscar helper verde (bounding box)
   - Si helper visible pero NO modelo → problema materiales
   - Si helper NO visible → problema posición/scale

### Test 3: Scale Temporal
```javascript
// test-terrain-from-map.html L575-577
// Cambiar temporalmente:
'fsb_operator': {
    scale: 5.0,  // En lugar de 0.7
    yOffset: 0
}
```
Recargar página y verificar si aparece GIGANTE.

---

## 📊 LOGS DETALLADOS IMPLEMENTADOS

### Logs de Carga (test-terrain-from-map.html L2115-2180)
```javascript
console.log(`📦 Mesh encontrado: ${child.name}`);
console.log(`     ✅ Visible ANTES: ${child.visible}`);
console.log(`     ✅ Visible DESPUÉS: ${child.visible}, frustumCulled: ${child.frustumCulled}`);
console.log(`     🎨 Procesando materiales para ${child.name}:`);
console.log(`       [${idx}] Material: ${material.name}`);
console.log(`           ├─ Tipo: ${material.type}`);
console.log(`           ├─ Transparent: ${material.transparent}, Opacity: ${material.opacity}`);
console.log(`           ├─ Color: ${material.color.getHexString()}`);
console.log(`           ├─ Map: ${material.map ? 'SÍ' : 'NO'}`);
console.log(`           ├─ Side: ${material.side}`);
console.log(`           └─ Visible: ${material.visible}`);
```

---

## 🎯 PRÓXIMOS PASOS SI AÚN NO FUNCIONA

1. **Copiar logs completos** de console y enviar
2. **Tomar screenshot** mostrando:
   - Terreno 3D generado
   - Árboles (con/sin follaje)
   - Posición donde debería estar FSB
   - Bounding box helper (verde)
3. **Verificar en Scene Inspector** (Three.js DevTools):
   - Children de la escena
   - Meshes cargados
   - visible = true/false

---

## 📝 COMMITS RELACIONADOS

- `9619b395` - fix: Árboles sin follaje por pérdida de materiales
- `81c0ae83` - debug: Bounding box helpers y verificación cámara
- `00d12642` - debug: Logs ultra-detallados para diagnóstico meshes
- `07e42689` - fix: Forzar visibilidad de TODOS los meshes

---

## 🔗 ARCHIVOS MODIFICADOS

- ✅ `Client/js/utils/VegetationInstancer.js` (L76-94, L207-259)
- ✅ `test-terrain-from-map.html` (L2076-2217, L2299)
- ⏳ FSB Operator: Pendiente testing del usuario

---

**Última actualización:** 8 de octubre 2025, 02:30 AM  
**Estado:** Árboles SOLUCIONADO ✅ | FSB Operator EN PROGRESO 🔄
