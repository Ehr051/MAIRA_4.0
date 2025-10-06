# 🎖️ Planificación Sistema Táctico Completo - MAIRA 4.0

## 📅 Fecha: 6 de Octubre 2025

---

## 🎯 Visión del Proyecto

**Objetivo**: Crear un sistema táctico similar a **Steel Beasts** mezclado con **juego de guerra hexagonal** y **Total War Rome III**, con:

- ✅ Mapas 2D hasta cierto zoom
- ✅ Vista 3D para zoom cercano con combate realista
- ✅ Terrenos reales (basados en mapas satelitales)
- ✅ Nivel de detalle táctico (NO rol por rol como Steel Beasts)
- ✅ Aplicación web optimizada (sin nivel de detalle FPS)

---

## 📊 Estado Actual (Implementado)

### ✅ Sistema de Terreno 3D
- [x] Generación desde mapa Leaflet
- [x] Elevaciones TIF reales
- [x] Vegetación por NDVI
- [x] Edificios y caminos
- [x] Sistema de colisiones por densidad

### ✅ Sistema de Combate
- [x] Line of Sight (LOS) esférico 3D
- [x] Restricciones técnicas de cañón (elevación/depresión)
- [x] Consumo de munición realista
- [x] Sistema de daño con armor
- [x] Efectos visuales (disparos, explosiones)

### ✅ Unidades Individuales
- [x] TAM (Tanque Argentino Mediano)
- [x] SK-105 Kürassier
- [x] Soldados (argentinos/rusos)
- [x] Propiedades técnicas completas

### ✅ UI Simplificada
- [x] Botón único "CREAR VISTA 3D"
- [x] Sistema de órdenes (mover, atacar)
- [x] Visualización LOS esférico

---

## 🚀 Próximas Implementaciones

### 1. 📦 Sistema de Modelos GLTF Completo

**Modelos Disponibles** (en `backup_gltf_models/gltf_new/`):
- ✅ TAM (War Thunder version)
- ✅ TAM2C 3D model
- ✅ Humvee
- ✅ M113
- ✅ Ural 4320 (camión)
- ✅ Montana Soldier
- ✅ Russian Soldier
- ✅ Medical Tent
- ✅ Military Tent

**Faltan Modelos** (prioridad alta):
- [ ] Cañones de artillería (155mm Oto Melara)
- [ ] Morteros (60mm, 81mm, 120mm)
- [ ] VCTP (Vehículo de Combate Transporte Personal)
- [ ] VCLC (Vehículo de Combate Lanza Cohetes)
- [ ] Helicópteros (Puma, Huey)
- [ ] Vehículos logísticos

**Acción**:
```javascript
// Actualizar unitModels en test-terrain-from-map.html
const unitModels = {
    // Tanques
    'tam': { path: 'backup_gltf_models/gltf_new/tam_war_thunder/scene.gltf', name: 'TAM', scale: 0.5 },
    'tam2c': { path: 'backup_gltf_models/gltf_new/tam2c_3d_model/scene.gltf', name: 'TAM2C', scale: 0.5 },
    
    // Vehículos blindados
    'm113': { path: 'backup_gltf_models/gltf_new/m113/scene.gltf', name: 'M113', scale: 0.5 },
    'humvee': { path: 'backup_gltf_models/gltf_new/humvee/scene.gltf', name: 'Humvee', scale: 0.5 },
    
    // Camiones
    'ural': { path: 'backup_gltf_models/gltf_new/ural_4320/scene.gltf', name: 'Ural 4320', scale: 0.5 },
    
    // Infantería
    'soldier': { path: 'backup_gltf_models/gltf_new/montana_soldier/scene.gltf', name: 'Soldado', scale: 0.02 },
    'soldier_ru': { path: 'backup_gltf_models/gltf_new/russian_soldier/scene.gltf', name: 'Soldado RU', scale: 0.02 },
    
    // Estructuras
    'tent': { path: 'backup_gltf_models/gltf_new/tent_military/scene.gltf', name: 'Carpa', scale: 0.5 },
    'medical_tent': { path: 'backup_gltf_models/gltf_new/medical_tent/scene.gltf', name: 'Carpa Médica', scale: 0.5 }
};
```

---

### 2. 🎯 Sistema de Alcance de Tiro Inteligente

**Problema Actual**: 
- Unidades se acercan innecesariamente para atacar
- No aprovechan alcance máximo de tiro

**Solución**:
```javascript
function shouldMoveCloserToAttack(attacker, target) {
    const distance = attacker.position.distanceTo(target.position);
    
    // Obtener alcance máximo desde military_data.json
    const weapon = getWeaponData(attacker.userData.weapons[0]);
    const maxRange = weapon.alcance_maximo; // en metros
    const effectiveRange = weapon.alcance_efectivo;
    
    // Si está dentro del alcance efectivo, NO moverse
    if (distance <= effectiveRange) {
        return false;
    }
    
    // Si está fuera del alcance máximo, acercarse al alcance efectivo
    if (distance > maxRange) {
        return true;
    }
    
    // Si está entre efectivo y máximo, puede disparar pero con menos precisión
    return false;
}

function calculateOptimalAttackPosition(attacker, target) {
    const weapon = getWeaponData(attacker.userData.weapons[0]);
    const effectiveRange = weapon.alcance_efectivo;
    
    // Posicionarse al 80% del alcance efectivo
    const optimalDistance = effectiveRange * 0.8;
    
    const direction = target.position.clone().sub(attacker.position).normalize();
    const optimalPosition = target.position.clone().sub(direction.multiplyScalar(optimalDistance));
    
    return optimalPosition;
}
```

**Datos de `military_data.json`**:
```json
{
  "armamento": [
    {
      "nombre": "SK 105",
      "alcance_efectivo": "1500",
      "alcance_maximo": "2000"
    },
    {
      "nombre": "TAM",
      "alcance_efectivo": "2500",
      "alcance_maximo": "3000"
    },
    {
      "nombre": "Mortero 120 mm",
      "alcance_efectivo": "4000",
      "alcance_maximo": "7000"
    }
  ]
}
```

---

### 3. 🎖️ Sistema de Secciones/Grupos (Milsymbols → 3D)

**Arquitectura Organizacional** (de `database/backup_mysql_original.sql`):

#### Estructura Jerárquica
```
Unidad (Regimiento)
├── Subunidad (Escuadrón/Compañía)
│   ├── Sección
│   │   ├── Grupo
│   │   │   └── Equipo
```

#### Ejemplo: Sección de Tanques TAM
**Composición** (según DB):
- **Sección de Tanques (TAM)** (id: 82)
  - 3x Grupos de Tanque TAM (id: 81)
    - 1x TAM por grupo
    - Jefe de Tanque (id: 25)
    - Apuntador (id: 23)
    - Cargador (id: 24)
    - Conductor (id: 22)

**Implementación**:
```javascript
class MilitarySection {
    constructor(sectionData) {
        this.id = sectionData.id;
        this.sidc = sectionData.sidc; // Milsymbol SIDC
        this.type = sectionData.tipo; // 'Sección'
        this.specialty = sectionData.especialidad; // 'Caballería Blindada'
        this.units = []; // Array de vehículos 3D
        this.formation = 'line'; // 'line', 'column', 'wedge', 'dispersed'
        this.deployed = false;
    }
    
    // Generar vehículos individuales según composición
    generateUnits() {
        // Ejemplo: Sección de 3 TAM
        const spacing = this.deployed ? 50 : 100; // metros entre vehículos
        
        for (let i = 0; i < 3; i++) {
            const offset = this.calculateFormationOffset(i, spacing);
            const unit = this.createTAMUnit(offset);
            this.units.push(unit);
        }
    }
    
    // Calcular posición según formación
    calculateFormationOffset(index, spacing) {
        switch (this.formation) {
            case 'line':
                return new THREE.Vector3(index * spacing, 0, 0);
            case 'column':
                return new THREE.Vector3(0, 0, index * spacing);
            case 'wedge':
                const side = index % 2 === 0 ? 1 : -1;
                return new THREE.Vector3(side * spacing/2, 0, Math.floor(index/2) * spacing);
            case 'dispersed':
                return new THREE.Vector3(
                    (Math.random() - 0.5) * spacing * 2,
                    0,
                    (Math.random() - 0.5) * spacing * 2
                );
        }
    }
    
    // Órdenes de sección (todos se mueven juntos)
    moveSection(targetPosition) {
        const centerOffset = this.calculateCenter();
        
        this.units.forEach((unit, index) => {
            const offset = this.calculateFormationOffset(index, 
                this.deployed ? 50 : 100);
            const finalPos = targetPosition.clone().add(offset).sub(centerOffset);
            unit.moveTo(finalPos);
        });
    }
    
    // Desplegar (órdenes individuales por vehículo)
    deploy() {
        this.deployed = true;
        this.formation = 'dispersed';
        log(`📍 Sección desplegada - órdenes individuales habilitadas`, 'info');
    }
    
    // Reagrupar (volver a órdenes de sección)
    regroup() {
        this.deployed = false;
        this.formation = 'line';
        log(`🔄 Sección reagrupada - órdenes de sección`, 'info');
    }
}
```

**Menu Radial**:
```javascript
function showSectionContextMenu(section) {
    const options = [
        { label: '➡️ MOVER', action: () => setSectionMoveMode(section) },
        { label: '🎯 ATACAR', action: () => setSectionAttackMode(section) },
        { label: '📍 DESPLEGAR', action: () => section.deploy() },
        { label: '🔄 REAGRUPAR', action: () => section.regroup() },
        { label: '📐 FORMACIÓN', submenu: [
            { label: 'Línea', action: () => section.setFormation('line') },
            { label: 'Columna', action: () => section.setFormation('column') },
            { label: 'Cuña', action: () => section.setFormation('wedge') },
            { label: 'Dispersa', action: () => section.setFormation('dispersed') }
        ]}
    ];
    
    displayRadialMenu(options);
}
```

**Adaptación a Terreno**:
```javascript
function adaptFormationToTerrain(section, targetPosition) {
    const terrain = analyzeTerrainAtPosition(targetPosition, 100); // radio 100m
    
    if (terrain.forestDensity > 0.7) {
        // Bosque denso: columna en camino
        section.setFormation('column');
        section.spacing = 30; // Más apretados
        log('🌳 Formación adaptada a bosque denso: COLUMNA', 'info');
    } else if (terrain.openArea > 0.8) {
        // Zona abierta: línea o dispersa
        section.setFormation(section.deployed ? 'dispersed' : 'line');
        section.spacing = 100;
        log('🏜️ Formación adaptada a zona abierta: LÍNEA', 'info');
    } else if (terrain.hasRoad) {
        // Camino disponible: columna
        section.setFormation('column');
        section.followRoad = true;
        log('🛣️ Formación adaptada a camino: COLUMNA', 'info');
    }
}
```

---

### 4. 🎨 Integración Milsymbols → 3D

**Flujo de Trabajo**:
```
1. Usuario coloca Milsymbol en mapa 2D
   ↓
2. Sistema lee SIDC (ej: "SFGPUCI-----")
   ↓
3. Busca en DB composición de esa unidad
   ↓
4. Genera múltiples modelos 3D según composición
   ↓
5. Vista 3D muestra todos los vehículos individuales
```

**Ejemplo Real**:
```javascript
// Usuario coloca "Sección de Tanques TAM" en mapa 2D
const milsymbol = {
    sidc: "SFGPUCIT----", // Tanque, Sección
    position: { lat: -34.5430, lng: -58.6871 },
    designation: "Sección A/Esc 1"
};

// Sistema convierte a 3D
function milsymbolTo3D(milsymbol) {
    // 1. Buscar en unidades DB
    const unitData = findUnitByDescriptor({
        tipo: 'Sección',
        especialidad: 'Caballería Blindada',
        subtipo: 'Tanques'
    });
    
    // 2. Obtener composición
    const composition = getUnitComposition(unitData.id); // 3x TAM
    
    // 3. Crear sección 3D
    const section = new MilitarySection(unitData);
    section.position = convertLatLngTo3D(milsymbol.position);
    section.generateUnits(); // Crea 3 TAM con espaciado
    
    // 4. Agregar a escena
    addSectionToScene(section);
    
    return section;
}
```

**Prueba de Renderización MCC**:
```javascript
// Medidas de Coordinación y Control (MCC)
const mccSymbols = [
    { type: 'point', sidc: 'GFGPGLP-----', label: 'Posición de Bloqueo' },
    { type: 'line', sidc: 'GFGPGLF-----', label: 'Frente' },
    { type: 'area', sidc: 'GFGPGLA-----', label: 'Área de Reunión' }
];

function renderMCCin3D(mcc) {
    switch (mcc.type) {
        case 'point':
            // Marcador 3D con cono/cilindro
            const marker = new THREE.Mesh(
                new THREE.ConeGeometry(5, 10, 8),
                new THREE.MeshBasicMaterial({ color: 0xff0000 })
            );
            marker.position.copy(mcc.position3D);
            marker.position.y = 15; // Altura visible
            scene.add(marker);
            break;
            
        case 'line':
            // ExtrudeGeometry para líneas 3D
            const points = mcc.points.map(p => new THREE.Vector3(p.x, 0.5, p.z));
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(
                geometry,
                new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 5 })
            );
            scene.add(line);
            break;
            
        case 'area':
            // ShapeGeometry para áreas
            const shape = new THREE.Shape();
            mcc.points.forEach((p, i) => {
                if (i === 0) shape.moveTo(p.x, p.z);
                else shape.lineTo(p.x, p.z);
            });
            shape.closePath();
            
            const areaMesh = new THREE.Mesh(
                new THREE.ShapeGeometry(shape),
                new THREE.MeshBasicMaterial({ 
                    color: 0xff0000, 
                    transparent: true, 
                    opacity: 0.3,
                    side: THREE.DoubleSide
                })
            );
            areaMesh.rotation.x = -Math.PI / 2;
            areaMesh.position.y = 0.2;
            scene.add(areaMesh);
            break;
    }
}
```

---

### 5. 🔧 Integración con Sistema Completo MAIRA

**Sincronización con gestorJuego.js**:
```javascript
// En Client/js/modules/juego/gestorJuego.js
class GestorJuego {
    constructor() {
        this.terrain3D = null;
        this.units2D = []; // Milsymbols en mapa 2D
        this.sections3D = []; // Secciones en vista 3D
        this.currentView = '2D'; // '2D' o '3D'
        this.zoomLevel = 10;
    }
    
    // Cambio automático 2D ↔ 3D según zoom
    onZoomChange(newZoom) {
        if (newZoom >= 17 && this.currentView === '2D') {
            this.switchTo3DView();
        } else if (newZoom < 17 && this.currentView === '3D') {
            this.switchTo2DView();
        }
    }
    
    switchTo3DView() {
        this.currentView = '3D';
        
        // Generar terreno 3D
        this.terrain3D = generateTerrainFromMap();
        
        // Convertir milsymbols 2D → secciones 3D
        this.units2D.forEach(unit => {
            const section = milsymbolTo3D(unit);
            this.sections3D.push(section);
        });
        
        // Mostrar vista 3D pantalla completa
        showFullscreen3DView();
    }
    
    switchTo2DView() {
        this.currentView = '2D';
        
        // Actualizar posiciones 2D desde 3D
        this.sections3D.forEach(section => {
            const unit2D = this.units2D.find(u => u.id === section.id);
            unit2D.position = convert3DToLatLng(section.position);
        });
        
        // Volver a mapa 2D
        hide3DView();
    }
    
    // Sistema de turnos
    onTurnEnd() {
        // Actualizar posiciones
        this.syncPositions();
        
        // Calcular fog of war
        this.updateFogOfWar();
        
        // Cambiar jugador activo
        this.switchActivePlayer();
    }
}
```

---

## 📈 Cronograma de Implementación

### Sprint 1 (1 semana)
- [ ] Integrar todos los modelos GLTF disponibles
- [ ] Sistema de alcance de tiro inteligente
- [ ] Cargar datos de `military_data.json` en tiempo real

### Sprint 2 (2 semanas)
- [ ] Sistema de secciones básico (3 tanques juntos)
- [ ] Formaciones simples (línea, columna)
- [ ] Órdenes de sección (mover todos juntos)

### Sprint 3 (1 semana)
- [ ] Menu radial para secciones
- [ ] Desplegar/Reagrupar
- [ ] Adaptación automática a terreno

### Sprint 4 (2 semanas)
- [ ] Integración Milsymbols → 3D
- [ ] Renderización MCC en 3D
- [ ] Pruebas completas

### Sprint 5 (2 semanas)
- [ ] Integración con gestorJuego.js
- [ ] Sistema de turnos 3D
- [ ] Cambio automático 2D ↔ 3D por zoom

---

## 🎯 Prioridades Inmediatas (Próximo Commit)

### ✅ Completado en este commit
1. Sistema de colisiones por densidad de árboles
2. UI simplificada con botón único
3. Elevaciones TIF reales en LOS
4. LOS esférico 3D (no solo círculo 2D)
5. Restricciones técnicas de cañón (`military_technical_specs.json`)

### 🔜 Próximo commit
1. Integrar modelos GLTF faltantes (Humvee, M113, Ural)
2. Sistema de alcance de tiro inteligente
3. Cargar datos de `military_data.json` en UI

---

## 📚 Recursos y Referencias

### Datos Existentes
- ✅ `Client/data/military_data.json` - Armamento, municiones, vehículos
- ✅ `Client/data/military_technical_specs.json` - Restricciones técnicas cañón
- ✅ `database/backup_mysql_original.sql` - Estructura organizacional completa
- ✅ `backup_gltf_models/gltf_new/` - Modelos 3D disponibles

### Tablas DB Clave
- `unidades` - Estructura jerárquica (Equipo → Grupo → Sección → Subunidad → Unidad)
- `roles_combate` - 60 roles diferentes con descripciones
- `armamento` - 30+ tipos de armas con datos técnicos
- `elementos_gb` - Elementos colocados en juegos (milsymbols)

### Sistemas a Integrar
- Milsymbols (SIDC codes) → Iconos 2D
- THREE.js → Modelos 3D
- Leaflet → Mapa base
- Socket.io → Multijugador
- gestorJuego.js → Lógica de juego

---

## 🎖️ Créditos

**Desarrollado para**: Ejército Argentino - Sistema MAIRA 4.0
**Inspiración**: Steel Beasts Pro PE, Total War Rome III, Command: Modern Operations
**Tecnologías**: THREE.js, Leaflet, Node.js, PostgreSQL

---

## 📝 Notas Finales

Este plan establece la ruta hacia un sistema táctico completo que combina:
- **Realismo táctico** (Steel Beasts)
- **Jugabilidad estratégica** (Total War)
- **Escalabilidad web** (optimizado para navegador)
- **Datos reales argentinos** (terrenos, unidades, doctrina)

El sistema está diseñado para permitir simulaciones tácticas realistas sin llegar al nivel de FPS individual, manteniendo un balance entre detalle y performance web.
