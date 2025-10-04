/**
 * Object3D Standalone - Sin dependencias de EventDispatcher
 * Versión completamente independiente y corregida
 */

(function() {
    'use strict';
    
    if (typeof THREE === 'undefined') {
        console.error('THREE.js debe cargarse antes que Object3D');
        return;
    }

    // Event dispatcher simple interno
    function SimpleEventDispatcher() {
        this._listeners = {};
    }

    SimpleEventDispatcher.prototype = {
        addEventListener: function(type, listener) {
            if (!this._listeners[type]) {
                this._listeners[type] = [];
            }
            this._listeners[type].push(listener);
        },

        removeEventListener: function(type, listener) {
            if (!this._listeners[type]) return;
            var index = this._listeners[type].indexOf(listener);
            if (index !== -1) {
                this._listeners[type].splice(index, 1);
            }
        },

        dispatchEvent: function(event) {
            if (!this._listeners[event.type]) return;
            var listeners = this._listeners[event.type].slice();
            for (var i = 0; i < listeners.length; i++) {
                try {
                    listeners[i].call(this, event);
                } catch (e) {
                    console.warn('Error in event listener:', e);
                }
            }
        }
    };

    // Función para generar UUID
    function generateUUID() {
        var lut = [];
        for (var i = 0; i < 256; i++) {
            lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
        }
        
        var d0 = Math.random() * 0xffffffff | 0;
        var d1 = Math.random() * 0xffffffff | 0;
        var d2 = Math.random() * 0xffffffff | 0;
        var d3 = Math.random() * 0xffffffff | 0;
        
        var uuid = lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
            lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
            lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
            lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
        
        return uuid.toLowerCase();
    }

    var _object3DId = 0;

    var _v1 = new THREE.Vector3();
    var _q1 = new THREE.Quaternion();
    var _m1 = new THREE.Matrix4();
    var _target = new THREE.Vector3();

    var _position = new THREE.Vector3();
    var _scale = new THREE.Vector3();
    var _quaternion = new THREE.Quaternion();

    var _xAxis = new THREE.Vector3(1, 0, 0);
    var _yAxis = new THREE.Vector3(0, 1, 0);
    var _zAxis = new THREE.Vector3(0, 0, 1);

    // Eventos predefinidos
    var _addedEvent = { type: 'added' };
    var _removedEvent = { type: 'removed' };
    var _childaddedEvent = { type: 'childadded', child: null };
    var _childremovedEvent = { type: 'childremoved', child: null };

    /**
     * Object3D - Constructor standalone
     */
    function Object3D() {
        // Usar nuestro event dispatcher simple
        SimpleEventDispatcher.call(this);

        // Flag de identificación
        this.isObject3D = true;

        // ID único
        Object.defineProperty(this, 'id', { value: _object3DId++ });

        // UUID único
        this.uuid = generateUUID();

        // Propiedades básicas
        this.name = '';
        this.type = 'Object3D';
        this.parent = null;
        this.children = [];

        // Vector UP por defecto
        this.up = Object3D.DEFAULT_UP.clone();

        // Transformaciones locales
        var position = new THREE.Vector3();
        var rotation = new THREE.Euler();
        var quaternion = new THREE.Quaternion();
        var scale = new THREE.Vector3(1, 1, 1);

        // Sincronización rotation <-> quaternion (con verificación)
        function onRotationChange() {
            if (quaternion && quaternion.setFromEuler) {
                quaternion.setFromEuler(rotation, false);
            }
        }

        function onQuaternionChange() {
            if (rotation && rotation.setFromQuaternion) {
                rotation.setFromQuaternion(quaternion, undefined, false);
            }
        }

        // Solo configurar callbacks si existen
        if (rotation && rotation._onChange) {
            rotation._onChange(onRotationChange);
        }
        if (quaternion && quaternion._onChange) {
            quaternion._onChange(onQuaternionChange);
        }

        // Definir propiedades
        Object.defineProperties(this, {
            position: {
                configurable: true,
                enumerable: true,
                value: position
            },
            rotation: {
                configurable: true,
                enumerable: true,
                value: rotation
            },
            quaternion: {
                configurable: true,
                enumerable: true,
                value: quaternion
            },
            scale: {
                configurable: true,
                enumerable: true,
                value: scale
            },
            modelViewMatrix: {
                value: new THREE.Matrix4()
            },
            normalMatrix: {
                value: new THREE.Matrix3()
            }
        });

        // Matrices de transformación
        this.matrix = new THREE.Matrix4();
        this.matrixWorld = new THREE.Matrix4();

        // Configuración de matrices
        this.matrixAutoUpdate = Object3D.DEFAULT_MATRIX_AUTO_UPDATE;
        this.matrixWorldAutoUpdate = Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE;
        this.matrixWorldNeedsUpdate = false;

        // Configuración de renderizado
        this.layers = new THREE.Layers();
        this.visible = true;
        this.castShadow = false;
        this.receiveShadow = false;
        this.frustumCulled = true;
        this.renderOrder = 0;

        // Animaciones y datos de usuario
        this.animations = [];
        this.userData = {};

        // Materiales personalizados
        this.customDepthMaterial = undefined;
        this.customDistanceMaterial = undefined;
    }

    // Herencia de SimpleEventDispatcher
    Object3D.prototype = Object.create(SimpleEventDispatcher.prototype);
    Object3D.prototype.constructor = Object3D;

    // Callbacks de renderizado
    Object3D.prototype.onBeforeShadow = function() {};
    Object3D.prototype.onAfterShadow = function() {};
    Object3D.prototype.onBeforeRender = function() {};
    Object3D.prototype.onAfterRender = function() {};

    // Métodos de transformación
    Object3D.prototype.applyMatrix4 = function(matrix) {
        if (this.matrixAutoUpdate) this.updateMatrix();
        this.matrix.premultiply(matrix);
        this.matrix.decompose(this.position, this.quaternion, this.scale);
        return this;
    };

    Object3D.prototype.applyQuaternion = function(q) {
        this.quaternion.premultiply(q);
        return this;
    };

    Object3D.prototype.setRotationFromAxisAngle = function(axis, angle) {
        this.quaternion.setFromAxisAngle(axis, angle);
    };

    Object3D.prototype.setRotationFromEuler = function(euler) {
        this.quaternion.setFromEuler(euler, true);
    };

    Object3D.prototype.setRotationFromMatrix = function(m) {
        this.quaternion.setFromRotationMatrix(m);
    };

    Object3D.prototype.setRotationFromQuaternion = function(q) {
        this.quaternion.copy(q);
    };

    Object3D.prototype.rotateOnAxis = function(axis, angle) {
        _q1.setFromAxisAngle(axis, angle);
        this.quaternion.multiply(_q1);
        return this;
    };

    Object3D.prototype.rotateOnWorldAxis = function(axis, angle) {
        _q1.setFromAxisAngle(axis, angle);
        this.quaternion.premultiply(_q1);
        return this;
    };

    Object3D.prototype.rotateX = function(angle) {
        return this.rotateOnAxis(_xAxis, angle);
    };

    Object3D.prototype.rotateY = function(angle) {
        return this.rotateOnAxis(_yAxis, angle);
    };

    Object3D.prototype.rotateZ = function(angle) {
        return this.rotateOnAxis(_zAxis, angle);
    };

    Object3D.prototype.translateOnAxis = function(axis, distance) {
        _v1.copy(axis).applyQuaternion(this.quaternion);
        this.position.add(_v1.multiplyScalar(distance));
        return this;
    };

    Object3D.prototype.translateX = function(distance) {
        return this.translateOnAxis(_xAxis, distance);
    };

    Object3D.prototype.translateY = function(distance) {
        return this.translateOnAxis(_yAxis, distance);
    };

    Object3D.prototype.translateZ = function(distance) {
        return this.translateOnAxis(_zAxis, distance);
    };

    Object3D.prototype.localToWorld = function(vector) {
        this.updateWorldMatrix(true, false);
        return vector.applyMatrix4(this.matrixWorld);
    };

    Object3D.prototype.worldToLocal = function(vector) {
        this.updateWorldMatrix(true, false);
        return vector.applyMatrix4(_m1.copy(this.matrixWorld).invert());
    };

    Object3D.prototype.lookAt = function(x, y, z) {
        if (x && x.isVector3) {
            _target.copy(x);
        } else {
            _target.set(x, y, z);
        }

        var parent = this.parent;
        this.updateWorldMatrix(true, false);
        _position.setFromMatrixPosition(this.matrixWorld);

        if (this.isCamera || this.isLight) {
            _m1.lookAt(_position, _target, this.up);
        } else {
            _m1.lookAt(_target, _position, this.up);
        }

        this.quaternion.setFromRotationMatrix(_m1);

        if (parent) {
            _m1.extractRotation(parent.matrixWorld);
            _q1.setFromRotationMatrix(_m1);
            this.quaternion.premultiply(_q1.invert());
        }
    };

    // Método ADD - CORREGIDO
    Object3D.prototype.add = function(object) {
        if (arguments.length > 1) {
            for (var i = 0; i < arguments.length; i++) {
                this.add(arguments[i]);
            }
            return this;
        }

        if (object === this) {
            console.error('THREE.Object3D.add: object can\'t be added as a child of itself.', object);
            return this;
        }

        // Validación estricta y mejorada
        if (object && object.isObject3D === true) {
            // Remover del padre actual si existe
            if (object.parent !== null) {
                object.parent.remove(object);
            }
            
            object.parent = this;
            this.children.push(object);

            // Dispatch events de forma segura
            try {
                if (object.dispatchEvent && _addedEvent) {
                    object.dispatchEvent(_addedEvent);
                }
                
                if (this.dispatchEvent && _childaddedEvent) {
                    _childaddedEvent.child = object;
                    this.dispatchEvent(_childaddedEvent);
                    _childaddedEvent.child = null;
                }
            } catch (e) {
                console.warn('Error dispatching add events:', e);
            }
        } else {
            console.error('THREE.Object3D.add: object not an instance of THREE.Object3D.', object);
            console.log('Object details:', {
                object: object,
                type: typeof object,
                isObject3D: object ? object.isObject3D : 'undefined',
                constructor: object ? object.constructor.name : 'undefined'
            });
        }

        return this;
    };

    Object3D.prototype.remove = function(object) {
        if (arguments.length > 1) {
            for (var i = 0; i < arguments.length; i++) {
                this.remove(arguments[i]);
            }
            return this;
        }

        var index = this.children.indexOf(object);
        if (index !== -1) {
            object.parent = null;
            this.children.splice(index, 1);

            // Dispatch events de forma segura
            try {
                if (object.dispatchEvent && _removedEvent) {
                    object.dispatchEvent(_removedEvent);
                }
                
                if (this.dispatchEvent && _childremovedEvent) {
                    _childremovedEvent.child = object;
                    this.dispatchEvent(_childremovedEvent);
                    _childremovedEvent.child = null;
                }
            } catch (e) {
                console.warn('Error dispatching remove events:', e);
            }
        }

        return this;
    };

    Object3D.prototype.removeFromParent = function() {
        var parent = this.parent;
        if (parent !== null) {
            parent.remove(this);
        }
        return this;
    };

    Object3D.prototype.clear = function() {
        return this.remove.apply(this, this.children);
    };

    Object3D.prototype.attach = function(object) {
        this.updateWorldMatrix(true, false);
        _m1.copy(this.matrixWorld).invert();

        if (object.parent !== null) {
            object.parent.updateWorldMatrix(true, false);
            _m1.multiply(object.parent.matrixWorld);
        }

        object.applyMatrix4(_m1);
        
        if (object.removeFromParent) {
            object.removeFromParent();
        }
        object.parent = this;
        this.children.push(object);
        
        if (object.updateWorldMatrix) {
            object.updateWorldMatrix(false, true);
        }

        // Dispatch events de forma segura
        try {
            if (object.dispatchEvent && _addedEvent) {
                object.dispatchEvent(_addedEvent);
            }
            
            if (this.dispatchEvent && _childaddedEvent) {
                _childaddedEvent.child = object;
                this.dispatchEvent(_childaddedEvent);
                _childaddedEvent.child = null;
            }
        } catch (e) {
            console.warn('Error dispatching attach events:', e);
        }

        return this;
    };

    // Métodos de búsqueda
    Object3D.prototype.getObjectById = function(id) {
        return this.getObjectByProperty('id', id);
    };

    Object3D.prototype.getObjectByName = function(name) {
        return this.getObjectByProperty('name', name);
    };

    Object3D.prototype.getObjectByProperty = function(name, value) {
        if (this[name] === value) return this;

        for (var i = 0, l = this.children.length; i < l; i++) {
            var child = this.children[i];
            var object = child.getObjectByProperty(name, value);
            if (object !== undefined) {
                return object;
            }
        }

        return undefined;
    };

    Object3D.prototype.getObjectsByProperty = function(name, value, result) {
        if (result === undefined) result = [];
        if (this[name] === value) result.push(this);

        var children = this.children;
        for (var i = 0, l = children.length; i < l; i++) {
            children[i].getObjectsByProperty(name, value, result);
        }

        return result;
    };

    Object3D.prototype.getWorldPosition = function(target) {
        this.updateWorldMatrix(true, false);
        return target.setFromMatrixPosition(this.matrixWorld);
    };

    Object3D.prototype.getWorldQuaternion = function(target) {
        this.updateWorldMatrix(true, false);
        this.matrixWorld.decompose(_position, target, _scale);
        return target;
    };

    Object3D.prototype.getWorldScale = function(target) {
        this.updateWorldMatrix(true, false);
        this.matrixWorld.decompose(_position, _quaternion, target);
        return target;
    };

    Object3D.prototype.getWorldDirection = function(target) {
        this.updateWorldMatrix(true, false);
        var e = this.matrixWorld.elements;
        return target.set(e[8], e[9], e[10]).normalize();
    };

    Object3D.prototype.raycast = function() {};

    Object3D.prototype.traverse = function(callback) {
        callback(this);
        var children = this.children;
        for (var i = 0, l = children.length; i < l; i++) {
            children[i].traverse(callback);
        }
    };

    Object3D.prototype.traverseVisible = function(callback) {
        if (this.visible === false) return;
        callback(this);
        var children = this.children;
        for (var i = 0, l = children.length; i < l; i++) {
            children[i].traverseVisible(callback);
        }
    };

    Object3D.prototype.traverseAncestors = function(callback) {
        var parent = this.parent;
        if (parent !== null) {
            callback(parent);
            parent.traverseAncestors(callback);
        }
    };

    Object3D.prototype.updateMatrix = function() {
        this.matrix.compose(this.position, this.quaternion, this.scale);
        this.matrixWorldNeedsUpdate = true;
    };

    Object3D.prototype.updateMatrixWorld = function(force) {
        if (this.matrixAutoUpdate) this.updateMatrix();

        if (this.matrixWorldNeedsUpdate || force) {
            if (this.matrixWorldAutoUpdate === true) {
                if (this.parent === null) {
                    this.matrixWorld.copy(this.matrix);
                } else {
                    this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
                }
            }
            this.matrixWorldNeedsUpdate = false;
            force = true;
        }

        var children = this.children;
        for (var i = 0, l = children.length; i < l; i++) {
            var child = children[i];
            if (child.updateMatrixWorld) {
                child.updateMatrixWorld(force);
            }
        }
    };

    Object3D.prototype.updateWorldMatrix = function(updateParents, updateChildren) {
        var parent = this.parent;

        if (updateParents === true && parent !== null && parent.updateWorldMatrix) {
            parent.updateWorldMatrix(true, false);
        }

        if (this.matrixAutoUpdate) this.updateMatrix();

        if (this.matrixWorldAutoUpdate === true) {
            if (this.parent === null) {
                this.matrixWorld.copy(this.matrix);
            } else {
                this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
            }
        }

        if (updateChildren === true) {
            var children = this.children;
            for (var i = 0, l = children.length; i < l; i++) {
                var child = children[i];
                if (child.updateWorldMatrix) {
                    child.updateWorldMatrix(false, true);
                }
            }
        }
    };

    Object3D.prototype.clone = function(recursive) {
        return new this.constructor().copy(this, recursive);
    };

    Object3D.prototype.copy = function(source, recursive) {
        if (recursive === undefined) recursive = true;

        this.name = source.name;
        this.up.copy(source.up);
        this.position.copy(source.position);
        this.rotation.order = source.rotation.order;
        this.quaternion.copy(source.quaternion);
        this.scale.copy(source.scale);
        this.matrix.copy(source.matrix);
        this.matrixWorld.copy(source.matrixWorld);
        this.matrixAutoUpdate = source.matrixAutoUpdate;
        this.matrixWorldAutoUpdate = source.matrixWorldAutoUpdate;
        this.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;
        this.layers.mask = source.layers.mask;
        this.visible = source.visible;
        this.castShadow = source.castShadow;
        this.receiveShadow = source.receiveShadow;
        this.frustumCulled = source.frustumCulled;
        this.renderOrder = source.renderOrder;
        this.animations = source.animations.slice();
        this.userData = JSON.parse(JSON.stringify(source.userData));

        if (recursive === true) {
            for (var i = 0; i < source.children.length; i++) {
                var child = source.children[i];
                this.add(child.clone());
            }
        }

        return this;
    };

    Object3D.prototype.toJSON = function(meta) {
        var isRootObject = (meta === undefined || typeof meta === 'string');
        var output = {};

        if (isRootObject) {
            meta = {
                geometries: {},
                materials: {},
                textures: {},
                images: {},
                shapes: {},
                skeletons: {},
                animations: {},
                nodes: {}
            };

            output.metadata = {
                version: 4.6,
                type: 'Object',
                generator: 'Object3D.toJSON'
            };
        }

        var object = {};

        object.uuid = this.uuid;
        object.type = this.type;

        if (this.name !== '') object.name = this.name;
        if (this.castShadow === true) object.castShadow = true;
        if (this.receiveShadow === true) object.receiveShadow = true;
        if (this.visible === false) object.visible = false;
        if (this.frustumCulled === false) object.frustumCulled = false;
        if (this.renderOrder !== 0) object.renderOrder = this.renderOrder;
        if (Object.keys(this.userData).length > 0) object.userData = this.userData;

        object.layers = this.layers.mask;
        object.matrix = this.matrix.toArray();
        object.up = this.up.toArray();

        if (this.matrixAutoUpdate === false) object.matrixAutoUpdate = false;

        if (this.children.length > 0) {
            object.children = [];
            for (var i = 0; i < this.children.length; i++) {
                object.children.push(this.children[i].toJSON(meta).object);
            }
        }

        if (this.animations.length > 0) {
            object.animations = [];
            for (var i = 0; i < this.animations.length; i++) {
                var animation = this.animations[i];
                object.animations.push(serialize(meta.animations, animation));
            }
        }

        if (isRootObject) {
            var geometries = extractFromCache(meta.geometries);
            var materials = extractFromCache(meta.materials);
            var textures = extractFromCache(meta.textures);
            var images = extractFromCache(meta.images);
            var shapes = extractFromCache(meta.shapes);
            var skeletons = extractFromCache(meta.skeletons);
            var animations = extractFromCache(meta.animations);
            var nodes = extractFromCache(meta.nodes);

            if (geometries.length > 0) output.geometries = geometries;
            if (materials.length > 0) output.materials = materials;
            if (textures.length > 0) output.textures = textures;
            if (images.length > 0) output.images = images;
            if (shapes.length > 0) output.shapes = shapes;
            if (skeletons.length > 0) output.skeletons = skeletons;
            if (animations.length > 0) output.animations = animations;
            if (nodes.length > 0) output.nodes = nodes;
        }

        output.object = object;
        return output;

        function serialize(library, element) {
            if (library[element.uuid] === undefined) {
                library[element.uuid] = element.toJSON(meta);
            }
            return element.uuid;
        }

        function extractFromCache(cache) {
            var values = [];
            for (var key in cache) {
                var data = cache[key];
                delete data.metadata;
                values.push(data);
            }
            return values;
        }
    };

    // Propiedades estáticas
    Object3D.DEFAULT_UP = new THREE.Vector3(0, 1, 0);
    Object3D.DEFAULT_MATRIX_AUTO_UPDATE = true;
    Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE = true;

    // Reemplazar completamente el Object3D de THREE
    THREE.Object3D = Object3D;

    console.log('Object3D standalone registrado completamente en THREE.Object3D');

})();