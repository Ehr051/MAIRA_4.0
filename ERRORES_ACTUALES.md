# 🐛 ERRORES IDENTIFICADOS - MAIRA 4.0
## Análisis de tareas.txt (15 oct 2025)

---

## 🚨 ERRORES CRÍTICOS (Prioridad MÁXIMA)

### 1. ❌ **Modelos GLTF 404 - Rutas Obsoletas**
**Problema:**
```
Failed to load resource: http://127.0.0.1:5500/backup_gltf_models/gltf_new/tam2c_3d_model/scene.gltf (404)
Failed to load resource: http://127.0.0.1:5500/backup_gltf_models/gltf_new/ural_4320/scene.gltf (404)
Failed to load resource: http://127.0.0.1:5500/backup_gltf_models/gltf_new/m113/scene.gltf (404)
Failed to load resource: http://127.0.0.1:5500/backup_gltf_models/gltf_new/humvee/scene.gltf (404)
Failed to load resource: http://127.0.0.1:5500/backup_gltf_models/gltf_new/tent_military/scene.gltf (404)
Failed to load resource: http://127.0.0.1:5500/backup_gltf_models/gltf_new/soldier/scene.gltf (404)
```

**Causa:**
El código **maira3DMaster.js** intenta cargar modelos GLTF de `backup_gltf_models/gltf_new/` pero:
1. ❌ Esa carpeta contiene formato GLTF (obsoleto)
2. ❌ Los archivos probablemente no existen o están corruptos
3. ✅ Los modelos GLB funcionales están en `Client/assets/models/gbl_new/`

**Impacto:**
- Sistema cae back a "símbolos verticales" (palitos básicos)
- No se muestran modelos 3D reales de unidades
- Experiencia visual degradada

**Solución:**
```javascript
// EN maira3DMaster.js líneas ~66-70
// ANTES (INCORRECTO):
'tank_tam': '/backup_gltf_models/gltf_new/tam2c_3d_model/scene.gltf',
'ural': '/backup_gltf_models/gltf_new/ural_4320/scene.gltf',

// DESPUÉS (CORRECTO):
'tank_tam': 'Client/assets/models/gbl_new/tam_tank.glb',
'ural': 'Client/assets/models/gbl_new/ural.glb', // Si existe
'm113': 'Client/assets/models/gbl_new/m113.glb', // Si existe
'humvee': 'Client/assets/models/gbl_new/humvee.glb', // Si existe
'soldier': 'Client/assets/models/gbl_new/a_solider_poin_weapon.glb',
```

**Archivos a modificar:**
- `Client/js/services/maira3DMaster.js` líneas ~66-70

**Acción inmediata:**
1. Verificar qué modelos GLB existen realmente en `Client/assets/models/gbl_new/`
2. Actualizar mapeo de rutas en maira3DMaster.js
3. Eliminar referencias a GLTF (solo usar GLB)

---

### 2. ❌ **TypeError: this.updateUnits is not a function**
**Problema:**
```javascript
maira3DMaster.js:661 Uncaught TypeError: this.updateUnits is not a function
    at render (maira3DMaster.js:661:18)
```

**Causa:**
La función `updateUnits()` no está definida en el contexto o se perdió durante refactor.

**Impacto:**
- Loop de animación/render se rompe
- Vista 3D puede congelarse o no actualizar unidades en movimiento

**Solución:**
Revisar `maira3DMaster.js` línea 661 y verificar:
1. ¿Existe `updateUnits()` definido en la clase/módulo?
2. ¿Se borró accidentalmente durante limpieza de código?
3. ¿Debe llamarse con otro nombre? (ej: `updatePlacedUnits()`)

**Acción inmediata:**
1. Abrir `maira3DMaster.js` línea 661
2. Buscar definición de `updateUnits` en el archivo
3. Si no existe, definirla o comentar la llamada temporalmente

---

### 3. ⚠️ **Uncaught errors sin detalle**
**Problema:**
```
maira3DMaster.js:661 Uncaught 
maira3DMaster.js:661 Uncaught (in promise) 
```

**Causa:**
Promesas rechazadas sin `.catch()` o try/catch

**Impacto:**
- Errores silenciosos dificultan debugging
- Comportamiento impredecible

**Solución:**
Agregar manejo de errores en promesas:
```javascript
// ANTES:
loadModel(modelPath).then(model => { /* ... */ });

// DESPUÉS:
loadModel(modelPath)
    .then(model => { /* ... */ })
    .catch(error => {
        console.error('❌ Error cargando modelo:', error);
        // Fallback a símbolo básico
    });
```

---

### 4. ⚠️ **Warnings menores (no bloquean funcionalidad)**
```
⚠️ Controles no disponibles para navegación táctica
⚠️ calcoActivo no disponible
⚠️ Milsymbol no disponible, creando símbolo básico
```

**Causa:**
Módulos opcionales no cargados (esperado en test-terrain-from-map-OPTIMIZADO.html)

**Impacto:**
- Minimal, solo reduce funcionalidad de navegación táctica
- Símbolos caen back a geometría básica (aceptable)

**Acción:**
- ✅ NO urgente, se puede ignorar por ahora
- En integración futura, cargar módulos completos si se necesitan

---

## 📋 PLAN DE ACCIÓN PRIORIZADO

### 🔴 **FASE 1: Estabilizar Sistema 3D Actual (1-2 horas)**

**Objetivo:** Que test-terrain-from-map-OPTIMIZADO.html funcione sin errores

#### Task 1.1: Fix rutas modelos GLB
- [ ] Listar modelos disponibles en `Client/assets/models/gbl_new/`
- [ ] Actualizar `maira3DMaster.js` líneas ~66-70 con rutas correctas
- [ ] Eliminar todas las referencias a `/backup_gltf_models/gltf_new/`
- [ ] Testing: Verificar que modelos cargan sin 404

#### Task 1.2: Fix TypeError updateUnits
- [ ] Abrir `maira3DMaster.js` línea 661
- [ ] Localizar función `updateUnits()` o equivalente
- [ ] Corregir llamada o definir función faltante
- [ ] Testing: Verificar render loop sin errores

#### Task 1.3: Agregar try/catch en promesas
- [ ] Identificar todas las promesas sin `.catch()`
- [ ] Agregar manejo de errores robusto
- [ ] Logging descriptivo de errores

**Resultado esperado:**
✅ test-terrain-from-map-OPTIMIZADO.html genera terreno SIN errores en consola
✅ Modelos GLB cargan correctamente (si existen)
✅ Fallback a símbolos básicos funciona (si modelos no existen)

---

### 🟠 **FASE 2: Optimizar y Documentar (2-3 horas)**

#### Task 2.1: Inventario completo de modelos
- [ ] Crear tabla: modelo GLB → tipo → tamaño → estado (funcional/corrupto/falta)
- [ ] Documentar qué modelos faltan y deben descargarse/crearse
- [ ] Priorizar modelos esenciales vs opcionales

#### Task 2.2: Limpieza de código obsoleto
- [ ] Eliminar referencias GLTF en todo el código
- [ ] Buscar y reemplazar `backup_gltf_models` por rutas correctas
- [ ] Eliminar scripts de conversión GLTF si ya no se usan

#### Task 2.3: Testing exhaustivo
- [ ] Generar terreno zoom 14 Buenos Aires (test NaN fix)
- [ ] Generar terreno zoom 15 área táctica (test FPS 40+)
- [ ] Verificar vegetación densa visible
- [ ] Verificar modelos (o símbolos fallback) renderizan

**Resultado esperado:**
✅ Sistema 3D completamente funcional sin warnings críticos
✅ Documentación actualizada de qué modelos hay/faltan
✅ Código limpio sin referencias obsoletas

---

### 🟡 **FASE 3: Integración con Planeamiento (FUTURO)**

**AHORA NO:** Según tu estrategia, esto se hace DESPUÉS de estabilizar el sistema 3D.

Una vez que:
1. ✅ test-terrain-from-map-OPTIMIZADO.html funciona perfecto
2. ✅ Terreno se genera correctamente optimizado
3. ✅ Modelos/símbolos se muestran sin errores

Entonces SÍ comenzar integración:
- [ ] Importar js de SIDC/MCC/MCCF en test file
- [ ] Implementar sistema SIDC → Modelos 3D
- [ ] Implementar renderizado MCC/MCCF en terreno
- [ ] Integrar con planeamiento.html (o clon)
- [ ] gestorOrdenes híbrido 2D/3D

**Esto está en TODO_PENDIENTE.md pero se hace DESPUÉS.**

---

## 🎯 PRÓXIMO PASO INMEDIATO

**LO QUE DEBES HACER AHORA:**

1. **Verificar modelos GLB disponibles:**
```bash
ls -lh Client/assets/models/gbl_new/
```

2. **Decidir qué modelos son ESENCIALES:**
- Infantería: ¿Cuál GLB usar? (a_solider_poin_weapon.glb, russian_soldier.glb, fsb_operator.glb)
- Tanques: ¿tam_tank.glb existe?
- Vehículos: ¿Qué GLB hay disponibles?

3. **Yo corrijo las rutas en maira3DMaster.js** según lo que me digas que existe

4. **Testing:** Generar terreno y verificar si modelos cargan

---

## 📊 RESUMEN ESTADO ACTUAL

**✅ LO QUE FUNCIONA:**
- Sistema de terreno 3D (elevación, vegetación)
- Optimizaciones (FPS, densidad, resolución adaptativa)
- Fallback a símbolos básicos cuando modelos fallan

**❌ LO QUE NO FUNCIONA:**
- Rutas de modelos (apuntan a GLTF obsoletos en backup/)
- updateUnits() undefined
- Promesas sin manejo de errores

**⚠️ LO QUE FALTA (FUTURO):**
- Integración SIDC/MCC/MCCF (en TODO_PENDIENTE.md)
- Animaciones (Mixamo pipeline)
- gestorOrdenes híbrido

---

**ESTRATEGIA CORRECTA:**
1. Primero: Fix errores actuales (rutas, updateUnits)
2. Segundo: Estabilizar y optimizar sistema 3D
3. Tercero: Integrar con planeamiento
4. Cuarto: Agregar features (animaciones, efectos, IA)

**TODO_PENDIENTE.md sigue siendo válido, pero PRIMERO hay que arreglar lo básico.**

---

**¿Qué hacemos?**
1. ¿Verificas qué modelos GLB existen en Client/assets/models/gbl_new/?
2. ¿Decido qué modelos son prioritarios?
3. Corrijo rutas en maira3DMaster.js
4. Corrijo updateUnits undefined
5. Testing completo

**Dime qué modelos GLB tienes disponibles y empezamos.**
