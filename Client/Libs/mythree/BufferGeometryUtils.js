/**
 * BufferGeometryUtils para THREE.js (adaptado para uso sin módulos)
 * Basado en THREE.js r152 - Versión simplificada MAIRA 4.0
 */
(function() {
    'use strict';
    if (!window.THREE) {
        console.error('THREE.js debe estar cargado antes de BufferGeometryUtils');
        return;
    }
    const BufferGeometryUtils = {
        mergeGeometries: function(geometries, useGroups = false) {
            if (!geometries || geometries.length === 0) return null;
            const isIndexed = geometries[0].index !== null;
            const attributesUsed = new Set(Object.keys(geometries[0].attributes));
            const attributes = {};
            const mergedGeometry = new THREE.BufferGeometry();
            let offset = 0;
            for (let i = 0; i < geometries.length; ++i) {
                const geometry = geometries[i];
                if (isIndexed !== (geometry.index !== null)) {
                    console.error('BufferGeometryUtils: geometries must have compatible indices');
                    return null;
                }
                for (const name in geometry.attributes) {
                    if (!attributesUsed.has(name)) return null;
                    if (attributes[name] === undefined) attributes[name] = [];
                    attributes[name].push(geometry.attributes[name]);
                }
                if (useGroups) {
                    const count = isIndexed ? geometry.index.count : geometry.attributes.position.count;
                    mergedGeometry.addGroup(offset, count, i);
                    offset += count;
                }
            }
            if (isIndexed) {
                let indexOffset = 0;
                const mergedIndex = [];
                for (let i = 0; i < geometries.length; ++i) {
                    const index = geometries[i].index;
                    for (let j = 0; j < index.count; ++j) {
                        mergedIndex.push(index.getX(j) + indexOffset);
                    }
                    indexOffset += geometries[i].attributes.position.count;
                }
                mergedGeometry.setIndex(mergedIndex);
            }
            for (const name in attributes) {
                const merged = this.mergeBufferAttributes(attributes[name]);
                if (!merged) return null;
                mergedGeometry.setAttribute(name, merged);
            }
            return mergedGeometry;
        },
        mergeBufferAttributes: function(attributes) {
            let TypedArray, itemSize, normalized, arrayLength = 0;
            for (let i = 0; i < attributes.length; ++i) {
                const attr = attributes[i];
                if (attr.isInterleavedBufferAttribute) return null;
                if (TypedArray === undefined) TypedArray = attr.array.constructor;
                if (TypedArray !== attr.array.constructor) return null;
                if (itemSize === undefined) itemSize = attr.itemSize;
                if (itemSize !== attr.itemSize) return null;
                if (normalized === undefined) normalized = attr.normalized;
                if (normalized !== attr.normalized) return null;
                arrayLength += attr.array.length;
            }
            const array = new TypedArray(arrayLength);
            let offset = 0;
            for (let i = 0; i < attributes.length; ++i) {
                array.set(attributes[i].array, offset);
                offset += attributes[i].array.length;
            }
            return new THREE.BufferAttribute(array, itemSize, normalized);
        }
    };
    THREE.BufferGeometryUtils = BufferGeometryUtils;
    console.log('✅ BufferGeometryUtils cargado');
})();
