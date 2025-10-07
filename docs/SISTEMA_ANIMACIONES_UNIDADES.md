# Sistema de Animaciones para Unidades 3D

## 🎬 Estado Actual

### Lo que Funciona ✅
- ✅ Movimiento suave de posición (interpolación lineal)
- ✅ Rotación hacia objetivo (`unit.lookAt(target)`)
- ✅ Velocidades realistas (5 km/h infantería, 65 km/h tanques)

### Lo que Falta ⚠️
- ❌ Animaciones esqueléticas (walking, running, shooting)
- ❌ Rotación de torretas independiente del chasis (tanques)
- ❌ Animación de retroceso al disparar
- ❌ Animación de muerte/destrucción
- ❌ Estados de animación (idle, alerta, combate)

## 🎯 Problema Identificado

**Usuario dice:** *"un soldado de infanteria marcha a 4km por hora... tienen una ametralladora o un rifle.. la animacion no deberia ser igual que la del tanque.. jaja"*

**Análisis:**
- Soldado y TAM usan el mismo sistema: solo `unit.lookAt(target)`
- No hay animación de caminar para infantería
- No hay rotación de torreta para tanques
- Todos los modelos se comportan como "estatuas deslizantes"

## 🔧 Velocidades Correctas (Ya Implementadas)

```javascript
// Infantería
model.userData.speed = 5; // km/h → 1.39 m/s (marcha normal)

// Tanques
model.userData.speed = 65; // km/h → 18.06 m/s (velocidad crucero)

// Conversión automática en updateUnitMovement():
const speedMS = speedKmH * 0.277778; // km/h → m/s
const speed = speedMS * delta; // m/frame a 60fps
```

**Referencia Real:**
- Infantería marcha: 4-5 km/h ✅
- Infantería corriendo: 10-12 km/h
- TAM velocidad máxima: 75 km/h
- TAM velocidad crucero: 50-65 km/h ✅

## 🎨 Soluciones de Animación

### Opción 1: Usar Animaciones del Modelo GLB (Recomendado)

**Si los modelos tienen animaciones integradas:**

```javascript
// Al cargar modelo GLTF
gltfLoader.load(config.path, (gltf) => {
    const model = gltf.scene;
    
    // 🎬 Verificar si tiene animaciones
    if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        
        // Encontrar clips de animación
        const walkClip = THREE.AnimationClip.findByName(gltf.animations, 'walk');
        const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'idle');
        const shootClip = THREE.AnimationClip.findByName(gltf.animations, 'shoot');
        
        // Crear acciones
        model.userData.animations = {
            mixer: mixer,
            idle: idleClip ? mixer.clipAction(idleClip) : null,
            walk: walkClip ? mixer.clipAction(walkClip) : null,
            shoot: shootClip ? mixer.clipAction(shootClip) : null
        };
        
        // Iniciar con idle
        if (model.userData.animations.idle) {
            model.userData.animations.idle.play();
        }
        
        console.log(`✅ Animaciones cargadas: ${gltf.animations.map(a => a.name).join(', ')}`);
    }
    
    // ... resto del código ...
});

// En animate() loop:
function animate() {
    const delta = clock.getDelta();
    
    // Actualizar mixers de animación
    placedUnits.forEach(unit => {
        if (unit.userData.animations?.mixer) {
            unit.userData.animations.mixer.update(delta);
        }
    });
    
    updateUnitMovement(delta);
    // ...
}

// En updateUnitMovement():
if (unit.userData.isMoving) {
    // Cambiar a animación de caminar
    if (unit.userData.animations) {
        if (unit.userData.animations.walk && !unit.userData.animations.walk.isRunning()) {
            unit.userData.animations.idle?.stop();
            unit.userData.animations.walk?.play();
        }
    }
    
    // ... mover unidad ...
} else {
    // Volver a idle
    if (unit.userData.animations) {
        if (unit.userData.animations.idle && !unit.userData.animations.idle.isRunning()) {
            unit.userData.animations.walk?.stop();
            unit.userData.animations.idle?.play();
        }
    }
}
```

**Nombres comunes de animaciones:**
- `Idle`, `idle`, `Armature|Idle`
- `Walk`, `walk`, `Walking`, `Armature|Walk`
- `Run`, `run`, `Running`
- `Shoot`, `shoot`, `Fire`
- `Death`, `death`, `Die`

### Opción 2: Animación Procedural (Si no hay clips)

**Para tanques - Rotación de torreta:**

```javascript
// Al cargar tanque, identificar torreta
gltfLoader.load(config.path, (gltf) => {
    const model = gltf.scene;
    
    // Buscar torreta (nombres comunes)
    let turret = model.getObjectByName('Turret') ||
                 model.getObjectByName('turret') ||
                 model.getObjectByName('Torre') ||
                 model.children.find(c => c.name.toLowerCase().includes('turret'));
    
    if (turret) {
        model.userData.turret = turret;
        console.log('✅ Torreta encontrada');
    }
    
    // ... resto del código ...
});

// En attackUnit():
function attackUnit(attacker, target) {
    // Si es tanque, rotar torreta hacia objetivo
    if (attacker.userData.turret) {
        // Mantener Y de torreta, solo rotar en Y hacia objetivo
        const direction = new THREE.Vector3();
        direction.subVectors(target.position, attacker.position);
        direction.y = 0;
        direction.normalize();
        
        const angle = Math.atan2(direction.x, direction.z);
        attacker.userData.turret.rotation.y = angle - attacker.rotation.y;
    }
    
    // ... resto del ataque ...
}
```

**Para infantería - Bounce simple:**

```javascript
// Simular caminata con bounce vertical
if (unit.userData.isMoving && unit.userData.unitType.includes('soldier')) {
    // Bounce sinusoidal
    const bounceSpeed = 4; // Hz
    const bounceHeight = 0.05; // metros
    
    const bounce = Math.sin(Date.now() * 0.001 * bounceSpeed * Math.PI * 2) * bounceHeight;
    unit.position.y = baseHeight + bounce;
}
```

### Opción 3: Mixamo Animations (Importar)

**Si necesitas animaciones de calidad:**

1. Subir modelo a Mixamo (https://www.mixamo.com)
2. Aplicar animaciones (Walking, Running, Idle, Shooting)
3. Descargar FBX con animaciones
4. Convertir FBX → GLB con Blender
5. Usar Opción 1

**Script Blender para convertir:**
```python
import bpy
import sys
import os

# Obtener argumentos
fbx_path = sys.argv[-2]
glb_path = sys.argv[-1]

# Limpiar escena
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Importar FBX
bpy.ops.import_scene.fbx(filepath=fbx_path)

# Exportar GLB
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format='GLB',
    export_animations=True
)

print(f"✅ Convertido: {fbx_path} → {glb_path}")
```

## 📝 Plan de Implementación

### Fase 1: Verificar Modelos Actuales ✅
```bash
# Listar animaciones en GLB
cd Client/assets/models/gbl_new/

# Usar gltf-transform para inspeccionar
npx gltf-transform inspect a_solider_poin_weapon.glb
npx gltf-transform inspect russian_soldier.glb
npx gltf-transform inspect tam_tank.glb
```

**Resultado esperado:**
```
animations: [
  { name: 'Idle', duration: 2.5s, channels: 45 },
  { name: 'Walk', duration: 1.0s, channels: 45 }
]
```

### Fase 2: Implementar AnimationMixer
- [ ] Agregar `THREE.Clock` para delta time
- [ ] Cargar y almacenar AnimationMixer por unidad
- [ ] Transiciones entre estados (idle ↔ walk ↔ shoot)

### Fase 3: Estados de Animación
```javascript
const AnimationStates = {
    IDLE: 'idle',
    WALKING: 'walking',
    RUNNING: 'running',
    SHOOTING: 'shooting',
    DEAD: 'dead'
};

model.userData.animationState = AnimationStates.IDLE;

function setAnimationState(unit, newState) {
    if (unit.userData.animationState === newState) return;
    
    const anims = unit.userData.animations;
    if (!anims) return;
    
    // Fade out estado anterior
    const oldClip = anims[unit.userData.animationState];
    if (oldClip) oldClip.fadeOut(0.2);
    
    // Fade in nuevo estado
    const newClip = anims[newState];
    if (newClip) {
        newClip.reset().fadeIn(0.2).play();
    }
    
    unit.userData.animationState = newState;
}
```

### Fase 4: Rotación de Torretas (Tanques)
- [ ] Identificar torreta en jerarquía del modelo
- [ ] Rotar independiente del chasis
- [ ] Animación suave (slerp) hacia objetivo

### Fase 5: Efectos Adicionales
- [ ] Retroceso al disparar
- [ ] Sacudida de cámara
- [ ] Polvo/humo al moverse
- [ ] Explosión al destruir

## 🎮 Modelos que Necesitan Animaciones

### Prioridad ALTA
- [ ] `a_solider_poin_weapon.glb` - Infantería argentina
  - Necesita: idle, walk, shoot
- [ ] `russian_soldier.glb` - Infantería rusa
  - Necesita: idle, walk, shoot
- [ ] `fsb_operator.glb` - Operador FSB
  - Necesita: idle, walk, shoot

### Prioridad MEDIA
- [ ] `tam_tank.glb` - TAM
  - Necesita: identificar torreta para rotación
- [ ] `humvee.glb` - Humvee
  - Necesita: rotación de ruedas (opcional)
- [ ] `m113.glb` - M113
  - Necesita: rotación de orugas (opcional)

## 🚀 Comandos Útiles

```bash
# Verificar animaciones en GLB
npx gltf-transform inspect modelo.glb

# Optimizar GLB
npx gltf-transform optimize modelo.glb modelo_optimizado.glb

# Convertir FBX → GLB
blender --background --python convert_fbx.py -- input.fbx output.glb

# Ver estructura jerárquica
npx gltf-transform inspect --format md modelo.glb > estructura.md
```

## 📚 Referencias

- **THREE.js AnimationMixer**: https://threejs.org/docs/#api/en/animation/AnimationMixer
- **GLTF Animations**: https://www.khronos.org/gltf/
- **Mixamo**: https://www.mixamo.com (animaciones gratis)
- **gltf-transform**: https://gltf-transform.donmccurdy.com

## 💡 Notas

**Usuario Original:**
> "un soldado de infanteria marcha a 4km por hora. esta bien que sea lento.. ahora.. tienen una ametralladora o un rifle.. la animacion no deberia ser igual que la del tanque.. jaja. pero igual esta piola."

**Respuesta:**
- ✅ Velocidad 5 km/h es correcta (4-5 km/h marcha real)
- ✅ Conversión km/h → m/s implementada correctamente
- ⚠️ Falta: Animaciones esqueléticas para diferenciar infantería de vehículos
- 🎯 Próximo paso: Verificar si modelos GLB tienen clips de animación integrados

---

**Última actualización:** 6 de octubre de 2025  
**Estado:** Documentación - Animaciones pendientes  
**Prioridad:** ALTA para infantería, MEDIA para vehículos
