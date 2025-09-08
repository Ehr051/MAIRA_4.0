/**
 * MAIRA Gesture Control - Content Script
 * =====================================
 * 
 * Se inyecta en la página web de MAIRA para:
 * 1. Detectar si el usuario tiene cámara
 * 2. Ofrecer instalar control por gestos
 * 3. Integrar detección de gestos con la interfaz web
 * 4. Controlar elementos de la página mediante gestos
 */

class MAIRAGestureIntegration {
    constructor() {
        this.gestureDetectorActive = false;
        this.cameraStream = null;
        this.canvas = null;
        this.ctx = null;
        this.isCalibrated = false;
        this.projectionCorners = null;
        
        this.init();
    }
    
    async init() {
        console.log('🎯 MAIRA Gesture Control - Inicializando...');
        
        // Esperar a que la página cargue completamente
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupGestureControl());
        } else {
            this.setupGestureControl();
        }
    }
    
    async setupGestureControl() {
        // Detectar si estamos en MAIRA
        if (!this.isMAIRAPage()) {
            console.log('No es una página de MAIRA, saltando inicialización');
            return;
        }
        
        console.log('✅ Página MAIRA detectada');
        
        // Verificar soporte de cámara
        const cameraSupported = await this.checkCameraSupport();
        
        if (cameraSupported) {
            this.showGestureControlOffer();
        } else {
            console.log('❌ Cámara no soportada en este dispositivo');
        }
    }
    
    isMAIRAPage() {
        // Detectar elementos específicos de MAIRA
        const indicators = [
            'body[data-app="maira"]',
            '.maira-game-container',
            '#gameContainer',
            '.hex-grid',
            '.comenzar-ahora-btn'
        ];
        
        return indicators.some(selector => document.querySelector(selector));
    }
    
    async checkCameraSupport() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasCamera = devices.some(device => device.kind === 'videoinput');
            
            if (hasCamera && navigator.mediaDevices.getUserMedia) {
                console.log('✅ Cámara disponible');
                return true;
            }
        } catch (error) {
            console.log('❌ Error verificando cámara:', error);
        }
        
        return false;
    }
    
    showGestureControlOffer() {
        // Crear oferta visual para activar control por gestos
        const gestureOffer = this.createGestureOffer();
        document.body.appendChild(gestureOffer);
        
        // Detectar primer click para mostrar oferta
        document.addEventListener('click', this.onFirstClick.bind(this), { once: true });
    }
    
    createGestureOffer() {
        const offer = document.createElement('div');
        offer.id = 'maira-gesture-offer';
        offer.innerHTML = `
            <div class="gesture-offer-content">
                <div class="gesture-icon">🤚</div>
                <h3>¿Controlar MAIRA con gestos?</h3>
                <p>Activa el control por gestos para una experiencia inmersiva</p>
                <div class="gesture-buttons">
                    <button id="activate-gestures" class="btn-primary">
                        🎯 Activar Gestos
                    </button>
                    <button id="skip-gestures" class="btn-secondary">
                        ⏭️ Continuar sin gestos
                    </button>
                </div>
                <div class="gesture-info">
                    <small>🔒 Tu cámara se usará solo localmente para detectar gestos</small>
                </div>
            </div>
        `;
        
        // Estilos
        offer.className = 'maira-gesture-offer hidden';
        
        // Event listeners
        offer.querySelector('#activate-gestures').addEventListener('click', () => {
            this.activateGestureControl();
            offer.remove();
        });
        
        offer.querySelector('#skip-gestures').addEventListener('click', () => {
            offer.remove();
        });
        
        return offer;
    }
    
    onFirstClick(event) {
        // Mostrar oferta después del primer click del usuario
        setTimeout(() => {
            const offer = document.getElementById('maira-gesture-offer');
            if (offer) {
                offer.classList.remove('hidden');
                offer.classList.add('show');
            }
        }, 1000);
    }
    
    async activateGestureControl() {
        console.log('🎯 Activando control por gestos...');
        
        try {
            // Solicitar acceso a la cámara
            this.cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: 1280, 
                    height: 720,
                    facingMode: 'environment' // Cámara trasera preferida
                }
            });
            
            console.log('✅ Acceso a cámara obtenido');
            
            // Crear interfaz de calibración
            this.createCalibrationInterface();
            
        } catch (error) {
            console.error('❌ Error obteniendo acceso a cámara:', error);
            this.showCameraError();
        }
    }
    
    createCalibrationInterface() {
        const calibrationUI = document.createElement('div');
        calibrationUI.id = 'maira-calibration-ui';
        calibrationUI.innerHTML = `
            <div class="calibration-container">
                <div class="calibration-header">
                    <h2>🎯 Calibración de Control por Gestos</h2>
                    <button id="close-calibration" class="close-btn">✕</button>
                </div>
                
                <div class="calibration-content">
                    <div class="camera-preview">
                        <video id="camera-feed" autoplay muted></video>
                        <canvas id="detection-overlay"></canvas>
                    </div>
                    
                    <div class="calibration-controls">
                        <div class="calibration-step active" data-step="1">
                            <h3>📹 Paso 1: Verificar Cámara</h3>
                            <p>Asegúrate de que la cámara capture tu área de trabajo</p>
                            <button id="next-step-1" class="btn-primary">Continuar</button>
                        </div>
                        
                        <div class="calibration-step" data-step="2">
                            <h3>🎯 Paso 2: Definir Área de Control</h3>
                            <p>Haz clic en las 4 esquinas de tu área de trabajo</p>
                            <div class="corner-status">
                                <span class="corner" data-corner="1">1️⃣</span>
                                <span class="corner" data-corner="2">2️⃣</span>
                                <span class="corner" data-corner="3">3️⃣</span>
                                <span class="corner" data-corner="4">4️⃣</span>
                            </div>
                            <button id="auto-detect" class="btn-secondary">🤖 Detección Automática</button>
                        </div>
                        
                        <div class="calibration-step" data-step="3">
                            <h3>✅ Paso 3: Confirmar Calibración</h3>
                            <p>Mueve tu mano para probar el control</p>
                            <button id="confirm-calibration" class="btn-primary">Confirmar</button>
                            <button id="recalibrate" class="btn-secondary">Recalibrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(calibrationUI);
        
        // Configurar video stream
        const video = document.getElementById('camera-feed');
        video.srcObject = this.cameraStream;
        
        // Configurar canvas overlay
        this.canvas = document.getElementById('detection-overlay');
        this.ctx = this.canvas.getContext('2d');
        
        // Event listeners
        this.setupCalibrationEvents();
        
        // Iniciar detección
        this.startGestureDetection();
    }
    
    setupCalibrationEvents() {
        // Cerrar calibración
        document.getElementById('close-calibration').addEventListener('click', () => {
            this.stopGestureDetection();
            document.getElementById('maira-calibration-ui').remove();
        });
        
        // Pasos de calibración
        document.getElementById('next-step-1').addEventListener('click', () => {
            this.nextCalibrationStep(2);
        });
        
        document.getElementById('auto-detect').addEventListener('click', () => {
            this.autoDetectProjection();
        });
        
        document.getElementById('confirm-calibration').addEventListener('click', () => {
            this.confirmCalibration();
        });
        
        // Click en canvas para seleccionar esquinas manualmente
        this.canvas.addEventListener('click', (event) => {
            this.onCanvasClick(event);
        });
    }
    
    nextCalibrationStep(step) {
        // Ocultar paso actual
        document.querySelector('.calibration-step.active').classList.remove('active');
        
        // Mostrar siguiente paso
        document.querySelector(`[data-step="${step}"]`).classList.add('active');
    }
    
    async startGestureDetection() {
        console.log('🎯 Iniciando detección de gestos...');
        
        // Cargar MediaPipe Hands desde CDN
        await this.loadMediaPipeHands();
        
        // Inicializar detector
        this.initializeHandDetection();
        
        // Iniciar loop de detección
        this.detectionLoop();
    }
    
    async loadMediaPipeHands() {
        return new Promise((resolve, reject) => {
            if (window.mediapipeHands) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js';
            script.onload = () => {
                window.mediapipeHands = true;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    initializeHandDetection() {
        // Configurar MediaPipe Hands
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
            }
        });
        
        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        this.hands.onResults((results) => {
            this.onHandsDetected(results);
        });
    }
    
    detectionLoop() {
        const video = document.getElementById('camera-feed');
        
        const detect = async () => {
            if (this.gestureDetectorActive && video.readyState >= 2) {
                await this.hands.send({ image: video });
            }
            
            if (this.gestureDetectorActive) {
                requestAnimationFrame(detect);
            }
        };
        
        this.gestureDetectorActive = true;
        detect();
    }
    
    onHandsDetected(results) {
        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                // Dibujar landmarks de la mano
                this.drawHandLandmarks(landmarks);
                
                // Detectar gestos
                const gesture = this.detectGesture(landmarks);
                
                // Ejecutar acción basada en gesto
                if (this.isCalibrated) {
                    this.executeGestureAction(gesture, landmarks);
                }
            }
        }
    }
    
    drawHandLandmarks(landmarks) {
        // Dibujar puntos de la mano
        this.ctx.fillStyle = '#00FF00';
        
        for (const landmark of landmarks) {
            const x = landmark.x * this.canvas.width;
            const y = landmark.y * this.canvas.height;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, 2 * Math.PI);
            this.ctx.fill();
        }
        
        // Dibujar conexiones entre puntos
        this.drawHandConnections(landmarks);
    }
    
    drawHandConnections(landmarks) {
        this.ctx.strokeStyle = '#00FF00';
        this.ctx.lineWidth = 2;
        
        // Definir conexiones de la mano
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],  // Pulgar
            [0, 5], [5, 6], [6, 7], [7, 8],  // Índice
            [5, 9], [9, 10], [10, 11], [11, 12],  // Medio
            [9, 13], [13, 14], [14, 15], [15, 16],  // Anular
            [13, 17], [17, 18], [18, 19], [19, 20],  // Meñique
            [0, 17]  // Palma
        ];
        
        for (const [start, end] of connections) {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            
            this.ctx.beginPath();
            this.ctx.moveTo(startPoint.x * this.canvas.width, startPoint.y * this.canvas.height);
            this.ctx.lineTo(endPoint.x * this.canvas.width, endPoint.y * this.canvas.height);
            this.ctx.stroke();
        }
    }
    
    detectGesture(landmarks) {
        // Detectar diferentes gestos
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        const middleTip = landmarks[12];
        
        // Calcular distancias
        const indexThumbDistance = this.calculateDistance(indexTip, thumbTip);
        
        // Gesto de pinza (click)
        if (indexThumbDistance < 0.05) {
            return { type: 'pinch', position: indexTip };
        }
        
        // Gesto de puntero (mover cursor)
        return { type: 'point', position: indexTip };
    }
    
    calculateDistance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    executeGestureAction(gesture, landmarks) {
        if (!gesture || !this.projectionCorners) return;
        
        // Transformar coordenadas del gesto a coordenadas de pantalla
        const screenCoords = this.transformGestureToScreen(gesture.position);
        
        switch (gesture.type) {
            case 'point':
                this.moveCursor(screenCoords.x, screenCoords.y);
                break;
                
            case 'pinch':
                this.simulateClick(screenCoords.x, screenCoords.y);
                break;
        }
    }
    
    transformGestureToScreen(gesturePosition) {
        // Convertir coordenadas normalizadas de MediaPipe a coordenadas de pantalla
        // teniendo en cuenta la calibración de la proyección
        
        const x = gesturePosition.x * window.innerWidth;
        const y = gesturePosition.y * window.innerHeight;
        
        return { x, y };
    }
    
    moveCursor(x, y) {
        // Crear evento de mouse move sintético
        const event = new MouseEvent('mousemove', {
            clientX: x,
            clientY: y,
            bubbles: true,
            cancelable: true
        });
        
        // Encontrar elemento en esa posición
        const element = document.elementFromPoint(x, y);
        if (element) {
            element.dispatchEvent(event);
            
            // Agregar efecto visual de cursor
            this.showVirtualCursor(x, y);
        }
    }
    
    simulateClick(x, y) {
        // Crear evento de click sintético
        const element = document.elementFromPoint(x, y);
        if (element) {
            const clickEvent = new MouseEvent('click', {
                clientX: x,
                clientY: y,
                bubbles: true,
                cancelable: true
            });
            
            element.dispatchEvent(clickEvent);
            console.log('🎯 Click simulado en:', element.tagName, element.className);
            
            // Efecto visual de click
            this.showClickEffect(x, y);
        }
    }
    
    showVirtualCursor(x, y) {
        // Crear/actualizar cursor virtual
        let cursor = document.getElementById('virtual-cursor');
        if (!cursor) {
            cursor = document.createElement('div');
            cursor.id = 'virtual-cursor';
            cursor.className = 'virtual-cursor';
            document.body.appendChild(cursor);
        }
        
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
    }
    
    showClickEffect(x, y) {
        // Crear efecto visual de click
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        document.body.appendChild(effect);
        
        // Remover después de la animación
        setTimeout(() => effect.remove(), 300);
    }
    
    stopGestureDetection() {
        this.gestureDetectorActive = false;
        
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
        }
    }
    
    showCameraError() {
        const error = document.createElement('div');
        error.innerHTML = `
            <div class="camera-error">
                <h3>❌ Error de Cámara</h3>
                <p>No se pudo acceder a la cámara. Verifica que:</p>
                <ul>
                    <li>Tengas una cámara conectada</li>
                    <li>Hayas dado permisos al navegador</li>
                    <li>No esté siendo usada por otra aplicación</li>
                </ul>
                <button onclick="this.parentElement.remove()">Cerrar</button>
            </div>
        `;
        document.body.appendChild(error);
    }
}

// Inicializar cuando se cargue el script
const gestureIntegration = new MAIRAGestureIntegration();
