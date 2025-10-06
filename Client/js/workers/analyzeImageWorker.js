/**
 * ═══════════════════════════════════════════════════════════════════════
 * ANALYZE IMAGE WORKER - MAIRA 4.0
 * ═══════════════════════════════════════════════════════════════════════
 * Web Worker para análisis de imagen satelital en background
 * 
 * Procesa imageData sin bloquear el hilo principal (UI fluida)
 * Usa Transferable Objects para transferencia zero-copy
 * 
 * @version 1.0.0
 * @author MAIRA Team
 * @date 2025-10-05
 */

/**
 * Clasificar píxel según color RGB
 */
function classifyPixel(r, g, b, thresholds) {
    // 1. Agua (azul predominante)
    if (b > Math.max(r, g) + 20 && b > 80) {
        return 'water';
    }
    
    // 2. Vegetación SUPER OSCURA (solo árboles densos/bosques)
    // ⚠️ CRITERIOS EXTREMADAMENTE ESTRICTOS
    // Queremos: RGB tipo (20-40, 40-70, 20-40) = verde muy oscuro
    const totalBrightness = r + g + b;
    const isGreen = g > r && g > b;
    const isVeryDark = totalBrightness < 120;       // 🔴 SUPER OSCURO (120 en lugar de 150)
    const hasStrongGreen = g >= 40 && g <= 80;      // 🔴 Verde entre 40-80 (no muy brillante)
    const lowRed = r < 50;                          // 🔴 Rojo BAJO (menos de 50)
    const lowBlue = b < 50;                         // 🔴 Azul BAJO (menos de 50)
    const hasStrongDominance = (g - r) >= 15 && (g - b) >= 15; // 🔴 Dominancia ALTA
    
    if (isGreen && isVeryDark && hasStrongGreen && lowRed && lowBlue && hasStrongDominance) {
        return 'vegetation';
    }
    
    // 2.5. CÉSPED (verde claro/medio) - DESACTIVADO (quedaba horrible)
    // const isMediumBright = totalBrightness >= 120 && totalBrightness < 350;
    // const hasGreenDominance = g > r && g > b && (g - r) >= 8 && (g - b) >= 8;
    // if (isGreen && isMediumBright && hasGreenDominance) {
    //     return 'grass';
    // }
    
    // 3. Caminos (gris uniforme)
    const road = thresholds.road;
    if (
        r >= road.minR && r <= road.maxR &&
        g >= road.minG && g <= road.maxG &&
        b >= road.minB && b <= road.maxB &&
        Math.abs(r - g) < road.maxDiff &&
        Math.abs(g - b) < road.maxDiff &&
        Math.abs(r - b) < road.maxDiff
    ) {
        return 'roads';
    }
    
    // 4. Edificios (colores oscuros/claros uniformes)
    const building = thresholds.building;
    if (
        r >= building.minR && r <= building.maxR &&
        g >= building.minG && g <= building.maxG &&
        b >= building.minB && b <= building.maxB
    ) {
        return 'buildings';
    }
    
    // 5. Tierra desnuda (marrón/beige)
    const soil = thresholds.bareSoil;
    if (
        r >= soil.minR && r <= soil.maxR &&
        g >= soil.minG && g <= soil.maxG &&
        b >= soil.minB && b <= soil.maxB
    ) {
        return 'bareSoil';
    }
    
    return null;
}

/**
 * Analizar imagen satelital
 */
function analyzeImage(imageData, config) {
    const { width, height, data } = imageData;
    const samplingRate = config.samplingRate || 16;
    const thresholds = config.thresholds;
    
    const features = {
        vegetation: [],
        grass: [],          // 🌱 NUEVO: césped verde claro
        roads: [],
        buildings: [],
        water: [],
        bareSoil: []
    };
    
    let sampledPixels = 0;
    
    // Muestreo con LOD - saltar píxeles
    for (let y = 0; y < height; y += samplingRate) {
        for (let x = 0; x < width; x += samplingRate) {
            const index = (y * width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            
            sampledPixels++;
            
            // Clasificar píxel
            const featureType = classifyPixel(r, g, b, thresholds);
            
            if (featureType) {
                features[featureType].push({
                    x: x,
                    y: y,
                    r: r,
                    g: g,
                    b: b,
                    type: featureType,
                    // Normalizar a [0, 1]
                    normX: x / width,
                    normY: y / height
                });
            }
        }
    }
    
    return {
        features,
        stats: {
            sampledPixels,
            totalPixels: width * height,
            coverage: (sampledPixels / (width * height) * 100).toFixed(2)
        }
    };
}

/**
 * Crear índice espacial
 */
function createSpatialIndex(features, width, height, cellSize = 32) {
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    const grid = {};
    
    // Insertar todas las features
    Object.values(features).forEach(featureArray => {
        featureArray.forEach(f => {
            const cellX = Math.floor(f.x / cellSize);
            const cellY = Math.floor(f.y / cellSize);
            const key = `${cellX},${cellY}`;
            
            if (!grid[key]) {
                grid[key] = [];
            }
            
            grid[key].push(f);
        });
    });
    
    return {
        grid,
        cols,
        rows,
        cellSize,
        width,
        height
    };
}

// ═══════════════════════════════════════════════════════════════════════
// WORKER MESSAGE HANDLER
// ═══════════════════════════════════════════════════════════════════════

self.onmessage = function(e) {
    const { type, payload } = e.data;
    
    try {
        switch (type) {
            case 'ANALYZE_IMAGE': {
                const startTime = performance.now();
                
                const { imageData, config } = payload;
                
                // Analizar imagen
                const result = analyzeImage(imageData, config);
                
                // Crear índice espacial
                const spatialIndex = createSpatialIndex(
                    result.features, 
                    imageData.width, 
                    imageData.height, 
                    32
                );
                
                const endTime = performance.now();
                const timeMs = (endTime - startTime).toFixed(2);
                
                // Contar features totales
                const totalFeatures = Object.values(result.features)
                    .reduce((sum, arr) => sum + arr.length, 0);
                
                // Enviar resultado
                self.postMessage({
                    type: 'ANALYZE_COMPLETE',
                    payload: {
                        features: result.features,
                        spatialIndex: spatialIndex,
                        stats: {
                            ...result.stats,
                            timeMs,
                            totalFeatures,
                            vegetation: result.features.vegetation.length,
                            roads: result.features.roads.length,
                            buildings: result.features.buildings.length,
                            water: result.features.water.length,
                            bareSoil: result.features.bareSoil.length
                        }
                    }
                });
                
                break;
            }
            
            default:
                throw new Error(`Unknown message type: ${type}`);
        }
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            payload: {
                message: error.message,
                stack: error.stack
            }
        });
    }
};

// Señal de que el worker está listo
self.postMessage({ type: 'WORKER_READY' });
