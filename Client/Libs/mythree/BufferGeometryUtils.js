/**
 * BufferGeometryUtils para THREE.js
 * Versión simplificada MAIRA 4.0
 */
(function() {
    'use strict';
    
    if (!window.THREE) {
        console.error('THREE.js debe estar cargado antes de BufferGeometryUtils');
        return;
    }
    
    const BufferGeometryUtils = {
        mergeGeometries: function(geometries, useGroups) {
            if (useGroups === undefined) useGroups = false;
            if (!geometries || geometries.length === 0) return null;
            
            const isIndexed = geometries[0].index !== null;
            const attributes = {};
            const mergedGeometry = new THREE.BufferGeometry();
            
            for (let i = 0; i < geometries.length; i++) {
                const geometry = geometries[i];
                for (const name in geometry.attributes) {
                    if (attributes[name] === undefined) attributes[name] = [];
                    attributes[name].push(geometry.attributes[name]);
                }
            }
            
            if (isIndexed) {
                let indexOffset = 0;
                const mergedIndex = [];
                for (let i = 0; i < geometries.length; i++) {
                    const index = geometries[i].index;
                    for (let j = 0; j < index.count; j++) {
                        mergedIndex.push(index.getX(j) + indexOffset);
                    }
                    indexOffset += geometries[i].attributes.position.count;
                }
                mergedGeometry.setIndex(mergedIndex);
            }
            
            for (const name in attributes) {
                const merged = this.mergeBufferAttributes(attributes[name]);
                if (merged) mergedGeometry.setAttribute(name, merged);
            }
            
            return mergedGeometry;
        },
        
        mergeBufferAttributes: function(attributes) {
            if (!attributes || attributes.length === 0) return null;
            
            let TypedArray = attributes[0].array.constructor;
            let itemSize = attributes[0].itemSize;
            let normalized = attributes[0].normalized;
            let arrayLength = 0;
            
            for (let i = 0; i < attributes.length; i++) {
                arrayLength += attributes[i].array.length;
            }
            
            const array = new TypedArray(arrayLength);
            let offset = 0;
            
            for (let i = 0; i < attributes.length; i++) {
                array.set(attributes[i].array, offset);
                offset += attributes[i].array.length;
            }
            
            return new THREE.BufferAttribute(array, itemSize, normalized);
        }
    };
    
    THREE.BufferGeometryUtils = BufferGeometryUtils;
    console.log('✅ BufferGeometryUtils cargado');
    
})();
