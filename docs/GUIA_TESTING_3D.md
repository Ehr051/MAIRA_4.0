# 🧪 Guía de Testing - Sistema 3D MAIRA 4.0

## 📋 Testing Fase 1: Texturas + Árboles (CRÍTICO)

### 🎯 Objetivo
Verificar que las correcciones de texturas sRGB y yOffset -150% funcionan correctamente.

---

## 🚀 Pasos de Testing

### 1️⃣ **Abrir Aplicación**

```
URL: http://127.0.0.1:5000/test-terrain-from-map.html
```

**Verificar:**
- ✅ Página carga sin errores
- ✅ Mapa Leaflet visible (panel izquierdo)
- ✅ Canvas 3D visible (panel derecho)

---

### 2️⃣ **Generar Terreno con Vegetación**

**Acciones:**
1. En el mapa Leaflet (izquierda), hacer click en algún lugar
2. Se dibuja un rectángulo rojo (área de selección)
3. Click en botón **"🌍 Generar Terreno 3D"**
4. Esperar generación (puede tardar 10-30 segundos)

**Verificar:**
- ✅ Terreno 3D se genera en canvas derecho
- ✅ Árboles aparecen en el terreno
- ✅ **CRÍTICO: Árboles TOCAN el suelo** (no flotan ~4m)
- ✅ Árboles tienen **color verde** (no gris)

**Console Logs Esperados:**
```javascript
✅ BaseColor texture encontrada para tree_tall.glb
✅ Normal map encontrado
```

**Si ves:**
```javascript
⚠️ Sin textura - Color fallback aplicado
```
→ Es normal si el modelo no tiene textura, pero debe verse **verde** (#2d5016)

---

### 3️⃣ **Colocar FSB Operator**

**Acciones:**
1. En sidebar izquierdo, sección **"Agregar Unidades 3D"**
2. Seleccionar tipo: **"FSB Operator"**
3. Hacer click en el terreno 3D para colocar

**Verificar:**
- ✅ Modelo aparece en el terreno
- ✅ **CRÍTICO: Se ve el CUERPO COMPLETO** (no solo arma + chaleco)
- ✅ **CRÍTICO: Texturas visibles** (uniforme táctico, no gris uniforme)
- ✅ Nivel de detalle (botas, casco, chaleco, guantes)

**Console Logs Esperados:**
```javascript
✅ Textura aplicada a Object_2
✅ Textura aplicada a Object_4
✅ Textura aplicada a Object_6
```

**Colores Esperados:**
- **Si tiene texturas:** Uniforme verde/marrón militar realista
- **Si NO tiene texturas (fallback):** Verde militar (#4a5a3c)

---

### 4️⃣ **Colocar Otras Unidades**

**Probar con:**
- Russian Soldier
- Montana Soldier
- TAM
- Humvee
- M113

**Verificar para CADA unidad:**
- ✅ Modelo completo visible (no solo partes)
- ✅ Texturas aplicadas (no gris)
- ✅ Nivel de detalle correcto
- ✅ Colores fallback correctos si no hay textura:
  - Soldados: Verde militar (#4a5a3c)
  - TAM: Gris tanque (#5a5a5a)
  - Vehículos: Marrón (#6b5a4a)

---

### 5️⃣ **Verificar Console Logs Completos**

**Abrir DevTools (F12) → Console**

**Buscar:**
```javascript
// ✅ ÉXITO (texturas funcionan):
✅ BaseColor texture encontrada para fsb_operator.glb
✅ Normal map encontrado
✅ Textura aplicada a Object_2

// ⚠️ FALLBACK (sin textura pero funcional):
⚠️ Sin textura para Object_0 - Color fallback aplicado
```

**NO debe aparecer:**
```javascript
❌ Error loading texture
❌ Texture not found
❌ Material is undefined
```

---

### 6️⃣ **Testing Funcionalidades Existentes**

**Selección de Unidades:**
- ✅ Click en unidad → se selecciona
- ✅ Aparece **anillo verde** (amigo) o **rojo** (enemigo) bajo la unidad
- ✅ Highlight visual

**Menú Radial:**
- ✅ Click derecho en unidad → menú radial aparece
- ✅ **Iconos Font Awesome visibles** (NO cuadrados vacíos)
- ✅ Opciones: Move, Attack, Defend, etc.

**Cámara:**
- ✅ Scroll: Zoom in/out
- ✅ Click derecho + drag: Rotar cámara
- ✅ Click medio + drag: Pan (desplazar)

**Órdenes:**
- ✅ Dar orden Move → unidad se mueve
- ✅ Animación de movimiento (si está implementada)
- ✅ Velocidad correcta (5 km/h infantería, 65 km/h TAM)

---

## 📊 Checklist de Resultados

### ✅ **TODO FUNCIONA** (Continuar a Fase 2)
- Árboles tocan suelo
- FSB Operator completo con texturas
- Todas las unidades visibles correctamente
- Menú radial con iconos
- Console logs: `✅ BaseColor texture encontrada`

→ **Acción:** Continuar con **Tarea 3: Preparar animaciones Mixamo**

---

### ⚠️ **PROBLEMAS MENORES** (Fallback OK)
- Árboles tocan suelo ✅
- FSB visible completo ✅
- Texturas grises PERO con color fallback correcto ✅
- Console logs: `⚠️ Sin textura - Color fallback`

→ **Acción:** Opcional ejecutar conversión GLTF→GLB para mejorar texturas

---

### ❌ **PROBLEMAS CRÍTICOS** (Ejecutar Tarea 2)
- Árboles siguen flotando ~4m
- FSB solo se ve arma + chaleco (incompleto)
- Todo gris sin colores fallback
- Console logs: Errores de carga

→ **Acción:** EJECUTAR `./convert_all_gltf_to_glb.sh` inmediatamente

---

## 🔄 Si Testing Falla: Conversión GLTF→GLB

### Script Automático

```bash
cd MAIRA-4.0
./convert_all_gltf_to_glb.sh
```

**Qué hace:**
1. Busca todos los `.gltf` en `backup_gltf_models/`
2. Convierte cada uno a `.glb` con `gltf-transform`
3. Guarda en `Client/assets/models/gbl_new/`
4. Verifica contenido (meshes, materiales, texturas)

**Tiempo estimado:** 5-10 minutos (16 modelos)

### Verificar Conversión Individual

```bash
npx gltf-transform inspect Client/assets/models/gbl_new/fsb_operator.glb
```

**Buscar:**
```
MESHES: X meshes
MATERIALS: X materiales
TEXTURES: X texturas embebidas
  - baseColorTexture: 4096x4096
```

---

## 📸 Screenshots de Referencia

### ✅ **Correcto:**
- Árboles con base tocando terreno
- FSB con uniforme completo visible
- Texturas realistas o colores fallback apropiados

### ❌ **Incorrecto:**
- Árboles flotando en el aire
- FSB solo arma + chaleco visible
- Todo gris uniforme sin textura ni fallback

---

## 🐛 Troubleshooting

### Problema: "Árboles siguen flotando"

**Solución:**
1. Abrir `Client/js/services/TerrainGenerator3D.js`
2. Línea 827: Verificar `yOffset = -(modelHeight * treeScale) * 1.5`
3. Si sigue flotando, aumentar a `1.8` o `2.0`
4. Guardar y recargar página

### Problema: "FSB incompleto"

**Causa:** Meshes no se combinan o falta textura
**Solución:**
1. Verificar `BufferGeometryUtils.js` existe
2. Console log: Buscar "Combinando X geometrías"
3. Si no aparece: ejecutar conversión GLTF→GLB

### Problema: "Todo gris sin colores fallback"

**Causa:** Código de texturas no se ejecuta
**Solución:**
1. Verificar commit `6bb6a111` aplicado
2. Buscar en `VegetationInstancer.js` línea 122: `material.needsUpdate = true`
3. Buscar en `test-terrain-from-map.html` línea 1990: `model.traverse`
4. Si falta: re-aplicar cambios

### Problema: "Menú radial sin iconos"

**Causa:** Font Awesome no cargado
**Solución:**
1. Verificar en `<head>`: `font-awesome/6.4.0/css/all.min.css`
2. Commit `2a47ac1b` debe estar aplicado
3. Recargar página con Ctrl+Shift+R (hard reload)

---

## 📞 Reportar Resultados

**Formato:**
```
Testing Fase 1: [ÉXITO/PROBLEMAS]

Árboles:
- ¿Tocan suelo? [SÍ/NO]
- ¿Color verde? [SÍ/NO]

FSB Operator:
- ¿Completo visible? [SÍ/NO]
- ¿Texturas aplicadas? [SÍ/NO/FALLBACK]

Console Logs:
- [Copiar logs relevantes]

Screenshots:
- [Opcional: adjuntar]

Conclusión:
- [Continuar / Ejecutar conversión / Buscar modelos nuevos]
```

---

## 🎯 Próximos Pasos Según Resultado

### ✅ Si TODO funciona
→ **Tarea 3:** Preparar modelos para animaciones Mixamo

### ⚠️ Si funciona con fallback
→ **Opcional:** Conversión GLTF→GLB para mejorar texturas
→ **Continuar:** Animaciones Mixamo

### ❌ Si falla crítico
→ **Tarea 2:** Conversión GLTF→GLB obligatoria
→ **O buscar:** Descargar modelos correctos (Sketchfab, Poly Haven)

---

**Última actualización:** 7 de octubre de 2025  
**Versión:** 1.0  
**Relacionado:** CORRECCION_TEXTURAS_ELEVACION.md, SISTEMA_COMBATE_3D_COMPLETO.md
