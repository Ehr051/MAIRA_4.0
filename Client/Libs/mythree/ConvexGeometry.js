/**
 * ConvexGeometry - Versión simplificada para MAIRA 4.0
 * Compatible con THREE.js r128 (no-module)
 * Basado en THREE.ConvexGeometry original
 */

(function() {
    'use strict';

    if (!window.THREE) {
        console.error('❌ THREE.js no está cargado. ConvexGeometry requiere THREE.js');
        return;
    }

    /**
     * ConvexGeometry
     * Genera geometría convexa a partir de un conjunto de puntos
     * @param {Array<THREE.Vector3>} points - Array de puntos
     */
    THREE.ConvexGeometry = function(points) {
        THREE.BufferGeometry.call(this);

        this.type = 'ConvexGeometry';

        if (!points || points.length < 4) {
            console.warn('⚠️ ConvexGeometry: Se necesitan al menos 4 puntos para crear geometría convexa');
            return;
        }

        // Generar hull convexo usando algoritmo QuickHull simplificado
        const faces = this._quickHull(points);

        // Convertir faces a BufferGeometry
        const vertices = [];
        const normals = [];

        for (let i = 0; i < faces.length; i++) {
            const face = faces[i];
            const a = points[face.a];
            const b = points[face.b];
            const c = points[face.c];

            vertices.push(a.x, a.y, a.z);
            vertices.push(b.x, b.y, b.z);
            vertices.push(c.x, c.y, c.z);

            // Calcular normal
            const cb = new THREE.Vector3().subVectors(c, b);
            const ab = new THREE.Vector3().subVectors(a, b);
            const normal = new THREE.Vector3().crossVectors(cb, ab).normalize();

            normals.push(normal.x, normal.y, normal.z);
            normals.push(normal.x, normal.y, normal.z);
            normals.push(normal.x, normal.y, normal.z);
        }

        this.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        this.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

        this.computeBoundingSphere();
    };

    THREE.ConvexGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
    THREE.ConvexGeometry.prototype.constructor = THREE.ConvexGeometry;

    /**
     * QuickHull simplificado - Genera hull convexo
     * @private
     */
    THREE.ConvexGeometry.prototype._quickHull = function(points) {
        // ALGORITMO SIMPLIFICADO: Usar envolvente esférica aproximada
        // Para producción real, implementar QuickHull completo
        
        // 1. Encontrar centro de masa
        const center = new THREE.Vector3();
        for (let i = 0; i < points.length; i++) {
            center.add(points[i]);
        }
        center.divideScalar(points.length);

        // 2. Ordenar puntos por ángulo esférico
        const sortedPoints = points.slice().sort((a, b) => {
            const angleA = Math.atan2(a.z - center.z, a.x - center.x);
            const angleB = Math.atan2(b.z - center.z, b.x - center.x);
            return angleA - angleB;
        });

        // 3. Generar faces conectando puntos consecutivos al centro superior/inferior
        const faces = [];
        
        // Encontrar punto más alto y más bajo
        let highest = sortedPoints[0];
        let lowest = sortedPoints[0];
        
        for (let i = 1; i < sortedPoints.length; i++) {
            if (sortedPoints[i].y > highest.y) highest = sortedPoints[i];
            if (sortedPoints[i].y < lowest.y) lowest = sortedPoints[i];
        }

        const topIdx = points.indexOf(highest);
        const bottomIdx = points.indexOf(lowest);

        // Generar faces laterales
        for (let i = 0; i < sortedPoints.length; i++) {
            const current = points.indexOf(sortedPoints[i]);
            const next = points.indexOf(sortedPoints[(i + 1) % sortedPoints.length]);

            // Face superior
            if (current !== topIdx && next !== topIdx) {
                faces.push({ a: topIdx, b: current, c: next });
            }

            // Face inferior
            if (current !== bottomIdx && next !== bottomIdx) {
                faces.push({ a: bottomIdx, b: next, c: current });
            }
        }

        return faces;
    };

    console.log('✅ THREE.ConvexGeometry (versión MAIRA simplificada) cargado');

})();
