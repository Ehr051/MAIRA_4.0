# 📚 Código Reutilizable - MAIRA 4.0

## 🎯 Propósito
Documentar funciones, sistemas y módulos ya implementados en el proyecto para **REUTILIZAR** en lugar de duplicar código.

---

## ✅ **YA IMPLEMENTADO**

### 1. 💡 Sistema de Iluminación 3D

**Ubicación:** `test-terrain-from-map.html` líneas 807-820

```javascript
// ✅ Sistema completo de iluminación
renderer.shadowMap.enabled = true;

// Luz ambiental
const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
scene.add(ambientLight);

// Luz direccional (sol)
const sunLight = new THREE.DirectionalLight(0xffffee, 1.2);
sunLight.position.set(50, 100, 50);
sunLight.castShadow = true;
scene.add(sunLight);
```

**Estado:** ✅ FUNCIONANDO  
**Acción:** NINGUNA - Ya está implementado correctamente

---

### 2. 🎯 Sistema de Selección de Unidades

**Ubicación:** `test-terrain-from-map.html` líneas 2120-2145

```javascript
// ✅ Selección con raycasting
let selectedUnit = null;

// Deseleccionar anterior
if (selectedUnit) {
    selectedUnit.traverse((child) => {
        if (child.isMesh && child.material) {
            child.material.emissive?.setHex(0x000000);
        }
    });
}

// Seleccionar nueva
selectedUnit = unitObj;
selectedUnit.traverse((child) => {
    if (child.isMesh && child.material) {
        child.material.emissive.setHex(0x00ff00); // Verde
    }
});
```

**Estado:** ⚠️ PARCIAL  
**Problema:** Pinta el modelo completo (emissive), usuario quiere **anillo debajo**  
**Acción:** MODIFICAR - Agregar THREE.RingGeometry debajo de la unidad

---

### 3. 🎮 Sistema de Órdenes

**Ubicación:** `test-terrain-from-map.html` líneas 831-870

```javascript
// ✅ Sistema de órdenes implementado
let currentOrderMode = null; // 'move', 'attack', etc.

// Orden de movimiento
if (currentOrderMode === 'move' && selectedUnit) {
    // ... código de movimiento ...
}

// Orden de ataque
if (currentOrderMode === 'attack' && selectedUnit) {
    attackUnit(selectedUnit, targetUnit);
}
```

**Estado:** ⚠️ PARCIAL  
**Problema:** Usuario reporta "no veo que se ejecute mover"  
**Acción:** VERIFICAR - Revisar implementación completa de movimiento

---

### 4. 📍 Sistema de Ayudas Visuales

**Ubicación:** `test-terrain-from-map.html` líneas 1711-1728

```javascript
// ✅ Círculos de visibilidad
function showVisibilityCircle(unit) {
    // Crear círculo alrededor de unidad
    // ... código ...
}

// Limpieza de meshes
if (selectedUnit.userData.visualAidMeshes) {
    selectedUnit.userData.visualAidMeshes.forEach(mesh => {
        scene.remove(mesh);
    });
    selectedUnit.userData.visualAidMeshes = [];
}
```

**Estado:** ✅ FUNCIONANDO  
**Acción:** REUTILIZAR - Usar mismo patrón para anillo de selección

---

### 5. 🗂️ Sistema de Carga de Unidades

**Ubicación:** `test-terrain-from-map.html` líneas 1990-2050

```javascript
// ✅ Carga de modelos GLB
const unitModels = {
    'fsb_operator': { 
        path: 'Client/assets/models/gbl_new/fsb_operator.glb',
        scale: 2.5,
        yOffset: 0
    },
    'tam': {
        path: 'Client/assets/models/gbl_new/tam.glb',
        scale: 2.5,
        yOffset: 0
    }
    // ...
};

gltfLoader.load(config.path, (gltf) => {
    const model = gltf.scene;
    // Forzar texturas
    model.traverse((child) => {
        if (child.isMesh && child.material) {
            mat.needsUpdate = true;
            // ...
        }
    });
});
```

**Estado:** ⚠️ LIMITADO  
**Problema:** Solo permite cargar tipos predefinidos, usuario quiere cargar múltiples  
**Acción:** EXPANDIR - Permitir carga dinámica de todos los modelos en carpeta

---

### 6. ⚔️ Sistema de Ataque

**Ubicación:** `test-terrain-from-map.html` líneas 2240-2300

```javascript
// ✅ Función de ataque básica
function attackUnit(attacker, target) {
    const attackerPos = new THREE.Vector3();
    const targetPos = new THREE.Vector3();
    
    attacker.getWorldPosition(attackerPos);
    target.getWorldPosition(targetPos);
    
    const distance = attackerPos.distanceTo(targetPos);
    
    // Calcular daño
    const damage = 20; // Hardcodeado
    
    // Aplicar daño
    target.userData.currentHealth -= damage;
    
    // Efecto visual
    createExplosion(targetPos);
}
```

**Estado:** ⚠️ BÁSICO  
**Problema:** Usuario: "no es lo mismo mortero, tanque, ametralladora"  
**Acción:** MEJORAR - Diferenciar por tipo de arma (direct/indirect fire)

---

### 7. 📊 Sistema de Logs

**Ubicación:** `test-terrain-from-map.html` líneas 2450-2470

```javascript
// ✅ Sistema de logs tácticos
function log(message, type = 'info') {
    const logPanel = document.getElementById('log-panel');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logPanel.appendChild(entry);
}
```

**Estado:** ✅ FUNCIONANDO  
**Acción:** REUTILIZAR

---

## ❌ **NO IMPLEMENTADO (Pendiente)**

### 1. 🔴 Anillo de Selección

**Requerimiento:** Usuario quiere anillo debajo de unidad seleccionada (verde amigo, rojo enemigo)

**Implementar:**
```javascript
function createSelectionRing(unit, color) {
    const ringGeometry = new THREE.RingGeometry(1.5, 1.8, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2; // Horizontal
    ring.position.y = 0.1; // Apenas sobre terreno
    
    unit.add(ring);
    unit.userData.selectionRing = ring;
}

function removeSelectionRing(unit) {
    if (unit.userData.selectionRing) {
        unit.remove(unit.userData.selectionRing);
        unit.userData.selectionRing = null;
    }
}
```

---

### 2. 📐 Line of Sight (LOS)

**Requerimiento:** Raycasting entre unidades para verificar visibilidad

**Implementar:**
```javascript
function hasLineOfSight(unitA, unitB) {
    const posA = new THREE.Vector3();
    const posB = new THREE.Vector3();
    
    unitA.getWorldPosition(posA);
    unitB.getWorldPosition(posB);
    
    posA.y += 2; // Altura de vista
    posB.y += 2;
    
    const direction = new THREE.Vector3().subVectors(posB, posA).normalize();
    const distance = posA.distanceTo(posB);
    
    raycaster.set(posA, direction);
    raycaster.far = distance;
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Si hay obstáculos (terreno, edificios): no hay LOS
    for (let intersect of intersects) {
        if (intersect.object !== unitA && intersect.object !== unitB) {
            if (intersect.object.userData.isObstacle) {
                return false;
            }
        }
    }
    
    return true;
}
```

---

### 3. 🔄 Sistema de Movimiento Animado

**Requerimiento:** Movimiento suave con velocidad correcta

**Implementar:**
```javascript
function moveUnit(unit, targetPosition, speed) {
    const startPos = unit.position.clone();
    const distance = startPos.distanceTo(targetPosition);
    const duration = (distance / speed) * 1000; // ms
    
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        unit.position.lerpVectors(startPos, targetPosition, progress);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            log(`${unit.userData.unitName} llegó a destino`, 'success');
        }
    }
    
    animate();
}
```

---

### 4. 🎯 Ataque Diferenciado por Tipo

**Requerimiento:** Mortero (indirect), tanque (direct), ametralladora (direct)

**Implementar:**
```javascript
const weaponTypes = {
    'direct_fire': {
        types: ['tank', 'machine_gun', 'rifle'],
        needsLOS: true,
        trajectory: 'straight',
        effectRadius: 5
    },
    'indirect_fire': {
        types: ['mortar', 'artillery', 'rocket'],
        needsLOS: false,
        trajectory: 'arc',
        effectRadius: 15
    }
};

function attackWithWeapon(attacker, target, weaponType) {
    const attackerType = weaponTypes[weaponType];
    
    if (attackerType.needsLOS && !hasLineOfSight(attacker, target)) {
        log('Sin línea de visión', 'warning');
        return false;
    }
    
    // Calcular trayectoria
    if (attackerType.trajectory === 'arc') {
        createArcTrajectory(attacker, target);
    } else {
        createStraightTrajectory(attacker, target);
    }
    
    // Aplicar daño
    applyDamage(target, attackerType.effectRadius);
}
```

---

### 5. 📦 Carga Dinámica de Modelos

**Requerimiento:** Cargar todos los modelos de carpeta y generar botones

**Implementar:**
```javascript
async function loadAllModelsFromFolder() {
    const modelsFolder = 'Client/assets/models/gbl_new/';
    
    // Obtener lista de archivos (requiere backend endpoint)
    const response = await fetch('/api/list-models');
    const models = await response.json();
    
    const sidebar = document.getElementById('unit-type-list');
    sidebar.innerHTML = '';
    
    models.forEach(model => {
        const button = document.createElement('button');
        button.textContent = model.name;
        button.onclick = () => placeUnitOfType(model.name);
        sidebar.appendChild(button);
    });
}
```

---

## 🔧 **MODIFICAR (Ajustar Existente)**

### 1. ⚠️ yOffset de Árboles

**Archivo:** `Client/js/services/TerrainGenerator3D.js` línea 827

**Actual:**
```javascript
const yOffset = -(modelHeight * treeScale) * 1.5; // -150%
```

**Problema:** Árboles aún flotan

**Probar:**
```javascript
const yOffset = -(modelHeight * treeScale) * 2.0; // -200%
// O valor absoluto:
const yOffset = -10; // Fijo -10 unidades
```

---

### 2. ⚠️ FSB Operator Incompleto

**Archivo:** `Client/js/utils/VegetationInstancer.js`

**Verificar:** BufferGeometryUtils combina TODOS los meshes

**Console log:**
```javascript
console.log(`🔍 Meshes encontrados: ${meshes.length}`);
console.log(`🔧 Geometrías a combinar: ${geometries.length}`);
```

---

### 3. ⚠️ Font Awesome

**Archivo:** `test-terrain-from-map.html` línea 7

**Actual:**
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
```

**Si falla, probar:**
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
```

---

## 📊 Resumen

| Sistema | Estado | Archivo | Líneas | Acción |
|---------|--------|---------|--------|--------|
| Iluminación 3D | ✅ OK | test-terrain-from-map.html | 807-820 | NINGUNA |
| Selección | ⚠️ Parcial | test-terrain-from-map.html | 2120-2145 | MODIFICAR (anillo) |
| Órdenes | ⚠️ Parcial | test-terrain-from-map.html | 831-870 | VERIFICAR (move) |
| Ayudas visuales | ✅ OK | test-terrain-from-map.html | 1711-1728 | REUTILIZAR |
| Carga modelos | ⚠️ Limitado | test-terrain-from-map.html | 1990-2050 | EXPANDIR |
| Ataque | ⚠️ Básico | test-terrain-from-map.html | 2240-2300 | MEJORAR |
| Logs | ✅ OK | test-terrain-from-map.html | 2450-2470 | REUTILIZAR |
| Anillo selección | ❌ No existe | - | - | CREAR |
| LOS | ❌ No existe | - | - | CREAR |
| Movimiento animado | ❌ No existe | - | - | CREAR |
| Ataque diferenciado | ❌ No existe | - | - | CREAR |
| Carga dinámica | ❌ No existe | - | - | CREAR |

---

**Última actualización:** 7 de octubre de 2025  
**Autor:** GitHub Copilot  
**Propósito:** Evitar duplicación de código, maximizar reutilización
