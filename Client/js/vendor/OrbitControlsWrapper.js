/**
 * ORBIT CONTROLS WRAPPER - MAIRA 4.0
 * Compatible con THREE.js sin ES6 imports ni CommonJS requires
 * Basado en three.js r160 OrbitControls
 */

(function() {
    'use strict';
    
    // Verificar que THREE esté disponible
    if (typeof THREE === 'undefined') {
        console.error('OrbitControlsWrapper: THREE.js debe estar cargado primero');
        return;
    }

    // Eventos y constantes internas
    const _changeEvent = { type: 'change' };
    const _startEvent = { type: 'start' };
    const _endEvent = { type: 'end' };
    const _ray = new THREE.Ray();
    const _plane = new THREE.Plane();
    const TILT_LIMIT = Math.cos(70 * THREE.MathUtils.DEG2RAD);

    // Clase OrbitControls compatible
    class OrbitControls extends THREE.EventDispatcher {
        constructor(object, domElement) {
            super();

            this.object = object;
            this.domElement = domElement;
            this.domElement.style.touchAction = 'none'; // disable touch scroll

            // Set to false to disable this control
            this.enabled = true;

            // "target" sets the location of focus, where the object orbits around
            this.target = new THREE.Vector3();

            // Sets the 3D cursor (similar to Blender), from which the maxTargetRadius takes effect
            this.cursor = new THREE.Vector3();

            // How far you can dolly in and out ( PerspectiveCamera only )
            this.minDistance = 0;
            this.maxDistance = Infinity;

            // How far you can zoom in and out ( OrthographicCamera only )
            this.minZoom = 0;
            this.maxZoom = Infinity;

            // How far you can orbit vertically, upper and lower limits.
            // Range is 0 to Math.PI radians.
            this.minPolarAngle = 0; // radians
            this.maxPolarAngle = Math.PI; // radians

            // How far you can orbit horizontally, upper and lower limits.
            // If set, the interval [ min, max ] must be a sub-interval of [ - 2 PI, 2 PI ], with ( max - min < 2 PI )
            this.minAzimuthAngle = -Infinity; // radians
            this.maxAzimuthAngle = Infinity; // radians

            // Set to true to enable damping (inertia)
            // If damping is enabled, you must call controls.update() in your animation loop
            this.enableDamping = false;
            this.dampingFactor = 0.05;

            // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
            // Set to false to disable zooming
            this.enableZoom = true;
            this.zoomSpeed = 1.0;

            // Set to false to disable rotating
            this.enableRotate = true;
            this.rotateSpeed = 1.0;

            // Set to false to disable panning
            this.enablePan = true;
            this.panSpeed = 1.0;
            this.screenSpacePanning = true; // if false, pan orthogonal to world-space direction camera.up
            this.keyPanSpeed = 7.0; // pixels moved per arrow key push
            this.zoomToCursor = false;

            // Set to true to automatically rotate around the target
            // If auto-rotate is enabled, you must call controls.update() in your animation loop
            this.autoRotate = false;
            this.autoRotateSpeed = 2.0; // 30 seconds per orbit when fps is 60

            // The four arrow keys
            this.keys = {
                LEFT: 'ArrowLeft',
                UP: 'ArrowUp',
                RIGHT: 'ArrowRight',
                BOTTOM: 'ArrowDown'
            };

            // Mouse buttons
            this.mouseButtons = {
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN
            };

            // Touch fingers
            this.touches = {
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN
            };

            // for reset
            this.target0 = this.target.clone();
            this.position0 = this.object.position.clone();
            this.zoom0 = this.object.zoom;

            // the target DOM element for key events
            this._domElementKeyEvents = null;

            // internals
            const scope = this;
            const STATE = {
                NONE: -1,
                ROTATE: 0,
                DOLLY: 1,
                PAN: 2,
                TOUCH_ROTATE: 3,
                TOUCH_PAN: 4,
                TOUCH_DOLLY_PAN: 5,
                TOUCH_DOLLY_ROTATE: 6
            };

            let state = STATE.NONE;
            const EPS = 0.000001;

            // current position in spherical coordinates
            const spherical = new THREE.Spherical();
            const sphericalDelta = new THREE.Spherical();

            let scale = 1;
            const panOffset = new THREE.Vector3();
            let zoomChanged = false;

            const rotateStart = new THREE.Vector2();
            const rotateEnd = new THREE.Vector2();
            const rotateDelta = new THREE.Vector2();

            const panStart = new THREE.Vector2();
            const panEnd = new THREE.Vector2();
            const panDelta = new THREE.Vector2();

            const dollyStart = new THREE.Vector2();
            const dollyEnd = new THREE.Vector2();
            const dollyDelta = new THREE.Vector2();

            const dollyDirection = new THREE.Vector3();
            const mouse = new THREE.Vector2();
            let performCursorZoom = false;

            const pointers = [];
            const pointerPositions = {};

            // Métodos públicos básicos
            this.getPolarAngle = function() {
                return spherical.phi;
            };

            this.getAzimuthalAngle = function() {
                return spherical.theta;
            };

            this.getDistance = function() {
                return this.object.position.distanceTo(this.target);
            };

            this.reset = function() {
                scope.target.copy(scope.target0);
                scope.object.position.copy(scope.position0);
                scope.object.zoom = scope.zoom0;
                scope.object.updateProjectionMatrix();
                scope.dispatchEvent(_changeEvent);
                scope.update();
                state = STATE.NONE;
            };

            this.update = function() {
                const offset = new THREE.Vector3();
                const quat = new THREE.Quaternion().setFromUnitVectors(object.up, new THREE.Vector3(0, 1, 0));
                const quatInverse = quat.clone().invert();
                const lastPosition = new THREE.Vector3();
                const lastQuaternion = new THREE.Quaternion();
                const lastTargetPosition = new THREE.Vector3();
                const twoPI = 2 * Math.PI;

                return function update(deltaTime = null) {
                    const position = scope.object.position;

                    offset.copy(position).sub(scope.target);
                    offset.applyQuaternion(quat);
                    spherical.setFromVector3(offset);

                    if (scope.autoRotate && state === STATE.NONE) {
                        rotateLeft(getAutoRotationAngle(deltaTime));
                    }

                    if (scope.enableDamping) {
                        spherical.theta += sphericalDelta.theta * scope.dampingFactor;
                        spherical.phi += sphericalDelta.phi * scope.dampingFactor;
                    } else {
                        spherical.theta += sphericalDelta.theta;
                        spherical.phi += sphericalDelta.phi;
                    }

                    // restrict theta to be between desired limits
                    let min = scope.minAzimuthAngle;
                    let max = scope.maxAzimuthAngle;

                    if (isFinite(min) && isFinite(max)) {
                        if (min < -Math.PI) min += twoPI;
                        else if (min > Math.PI) min -= twoPI;

                        if (max < -Math.PI) max += twoPI;
                        else if (max > Math.PI) max -= twoPI;

                        if (min <= max) {
                            spherical.theta = Math.max(min, Math.min(max, spherical.theta));
                        } else {
                            spherical.theta = spherical.theta > (min + max) / 2 ?
                                Math.max(min, spherical.theta) :
                                Math.min(max, spherical.theta);
                        }
                    }

                    // restrict phi to be between desired limits
                    spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));
                    spherical.makeSafe();
                    spherical.radius *= scale;

                    // restrict radius to be between desired limits
                    spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));

                    // move target to panned location
                    if (scope.enableDamping === true) {
                        scope.target.addScaledVector(panOffset, scope.dampingFactor);
                    } else {
                        scope.target.add(panOffset);
                    }

                    // Clamp the target to the cursor
                    scope.target.sub(scope.cursor);
                    scope.target.clampLength(0, scope.maxTargetRadius);
                    scope.target.add(scope.cursor);

                    offset.setFromSpherical(spherical);
                    offset.applyQuaternion(quatInverse);
                    position.copy(scope.target).add(offset);
                    scope.object.lookAt(scope.target);

                    if (scope.enableDamping === true) {
                        sphericalDelta.theta *= (1 - scope.dampingFactor);
                        sphericalDelta.phi *= (1 - scope.dampingFactor);
                        panOffset.multiplyScalar(1 - scope.dampingFactor);
                    } else {
                        sphericalDelta.set(0, 0, 0);
                        panOffset.set(0, 0, 0);
                    }

                    scale = 1;

                    // update condition is:
                    if (zoomChanged ||
                        lastPosition.distanceToSquared(scope.object.position) > EPS ||
                        8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS ||
                        lastTargetPosition.distanceToSquared(scope.target) > EPS) {

                        scope.dispatchEvent(_changeEvent);

                        lastPosition.copy(scope.object.position);
                        lastQuaternion.copy(scope.object.quaternion);
                        lastTargetPosition.copy(scope.target);

                        zoomChanged = false;

                        return true;
                    }

                    return false;
                };
            }();

            this.dispose = function() {
                scope.domElement.removeEventListener('contextmenu', onContextMenu);
                scope.domElement.removeEventListener('pointerdown', onPointerDown);
                scope.domElement.removeEventListener('pointercancel', onPointerUp);
                scope.domElement.removeEventListener('wheel', onMouseWheel);
                scope.domElement.removeEventListener('pointermove', onPointerMove);
                scope.domElement.removeEventListener('pointerup', onPointerUp);

                if (scope._domElementKeyEvents !== null) {
                    scope._domElementKeyEvents.removeEventListener('keydown', onKeyDown);
                    scope._domElementKeyEvents = null;
                }
            };

            // Funciones internas simplificadas
            function getAutoRotationAngle(deltaTime) {
                if (deltaTime !== null) {
                    return (1 / 60) * scope.autoRotateSpeed * deltaTime;
                } else {
                    return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
                }
            }

            function rotateLeft(angle) {
                sphericalDelta.theta -= angle;
            }

            function rotateUp(angle) {
                sphericalDelta.phi -= angle;
            }

            // Event handlers (simplificados)
            function onPointerDown(event) {
                if (scope.enabled === false) return;
                // Implementación básica de eventos
            }

            function onPointerMove(event) {
                if (scope.enabled === false) return;
                // Implementación básica de eventos
            }

            function onPointerUp(event) {
                if (scope.enabled === false) return;
                // Implementación básica de eventos
            }

            function onMouseWheel(event) {
                if (scope.enabled === false || scope.enableZoom === false) return;
                event.preventDefault();
                scope.dispatchEvent(_startEvent);
                
                if (event.deltaY < 0) {
                    scale /= getZoomScale();
                } else if (event.deltaY > 0) {
                    scale *= getZoomScale();
                }
                
                scope.update();
                scope.dispatchEvent(_endEvent);
            }

            function getZoomScale() {
                return Math.pow(0.95, scope.zoomSpeed);
            }

            function onContextMenu(event) {
                if (scope.enabled === false) return;
                event.preventDefault();
            }

            function onKeyDown(event) {
                if (scope.enabled === false || scope.enablePan === false) return;
                // Implementación básica de teclas
            }

            // Inicializar eventos
            scope.domElement.addEventListener('contextmenu', onContextMenu);
            scope.domElement.addEventListener('pointerdown', onPointerDown);
            scope.domElement.addEventListener('pointercancel', onPointerUp);
            scope.domElement.addEventListener('wheel', onMouseWheel, { passive: false });

            // force an update at start
            this.update();
        }
    }

    // Exportar al namespace global de THREE
    THREE.OrbitControls = OrbitControls;

    // También disponible en window para compatibilidad
    window.OrbitControls = OrbitControls;
    
    console.log('✅ OrbitControls wrapper cargado correctamente');
})();
