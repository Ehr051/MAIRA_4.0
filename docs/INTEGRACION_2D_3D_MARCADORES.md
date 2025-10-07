# Integración Sistema 2D-3D con Marcadores SIDC

## 📋 Resumen

Este documento describe cómo integrar el sistema de marcadores SIDC 2D (`simbolosP.js`) con el sistema 3D de combate táctico (`test-terrain-from-map.html`).

## 🎯 Objetivos de Integración

### 1. Sincronización Bidireccional
- **3D → 2D**: Cuando una unidad 3D se mueve, actualizar su marcador SIDC en el mapa Leaflet
- **2D → 3D**: Cuando se coloca/mueve un marcador SIDC, reflejarlo en la vista 3D

### 2. Coherencia de Datos
- Misma unidad representada en ambos sistemas
- Mismo SIDC, nombre, propiedades
- Estado sincronizado (HP, munición, etc.)

## 🔧 Sistema Actual

### Sistema de Marcadores 2D (`simbolosP.js`)

**Función Principal:**
```javascript
window.agregarMarcador = function(sidc, nombre) {
    // 1. Validación modo y permisos
    // 2. Handler para click en mapa
    // 3. Validación zona despliegue
    // 4. Configuración SIDC y símbolo (ms.Symbol)
    // 5. Crear L.marker con propiedades:
    const marcador = L.marker(latlng, {
        icon: L.divIcon({
            html: sym.asSVG(),
            className: 'custom-div-icon',
            iconSize: [70, 50],
            iconAnchor: [35, 25]
        }),
        draggable: true,
        sidc: sidcFormateado,
        nombre: nombre,
        jugador: window.userId,
        equipo: window.equipoJugador,
        id: uniqueId,
        estado: 'operativo'
    });
}
```

**Propiedades del Marcador:**
- `sidc`: Código SIDC (15 caracteres)
- `nombre`: Nombre de la unidad
- `jugador`: ID del propietario
- `equipo`: 'azul' o 'rojo'
- `id`: ID único
- `estado`: 'operativo', 'dañado', 'destruido'
- `latlng`: Posición geográfica

### Sistema 3D Actual (`test-terrain-from-map.html`)

**Propiedades de Unidad 3D:**
```javascript
model.userData = {
    unitType: 'tam',           // Tipo: 'tam', 'soldier', etc.
    unitName: 'TAM (Tanque)',  // Nombre display
    currentHealth: 100,
    maxHealth: 100,
    currentAmmo: 30,
    maxAmmo: 30,
    armor: 50,
    speed: 5,
    isMoving: false,
    waypoints: [],
    order: null
};
```

**Posición 3D:**
- `unit.position`: THREE.Vector3 (x, y, z en metros)
- Necesita convertir a LatLng para 2D

## 🔗 Estrategia de Integración

### Opción 1: Agregar Referencias Cruzadas (Recomendado)

#### En el Sistema 3D:
```javascript
// Al crear unidad 3D, agregar referencia al marcador 2D
model.userData.marcador2D = marcadorLeaflet;
model.userData.sidc = 'SFG-UCI----D----'; // SIDC estándar
```

#### En el Sistema 2D:
```javascript
// Al crear marcador, agregar referencia a objeto 3D
marcador.options.object3D = model3D;
```

#### Sincronización 3D → 2D:
```javascript
function updateUnitMovement(delta) {
    placedUnits.forEach(unit => {
        if (unit.userData.isMoving) {
            // ... mover unidad 3D ...
            unit.position.copy(nextPos);
            
            // ✅ SINCRONIZAR con marcador 2D
            if (unit.userData.marcador2D) {
                const latlng = convert3DToLatLng(unit.position);
                unit.userData.marcador2D.setLatLng(latlng);
            }
        }
    });
}
```

#### Funciones de Conversión:
```javascript
/**
 * Convertir posición 3D (metros desde centro terreno) a LatLng
 */
function convert3DToLatLng(position3D) {
    // Necesita:
    // - terrainCenterLat, terrainCenterLon (centro del terreno 3D)
    // - terrainSize (tamaño en metros)
    
    const metersPerDegree = 111320; // Aprox en ecuador
    
    const latOffset = position3D.z / metersPerDegree;
    const lonOffset = position3D.x / (metersPerDegree * Math.cos(terrainCenterLat * Math.PI / 180));
    
    return L.latLng(
        terrainCenterLat + latOffset,
        terrainCenterLon + lonOffset
    );
}

/**
 * Convertir LatLng a posición 3D (metros)
 */
function convertLatLngTo3D(latlng) {
    const metersPerDegree = 111320;
    
    const latDiff = latlng.lat - terrainCenterLat;
    const lonDiff = latlng.lng - terrainCenterLon;
    
    const x = lonDiff * metersPerDegree * Math.cos(terrainCenterLat * Math.PI / 180);
    const z = latDiff * metersPerDegree;
    
    // Y (altura) se calcula con raycasting al terreno
    const y = getTerrainHeightAt(x, z);
    
    return new THREE.Vector3(x, y, z);
}
```

### Opción 2: Sistema de ID Compartido

```javascript
// Crear ID único compartido
const sharedId = `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// En 3D:
model.userData.sharedId = sharedId;

// En 2D:
marcador.options.sharedId = sharedId;

// Lookup tables
const units3DById = new Map(); // sharedId → THREE.Object3D
const markers2DById = new Map(); // sharedId → L.Marker
```

## 📝 Plan de Implementación

### Fase 1: Preparación (No Modificar Aún)
- [x] Documentar sistema actual
- [ ] Decidir estrategia (Opción 1 recomendada)
- [ ] Definir mapping SIDC ↔ unitType

### Fase 2: Variables Globales Compartidas
```javascript
// Variables necesarias en ambos sistemas:
let terrainCenterLat = null;
let terrainCenterLon = null;
let terrainSize = 1500; // metros
```

### Fase 3: Funciones de Conversión
- [ ] Implementar `convert3DToLatLng()`
- [ ] Implementar `convertLatLngTo3D()`
- [ ] Implementar `getTerrainHeightAt(x, z)`

### Fase 4: Sincronización 3D → 2D
- [ ] Modificar `updateUnitMovement()` para actualizar marcadores
- [ ] Agregar eventos para creación/destrucción de unidades

### Fase 5: Sincronización 2D → 3D
- [ ] Hook en eventos drag de marcadores Leaflet
- [ ] Actualizar posición 3D cuando marcador se mueve

### Fase 6: Integración Completa
- [ ] Sistema unificado de creación de unidades
- [ ] UI para elegir entre vista 2D/3D/ambas
- [ ] Sincronización de estado (HP, munición)

## 🎨 Mapping SIDC ↔ Tipos 3D

```javascript
const SIDC_TO_3D_TYPE = {
    // Tanques
    'SFG-UCI----D----': 'tam',        // TAM argentino
    'SFG-UCIZ---D----': 'tam2c',      // TAM 2C
    
    // Infantería
    'SFG-UCI----D----': 'soldier',    // Infantería genérica
    'SHG-UCI----D----': 'soldier_ru', // Infantería rusa
    
    // Vehículos
    'SFG-UCWV---D----': 'humvee',     // Humvee
    'SFG-UCAA---D----': 'm113',       // M113 APC
    
    // Artillería
    'SFG-UCFH---D----': 'artillery',  // Obús
    'SFG-UCFM---D----': 'mortar'      // Mortero
};

const TYPE_3D_TO_SIDC = Object.fromEntries(
    Object.entries(SIDC_TO_3D_TYPE).map(([k, v]) => [v, k])
);
```

## 🚨 Consideraciones Importantes

### Performance
- Sincronizar solo unidades visibles en viewport
- Throttle de actualizaciones (max 30fps para marcadores)
- Batch updates cuando múltiples unidades se mueven

### Escalabilidad
- Usar spatial indexing para búsquedas rápidas
- Lazy loading de marcadores fuera de viewport
- Pool de objetos para evitar GC

### Compatibilidad
- **NO modificar** `simbolosP.js` hasta coordinación completa
- Mantener compatibilidad con módulos existentes:
  - `planeamiento.html`
  - `juegodeguerra.html`
  - `gestionbatalla.html`

## 📞 Puntos de Coordinación

Antes de implementar, coordinar:

1. **Variables globales compartidas**
   - ¿Dónde almacenar `terrainCenterLat/Lon`?
   - ¿Usar `window.` o módulo ES6?

2. **Eventos de sincronización**
   - ¿Usar CustomEvents?
   - ¿Implementar EventEmitter?

3. **Gestión de estado**
   - ¿Single source of truth (2D o 3D)?
   - ¿Sistema de réplica bidireccional?

4. **Testing**
   - ¿Crear test-integracion-2d-3d.html?
   - ¿Validar con ambos módulos?

## 🎯 Próximos Pasos

**Inmediato:**
- Este documento sirve como referencia para futura integración
- `test-terrain-from-map.html` continúa independiente por ahora
- `simbolosP.js` no se modifica

**Cuando se integre:**
1. Crear branch `feature/integracion-2d-3d`
2. Implementar funciones de conversión
3. Agregar referencias cruzadas
4. Testing exhaustivo
5. Merge coordinado

---

**Última actualización:** 6 de octubre de 2025  
**Estado:** Documentación de integración futura  
**Responsable:** Equipo MAIRA
