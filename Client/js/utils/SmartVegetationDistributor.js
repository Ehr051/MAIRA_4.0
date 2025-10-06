/**
 * ═══════════════════════════════════════════════════════════════════════
 * SMART VEGETATION DISTRIBUTOR - MAIRA 4.0
 * ═══════════════════════════════════════════════════════════════════════
 * Sistema inteligente de distribución de vegetación basado en regiones
 * 
 * Mejoras sobre sistema anterior:
 * - ❌ ANTES: Grid sampling → Árboles dispersos, sin forma real
 * - ✅ AHORA: Region-based → Bosques con forma real, distribución natural
 * 
 * Estrategias por tipo:
 * - BOSQUES: Distribución densa con variación natural
 * - CÉSPED: Distribución dispersa uniforme
 * - CAMINOS: Textura plana (sin objetos 3D)
 * - EDIFICIOS: Modelo único centrado
 * 
 * @version 1.0.0
 * @author MAIRA Team
 * @date 2025-10-05
 */

class SmartVegetationDistributor {
    constructor(regions, bounds, imageWidth, imageHeight) {
        this.regions = regions;
        this.bounds = bounds; // Leaflet bounds
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
        
        // Estadísticas
        this.stats = {
            totalInstances: 0,
            byType: {},
            byRegion: {}
        };
        
        console.log(`🌳 SmartVegetationDistributor inicializado: ${regions.length} regiones`);
    }
    
    /**
     * Distribuir vegetación en todas las regiones
     * @param {Object} config - Configuración de distribución
     * @returns {Array} Array de instancias { type, position, scale, rotation }
     */
    distribute(config = {}) {
        const {
            // Densidades por tipo (instancias por 100px²)
            densities: {
                forest: forestDensity = 0.8,      // 0.8 árboles por 100px² → Bosque denso
                vegetation: vegDensity = 0.5,     // 0.5 arbustos por 100px²
                grass: grassDensity = 0.2,        // 0.2 césped por 100px² → Disperso
                crops: cropsDensity = 0.4         // 0.4 cultivos por 100px²
            } = {},
            
            // Variación de posición (para naturalidad)
            positionJitter = 0.3,                 // 30% de variación en posición
            
            // Filtros
            minRegionArea = 25,                   // Ignorar regiones < 25px
            maxInstancesPerRegion = 100,          // Máximo 100 instancias por región
            
            // Estrategias especiales
            useClusteringForForest = true,        // Agrupar árboles en clusters naturales
            avoidBoundaries = true,               // No colocar en bordes de regiones
            respectOrientation = true             // Rotar según orientación de región
        } = config;
        
        console.log(`🎨 Distribuyendo vegetación en ${this.regions.length} regiones...`);
        
        const startTime = performance.now();
        const instances = [];
        
        this.regions.forEach((region, index) => {
            // Filtrar regiones muy pequeñas
            if (region.area < minRegionArea) {
                return;
            }
            
            // Seleccionar estrategia según tipo
            let regionInstances = [];
            
            switch (region.type) {
                case 'forest':
                    regionInstances = this.distributeForest(
                        region,
                        forestDensity,
                        {
                            useClustering: useClusteringForForest,
                            avoidBoundaries,
                            positionJitter,
                            maxInstances: maxInstancesPerRegion
                        }
                    );
                    break;
                    
                case 'vegetation':
                case 'crops':
                    regionInstances = this.distributeVegetation(
                        region,
                        region.type === 'crops' ? cropsDensity : vegDensity,
                        {
                            avoidBoundaries,
                            positionJitter,
                            respectOrientation,
                            maxInstances: maxInstancesPerRegion
                        }
                    );
                    break;
                    
                case 'grass':
                    regionInstances = this.distributeGrass(
                        region,
                        grassDensity,
                        {
                            positionJitter,
                            maxInstances: maxInstancesPerRegion
                        }
                    );
                    break;
                    
                case 'roads':
                case 'buildings':
                case 'water':
                    // Estos no generan vegetación 3D
                    // TODO: Podrían generar texturas planas o modelos especiales
                    break;
                    
                default:
                    console.debug(`⚠️ Tipo desconocido: ${region.type}`);
            }
            
            // Agregar instancias generadas
            instances.push(...regionInstances);
            
            // Estadísticas
            this.stats.byRegion[index] = regionInstances.length;
            this.stats.byType[region.type] = (this.stats.byType[region.type] || 0) + regionInstances.length;
        });
        
        this.stats.totalInstances = instances.length;
        
        const endTime = performance.now();
        const timeMs = (endTime - startTime).toFixed(2);
        
        console.log(`✅ ${instances.length} instancias distribuidas en ${timeMs}ms`);
        console.log(`📊 Por tipo:`, this.stats.byType);
        
        return instances;
    }
    
    /**
     * Distribuir bosque con clustering natural
     */
    distributeForest(region, density, options) {
        const instances = [];
        const numInstances = Math.min(
            Math.floor(region.area * density / 100),
            options.maxInstances
        );
        
        if (numInstances === 0) return instances;
        
        // Usar clustering para simular grupos naturales de árboles
        if (options.useClustering) {
            const numClusters = Math.max(1, Math.floor(numInstances / 10)); // Clusters de ~10 árboles
            const clusters = this.generateClusters(region, numClusters);
            
            clusters.forEach(cluster => {
                const treesInCluster = Math.floor(numInstances / numClusters);
                
                for (let i = 0; i < treesInCluster; i++) {
                    const position = this.samplePointInRegion(region, {
                        center: cluster,
                        radius: 15, // Radio del cluster en píxeles
                        avoidBoundaries: options.avoidBoundaries,
                        jitter: options.positionJitter
                    });
                    
                    if (position) {
                        instances.push({
                            type: 'tree_tall',
                            position: this.pixelToWorld(position.x, position.y),
                            scale: 0.8 + Math.random() * 0.4, // Variación de escala
                            rotation: Math.random() * Math.PI * 2
                        });
                    }
                }
            });
        } else {
            // Distribución uniforme simple
            for (let i = 0; i < numInstances; i++) {
                const position = this.samplePointInRegion(region, {
                    avoidBoundaries: options.avoidBoundaries,
                    jitter: options.positionJitter
                });
                
                if (position) {
                    instances.push({
                        type: 'tree_tall',
                        position: this.pixelToWorld(position.x, position.y),
                        scale: 0.8 + Math.random() * 0.4,
                        rotation: Math.random() * Math.PI * 2
                    });
                }
            }
        }
        
        return instances;
    }
    
    /**
     * Distribuir vegetación general (arbustos, cultivos)
     */
    distributeVegetation(region, density, options) {
        const instances = [];
        const numInstances = Math.min(
            Math.floor(region.area * density / 100),
            options.maxInstances
        );
        
        if (numInstances === 0) return instances;
        
        for (let i = 0; i < numInstances; i++) {
            const position = this.samplePointInRegion(region, {
                avoidBoundaries: options.avoidBoundaries,
                jitter: options.jitter
            });
            
            if (position) {
                // Orientación según región si está habilitado
                const rotation = options.respectOrientation
                    ? region.orientation + (Math.random() - 0.5) * Math.PI / 4
                    : Math.random() * Math.PI * 2;
                
                instances.push({
                    type: 'bush',
                    position: this.pixelToWorld(position.x, position.y),
                    scale: 0.7 + Math.random() * 0.6,
                    rotation: rotation
                });
            }
        }
        
        return instances;
    }
    
    /**
     * Distribuir césped disperso
     */
    distributeGrass(region, density, options) {
        const instances = [];
        const numInstances = Math.min(
            Math.floor(region.area * density / 100),
            options.maxInstances
        );
        
        if (numInstances === 0) return instances;
        
        for (let i = 0; i < numInstances; i++) {
            const position = this.samplePointInRegion(region, {
                jitter: options.jitter
            });
            
            if (position) {
                instances.push({
                    type: 'grass',
                    position: this.pixelToWorld(position.x, position.y),
                    scale: 0.5 + Math.random() * 0.5,
                    rotation: Math.random() * Math.PI * 2
                });
            }
        }
        
        return instances;
    }
    
    /**
     * Generar puntos de clusters dentro de región
     */
    generateClusters(region, numClusters) {
        const clusters = [];
        
        for (let i = 0; i < numClusters; i++) {
            // Elegir pixel aleatorio dentro de región como centro de cluster
            const pixel = region.pixels[Math.floor(Math.random() * region.pixels.length)];
            clusters.push({x: pixel.x, y: pixel.y});
        }
        
        return clusters;
    }
    
    /**
     * Muestrear punto aleatorio dentro de región
     */
    samplePointInRegion(region, options = {}) {
        const {
            center = null,          // Centro de muestreo (para clusters)
            radius = null,          // Radio de muestreo (para clusters)
            avoidBoundaries = false, // Evitar bordes de región
            jitter = 0.3            // Variación de posición
        } = options;
        
        // Si hay centro y radio, muestrear en área circular
        if (center && radius) {
            // Muestreo por rechazo en círculo
            for (let attempt = 0; attempt < 10; attempt++) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.sqrt(Math.random()) * radius;
                const x = Math.round(center.x + r * Math.cos(angle));
                const y = Math.round(center.y + r * Math.sin(angle));
                
                // Verificar que está dentro de la región
                if (this.isPointInRegion(x, y, region)) {
                    return {
                        x: x + (Math.random() - 0.5) * jitter,
                        y: y + (Math.random() - 0.5) * jitter
                    };
                }
            }
            return null;
        }
        
        // Muestreo uniforme en región
        const validPixels = avoidBoundaries
            ? this.getInteriorPixels(region)
            : region.pixels;
        
        if (validPixels.length === 0) return null;
        
        const pixel = validPixels[Math.floor(Math.random() * validPixels.length)];
        
        return {
            x: pixel.x + (Math.random() - 0.5) * jitter,
            y: pixel.y + (Math.random() - 0.5) * jitter
        };
    }
    
    /**
     * Verificar si punto está dentro de región
     */
    isPointInRegion(x, y, region) {
        return region.pixels.some(p => p.x === Math.round(x) && p.y === Math.round(y));
    }
    
    /**
     * Obtener píxeles interiores (no en borde) de región
     */
    getInteriorPixels(region) {
        // Filtrar píxeles que no tienen todos los vecinos en la región
        const pixelSet = new Set(region.pixels.map(p => `${p.x},${p.y}`));
        
        return region.pixels.filter(p => {
            // Verificar 4 vecinos
            const hasAllNeighbors = 
                pixelSet.has(`${p.x+1},${p.y}`) &&
                pixelSet.has(`${p.x-1},${p.y}`) &&
                pixelSet.has(`${p.x},${p.y+1}`) &&
                pixelSet.has(`${p.x},${p.y-1}`);
            
            return hasAllNeighbors;
        });
    }
    
    /**
     * Convertir coordenadas de píxel a coordenadas del mundo 3D
     */
    pixelToWorld(pixelX, pixelY) {
        // Normalizar píxel a [0, 1]
        const normX = pixelX / this.imageWidth;
        const normY = pixelY / this.imageHeight;
        
        // Convertir a lat/lon usando bounds
        const north = this.bounds.getNorth();
        const south = this.bounds.getSouth();
        const east = this.bounds.getEast();
        const west = this.bounds.getWest();
        
        const lat = south + (north - south) * (1 - normY); // Invertir Y
        const lon = west + (east - west) * normX;
        
        // Retornar lat/lon (TerrainGenerator3D hará la conversión a 3D)
        return { lat, lon, normX, normY };
    }
    
    /**
     * Obtener estadísticas de distribución
     */
    getStats() {
        return this.stats;
    }
}

// Exportar para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartVegetationDistributor;
}

// Registrar globalmente para navegador
if (typeof window !== 'undefined') {
    window.SmartVegetationDistributor = SmartVegetationDistributor;
    console.log('✅ SmartVegetationDistributor registrado globalmente');
}
