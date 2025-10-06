/**
 * ═══════════════════════════════════════════════════════════════════════
 * REGION DETECTOR - MAIRA 4.0
 * ═══════════════════════════════════════════════════════════════════════
 * Sistema de detección de regiones continuas en imágenes satelitales
 * 
 * Funcionalidad:
 * - Analiza imagen satelital completa
 * - Detecta regiones continuas (bosques, caminos, edificios)
 * - Extrae polígonos con forma y orientación real
 * - Respeta distribución geográfica original
 * 
 * Algoritmo:
 * 1. Flood Fill para agrupar píxeles contiguos del mismo tipo
 * 2. Extracción de contornos (boundary tracing)
 * 3. Simplificación de polígonos (Douglas-Peucker)
 * 4. Cálculo de orientación y características
 * 
 * @version 1.0.0
 * @author MAIRA Team
 * @date 2025-10-05
 */

class RegionDetector {
    constructor(imageData, features = []) {
        this.imageData = imageData;
        this.width = imageData.width;
        this.height = imageData.height;
        this.features = features; // Features del SatelliteAnalyzer
        
        // Mapa de píxeles visitados (para flood fill)
        this.visited = new Set();
        
        // Regiones detectadas
        this.regions = [];
        
        console.log(`🗺️ RegionDetector inicializado: ${this.width}×${this.height}px, ${features.length} features`);
    }
    
    /**
     * Detectar todas las regiones en la imagen
     * @param {Object} config - Configuración de detección
     * @returns {Array} Array de regiones detectadas
     */
    detectRegions(config = {}) {
        const {
            minRegionSize = 25,        // Mínimo 25 píxeles (5×5px) para considerar región
            maxRegions = 200,          // Máximo 200 regiones para evitar explosion
            simplifyTolerance = 2.0,   // Tolerancia para simplificación de polígonos
            mergeDistance = 5          // Distancia para mergear regiones cercanas del mismo tipo
        } = config;
        
        console.log(`🔍 Detectando regiones (min=${minRegionSize}px, max=${maxRegions})...`);
        
        const startTime = performance.now();
        this.regions = [];
        this.visited.clear();
        
        // Crear grid de tipos de features para búsqueda rápida
        const featureGrid = this.createFeatureGrid();
        
        // Iterar sobre todos los píxeles buscando regiones
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const key = `${x},${y}`;
                
                // Si ya visitado, skip
                if (this.visited.has(key)) continue;
                
                // Obtener tipo de feature en este pixel
                const featureType = featureGrid[y][x];
                
                // Si no es un tipo relevante para regiones, skip
                if (!this.isRelevantType(featureType)) {
                    this.visited.add(key);
                    continue;
                }
                
                // Flood fill desde este punto
                const pixels = this.floodFill(x, y, featureType, featureGrid);
                
                // Si la región es suficientemente grande, procesarla
                if (pixels.length >= minRegionSize) {
                    const region = this.createRegion(pixels, featureType, simplifyTolerance);
                    
                    if (region) {
                        this.regions.push(region);
                        
                        // Limitar número de regiones
                        if (this.regions.length >= maxRegions) {
                            console.warn(`⚠️ Límite de ${maxRegions} regiones alcanzado`);
                            break;
                        }
                    }
                }
            }
            
            if (this.regions.length >= maxRegions) break;
        }
        
        const endTime = performance.now();
        const timeMs = (endTime - startTime).toFixed(2);
        
        console.log(`✅ ${this.regions.length} regiones detectadas en ${timeMs}ms`);
        
        // Ordenar por tamaño (mayor primero) para renderizado eficiente
        this.regions.sort((a, b) => b.area - a.area);
        
        // Estadísticas
        this.logRegionStats();
        
        return this.regions;
    }
    
    /**
     * Crear grid de features para búsqueda rápida O(1)
     * ✅ MEJORA: Expandir features a vecinos para crear regiones continuas
     */
    createFeatureGrid() {
        const grid = Array(this.height).fill(null).map(() => Array(this.width).fill('unknown'));
        
        // Paso 1: Mapear features directamente
        this.features.forEach(feature => {
            if (feature.x >= 0 && feature.x < this.width && feature.y >= 0 && feature.y < this.height) {
                grid[feature.y][feature.x] = feature.type;
            }
        });
        
        // Paso 2: Expandir features a vecinos cercanos (3x3)
        // Esto crea regiones continuas a partir de píxeles dispersos
        const expanded = Array(this.height).fill(null).map(() => Array(this.width).fill('unknown'));
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (grid[y][x] !== 'unknown') {
                    // Copiar el tipo del feature
                    expanded[y][x] = grid[y][x];
                    
                    // Expandir a vecinos 8-conectividad (3x3)
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nx = x + dx;
                            const ny = y + dy;
                            
                            if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                                // Solo expandir si el vecino es 'unknown'
                                if (expanded[ny][nx] === 'unknown') {
                                    expanded[ny][nx] = grid[y][x];
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Debug: Contar píxeles de cada tipo
        const typeCounts = {};
        let filledPixels = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const type = expanded[y][x];
                if (type !== 'unknown') {
                    typeCounts[type] = (typeCounts[type] || 0) + 1;
                    filledPixels++;
                }
            }
        }
        
        console.log(`📊 Feature Grid expandido: ${filledPixels}/${this.width * this.height} píxeles (${(filledPixels / (this.width * this.height) * 100).toFixed(1)}%)`);
        console.log(`📊 Por tipo:`, typeCounts);
        
        return expanded;
    }
    
    /**
     * Verificar si un tipo de feature es relevante para detección de regiones
     */
    isRelevantType(type) {
        const relevantTypes = [
            'vegetation',
            'forest',
            'grass',
            'crops',
            'water',
            'roads',
            'buildings'
        ];
        
        return relevantTypes.includes(type);
    }
    
    /**
     * Flood fill para detectar región continua
     * @param {number} startX - Coordenada X inicial
     * @param {number} startY - Coordenada Y inicial
     * @param {string} targetType - Tipo de feature buscado
     * @param {Array} featureGrid - Grid de features
     * @returns {Array} Array de píxeles {x, y} en la región
     */
    floodFill(startX, startY, targetType, featureGrid) {
        const pixels = [];
        const queue = [{x: startX, y: startY}];
        const visited = new Set();
        
        while (queue.length > 0) {
            const {x, y} = queue.shift();
            const key = `${x},${y}`;
            
            // Validaciones
            if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
            if (visited.has(key) || this.visited.has(key)) continue;
            if (featureGrid[y][x] !== targetType) continue;
            
            // Marcar como visitado
            visited.add(key);
            this.visited.add(key);
            pixels.push({x, y});
            
            // Agregar vecinos (4-conectividad para regiones más precisas)
            queue.push(
                {x: x + 1, y: y},     // Derecha
                {x: x - 1, y: y},     // Izquierda
                {x: x, y: y + 1},     // Abajo
                {x: x, y: y - 1}      // Arriba
            );
        }
        
        return pixels;
    }
    
    /**
     * Crear región a partir de píxeles detectados
     */
    createRegion(pixels, type, simplifyTolerance) {
        try {
            // Calcular bounding box
            const bounds = this.calculateBounds(pixels);
            
            // Extraer contorno (boundary)
            const boundary = this.extractBoundary(pixels, bounds);
            
            if (boundary.length < 3) return null; // Necesita al menos 3 puntos para polígono
            
            // Simplificar polígono (Douglas-Peucker)
            const simplified = this.simplifyPolygon(boundary, simplifyTolerance);
            
            // Calcular propiedades
            const centroid = this.calculateCentroid(pixels);
            const area = pixels.length; // Área en píxeles
            const orientation = this.calculateOrientation(simplified);
            
            return {
                type: type,
                pixels: pixels,
                boundary: simplified,
                bounds: bounds,
                centroid: centroid,
                area: area,
                orientation: orientation, // Ángulo en radianes
                aspectRatio: bounds.width / bounds.height
            };
            
        } catch (error) {
            console.warn('Error creando región:', error);
            return null;
        }
    }
    
    /**
     * Calcular bounding box de píxeles
     */
    calculateBounds(pixels) {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        pixels.forEach(p => {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        });
        
        return {
            minX, maxX, minY, maxY,
            width: maxX - minX + 1,
            height: maxY - minY + 1,
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2
        };
    }
    
    /**
     * Extraer contorno de región (boundary tracing)
     */
    extractBoundary(pixels, bounds) {
        // Crear grid local de la región
        const grid = Array(bounds.height).fill(null).map(() => Array(bounds.width).fill(false));
        
        pixels.forEach(p => {
            const localX = p.x - bounds.minX;
            const localY = p.y - bounds.minY;
            if (localX >= 0 && localX < bounds.width && localY >= 0 && localY < bounds.height) {
                grid[localY][localX] = true;
            }
        });
        
        // Encontrar punto inicial (leftmost, topmost)
        let startX = -1, startY = -1;
        outer: for (let y = 0; y < bounds.height; y++) {
            for (let x = 0; x < bounds.width; x++) {
                if (grid[y][x]) {
                    startX = x;
                    startY = y;
                    break outer;
                }
            }
        }
        
        if (startX === -1) return [];
        
        // Moore boundary tracing
        const boundary = [];
        const directions = [
            {dx: 1, dy: 0},   // E
            {dx: 1, dy: 1},   // SE
            {dx: 0, dy: 1},   // S
            {dx: -1, dy: 1},  // SW
            {dx: -1, dy: 0},  // W
            {dx: -1, dy: -1}, // NW
            {dx: 0, dy: -1},  // N
            {dx: 1, dy: -1}   // NE
        ];
        
        let x = startX, y = startY;
        let dir = 7; // Start looking North
        let iterations = 0;
        const maxIterations = bounds.width * bounds.height * 4; // Prevenir loops infinitos
        
        do {
            boundary.push({
                x: x + bounds.minX,
                y: y + bounds.minY
            });
            
            // Buscar siguiente pixel del contorno
            let found = false;
            for (let i = 0; i < 8; i++) {
                const checkDir = (dir + i) % 8;
                const nx = x + directions[checkDir].dx;
                const ny = y + directions[checkDir].dy;
                
                if (nx >= 0 && nx < bounds.width && ny >= 0 && ny < bounds.height && grid[ny][nx]) {
                    x = nx;
                    y = ny;
                    dir = (checkDir + 6) % 8; // Turn left
                    found = true;
                    break;
                }
            }
            
            if (!found) break;
            
            iterations++;
            if (iterations > maxIterations) {
                console.warn('⚠️ Boundary tracing excedió iteraciones máximas');
                break;
            }
            
        } while (x !== startX || y !== startY);
        
        return boundary;
    }
    
    /**
     * Simplificar polígono usando Douglas-Peucker
     */
    simplifyPolygon(points, tolerance) {
        if (points.length <= 3) return points;
        
        // Implementación de Douglas-Peucker
        const simplified = this.douglasPeucker(points, tolerance);
        
        return simplified.length >= 3 ? simplified : points;
    }
    
    douglasPeucker(points, tolerance) {
        if (points.length <= 2) return points;
        
        // Encontrar punto más lejano de la línea start-end
        let maxDist = 0;
        let maxIndex = 0;
        const start = points[0];
        const end = points[points.length - 1];
        
        for (let i = 1; i < points.length - 1; i++) {
            const dist = this.perpendicularDistance(points[i], start, end);
            if (dist > maxDist) {
                maxDist = dist;
                maxIndex = i;
            }
        }
        
        // Si el punto más lejano excede tolerancia, recursión
        if (maxDist > tolerance) {
            const left = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
            const right = this.douglasPeucker(points.slice(maxIndex), tolerance);
            
            return left.slice(0, -1).concat(right);
        } else {
            return [start, end];
        }
    }
    
    perpendicularDistance(point, lineStart, lineEnd) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const norm = Math.sqrt(dx * dx + dy * dy);
        
        if (norm === 0) {
            return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);
        }
        
        const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (norm * norm);
        
        let closestX, closestY;
        if (t < 0) {
            closestX = lineStart.x;
            closestY = lineStart.y;
        } else if (t > 1) {
            closestX = lineEnd.x;
            closestY = lineEnd.y;
        } else {
            closestX = lineStart.x + t * dx;
            closestY = lineStart.y + t * dy;
        }
        
        return Math.sqrt((point.x - closestX) ** 2 + (point.y - closestY) ** 2);
    }
    
    /**
     * Calcular centroide de región
     */
    calculateCentroid(pixels) {
        const sum = pixels.reduce((acc, p) => {
            acc.x += p.x;
            acc.y += p.y;
            return acc;
        }, {x: 0, y: 0});
        
        return {
            x: sum.x / pixels.length,
            y: sum.y / pixels.length
        };
    }
    
    /**
     * Calcular orientación de región usando PCA (Principal Component Analysis)
     */
    calculateOrientation(boundary) {
        if (boundary.length < 2) return 0;
        
        // Calcular centroide del boundary
        const cx = boundary.reduce((sum, p) => sum + p.x, 0) / boundary.length;
        const cy = boundary.reduce((sum, p) => sum + p.y, 0) / boundary.length;
        
        // Calcular matriz de covarianza
        let xx = 0, yy = 0, xy = 0;
        boundary.forEach(p => {
            const dx = p.x - cx;
            const dy = p.y - cy;
            xx += dx * dx;
            yy += dy * dy;
            xy += dx * dy;
        });
        
        xx /= boundary.length;
        yy /= boundary.length;
        xy /= boundary.length;
        
        // Calcular eigenvector principal (orientación)
        const angle = 0.5 * Math.atan2(2 * xy, xx - yy);
        
        return angle;
    }
    
    /**
     * Estadísticas de regiones detectadas
     */
    logRegionStats() {
        const byType = {};
        let totalArea = 0;
        
        this.regions.forEach(region => {
            byType[region.type] = (byType[region.type] || 0) + 1;
            totalArea += region.area;
        });
        
        console.log(`📊 Regiones por tipo:`, byType);
        console.log(`📏 Área total cubierta: ${totalArea} píxeles (${(totalArea / (this.width * this.height) * 100).toFixed(1)}%)`);
        
        // Top 5 regiones más grandes
        const top5 = this.regions.slice(0, 5);
        console.log(`🏆 Top 5 regiones más grandes:`, top5.map(r => 
            `${r.type} (${r.area}px, ${r.boundary.length} vértices)`
        ));
    }
    
    /**
     * Obtener regiones detectadas
     */
    getRegions() {
        return this.regions;
    }
    
    /**
     * Filtrar regiones por tipo
     */
    getRegionsByType(type) {
        return this.regions.filter(r => r.type === type);
    }
}

// Exportar para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RegionDetector;
}

// Registrar globalmente para navegador
if (typeof window !== 'undefined') {
    window.RegionDetector = RegionDetector;
    console.log('✅ RegionDetector registrado globalmente');
}
