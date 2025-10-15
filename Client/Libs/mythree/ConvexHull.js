/**
 * ConvexHull.js - QuickHull Algorithm Implementation
 * Calcula el envolvente convexo (convex hull) de un conjunto de puntos 3D
 * Usado para cálculos de Line of Sight (LOS) esférico en MAIRA 4.0
 * 
 * Algoritmo: QuickHull (divide and conquer)
 * Complejidad: O(n log n) promedio, O(n²) peor caso
 */

// ===== CLASE POINT3: Vector 3D con operaciones básicas =====
function Point3(x, y, z) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
}

Point3.prototype = {
    length: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    },
    
    dot: function(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    },
    
    cross: function(v) {
        return new Point3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    },
    
    sub: function(v) {
        return new Point3(this.x - v.x, this.y - v.y, this.z - v.z);
    },
    
    add: function(v) {
        return new Point3(this.x + v.x, this.y + v.y, this.z + v.z);
    },
    
    scale: function(s) {
        return new Point3(this.x * s, this.y * s, this.z * s);
    },
    
    normalize: function() {
        const len = this.length();
        if (len > 0) {
            return new Point3(this.x / len, this.y / len, this.z / len);
        }
        return new Point3(0, 0, 0);
    }
};

// ===== CLASE FACE: Cara triangular con topología =====
function Face(a, b, c) {
    this.a = a; // Índice vértice A
    this.b = b; // Índice vértice B
    this.c = c; // Índice vértice C
    this.normal = new Point3(0, 0, 0);
    this.neighbors = []; // Caras vecinas
}

Face.prototype._calculateNormal = function(vertices) {
    const v0 = vertices[this.a];
    const v1 = vertices[this.b];
    const v2 = vertices[this.c];
    
    const edge1 = v1.sub(v0);
    const edge2 = v2.sub(v0);
    this.normal = edge1.cross(edge2);
    
    const len = this.normal.length();
    if (len > 0) {
        this.normal = this.normal.normalize();
    }
};

// ===== CLASE CONVEXHULL: Algoritmo QuickHull =====
function ConvexHull() {
    this.vertices = [];
    this.faces = [];
}

ConvexHull.prototype = {
    /**
     * Método principal: Calcula el convex hull desde un array de puntos
     * @param {Array} points - Array de THREE.Vector3 o Point3
     */
    setFromPoints: function(points) {
        if (!points || points.length < 4) {
            console.warn('⚠️ ConvexHull necesita al menos 4 puntos');
            this.vertices = points.map(p => new Point3(p.x, p.y, p.z));
            this.faces = [];
            return;
        }
        
        // 1. Copiar puntos a vertices
        this.vertices = points.map(p => new Point3(p.x, p.y, p.z));
        
        // 2. Encontrar 4 puntos extremos que formen el tetraedro más grande
        const extremeIndices = this._findExtremePoints();
        
        if (extremeIndices.length < 4) {
            console.warn('⚠️ No se encontraron suficientes puntos extremos');
            return;
        }
        
        // 3. Construir hull inicial desde el tetraedro
        this._buildInitialHull(
            extremeIndices[0],
            extremeIndices[1],
            extremeIndices[2],
            extremeIndices[3]
        );
        
        // 4. Agregar puntos restantes iterativamente
        const processed = new Set(extremeIndices);
        for (let i = 0; i < this.vertices.length; i++) {
            if (!processed.has(i)) {
                this._addPointToHull(i);
            }
        }
        
        console.log(`✅ ConvexHull generado: ${this.vertices.length} vértices, ${this.faces.length} caras`);
    },
    
    /**
     * Encuentra 4 puntos extremos para formar el tetraedro inicial
     * @returns {Array} Índices de los 4 puntos
     */
    _findExtremePoints: function() {
        if (this.vertices.length < 4) return [];
        
        // Encontrar min/max en cada eje
        let minX = 0, maxX = 0;
        let minY = 0, maxY = 0;
        let minZ = 0, maxZ = 0;
        
        for (let i = 1; i < this.vertices.length; i++) {
            if (this.vertices[i].x < this.vertices[minX].x) minX = i;
            if (this.vertices[i].x > this.vertices[maxX].x) maxX = i;
            if (this.vertices[i].y < this.vertices[minY].y) minY = i;
            if (this.vertices[i].y > this.vertices[maxY].y) maxY = i;
            if (this.vertices[i].z < this.vertices[minZ].z) minZ = i;
            if (this.vertices[i].z > this.vertices[maxZ].z) maxZ = i;
        }
        
        // Seleccionar los 6 candidatos únicos
        const candidates = [...new Set([minX, maxX, minY, maxY, minZ, maxZ])];
        
        if (candidates.length < 4) {
            // Si hay menos de 4 puntos únicos, usar los primeros 4 del array
            return [0, 1, 2, 3];
        }
        
        // Encontrar el tetraedro de mayor volumen
        let maxVolume = 0;
        let bestTetra = [candidates[0], candidates[1], candidates[2], candidates[3]];
        
        // Probar todas las combinaciones de 4 puntos de los candidatos
        for (let i = 0; i < candidates.length - 3; i++) {
            for (let j = i + 1; j < candidates.length - 2; j++) {
                for (let k = j + 1; k < candidates.length - 1; k++) {
                    for (let l = k + 1; l < candidates.length; l++) {
                        const volume = this._calculateTetrahedronVolume(
                            candidates[i], candidates[j], candidates[k], candidates[l]
                        );
                        
                        if (volume > maxVolume) {
                            maxVolume = volume;
                            bestTetra = [candidates[i], candidates[j], candidates[k], candidates[l]];
                        }
                    }
                }
            }
        }
        
        return bestTetra;
    },
    
    /**
     * Calcula el volumen de un tetraedro
     */
    _calculateTetrahedronVolume: function(i0, i1, i2, i3) {
        const v0 = this.vertices[i0];
        const v1 = this.vertices[i1];
        const v2 = this.vertices[i2];
        const v3 = this.vertices[i3];
        
        const edge1 = v1.sub(v0);
        const edge2 = v2.sub(v0);
        const edge3 = v3.sub(v0);
        
        return Math.abs(edge1.dot(edge2.cross(edge3))) / 6.0;
    },
    
    /**
     * Construye el hull inicial desde 4 puntos (tetraedro)
     */
    _buildInitialHull: function(i0, i1, i2, i3) {
        this.faces = [];
        
        // Crear 4 caras del tetraedro
        const face0 = new Face(i0, i1, i2);
        const face1 = new Face(i0, i3, i1);
        const face2 = new Face(i0, i2, i3);
        const face3 = new Face(i1, i3, i2);
        
        // Calcular normales
        face0._calculateNormal(this.vertices);
        face1._calculateNormal(this.vertices);
        face2._calculateNormal(this.vertices);
        face3._calculateNormal(this.vertices);
        
        // Verificar que las normales apunten hacia afuera
        const center = new Point3(
            (this.vertices[i0].x + this.vertices[i1].x + this.vertices[i2].x + this.vertices[i3].x) / 4,
            (this.vertices[i0].y + this.vertices[i1].y + this.vertices[i2].y + this.vertices[i3].y) / 4,
            (this.vertices[i0].z + this.vertices[i1].z + this.vertices[i2].z + this.vertices[i3].z) / 4
        );
        
        // Invertir caras si es necesario
        [face0, face1, face2, face3].forEach(face => {
            const v0 = this.vertices[face.a];
            const toCenter = center.sub(v0);
            
            if (face.normal.dot(toCenter) > 0) {
                // Normal apunta hacia dentro, invertir cara
                const temp = face.a;
                face.a = face.c;
                face.c = temp;
                face.normal = face.normal.scale(-1);
            }
        });
        
        this.faces.push(face0, face1, face2, face3);
    },
    
    /**
     * Agrega un punto al hull existente
     */
    _addPointToHull: function(pointIndex) {
        const EPSILON = 0.00001;
        
        // 1. Encontrar caras visibles desde el punto
        const visibleFaces = [];
        for (let i = 0; i < this.faces.length; i++) {
            if (this._isVisible(this.faces[i], pointIndex, EPSILON)) {
                visibleFaces.push(i);
            }
        }
        
        if (visibleFaces.length === 0) {
            // Punto dentro del hull, ignorar
            return;
        }
        
        // 2. Encontrar aristas del horizonte (boundary entre visible/no-visible)
        const horizonEdges = this._findHorizonEdges(visibleFaces);
        
        // 3. Eliminar caras visibles (en orden inverso para no alterar índices)
        for (let i = visibleFaces.length - 1; i >= 0; i--) {
            this.faces.splice(visibleFaces[i], 1);
        }
        
        // 4. Crear nuevas caras desde el punto hacia el horizonte
        for (let i = 0; i < horizonEdges.length; i++) {
            const edge = horizonEdges[i];
            const newFace = new Face(edge[0], edge[1], pointIndex);
            newFace._calculateNormal(this.vertices);
            
            // Verificar orientación
            const v0 = this.vertices[edge[0]];
            const toPoint = this.vertices[pointIndex].sub(v0);
            
            if (newFace.normal.dot(toPoint) < 0) {
                // Normal apunta hacia adentro, invertir
                newFace.a = edge[1];
                newFace.b = edge[0];
                newFace._calculateNormal(this.vertices);
            }
            
            this.faces.push(newFace);
        }
    },
    
    /**
     * Verifica si un punto está visible desde una cara (fuera del hull)
     */
    _isVisible: function(face, pointIndex, epsilon) {
        const v0 = this.vertices[face.a];
        const point = this.vertices[pointIndex];
        const toPoint = point.sub(v0);
        
        return toPoint.dot(face.normal) > epsilon;
    },
    
    /**
     * Encuentra las aristas del horizonte (boundary de caras visibles)
     */
    _findHorizonEdges: function(visibleFaceIndices) {
        const visibleSet = new Set(visibleFaceIndices);
        const horizonEdges = [];
        
        // Para cada cara visible, verificar sus aristas
        for (let i = 0; i < visibleFaceIndices.length; i++) {
            const face = this.faces[visibleFaceIndices[i]];
            
            // Tres aristas: AB, BC, CA
            const edges = [
                [face.a, face.b],
                [face.b, face.c],
                [face.c, face.a]
            ];
            
            for (let j = 0; j < edges.length; j++) {
                const edge = edges[j];
                
                // Verificar si la arista es compartida con una cara no-visible
                let isHorizon = true;
                
                for (let k = 0; k < this.faces.length; k++) {
                    if (visibleSet.has(k)) continue; // Skip caras visibles
                    
                    const otherFace = this.faces[k];
                    
                    // Verificar si comparten arista (en cualquier orden)
                    if (
                        (otherFace.a === edge[0] && otherFace.b === edge[1]) ||
                        (otherFace.b === edge[0] && otherFace.c === edge[1]) ||
                        (otherFace.c === edge[0] && otherFace.a === edge[1]) ||
                        (otherFace.a === edge[1] && otherFace.b === edge[0]) ||
                        (otherFace.b === edge[1] && otherFace.c === edge[0]) ||
                        (otherFace.c === edge[1] && otherFace.a === edge[0])
                    ) {
                        isHorizon = false;
                        break;
                    }
                }
                
                if (isHorizon) {
                    horizonEdges.push(edge);
                }
            }
        }
        
        return horizonEdges;
    }
};

// ===== EXPORTAR A THREE.js =====
if (typeof THREE !== 'undefined') {
    THREE.ConvexHull = ConvexHull;
    THREE.Point3 = Point3;
    console.log('✅ THREE.ConvexHull (QuickHull algorithm) cargado correctamente');
} else {
    console.warn('⚠️ THREE.js no disponible, ConvexHull no exportado');
}

// Exportar también para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConvexHull, Point3, Face };
}
