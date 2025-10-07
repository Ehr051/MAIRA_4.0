# 📦 Inventario de Modelos 3D Necesarios - MAIRA 4.0

## 📅 Fecha: 6 de Octubre 2025

---

## 🎯 Análisis del Menú "Agregar Elemento" de Planeamiento

Este documento cataloga **TODOS** los elementos del menú de planeamiento que necesitarán modelos 3D para la vista táctica.

---

## ✅ MODELOS YA DISPONIBLES (en backup_gltf_models/gltf_new/)

### Vehículos Blindados
- ✅ **TAM** (tam_war_thunder/scene.gltf)
- ✅ **TAM2C** (tam2c_3d_model/scene.gltf)
- ✅ **M113** (m113/scene.gltf)
- ✅ **Humvee** (humvee/scene.gltf)
- ✅ **Ural 4320** (ural_4320/scene.gltf) - Camión logístico

### Infantería
- ✅ **Soldado Argentino** (montana_soldier/scene.gltf)
- ✅ **Soldado Ruso** (russian_soldier/scene.gltf)

### Estructuras
- ✅ **Carpa Militar** (tent_military/scene.gltf)
- ✅ **Carpa Médica** (medical_tent/scene.gltf)

### Vegetación
- ✅ **Árbol Alto** (arbol_alto.glb)
- ✅ **Árbol Simple** (arbol.glb)
- ✅ **Árboles Low-Poly** (trees_low.glb)
- ✅ **Oak Animado** (AnimatedOak.glb)
- ✅ **Arbusto** (arbusto.glb)
- ✅ **Césped** (simple_grass_chunks.glb)

---

## ❌ MODELOS FALTANTES (PRIORIDAD CRÍTICA)

### 🔫 **1. INFANTERÍA - ARMAMENTO**
**Prioridad:** ALTA (armas estacionarias)

- [ ] **FAL** (Fusil Automático Liviano) - SIDC: SFGPEWR---
- [ ] **FAP** (Fusil Automático Pesado) - SIDC: SFGPEWRR--
- [ ] **Ametralladora Pesada** - SIDC: SFGPEWRL--
- [ ] **Arma Antiaérea** - SIDC: SFGPEWA---
- [ ] **Ametralladora Pesada Antiaérea** - SIDC: SFGPEWAM--
- [ ] **Cañón Antitanque** - SIDC: SFGPEWD---
- [ ] **Arma Antitanque Corto Alcance** (AT4/RPG) - SIDC: SFGPEWG---
- [ ] **Arma Antitanque Largo Alcance** - SIDC: SFGPEWGM--
- [ ] **Lanzacohetes** - SIDC: SFGPEWM---

**Modelos Sugeridos:**
- Infantería con arma en posición de combate
- Trípode de ametralladora con operador
- AT4 sobre hombro de soldado
- RPG-7 con operador

---

### 🎖️ **2. MORTEROS**
**Prioridad:** ALTA (apoyo de fuego fundamental)

- [ ] **Mortero Liviano** (60mm) - SIDC: SFGPEWO---
- [ ] **Mortero Mediano** (81mm) - SIDC: SFGPEWOM--
- [ ] **Mortero Pesado** (120mm) - SIDC: SFGPEWOH--

**Características del Modelo:**
- Tubo del mortero con placa base
- Trípode ajustable
- Operadores (2-3 soldados)
- Munición apilada cerca

**Referencias Técnicas:**
```
Mortero 60mm: Altura 0.6m, Peso 18kg
Mortero 81mm: Altura 1.2m, Peso 35kg
Mortero 120mm: Altura 1.8m, Peso 230kg
```

---

### 🚜 **3. CABALLERÍA - VEHÍCULOS BLINDADOS**
**Prioridad:** MEDIA (complementa TAM/M113 existentes)

- [ ] **SK-105 Kürassier** - Cazacarros ligero austríaco (usado por Argentina)
- [ ] **Vehículo Blindado a Rueda** (Genérico) - SIDC: SFGPEVAI--
- [ ] **Vehículo de Exploración** - SIDC: SFGPEVATH-

**Características:**
- Torreta con cañón 105mm (SK-105)
- Ruedas 8×8 o 6×6
- Perfil bajo para reconocimiento

---

### 🎯 **4. ARTILLERÍA DE CAMPAÑA**
**Prioridad:** ALTA (apoyo de fuego crítico)

#### Obuses:
- [ ] **Obús Liviano 105mm** - SIDC: SFGPEWH---
- [ ] **Obús Mediano 155mm** (Oto Melara) - SIDC: SFGPEWHM--
- [ ] **Obús Pesado 240mm** - SIDC: SFGPEWHH--

#### Cañones:
- [ ] **Cañón Liviano** - SIDC: SFGPEWD---
- [ ] **Cañón Mediano** - SIDC: SFGPEWDL--
- [ ] **Cañón Pesado** - SIDC: SFGPEWDM--
- [ ] **Cañón Autopropulsado** - SIDC: SFGPEWDLS-

**Características del Modelo:**
- Tubo del cañón con elevación ajustable
- Plataforma de disparo (trail)
- Escudos de protección
- Munición cerca del cañón
- Operadores (5-7 soldados)

**Referencias Técnicas:**
```
Oto Melara 155mm:
- Calibre: 155mm L/33
- Alcance: 18-24km
- Elevación: -5° a +70°
- Peso: 5.5 toneladas
- Tripulación: 7 soldados
```

---

### 🛡️ **5. ARTILLERÍA ANTIAÉREA**
**Prioridad:** MEDIA

- [ ] **Cañón Antiaéreo** - SIDC: SFGPEWA---
- [ ] **Proyectil Autopropulsado Superficie-Aire** (SAM) - SIDC: SFGPEWAL--

**Modelos Sugeridos:**
- Cañón Oerlikon 35mm (usado por Argentina)
- Lanzador Roland SAM

---

### 🔧 **6. INGENIEROS - VEHÍCULOS Y EQUIPOS**
**Prioridad:** MEDIA-ALTA (variedad de funciones)

#### Vehículos de Combate:
- [ ] **Vehículo Lanzapuentes** - SIDC: SFGPEVEB--
- [ ] **Vehículo de Ingenieros** - SIDC: SFGPEVE---
- [ ] **Vehículo de Apertura de Brecha** - SIDC: SFGPEVC---
- [ ] **Vehículo de Desminado** - SIDC: SFGPEVUL--
- [ ] **Vehículo de Movilidad** - SIDC: SFGPEVM---

#### Maquinaria Pesada:
- [ ] **Bulldozer** - SIDC: SFGPEVUB--
- [ ] **Excavadora** - SIDC: SFGPEVUE--
- [ ] **Cargador Frontal** - SIDC: SFGPEVUL--
- [ ] **Grúa** - SIDC: SFGPEVUX--
- [ ] **Volquete** - SIDC: SFGPEVUT--
- [ ] **Rodillo** - SIDC: SFGPEVUR--
- [ ] **Camión Cisterna** - SIDC: SFGPEVUT--

**Modelos Sugeridos:**
- Caterpillar D9 (bulldozer militar)
- Excavadora sobre orugas
- Grúa móvil militar
- Camión Mercedes-Benz 1114 (usado por Argentina)

---

### 🏗️ **7. INGENIEROS - INFRAESTRUCTURA**
**Prioridad:** BAJA (pueden usar geometría procedural)

- [ ] **Puente Militar** - SIDC: GFMPBCB---
- [ ] **Vado** - SIDC: GFMPBCF---
- [ ] **Fortificación** - SIDC: GFMPSF----
- [ ] **Muro Defensivo** - SIDC: GFMPSE----
- [ ] **Obstáculo** - SIDC: GFMPOB----
- [ ] **Mina Antitanque** - SIDC: GFMPOMD---
- [ ] **Mina Antipersonal** - SIDC: GFMPOME---

**Notas:**
- Pueden renderizarse con geometría THREE.js simple
- Puente: ExtrudeGeometry
- Muro: BoxGeometry + repetición
- Minas: SphereGeometry + marcador

---

### 📡 **8. COMUNICACIONES**
**Prioridad:** BAJA (mayoría son símbolos abstractos)

- [ ] **Antena de Radio** - SIDC: SFG-UCRR--
- [ ] **Repetidor de Radio** - SIDC: SFG-UCRRT-
- [ ] **Torre de Comunicaciones** - SIDC: SFGPUCPX--
- [ ] **Vehículo de Comunicaciones** - SIDC: SFGPUCM---

**Modelos Sugeridos:**
- Antena whip simple
- Torre de radio con trípode
- Humvee con antenas (variante del modelo existente)

---

### 🚑 **9. SANIDAD**
**Prioridad:** MEDIA

- [ ] **Ambulancia** (Iveco Daily 4×4) - SIDC: EFOPAE----
- [ ] **Hospital Quirófano Móvil** - SIDC: SFGPUSMM--

**Modelos Sugeridos:**
- Ambulancia 4×4 con cruz roja
- Carpa grande de cirugía (2x el tamaño de medical_tent)

---

### 📦 **10. LOGÍSTICA - TRANSPORTE Y ABASTECIMIENTO**
**Prioridad:** MEDIA-ALTA

#### Vehículos de Carga:
- [ ] **Camión de Carga** (Mercedes-Benz 1114)
- [ ] **Semirremolque** (para transporte pesado)
- [ ] **Camión Cisterna de Combustible**
- [ ] **Camión Frigorífico** (alimentos Clase I)

#### Instalaciones:
- [ ] **Depósito de Munición** - SIDC: GFSPPSZ---
- [ ] **Depósito de Combustible** - SIDC: GFSPPSC---
- [ ] **Área de Abastecimiento** - SIDC: GFSPPSA---

**Modelos Sugeridos:**
- Contenedor ISO 20' (reutilizable para múltiples usos)
- Tanque de combustible de 10,000 litros
- Pallet de munición cubierto con lona

---

### 🚁 **11. AVIACIÓN**
**Prioridad:** BAJA (fuera del alcance inicial)

- [ ] **Helicóptero Puma** (usado por Argentina)
- [ ] **Helicóptero Huey UH-1H**
- [ ] **Helicóptero de Ataque** (opcional)

**Notas:**
- Modelos muy complejos
- Pueden representarse con símbolos 2D inicialmente
- Implementar después del sistema terrestre completo

---

### 🎖️ **12. SÍMBOLOS ABSTRACTOS (NO REQUIEREN MODELO 3D)**

Los siguientes elementos se representan mejor con geometría THREE.js procedural:

#### Áreas (ShapeGeometry + transparencia):
- ✅ Área de Operaciones
- ✅ Zona de Reunión
- ✅ Área de Fuego Restringido (AFR)
- ✅ Área de NO Fuego (ANF)
- ✅ Objetivo
- ✅ Zona de Demoliciones

#### Líneas (LineGeometry + estilo):
- ✅ Límites entre elementos
- ✅ Línea de Coordinación (LLA, LCAF, LCSF)
- ✅ Línea de Contacto
- ✅ Línea de Partida para el Ataque
- ✅ Dirección de Ataque (flecha)
- ✅ Eje de Avance (flecha ancha)
- ✅ Barrera de Fuegos
- ✅ Grupo de Fuegos

#### Puntos (ConeGeometry o SphereGeometry):
- ✅ Punto de Control (PC)
- ✅ Punto Inicial (PI)
- ✅ Punto Terminal (PT)
- ✅ Bloqueo
- ✅ Puesto Comando
- ✅ Observador Adelantado

---

## 📊 RESUMEN DE PRIORIDADES

### 🔴 **PRIORIDAD CRÍTICA** (Implementar YA):
1. **Morteros** (60mm, 81mm, 120mm) - 3 modelos
2. **Obús 155mm Oto Melara** - 1 modelo
3. **SK-105 Kürassier** - 1 modelo
4. **Bulldozer / Excavadora** - 2 modelos
5. **Ambulancia** - 1 modelo

**Total:** 8 modelos críticos

---

### 🟠 **PRIORIDAD ALTA** (Próximo Sprint):
1. Armamento Infantería (FAL, FAP, AT4, Ametralladora) - 4 modelos
2. Obuses Liviano/Pesado (105mm, 240mm) - 2 modelos
3. Camión de Carga Mercedes-Benz 1114 - 1 modelo
4. Contenedor ISO 20' - 1 modelo
5. Vehículo Blindado a Rueda - 1 modelo

**Total:** 9 modelos

---

### 🟡 **PRIORIDAD MEDIA** (Sprint 3-4):
1. Cañones Antiaéreos - 2 modelos
2. Maquinaria Pesada (Grúa, Volquete, Cisterna) - 3 modelos
3. Vehículos de Ingenieros especiales - 3 modelos
4. Hospital Quirófano Móvil - 1 modelo

**Total:** 9 modelos

---

### 🟢 **PRIORIDAD BAJA** (Futuro):
1. Aviación (Helicópteros) - 3 modelos
2. Infraestructura especializada - variable
3. Comunicaciones (antenas, torres) - 2 modelos

**Total:** 5+ modelos

---

## 🎨 ESTRATEGIA DE OBTENCIÓN DE MODELOS

### Opción 1: Descargar de Repositorios Gratuitos
**Fuentes:**
- **Sketchfab** (filtro "CC0" o "CC BY")
- **TurboSquid Free** (modelos low-poly)
- **Free3D**
- **CGTrader Free**
- **Poly Haven** (equipamiento genérico)

**Búsquedas Recomendadas:**
- "military mortar"
- "howitzer artillery"
- "bulldozer military"
- "mercedes truck"
- "iso container"

---

### Opción 2: Convertir GLTF Existentes a GLB
**Herramienta:** `gltf-pipeline`
```bash
npm install -g gltf-pipeline
gltf-pipeline -i model.gltf -o model.glb
```

**Ventajas:**
- Archivo único (.glb) vs múltiples (.gltf + .bin + texturas)
- Menor tamaño de descarga
- Carga más rápida en THREE.js

---

### Opción 3: Crear Modelos Procedurales (THREE.js)
**Para elementos simples:**
```javascript
// Mortero 120mm procedural
function createMortar120mm() {
    const group = new THREE.Group();
    
    // Tubo
    const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    tube.rotation.x = Math.PI / 4; // 45° elevación
    
    // Placa base
    const plate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    
    // Trípode
    const leg1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 1.0),
        new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    leg1.position.set(0.3, -0.5, 0);
    leg1.rotation.z = Math.PI / 6;
    
    // ... legs 2 y 3
    
    group.add(tube, plate, leg1, leg2, leg3);
    return group;
}
```

**Ventajas:**
- No requiere descargas
- Totalmente personalizable
- Rendimiento óptimo (low-poly garantizado)

**Desventajas:**
- Menos realismo visual
- Requiere más código

---

## 🚀 PLAN DE ACCIÓN INMEDIATO

### Sprint Actual (Semana 1):
1. ✅ Buscar y descargar **8 modelos críticos** de Sketchfab
2. ✅ Convertir GLTF → GLB si es necesario
3. ✅ Integrar en `GLTFModelLoader.js`
4. ✅ Agregar a botones UI en `test-terrain-from-map.html`
5. ✅ Testear carga y escalado

### Sprint 2 (Semana 2):
1. Implementar **9 modelos prioridad alta**
2. Crear sistema de categorías en UI (dropdown)
3. Implementar búsqueda por tipo de unidad

### Sprint 3 (Semana 3-4):
1. Modelos procedurales para elementos simples
2. Sistema de LOD (Level of Detail) para optimización
3. Integración completa con milsymbols → 3D

---

## 📝 NOTAS FINALES

**Total de Modelos Necesarios:** ~40 modelos únicos

**Distribución:**
- 8 modelos CRÍTICOS (ahora)
- 9 modelos ALTA prioridad (Sprint 2)
- 9 modelos MEDIA prioridad (Sprint 3-4)
- 5+ modelos BAJA prioridad (futuro)
- ~10 elementos con geometría procedural

**Estrategia Recomendada:**
1. Descargar 8 modelos críticos ahora (2 horas)
2. Implementar sistema de carga modular (4 horas)
3. Crear fallbacks procedurales para modelos faltantes (2 horas)
4. Iteración continua según feedback de usuario

**Objetivo:** Sistema funcional con modelos críticos en 48 horas.

---

**Creado:** 6 de Octubre 2025
**Autor:** Análisis MAIRA 4.0
**Revisión:** v1.0
