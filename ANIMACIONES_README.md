# 🎬 Guía Rápida: Animaciones Mixamo para MAIRA

## 🎯 Resumen del Problema

**Situación actual:**
- ✅ Tenemos modelos GLB sin animaciones
- ✅ Velocidades correctas (5 km/h infantería, 65-90 km/h vehículos)
- ❌ Todos los modelos se mueven igual (como "estatuas deslizantes")
- ❌ Mixamo solo acepta FBX, no GLB
- ⚠️ Algunos modelos sin texturas (se ven grises)

**Solución:**
```
GLB → FBX → Mixamo (rig + anims) → FBX → GLB animado → THREE.js
```

---

## 📋 Paso a Paso Ultra-Rápido

### 1️⃣ Preparar modelos para Mixamo (5 minutos)

```bash
# Ejecutar script automático
./prepare_for_mixamo.sh
```

**Esto convierte:**
- `a_solider_poin_weapon.glb` → `soldier_argentine.fbx`
- `russian_soldier.glb` → `soldier_russian.fbx`
- `fsb_operator.glb` → `soldier_fsb.fbx`

**Archivos FBX listos en:** `mixamo_ready/`

---

### 2️⃣ Subir a Mixamo y descargar animaciones (10 minutos)

**Para CADA soldado:**

1. **Ir a:** https://www.mixamo.com
2. **Login** con Adobe ID (gratis)
3. **Upload Character** → seleccionar FBX
4. **Auto-rig** → ajustar joints si es necesario → Next
5. **Descargar animaciones:**

| Orden | Animación | Configuración | Filename sugerido |
|-------|-----------|---------------|-------------------|
| 1º | **Idle** | FBX, **With Skin**, 30fps | `soldier_argentine_idle.fbx` |
| 2º | **Walking** | FBX, **Without Skin**, 30fps | `soldier_argentine_walk.fbx` |
| 3º | **Rifle Aiming Idle** | FBX, **Without Skin**, 30fps | `soldier_argentine_shoot.fbx` |
| 4º | **Death** | FBX, **Without Skin**, 30fps | `soldier_argentine_death.fbx` |

**⚠️ IMPORTANTE:**
- Primera animación: **With Skin** (incluye geometría)
- Resto: **Without Skin** (solo animación)

**Guardar archivos en:** `mixamo_animations/`

---

### 3️⃣ Convertir FBX animados a GLB (2 minutos)

```bash
# Ejecutar script automático
./convert_mixamo_animations.sh
```

**Esto genera:**
- `soldier_argentine_animated.glb`
- `soldier_russian_animated.glb`
- `soldier_fsb_animated.glb`

**Ubicación:** `Client/assets/models/gbl_new/`

---

### 4️⃣ Verificar animaciones (1 minuto)

```bash
# Instalar gltf-transform (solo una vez)
npm install -g @gltf-transform/cli

# Verificar animaciones
npx gltf-transform inspect Client/assets/models/gbl_new/soldier_argentine_animated.glb
```

**Salida esperada:**
```
animations: 4
  - Idle (2.5s)
  - Walking (1.0s)
  - Shooting (3.0s)
  - Death (4.0s)
```

---

### 5️⃣ Integrar en THREE.js (ya hecho parcialmente)

El código base ya está preparado en `test-terrain-from-map.html`, solo necesitas:

**Actualizar paths de modelos:**

```javascript
const unitModels = {
    'soldier': {
        path: 'Client/assets/models/gbl_new/soldier_argentine_animated.glb', // ⬅️ Cambiar esto
        scale: 0.8,
        yOffset: 0.9,
        name: 'Soldado Animado'
    }
    // ... resto igual
};
```

**El sistema de animaciones ya incluye:**
- ✅ AnimationMixer automático al cargar GLB
- ✅ Detección de animaciones disponibles
- ✅ Transiciones suaves entre estados
- ✅ Actualización en loop de animación
- ✅ Cambio a "Walking" al moverse
- ✅ Vuelta a "Idle" al detenerse

---

## 🚗 Animaciones de Vehículos (Sin Mixamo)

**Los vehículos NO usan animaciones esqueléticas**, en su lugar:

### Rotación de Torreta (TAM)

Ya está implementado en el código, solo necesita que el modelo tenga un objeto llamado "turret" o "torre" en su jerarquía.

**Verificar jerarquía del modelo:**

```javascript
// En consola del navegador después de cargar TAM
placedUnits.forEach(unit => {
    if (unit.userData.unitType === 'tam') {
        console.log('Jerarquía TAM:');
        unit.traverse(obj => {
            console.log(`  - ${obj.name} (${obj.type})`);
        });
    }
});
```

**Si no encuentra torreta:** Necesitas editar el modelo en Blender para nombrar la torreta correctamente.

### Rotación de Ruedas (Humvee, M113)

Implementación pendiente, ver `docs/SISTEMA_ANIMACIONES_UNIDADES.md` sección 6.2 y 6.3.

---

## 🎨 Solucionar Texturas Grises

### Problema: Modelos sin texturas

**Verificar texturas:**

```bash
npx gltf-transform inspect modelo.glb
```

**Si muestra `textures: 0`:**

**Opción 1: Embebed texturas con Blender**

```python
# Script ya creado: embed_textures.py
blender --background --python embed_textures.py -- input.glb output_with_textures.glb
```

**Opción 2: Aplicar color en THREE.js** (temporal)

```javascript
// En carga de modelo
model.traverse(obj => {
    if (obj.isMesh && !obj.material.map) {
        obj.material.color.setHex(0x8B7355); // Color caqui militar
    }
});
```

---

## 📁 Estructura de Archivos

```
MAIRA-4.0/
├── prepare_for_mixamo.sh          ← Script 1: GLB → FBX
├── convert_mixamo_animations.sh   ← Script 2: FBX → GLB animado
├── convert_glb_to_fbx.py          ← Blender script (GLB → FBX)
├── convert_mixamo_to_glb.py       ← Blender script (FBX → GLB)
│
├── mixamo_ready/                  ← Salida script 1 (FBX para Mixamo)
│   ├── soldier_argentine.fbx
│   ├── soldier_russian.fbx
│   └── soldier_fsb.fbx
│
├── mixamo_animations/             ← Animaciones descargadas de Mixamo
│   ├── soldier_argentine_idle.fbx      (With Skin)
│   ├── soldier_argentine_walk.fbx      (Without Skin)
│   ├── soldier_argentine_shoot.fbx     (Without Skin)
│   ├── soldier_argentine_death.fbx     (Without Skin)
│   ├── soldier_russian_idle.fbx
│   └── ...
│
└── Client/assets/models/gbl_new/  ← Salida script 2 (GLB para THREE.js)
    ├── soldier_argentine_animated.glb  ✅ Listo para usar
    ├── soldier_russian_animated.glb    ✅ Listo para usar
    └── soldier_fsb_animated.glb        ✅ Listo para usar
```

---

## ✅ Checklist Completo

### Preparación (5 min)
- [ ] Verificar Blender instalado: `/Applications/Blender.app/`
- [ ] Crear cuenta en Mixamo: https://www.mixamo.com
- [ ] Instalar gltf-transform: `npm install -g @gltf-transform/cli`

### Conversión GLB → FBX (5 min)
- [ ] Ejecutar `./prepare_for_mixamo.sh`
- [ ] Verificar FBX en `mixamo_ready/`
- [ ] 3 archivos FBX creados correctamente

### Mixamo (10 min por soldado)
- [ ] **Soldado Argentino:**
  - [ ] Upload `soldier_argentine.fbx` → Auto-rig
  - [ ] Descargar Idle (With Skin, 30fps)
  - [ ] Descargar Walking (Without Skin, 30fps)
  - [ ] Descargar Rifle Aiming Idle (Without Skin, 30fps)
  - [ ] Descargar Death (Without Skin, 30fps)
- [ ] **Soldado Ruso:** (repetir proceso)
- [ ] **FSB Operator:** (repetir proceso)
- [ ] Todos los FBX en `mixamo_animations/`

### Conversión FBX → GLB (2 min)
- [ ] Ejecutar `./convert_mixamo_animations.sh`
- [ ] Verificar GLB en `Client/assets/models/gbl_new/`
- [ ] Verificar animaciones: `npx gltf-transform inspect ...`

### Integración THREE.js (5 min)
- [ ] Actualizar paths en `unitModels`
- [ ] Testing: Colocar soldado y ver animación Idle
- [ ] Testing: Dar orden de mover → ver animación Walking
- [ ] Testing: Atacar → ver animación Shooting
- [ ] Testing: Morir → ver animación Death

### Vehículos (pendiente)
- [ ] Verificar jerarquía TAM (buscar torreta)
- [ ] Implementar rotación ruedas Humvee
- [ ] Implementar scroll UV orugas M113

### Texturas (si es necesario)
- [ ] Verificar texturas embebidas
- [ ] Embebed con Blender si falta
- [ ] Aplicar colores fallback en THREE.js

---

## 🚀 Comandos Rápidos

```bash
# 1. Preparar para Mixamo
./prepare_for_mixamo.sh

# 2. Después de descargar de Mixamo
./convert_mixamo_animations.sh

# 3. Verificar resultado
npx gltf-transform inspect Client/assets/models/gbl_new/soldier_argentine_animated.glb

# 4. Ver jerarquía del modelo
npx gltf-transform inspect --format md modelo.glb > estructura.md

# 5. Verificar texturas
npx gltf-transform inspect modelo.glb | grep textures

# 6. Testing
# Iniciar servidor y abrir: http://127.0.0.1:5000/test-terrain-from-map.html
```

---

## 🐛 Troubleshooting

### "Blender no encontrado"
**Solución:** Ajustar ruta en scripts:
```bash
BLENDER="/Applications/Blender.app/Contents/MacOS/Blender"
```

### "Mixamo auto-rig falla"
**Causas:**
- Modelo muy complejo (>50k polígonos)
- Pose incorrecta (no T-pose)

**Solución:** Simplificar modelo en Blender

### "Animaciones no se ven en THREE.js"
**Checklist:**
1. ✅ GLB tiene animaciones: `gltf-transform inspect`
2. ✅ Mixer se actualiza: `mixer.update(delta)` en loop
3. ✅ Action está playing: `action.play()`
4. ✅ Path correcto en unitModels

### "Modelo se ve gris"
**Solución 1:** Embebed texturas
```bash
blender --background --python embed_textures.py -- input.glb output.glb
```

**Solución 2:** Color fallback en THREE.js
```javascript
obj.material.color.setHex(0x8B7355);
```

---

## 📚 Documentación Completa

- **Guía detallada:** `docs/GUIA_ANIMACIONES_MIXAMO.md` (20 páginas)
- **Sistema animaciones:** `docs/SISTEMA_ANIMACIONES_UNIDADES.md`
- **Integración 2D-3D:** `docs/INTEGRACION_2D_3D_MARCADORES.md`

---

## 🎮 Estado Actual del Sistema

✅ **Funcionando:**
- Movimiento con velocidades correctas
- Sistema de órdenes consecutivas
- Menú radial
- Ver alcance
- 6 tipos de unidades

⏳ **En Progreso:**
- Animaciones de infantería (esta guía)

❌ **Pendiente:**
- Rotación torretas vehículos
- Rotación ruedas
- Integración 2D-3D marcadores

---

**Última actualización:** 7 de octubre de 2025  
**Creado para:** Implementar animaciones Mixamo en MAIRA 3D  
**Tiempo estimado total:** 30-45 minutos por soldado
