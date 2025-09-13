# CONSOLIDACIÓN CSS Y Z-INDEX - MAIRA 4.0

## Estado Actual de Z-Index (Problemático)

### 🔴 Conflictos Identificados
```css
/* Elementos con z-index alto */
Loading Screen: 9999 !important
Menu Elements: 9999
Game Controls: 1000
Turn Indicator: 1000
Timer: 1000
Test Buttons: 1000
Panel Unificado: Variable (conflicto)
```

## 🎯 Nueva Jerarquía Z-Index Unificada

### Niveles Definidos
```css
/* ============================================
   JERARQUÍA Z-INDEX OFICIAL MAIRA 4.0
   ============================================ */

/* Nivel 9000-9999: Sistema/Loading */
.loading-container { z-index: 9999 !important; }
.system-critical { z-index: 9000; }

/* Nivel 2000-2999: Navegación Principal */
.menu-principal { z-index: 2000; }
.menu-secundario { z-index: 1900; }

/* Nivel 1500-1999: UI Fija (Reloj Central) */
.reloj-central-fijo { z-index: 1500; }
.indicadores-fijos { z-index: 1400; }

/* Nivel 1000-1499: HUBs y Paneles Emergentes */
.hub-estado { z-index: 1100; }
.hub-unidad { z-index: 1050; }
.hub-comandos { z-index: 1000; }
.panel-unificado { z-index: 1000; }

/* Nivel 500-999: Controles de Mapa */
.controles-zoom { z-index: 800; }
.indicador-zoom { z-index: 700; }
.overlay-mapa { z-index: 600; }
.controles-mapa { z-index: 500; }

/* Nivel 100-499: Elementos de Juego */
.unidades-militares { z-index: 300; }
.elementos-mapa { z-index: 200; }
.grid-coordenadas { z-index: 100; }

/* Nivel 1-99: Base del Mapa */
.mapa-base { z-index: 50; }
.terrain-background { z-index: 1; }
```

## 📁 Reorganización de Archivos CSS

### Estructura Actual (Fragmentada)
```
Client/css/
├── common/
│   ├── planeamiento.css      # Específico planeamiento
│   ├── CYGMarcha.css         # Marcha específica
│   └── hexgrid.css           # Grid hexagonal
├── modules/                  # CSS por módulos
├── carrusel.css             # Componente específico
├── CO.css                   # Comando y control
├── director-styles.css       # Director juego
├── GBatalla.css             # Guerra batalla
├── graficomarcha.css        # Gráfico marcha
├── iniciarpartida.css       # Inicio partida
├── inicioGB.css             # Inicio guerra
├── juegodeguerra.css         # Principal juego
├── miradial.css             # MiRadial component
├── responsive-fixes.css      # Fixes responsive
└── style.css                # Estilos base
```

### Nueva Estructura Propuesta
```
Client/css/
├── core/
│   ├── variables.css         # Variables CSS globales
│   ├── reset.css            # Reset/normalize
│   ├── typography.css       # Fuentes y texto
│   └── z-index.css          # Jerarquía z-index
├── components/
│   ├── reloj-central.css    # Reloj central fijo
│   ├── hubs.css             # Sistemas HUB
│   ├── panels.css           # Paneles unificados
│   ├── menu.css             # Menús y navegación
│   └── maps.css             # Elementos del mapa
├── layouts/
│   ├── game.css             # Layout principal juego
│   ├── planning.css         # Layout planeamiento
│   └── responsive.css       # Media queries
└── modules/
    ├── combat.css           # Sistema combate
    ├── units.css            # Unidades militares
    ├── zoom.css             # Sistema zoom
    └── march.css            # Sistema marcha
```

## 🛠️ Variables CSS Unificadas

### Colores Militares Estandarizados
```css
:root {
  /* Colores Base Militares */
  --color-militar-principal: #0a192f;
  --color-militar-secundario: #112240;
  --color-militar-acento: #64ffda;
  --color-militar-texto: #e6f1ff;
  --color-militar-dorado: #ffd700;
  --color-militar-verde: #00ff88;
  --color-militar-rojo: #ff4444;
  --color-militar-amarillo: #ffeb3b;

  /* Z-Index System */
  --z-loading: 9999;
  --z-menu-principal: 2000;
  --z-reloj-central: 1500;
  --z-hubs: 1100;
  --z-panels: 1000;
  --z-map-controls: 500;
  --z-map-elements: 100;
  --z-map-base: 1;

  /* Transiciones Estándar */
  --transicion-rapida: all 0.2s ease;
  --transicion-normal: all 0.3s ease;
  --transicion-suave: all 0.5s ease;

  /* Sombras Militares */
  --sombra-militar: 0 4px 20px rgba(100, 255, 218, 0.3);
  --sombra-profunda: 0 8px 32px rgba(0, 0, 0, 0.6);

  /* Bordes y Radios */
  --radio-border: 8px;
  --border-militar: 1px solid var(--color-militar-acento);
}
```

## 🎨 Clases CSS Unificadas

### Sistema de Componentes
```css
/* ============================================
   COMPONENTES BASE
   ============================================ */

.hub-base {
  position: fixed;
  background: rgba(10, 25, 47, 0.95);
  border: var(--border-militar);
  border-radius: var(--radio-border);
  box-shadow: var(--sombra-militar);
  backdrop-filter: blur(10px);
  color: var(--color-militar-texto);
  font-family: 'Roboto', 'Arial', sans-serif;
  transition: var(--transicion-normal);
}

.hub-emergente {
  transform: translateX(-100%);
  opacity: 0;
}

.hub-emergente.show {
  transform: translateX(0);
  opacity: 1;
}

.btn-militar {
  background: var(--color-militar-principal);
  border: var(--border-militar);
  color: var(--color-militar-texto);
  padding: 8px 16px;
  border-radius: var(--radio-border);
  cursor: pointer;
  transition: var(--transicion-rapida);
  font-weight: bold;
  text-transform: uppercase;
}

.btn-militar:hover {
  background: var(--color-militar-acento);
  color: var(--color-militar-principal);
  box-shadow: var(--sombra-militar);
  transform: translateY(-2px);
}

.panel-section {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(17, 34, 64, 0.8);
  border-radius: var(--radio-border);
  border-left: 3px solid var(--color-militar-acento);
}

.stat-bar {
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 4px;
}

.stat-fill {
  height: 100%;
  border-radius: 4px;
  transition: var(--transicion-normal);
}

.stat-fill.green { background: linear-gradient(90deg, #00ff88, #00cc66); }
.stat-fill.yellow { background: linear-gradient(90deg, #ffd700, #ffb300); }
.stat-fill.orange { background: linear-gradient(90deg, #ff9800, #f57c00); }
.stat-fill.red { background: linear-gradient(90deg, #ff4444, #cc1111); }
```

## 🔧 Plan de Implementación

### Fase 1: Variables y Z-Index
- [x] Crear archivo `css/core/variables.css`
- [x] Crear archivo `css/core/z-index.css`
- [ ] Aplicar variables en todos los componentes existentes

### Fase 2: Componentes Base
- [x] Crear `css/components/reloj-central.css`
- [ ] Crear `css/components/hubs.css`
- [ ] Crear `css/components/panels.css`

### Fase 3: Migración Gradual
- [ ] Migrar `juegodeguerra.css` → estructura modular
- [ ] Migrar `planeamiento.css` → estructura modular
- [ ] Consolidar estilos responsivos

### Fase 4: Optimización
- [ ] Remover CSS duplicado
- [ ] Optimizar selectores
- [ ] Validar accesibilidad

## 📏 Media Queries Unificadas

```css
/* ============================================
   BREAKPOINTS ESTÁNDAR MAIRA 4.0
   ============================================ */

/* Mobile First Approach */
:root {
  --breakpoint-xs: 320px;   /* Mobile pequeño */
  --breakpoint-sm: 576px;   /* Mobile */
  --breakpoint-md: 768px;   /* Tablet */
  --breakpoint-lg: 992px;   /* Desktop pequeño */
  --breakpoint-xl: 1200px;  /* Desktop */
  --breakpoint-xxl: 1400px; /* Desktop grande */
}

@media (max-width: 576px) {
  .reloj-central-fijo {
    transform: translateX(-50%) scale(0.8);
    top: 45px;
  }
  
  .hub-base {
    width: 95vw;
    left: 2.5vw;
    right: 2.5vw;
  }
}

@media (max-width: 768px) {
  .hub-emergente {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    transform: translateY(100%);
  }
  
  .hub-emergente.show {
    transform: translateY(0);
  }
}

@media (min-width: 1400px) {
  .reloj-central-fijo {
    transform: translateX(-50%) scale(1.1);
  }
}
```
