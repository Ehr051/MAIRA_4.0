/**
 * MAIRA 4.0 - OrbitControls Customizado
 * Basado en THREE.OrbitControls pero adaptado para nuestro sistema
 * Sin dependencias ES6 modules
 */

class OrbitControls {
    constructor(camera, domElement) {
        if (!camera) {
            throw new Error('OrbitControls: camera es requerido');
        }
        
        if (!domElement) {
            console.warn('OrbitControls: domElement no proporcionado, usando document');
            domElement = document;
        }

        this.camera = camera;
        this.domElement = domElement;
        
        // Configuración por defecto
        this.enabled = true;
        this.enableDamping = true;
        this.dampingFactor = 0.05;
        this.enableZoom = true;
        this.zoomSpeed = 1.0;
        this.minDistance = 0;
        this.maxDistance = Infinity;
        this.enableRotate = true;
        this.rotateSpeed = 1.0;
        this.enablePan = true;
        this.panSpeed = 1.0;
        this.autoRotate = false;
        this.autoRotateSpeed = 2.0;
        
        // Límites verticales
        this.minPolarAngle = 0;
        this.maxPolarAngle = Math.PI;
        
        // Límites horizontales
        this.minAzimuthAngle = -Infinity;
        this.maxAzimuthAngle = Infinity;
        
        // Target
        this.target = new THREE.Vector3();
        
        // Estado interno
        this._spherical = new THREE.Spherical();
        this._sphericalDelta = new THREE.Spherical();
        this._scale = 1;
        this._panOffset = new THREE.Vector3();
        this._zoomChanged = false;
        this._rotateStart = new THREE.Vector2();
        this._rotateEnd = new THREE.Vector2();
        this._rotateDelta = new THREE.Vector2();
        this._panStart = new THREE.Vector2();
        this._panEnd = new THREE.Vector2();
        this._panDelta = new THREE.Vector2();
        this._dollyStart = new THREE.Vector2();
        this._dollyEnd = new THREE.Vector2();
        this._dollyDelta = new THREE.Vector2();
        
        // Estados de botones
        this._state = {
            NONE: -1,
            ROTATE: 0,
            DOLLY: 1,
            PAN: 2,
            TOUCH_ROTATE: 3,
            TOUCH_PAN: 4,
            TOUCH_DOLLY_PAN: 5,
            TOUCH_DOLLY_ROTATE: 6
        };
        this._currentState = this._state.NONE;
        
        // Configuración de botones de mouse
        this.mouseButtons = {
            LEFT: 0,    // ROTATE
            MIDDLE: 1,  // DOLLY
            RIGHT: 2    // PAN
        };
        
        // Configuración de toques
        this.touches = {
            ONE: 0,    // TOUCH_ROTATE
            TWO: 1     // TOUCH_DOLLY_PAN
        };
        
        // Event listeners
        this._onMouseDown = this.onMouseDown.bind(this);
        this._onMouseMove = this.onMouseMove.bind(this);
        this._onMouseUp = this.onMouseUp.bind(this);
        this._onMouseWheel = this.onMouseWheel.bind(this);
        this._onTouchStart = this.onTouchStart.bind(this);
        this._onTouchMove = this.onTouchMove.bind(this);
        this._onTouchEnd = this.onTouchEnd.bind(this);
        this._onContextMenu = this.onContextMenu.bind(this);
        
        this.connect();
        this.update();
        
        console.log('✅ MAIRA OrbitControls inicializado');
    }
    
    connect() {
        this.domElement.addEventListener('contextmenu', this._onContextMenu);
        this.domElement.addEventListener('mousedown', this._onMouseDown);
        this.domElement.addEventListener('wheel', this._onMouseWheel);
        this.domElement.addEventListener('touchstart', this._onTouchStart);
        this.domElement.addEventListener('touchend', this._onTouchEnd);
        this.domElement.addEventListener('touchmove', this._onTouchMove);
    }
    
    disconnect() {
        this.domElement.removeEventListener('contextmenu', this._onContextMenu);
        this.domElement.removeEventListener('mousedown', this._onMouseDown);
        this.domElement.removeEventListener('wheel', this._onMouseWheel);
        this.domElement.removeEventListener('touchstart', this._onTouchStart);
        this.domElement.removeEventListener('touchend', this._onTouchEnd);
        this.domElement.removeEventListener('touchmove', this._onTouchMove);
        
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
    }
    
    dispose() {
        this.disconnect();
    }
    
    getPolarAngle() {
        return this._spherical.phi;
    }
    
    getAzimuthalAngle() {
        return this._spherical.theta;
    }
    
    getDistance() {
        return this.camera.position.distanceTo(this.target);
    }
    
    saveState() {
        this._target0 = this.target.clone();
        this._position0 = this.camera.position.clone();
        this._zoom0 = this.camera.zoom;
    }
    
    reset() {
        this.target.copy(this._target0);
        this.camera.position.copy(this._position0);
        this.camera.zoom = this._zoom0;
        this.camera.updateProjectionMatrix();
        this.update();
        this._currentState = this._state.NONE;
    }
    
    update() {
        const offset = new THREE.Vector3();
        const quat = new THREE.Quaternion().setFromUnitVectors(this.camera.up, new THREE.Vector3(0, 1, 0));
        const quatInverse = quat.clone().invert();
        
        if (!this._lastPosition) this._lastPosition = new THREE.Vector3();
        if (!this._lastQuaternion) this._lastQuaternion = new THREE.Quaternion();
        
        const twoPI = 2 * Math.PI;
        const position = this.camera.position;
        
        offset.copy(position).sub(this.target);
        offset.applyQuaternion(quat);
        
        this._spherical.setFromVector3(offset);
        
        if (this.autoRotate && this._currentState === this._state.NONE) {
            this.rotateLeft(this.getAutoRotationAngle());
        }
        
        if (this.enableDamping) {
            this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor;
            this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor;
        } else {
            this._spherical.theta += this._sphericalDelta.theta;
            this._spherical.phi += this._sphericalDelta.phi;
        }
        
        // Aplicar límites
        let min = this.minAzimuthAngle;
        let max = this.maxAzimuthAngle;
        
        if (isFinite(min) && isFinite(max)) {
            if (min < -Math.PI) min += twoPI;
            else if (min > Math.PI) min -= twoPI;
            
            if (max < -Math.PI) max += twoPI;
            else if (max > Math.PI) max -= twoPI;
            
            if (min <= max) {
                this._spherical.theta = Math.max(min, Math.min(max, this._spherical.theta));
            } else {
                this._spherical.theta = (this._spherical.theta > (min + max) / 2) ?
                    Math.max(min, this._spherical.theta) :
                    Math.min(max, this._spherical.theta);
            }
        }
        
        this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi));
        this._spherical.makeSafe();
        this._spherical.radius *= this._scale;
        this._spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this._spherical.radius));
        
        // Aplicar pan offset
        if (this.enableDamping) {
            this.target.addScaledVector(this._panOffset, this.dampingFactor);
        } else {
            this.target.add(this._panOffset);
        }
        
        offset.setFromSpherical(this._spherical);
        offset.applyQuaternion(quatInverse);
        
        position.copy(this.target).add(offset);
        this.camera.lookAt(this.target);
        
        if (this.enableDamping) {
            this._sphericalDelta.theta *= (1 - this.dampingFactor);
            this._sphericalDelta.phi *= (1 - this.dampingFactor);
            this._panOffset.multiplyScalar(1 - this.dampingFactor);
        } else {
            this._sphericalDelta.set(0, 0, 0);
            this._panOffset.set(0, 0, 0);
        }
        
        this._scale = 1;
        
        // Verificar si hubo cambios
        if (this._zoomChanged ||
            this._lastPosition.distanceToSquared(this.camera.position) > 1e-6 ||
            8 * (1 - this._lastQuaternion.dot(this.camera.quaternion)) > 1e-6) {
            
            this._lastPosition.copy(this.camera.position);
            this._lastQuaternion.copy(this.camera.quaternion);
            this._zoomChanged = false;
            
            return true;
        }
        
        return false;
    }
    
    getAutoRotationAngle() {
        return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
    }
    
    getZoomScale() {
        return Math.pow(0.95, this.zoomSpeed);
    }
    
    rotateLeft(angle) {
        this._sphericalDelta.theta -= angle;
    }
    
    rotateUp(angle) {
        this._sphericalDelta.phi -= angle;
    }
    
    panLeft(distance, objectMatrix) {
        const v = new THREE.Vector3();
        v.setFromMatrixColumn(objectMatrix, 0);
        v.multiplyScalar(-distance);
        this._panOffset.add(v);
    }
    
    panUp(distance, objectMatrix) {
        const v = new THREE.Vector3();
        if (this.screenSpacePanning === true) {
            v.setFromMatrixColumn(objectMatrix, 1);
        } else {
            v.setFromMatrixColumn(objectMatrix, 0);
            v.crossVectors(this.camera.up, v);
        }
        v.multiplyScalar(distance);
        this._panOffset.add(v);
    }
    
    pan(deltaX, deltaY) {
        const element = this.domElement;
        
        if (this.camera.isPerspectiveCamera) {
            const position = this.camera.position;
            const offset = position.clone().sub(this.target);
            let targetDistance = offset.length();
            
            targetDistance *= Math.tan((this.camera.fov / 2) * Math.PI / 180.0);
            
            this.panLeft(2 * deltaX * targetDistance / element.clientHeight, this.camera.matrix);
            this.panUp(2 * deltaY * targetDistance / element.clientHeight, this.camera.matrix);
        } else if (this.camera.isOrthographicCamera) {
            this.panLeft(deltaX * (this.camera.right - this.camera.left) / this.camera.zoom / element.clientWidth, this.camera.matrix);
            this.panUp(deltaY * (this.camera.top - this.camera.bottom) / this.camera.zoom / element.clientHeight, this.camera.matrix);
        } else {
            console.warn('MAIRA OrbitControls: unknown camera type');
        }
    }
    
    dollyOut(dollyScale) {
        if (this.camera.isPerspectiveCamera || this.camera.isOrthographicCamera) {
            this._scale /= dollyScale;
        } else {
            console.warn('MAIRA OrbitControls: unknown camera type');
        }
    }
    
    dollyIn(dollyScale) {
        if (this.camera.isPerspectiveCamera || this.camera.isOrthographicCamera) {
            this._scale *= dollyScale;
        } else {
            console.warn('MAIRA OrbitControls: unknown camera type');
        }
    }
    
    handleMouseDownRotate(event) {
        this._rotateStart.set(event.clientX, event.clientY);
    }
    
    handleMouseDownDolly(event) {
        this._dollyStart.set(event.clientX, event.clientY);
    }
    
    handleMouseDownPan(event) {
        this._panStart.set(event.clientX, event.clientY);
    }
    
    handleMouseMoveRotate(event) {
        this._rotateEnd.set(event.clientX, event.clientY);
        this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
        
        const element = this.domElement;
        this.rotateLeft(2 * Math.PI * this._rotateDelta.x / element.clientHeight);
        this.rotateUp(2 * Math.PI * this._rotateDelta.y / element.clientHeight);
        
        this._rotateStart.copy(this._rotateEnd);
        this.update();
    }
    
    handleMouseMoveDolly(event) {
        this._dollyEnd.set(event.clientX, event.clientY);
        this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart);
        
        if (this._dollyDelta.y > 0) {
            this.dollyOut(this.getZoomScale());
        } else if (this._dollyDelta.y < 0) {
            this.dollyIn(this.getZoomScale());
        }
        
        this._dollyStart.copy(this._dollyEnd);
        this.update();
    }
    
    handleMouseMovePan(event) {
        this._panEnd.set(event.clientX, event.clientY);
        this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed);
        this.pan(this._panDelta.x, this._panDelta.y);
        this._panStart.copy(this._panEnd);
        this.update();
    }
    
    handleMouseWheel(event) {
        if (event.deltaY < 0) {
            this.dollyIn(this.getZoomScale());
        } else if (event.deltaY > 0) {
            this.dollyOut(this.getZoomScale());
        }
        this.update();
    }
    
    // Event handlers
    onMouseDown(event) {
        if (!this.enabled) return;
        
        event.preventDefault();
        
        if (event.button === this.mouseButtons.LEFT) {
            if (this.enableRotate === false) return;
            this.handleMouseDownRotate(event);
            this._currentState = this._state.ROTATE;
        } else if (event.button === this.mouseButtons.MIDDLE) {
            if (this.enableZoom === false) return;
            this.handleMouseDownDolly(event);
            this._currentState = this._state.DOLLY;
        } else if (event.button === this.mouseButtons.RIGHT) {
            if (this.enablePan === false) return;
            this.handleMouseDownPan(event);
            this._currentState = this._state.PAN;
        }
        
        if (this._currentState !== this._state.NONE) {
            document.addEventListener('mousemove', this._onMouseMove);
            document.addEventListener('mouseup', this._onMouseUp);
        }
    }
    
    onMouseMove(event) {
        if (!this.enabled) return;
        
        event.preventDefault();
        
        if (this._currentState === this._state.ROTATE) {
            if (this.enableRotate === false) return;
            this.handleMouseMoveRotate(event);
        } else if (this._currentState === this._state.DOLLY) {
            if (this.enableZoom === false) return;
            this.handleMouseMoveDolly(event);
        } else if (this._currentState === this._state.PAN) {
            if (this.enablePan === false) return;
            this.handleMouseMovePan(event);
        }
    }
    
    onMouseUp(event) {
        if (!this.enabled) return;
        
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
        
        this._currentState = this._state.NONE;
    }
    
    onMouseWheel(event) {
        if (!this.enabled || !this.enableZoom || 
            (this._currentState !== this._state.NONE && this._currentState !== this._state.ROTATE)) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        this.handleMouseWheel(event);
    }
    
    onTouchStart(event) {
        if (!this.enabled) return;
        
        // Implementación básica de touch - puede expandirse
        event.preventDefault();
    }
    
    onTouchMove(event) {
        if (!this.enabled) return;
        
        event.preventDefault();
    }
    
    onTouchEnd(event) {
        if (!this.enabled) return;
        
        event.preventDefault();
    }
    
    onContextMenu(event) {
        if (!this.enabled) return;
        
        event.preventDefault();
    }
}

// Para mantener compatibilidad con THREE.OrbitControls
if (typeof THREE !== 'undefined') {
    THREE.OrbitControls = OrbitControls;
}

// Export para diferentes sistemas de módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrbitControls;
}

if (typeof window !== 'undefined') {
    window.OrbitControls = OrbitControls;
}

console.log('📦 MAIRA OrbitControls v1.0 cargado correctamente');
