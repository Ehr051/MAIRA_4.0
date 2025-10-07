# 🎬 Guía Completa: Animaciones Mixamo para MAIRA 3D

## 📋 Problema Actual

**Usuario dice:** 
> "como hacemos esas animaciones? solo me deja subir obj zip o fbx... no me da para gbl o gltf.. hay animaciones corriendo mueriendo etc.. pero no se com aplicarlo.. y como animo los vehiculos?"

**Situación:**
- ✅ Tenemos modelos GLB: `a_solider_poin_weapon.glb`, `russian_soldier.glb`, `fsb_operator.glb`
- ❌ No tienen animaciones integradas (necesitamos agregarlas)
- ❌ Mixamo solo exporta FBX, no GLB directamente
- ⚠️ Algunos modelos sin texturas (se ven grises)

---

## 🎯 Solución: Pipeline Mixamo → FBX → GLB

### Proceso Completo

```
1. Modelo base → 2. Mixamo (rig + anim) → 3. FBX download → 4. Blender convert → 5. GLB final
```

---

## 📝 PASO 1: Preparar Modelo para Mixamo

### Requisitos del Modelo

Mixamo necesita:
- ✅ Formato: **FBX, OBJ o ZIP**
- ✅ Geometría limpia (single mesh preferible)
- ✅ Pose T o A (brazos extendidos)
- ✅ Sin rig previo (Mixamo lo crea)
- ⚠️ Máximo 10,000 polígonos (recomendado para auto-rig)

### Convertir GLB → FBX con Blender (si es necesario)

**Script Python para Blender:**

```python
# convert_glb_to_fbx.py
import bpy
import sys

# Limpiar escena
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Importar GLB
glb_path = sys.argv[-2]
fbx_path = sys.argv[-1]

bpy.ops.import_scene.gltf(filepath=glb_path)

# Exportar FBX (sin animaciones, solo geometría)
bpy.ops.export_scene.fbx(
    filepath=fbx_path,
    use_selection=False,
    add_leaf_bones=False,
    bake_anim=False
)

print(f"✅ Convertido: {glb_path} → {fbx_path}")
```

**Uso:**
```bash
blender --background --python convert_glb_to_fbx.py -- input.glb output.fbx
```

---

## 🎨 PASO 2: Subir a Mixamo y Riggear

### 2.1 Acceder a Mixamo

1. Ir a https://www.mixamo.com
2. Login con Adobe ID (gratis)
3. Click en **"Upload Character"**

### 2.2 Subir Modelo

**Formatos aceptados:**
- FBX (.fbx) ✅ **RECOMENDADO**
- OBJ + texturas en ZIP ✅
- No acepta GLB/GLTF directamente ❌

**Proceso:**
1. Seleccionar archivo FBX del soldado
2. Esperar upload (puede tardar 1-2 min)
3. Mixamo detecta automáticamente joints

### 2.3 Auto-Rigging

**Si el modelo NO tiene rig:**

1. Mixamo muestra interfaz de rigging
2. **Ajustar puntos clave** (lo más importante):
   - Barbilla (chin)
   - Muñecas (wrists)
   - Codos (elbows)
   - Rodillas (knees)
   - Entrepierna (groin)

3. Click **"Next"**
4. Esperar procesamiento (30 segundos - 2 minutos)
5. ✅ Rig automático generado

**Resultado:** Modelo con esqueleto completo de ~65 joints (Mixamo standard rig)

---

## 🏃 PASO 3: Aplicar Animaciones

### 3.1 Animaciones Recomendadas para Infantería

**Esenciales (prioridad ALTA):**

| Animación | Nombre en Mixamo | Uso en MAIRA |
|-----------|------------------|--------------|
| **Parado** | Idle | Cuando unidad seleccionada sin orden |
| **Caminar** | Walking | Movimiento normal 5 km/h |
| **Correr** | Running | Movimiento rápido (futuro) |
| **Disparar Rifle** | Rifle Aiming Idle | Modo ataque |
| **Morir** | Death | Cuando HP = 0 |

**Opcionales (prioridad MEDIA):**

| Animación | Nombre | Uso |
|-----------|--------|-----|
| Crouch Idle | Agachado idle | Posición defensiva |
| Rifle Run | Corriendo con rifle | Movimiento táctico |
| Hit React | Reacción impacto | Cuando recibe daño |
| Aiming | Apuntar | Antes de disparar |

### 3.2 Seleccionar Animación

1. En Mixamo, con modelo cargado, buscar en panel izquierdo
2. Escribir nombre: **"Walking"**
3. Click en animación → Preview en 3D
4. **Ajustar parámetros:**
   - **Overdrive:** 0% (velocidad normal) a 100% (rápido)
   - **Arms Space:** Ajustar posición brazos
   - **Trim:** Recortar inicio/fin si es muy largo

### 3.3 Descargar Animación

**Configuración CRÍTICA para GLB:**

```
Format: FBX for Unity (.fbx)
Frames per second: 30 fps
Skin: ✅ With Skin (incluir geometría)
        o
        ❌ Without Skin (solo animación) - si ya tienes el mesh

Keyframe Reduction: None (mantener calidad)
```

**Para primer modelo:**
- ✅ **With Skin** (incluye geometría + rig + animación)
- Esto crea FBX completo

**Para animaciones adicionales del mismo modelo:**
- ❌ **Without Skin** (solo animación)
- Más liviano, solo clips

**Nombre sugerido:** `soldier_walk.fbx`, `soldier_idle.fbx`, etc.

---

## 🔄 PASO 4: Convertir FBX → GLB con Blender

### 4.1 Script de Conversión Automática

**Script: `convert_mixamo_to_glb.py`**

```python
import bpy
import sys
import os

# Argumentos
fbx_path = sys.argv[-2]  # Entrada FBX
glb_path = sys.argv[-1]  # Salida GLB

print(f"🔄 Convirtiendo: {fbx_path} → {glb_path}")

# Limpiar escena
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Importar FBX de Mixamo
bpy.ops.import_scene.fbx(
    filepath=fbx_path,
    automatic_bone_orientation=True,
    use_anim=True  # Importante: importar animaciones
)

# Verificar animaciones importadas
if bpy.data.actions:
    print(f"✅ Animaciones encontradas: {len(bpy.data.actions)}")
    for action in bpy.data.actions:
        print(f"  - {action.name} ({len(action.fcurves)} canales)")
else:
    print("⚠️ No se encontraron animaciones")

# Exportar GLB
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format='GLB',
    export_animations=True,
    export_skins=True,
    export_all_influences=True,
    export_morph=True,
    export_lights=False,
    export_cameras=False,
    export_apply=False
)

print(f"✅ Conversión completada: {os.path.basename(glb_path)}")

# Información del archivo
size_mb = os.path.getsize(glb_path) / (1024 * 1024)
print(f"📦 Tamaño: {size_mb:.2f} MB")
```

### 4.2 Uso del Script

**Comando:**
```bash
blender --background --python convert_mixamo_to_glb.py -- soldier_walk.fbx soldier_animated.glb
```

**Batch conversion (múltiples animaciones):**
```bash
#!/bin/bash
# convert_all_mixamo.sh

BLENDER="/Applications/Blender.app/Contents/MacOS/Blender"
SCRIPT="convert_mixamo_to_glb.py"
INPUT_DIR="mixamo_fbx"
OUTPUT_DIR="Client/assets/models/gbl_new"

for fbx in $INPUT_DIR/*.fbx; do
    filename=$(basename "$fbx" .fbx)
    output="$OUTPUT_DIR/${filename}_animated.glb"
    
    echo "🔄 Procesando: $filename"
    $BLENDER --background --python $SCRIPT -- "$fbx" "$output"
done

echo "✅ Conversión completada"
```

---

## 🎮 PASO 5: Integrar en THREE.js

### 5.1 Cargar Modelo con Animaciones

**Modificar `test-terrain-from-map.html`:**

```javascript
// Al cargar modelo con GLTFLoader
gltfLoader.load(config.path, (gltf) => {
    const model = gltf.scene;
    
    // 🎬 VERIFICAR ANIMACIONES
    if (gltf.animations && gltf.animations.length > 0) {
        console.log(`🎬 Animaciones disponibles en ${type}:`, 
                    gltf.animations.map(a => a.name));
        
        // Crear AnimationMixer
        const mixer = new THREE.AnimationMixer(model);
        
        // Almacenar animaciones por nombre
        const animations = {};
        gltf.animations.forEach(clip => {
            animations[clip.name] = mixer.clipAction(clip);
        });
        
        // Guardar en userData
        model.userData.mixer = mixer;
        model.userData.animations = animations;
        model.userData.currentAnimation = null;
        
        // Iniciar con idle si existe
        if (animations['Idle'] || animations['idle']) {
            const idleAction = animations['Idle'] || animations['idle'];
            idleAction.play();
            model.userData.currentAnimation = 'Idle';
        }
    } else {
        console.warn(`⚠️ Sin animaciones: ${type}`);
    }
    
    // ... resto del código ...
});
```

### 5.2 Función para Cambiar Animación

```javascript
// Función para transiciones suaves
function setUnitAnimation(unit, animationName, fadeTime = 0.3) {
    if (!unit.userData.animations || !unit.userData.mixer) {
        console.warn('⚠️ Unidad sin sistema de animación');
        return;
    }
    
    const animations = unit.userData.animations;
    const newAnimation = animations[animationName];
    
    if (!newAnimation) {
        console.warn(`⚠️ Animación no encontrada: ${animationName}`);
        return;
    }
    
    // Si ya está corriendo, no hacer nada
    if (unit.userData.currentAnimation === animationName) {
        return;
    }
    
    // Fade out animación anterior
    const oldName = unit.userData.currentAnimation;
    if (oldName && animations[oldName]) {
        animations[oldName].fadeOut(fadeTime);
    }
    
    // Fade in nueva animación
    newAnimation
        .reset()
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(1)
        .fadeIn(fadeTime)
        .play();
    
    unit.userData.currentAnimation = animationName;
    
    console.log(`🎬 ${unit.userData.unitName}: ${oldName} → ${animationName}`);
}
```

### 5.3 Actualizar Loop de Animación

```javascript
// En la función animate() principal
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // ✅ ACTUALIZAR MIXERS DE ANIMACIÓN
    placedUnits.forEach(unit => {
        if (unit.userData.mixer) {
            unit.userData.mixer.update(delta);
        }
    });
    
    // Actualizar movimiento
    updateUnitMovement(delta);
    
    // Renderizar
    renderer.render(scene, camera);
}
```

### 5.4 Integrar con Sistema de Movimiento

```javascript
// Modificar updateUnitMovement()
function updateUnitMovement(delta) {
    placedUnits.forEach(unit => {
        if (unit.userData.isMoving && unit.userData.waypoints) {
            
            // 🎬 Cambiar a animación de caminar
            if (unit.userData.unitType.includes('soldier')) {
                setUnitAnimation(unit, 'Walking');
            }
            
            // ... código de movimiento existente ...
            
        } else {
            // 🎬 Volver a idle cuando para
            if (unit.userData.unitType.includes('soldier')) {
                setUnitAnimation(unit, 'Idle');
            }
        }
    });
}
```

### 5.5 Animación de Muerte

```javascript
// Cuando HP llega a 0
function killUnit(unit) {
    unit.userData.isDead = true;
    unit.userData.isMoving = false;
    
    // 🎬 Reproducir animación de muerte
    if (unit.userData.animations?.Death) {
        setUnitAnimation(unit, 'Death');
        
        // Desactivar loop (death es one-shot)
        unit.userData.animations.Death.setLoop(THREE.LoopOnce);
        unit.userData.animations.Death.clampWhenFinished = true;
        
        // Remover después de animación (opcional)
        setTimeout(() => {
            scene.remove(unit);
            const index = placedUnits.indexOf(unit);
            if (index > -1) placedUnits.splice(index, 1);
        }, 3000); // 3 segundos para ver la muerte
    }
    
    log(`💀 ${unit.userData.unitName} eliminado`);
}
```

---

## 🚗 PASO 6: Animar Vehículos (Sin Mixamo)

### Vehículos NO usan animaciones esqueléticas

**En su lugar:**

### 6.1 Rotación de Torreta (Tanques)

```javascript
// Al cargar TAM
gltfLoader.load('tam_tank.glb', (gltf) => {
    const model = gltf.scene;
    
    // Buscar torreta en jerarquía
    const turret = model.getObjectByName('Turret') ||
                   model.getObjectByName('turret') ||
                   model.children.find(c => 
                       c.name.toLowerCase().includes('turret') ||
                       c.name.toLowerCase().includes('torre')
                   );
    
    if (turret) {
        model.userData.turret = turret;
        console.log('✅ Torreta encontrada:', turret.name);
    } else {
        console.warn('⚠️ Torreta no encontrada - revisar jerarquía');
        // Listar todos los objetos para debugging
        model.traverse(obj => {
            console.log('  -', obj.name, obj.type);
        });
    }
});

// Al atacar
function attackUnit(attacker, target) {
    if (attacker.userData.turret) {
        // Vector hacia objetivo
        const direction = new THREE.Vector3();
        direction.subVectors(target.position, attacker.position);
        direction.y = 0; // Solo rotación horizontal
        direction.normalize();
        
        // Calcular ángulo
        const angle = Math.atan2(direction.x, direction.z);
        
        // Rotar torreta (relativo al chasis)
        const targetRotation = angle - attacker.rotation.y;
        
        // Interpolación suave (slerp)
        attacker.userData.turret.rotation.y = THREE.MathUtils.lerp(
            attacker.userData.turret.rotation.y,
            targetRotation,
            0.05 // Velocidad de rotación
        );
    }
}
```

### 6.2 Rotación de Ruedas (Humvee)

```javascript
// Al cargar Humvee
gltfLoader.load('humvee.glb', (gltf) => {
    const model = gltf.scene;
    
    // Encontrar ruedas
    const wheels = [];
    model.traverse(obj => {
        if (obj.name.toLowerCase().includes('wheel') ||
            obj.name.toLowerCase().includes('tire') ||
            obj.name.toLowerCase().includes('rueda')) {
            wheels.push(obj);
        }
    });
    
    model.userData.wheels = wheels;
    console.log(`✅ Ruedas encontradas: ${wheels.length}`);
});

// En updateUnitMovement()
if (unit.userData.isMoving && unit.userData.wheels) {
    const speedKmH = unit.userData.speed || 5;
    const speedMS = speedKmH * 0.277778;
    
    // Velocidad angular de rueda
    const wheelRadius = 0.35; // metros (ajustar según modelo)
    const angularSpeed = speedMS / wheelRadius; // rad/s
    
    // Rotar ruedas
    unit.userData.wheels.forEach(wheel => {
        wheel.rotation.x += angularSpeed * delta;
    });
}
```

### 6.3 Animación de Orugas (M113)

```javascript
// Para M113 con orugas, usar UV scrolling
gltfLoader.load('m113.glb', (gltf) => {
    const model = gltf.scene;
    
    // Encontrar material de orugas
    model.traverse(obj => {
        if (obj.isMesh && obj.material) {
            if (obj.name.toLowerCase().includes('track')) {
                obj.material.userData.isTrack = true;
                obj.material.userData.uvOffset = 0;
            }
        }
    });
});

// En updateUnitMovement()
if (unit.userData.isMoving) {
    unit.traverse(obj => {
        if (obj.isMesh && obj.material?.userData?.isTrack) {
            const speedMS = (unit.userData.speed || 5) * 0.277778;
            obj.material.userData.uvOffset += speedMS * delta * 0.1;
            
            if (obj.material.map) {
                obj.material.map.offset.y = obj.material.userData.uvOffset;
            }
        }
    });
}
```

---

## 🎨 PASO 7: Solucionar Texturas Grises

### Problema: Modelos sin Texturas

**Causas comunes:**
1. Texturas no embebidas en GLB
2. Rutas de texturas incorrectas
3. Texturas en formato no soportado

### 7.1 Verificar Texturas en GLB

```bash
# Instalar gltf-transform
npm install -g @gltf-transform/cli

# Inspeccionar modelo
npx gltf-transform inspect a_solider_poin_weapon.glb
```

**Salida esperada:**
```
textures: 2
  - BaseColor.png (512x512)
  - Normal.png (512x512)
materials: 1
  - SoldierMat (pbrMetallicRoughness)
```

**Si muestra `textures: 0`** → Texturas no embebidas

### 7.2 Embebed Texturas con Blender

**Script: `embed_textures.py`**

```python
import bpy
import sys
import os

glb_input = sys.argv[-2]
glb_output = sys.argv[-1]

# Limpiar
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Importar
bpy.ops.import_scene.gltf(filepath=glb_input)

# Embebed todas las texturas
for img in bpy.data.images:
    if img.packed_file is None:
        img.pack()
        print(f"✅ Textura embebida: {img.name}")

# Exportar con texturas embebidas
bpy.ops.export_scene.gltf(
    filepath=glb_output,
    export_format='GLB',
    export_image_format='AUTO',  # Mantener formato original
    export_texcoords=True,
    export_normals=True,
    export_materials='EXPORT'
)

print(f"✅ GLB con texturas: {glb_output}")
```

**Uso:**
```bash
blender --background --python embed_textures.py -- input.glb output_with_textures.glb
```

### 7.3 Forzar Carga de Texturas en THREE.js

```javascript
gltfLoader.load(config.path, (gltf) => {
    const model = gltf.scene;
    
    // 🎨 Verificar y forzar texturas
    model.traverse((obj) => {
        if (obj.isMesh) {
            const mat = obj.material;
            
            if (mat) {
                // Asegurar que el material recibe sombras
                mat.side = THREE.DoubleSide;
                mat.needsUpdate = true;
                
                // Si no tiene textura, aplicar color
                if (!mat.map) {
                    console.warn(`⚠️ Sin textura: ${obj.name}`);
                    mat.color.setHex(0x8B7355); // Color caqui militar
                }
                
                // Verificar normal map
                if (mat.normalMap) {
                    console.log(`✅ Normal map: ${obj.name}`);
                }
            }
        }
    });
});
```

---

## 📦 Flujo Completo: Ejemplo Práctico

### Crear Soldado Animado desde Cero

**1. Preparar FBX base:**
```bash
blender --background --python convert_glb_to_fbx.py -- \
    a_solider_poin_weapon.glb \
    soldier_base.fbx
```

**2. Subir a Mixamo:**
- Ir a https://www.mixamo.com
- Upload Character → `soldier_base.fbx`
- Auto-rig (ajustar joints si es necesario)

**3. Descargar animaciones:**
- Buscar "Idle" → Download (FBX, With Skin, 30fps) → `soldier_idle.fbx`
- Buscar "Walking" → Download (Without Skin, 30fps) → `soldier_walk.fbx`
- Buscar "Rifle Aiming Idle" → Download (Without Skin, 30fps) → `soldier_shoot.fbx`
- Buscar "Death" → Download (Without Skin, 30fps) → `soldier_death.fbx`

**4. Combinar animaciones en Blender:**

```python
# combine_animations.py
import bpy

# Limpiar
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Importar base con Idle (With Skin)
bpy.ops.import_scene.fbx(filepath="soldier_idle.fbx")

# Importar otras animaciones (Without Skin)
bpy.ops.import_scene.fbx(filepath="soldier_walk.fbx", use_anim=True)
bpy.ops.import_scene.fbx(filepath="soldier_shoot.fbx", use_anim=True)
bpy.ops.import_scene.fbx(filepath="soldier_death.fbx", use_anim=True)

# Renombrar actions
for action in bpy.data.actions:
    if 'idle' in action.name.lower():
        action.name = 'Idle'
    elif 'walk' in action.name.lower():
        action.name = 'Walking'
    elif 'aim' in action.name.lower() or 'shoot' in action.name.lower():
        action.name = 'Shooting'
    elif 'death' in action.name.lower():
        action.name = 'Death'

# Exportar GLB con todas las animaciones
bpy.ops.export_scene.gltf(
    filepath="soldier_full_animated.glb",
    export_format='GLB',
    export_animations=True
)

print(f"✅ Animaciones combinadas: {len(bpy.data.actions)}")
```

**5. Convertir a GLB:**
```bash
blender --background --python combine_animations.py
```

**6. Verificar resultado:**
```bash
npx gltf-transform inspect soldier_full_animated.glb
```

**Salida esperada:**
```
animations: 4
  - Idle (2.5s, 65 channels)
  - Walking (1.0s, 65 channels)
  - Shooting (3.0s, 65 channels)
  - Death (4.0s, 65 channels)
```

**7. Mover a proyecto:**
```bash
cp soldier_full_animated.glb Client/assets/models/gbl_new/
```

**8. Actualizar path en HTML:**
```javascript
const unitModels = {
    'soldier': {
        path: 'Client/assets/models/gbl_new/soldier_full_animated.glb',
        scale: 0.8,
        yOffset: 0.9,
        name: 'Soldado (Animado)'
    }
};
```

---

## ✅ Checklist de Implementación

### Fase 1: Setup Básico
- [ ] Instalar Blender
- [ ] Crear cuenta en Mixamo
- [ ] Instalar gltf-transform: `npm install -g @gltf-transform/cli`

### Fase 2: Preparar Modelos
- [ ] Convertir GLB → FBX (si es necesario)
- [ ] Verificar pose del modelo (T o A pose ideal)
- [ ] Verificar conteo de polígonos (<10k ideal)

### Fase 3: Mixamo
- [ ] Subir modelo a Mixamo
- [ ] Auto-rig exitoso
- [ ] Descargar Idle (With Skin, 30fps, FBX)
- [ ] Descargar Walking (Without Skin, 30fps, FBX)
- [ ] Descargar Shooting (Without Skin, 30fps, FBX)
- [ ] Descargar Death (Without Skin, 30fps, FBX)

### Fase 4: Conversión
- [ ] Combinar animaciones en Blender
- [ ] Renombrar actions
- [ ] Exportar GLB con animaciones
- [ ] Verificar con gltf-transform

### Fase 5: Integración THREE.js
- [ ] Cargar GLB con GLTFLoader
- [ ] Crear AnimationMixer
- [ ] Implementar setUnitAnimation()
- [ ] Actualizar mixers en animate() loop
- [ ] Integrar con updateUnitMovement()
- [ ] Testing completo

### Fase 6: Vehículos
- [ ] Identificar torretas en tanques
- [ ] Implementar rotación de torretas
- [ ] Rotación de ruedas (opcional)
- [ ] UV scrolling orugas (opcional)

### Fase 7: Texturas
- [ ] Verificar texturas embebidas
- [ ] Embebed texturas si es necesario
- [ ] Verificar carga en THREE.js
- [ ] Fallback a colores si falla

---

## 🚨 Troubleshooting Común

### "Mixamo no acepta mi GLB"
**Solución:** Convertir GLB → FBX primero con Blender

### "Auto-rig falla en Mixamo"
**Causas:**
- Modelo muy complejo (>50k polígonos)
- Geometría no limpia (múltiples meshes)
- Pose incorrecta (no T-pose)

**Solución:** Simplificar modelo en Blender antes de subir

### "Animaciones no se ven en THREE.js"
**Checklist:**
1. ¿GLB tiene animaciones? → `npx gltf-transform inspect model.glb`
2. ¿Mixer se actualiza? → `mixer.update(delta)` en animate()
3. ¿Action está playing? → `action.play()`
4. ¿Console muestra errores? → Revisar nombres de clips

### "Texturas grises"
**Soluciones:**
1. Verificar texturas embebidas: `gltf-transform inspect`
2. Embebed con Blender: `embed_textures.py`
3. Verificar material.map en THREE.js
4. Aplicar color fallback si falla

### "Torreta no rota"
**Checklist:**
1. ¿Existe objeto torreta? → `model.traverse()` para listar
2. ¿Nombre correcto? → Buscar 'turret', 'torre', etc.
3. ¿Pivot correcto? → Debe estar en base de torreta

---

## 📚 Referencias

- **Mixamo:** https://www.mixamo.com
- **THREE.js AnimationMixer:** https://threejs.org/docs/#api/en/animation/AnimationMixer
- **GLTF Transform:** https://gltf-transform.donmccurdy.com
- **Blender Python API:** https://docs.blender.org/api/current/
- **GLTF 2.0 Spec:** https://www.khronos.org/gltf/

---

## 💡 Tips Finales

1. **Empezar simple:** Una animación (Idle o Walking) primero
2. **Testing incremental:** Verificar cada paso antes de continuar
3. **Backup modelos:** Guardar versión sin animar por si acaso
4. **Nombres consistentes:** Usar convención clara (soldier_walk.fbx)
5. **Performance:** Limitar animaciones a <10 por escena simultáneas

---

**Última actualización:** 7 de octubre de 2025  
**Usuario:** Queremos animaciones de Mixamo pero solo acepta FBX  
**Solución:** Pipeline completo FBX → Mixamo → FBX → Blender → GLB
