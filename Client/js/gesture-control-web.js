/**
 * MAIRA Web Gesture Control - Implementación Nativa
 * ================================================
 * 
 * Sistema de control por gestos integrado directamente en la web
 * sin necesidad de extensiones del navegador.
 * 
 * Características:
 * - Detección automática de capacidades del dispositivo
 * - Interfaz de activación elegante
 * - Control directo de elementos DOM
 * - Compatibilidad con dispositivos móviles
 */

class MAIRAWebGestureControl {
    constructor() {
        this.isActive = false;
        this.cameraStream = null;
        this.hands = null;
        this.gestureCanvas = null;
        this.lastGesture = null;
        this.virtualCursor = null;
        
        // Configuración
        this.config = {
            pinchThreshold: 0.05,
            clickCooldown: 500, // ms
            cursorSmoothness: 0.3,
            showDebugInfo: false
        };
        
        this.lastClickTime = 0;
        this.init();
    }
    
    async init() {
        console.log('🎯 MAIRA Web Gesture Control - Inicializando...');
        
        // Esperar a que MAIRA esté listo
        this.waitForMAIRA().then(() => {
            this.setupGestureDetection();
        });
    }
    
    async waitForMAIRA() {
        return new Promise((resolve) => {
            const checkMAIRA = () => {
                if (this.isMAIRAReady()) {
                    console.log('✅ MAIRA listo para control por gestos');
                    resolve();
                } else {
                    setTimeout(checkMAIRA, 500);
                }
            };
            checkMAIRA();
        });
    }
    
    isMAIRAReady() {
        // Verificar que MAIRA esté completamente cargado
        const indicators = [
            '#gameContainer',
            '.hex-grid',
            '.comenzar-ahora-btn',
            '[data-maira-loaded="true"]'
        ];
        
        return indicators.some(selector => document.querySelector(selector));
    }
    
    async setupGestureDetection() {
        // Verificar soporte de cámara
        const hasCamera = await this.checkCameraSupport();
        
        if (!hasCamera) {
            console.log('❌ Dispositivo no soporta cámara');
            return;
        }
        
        // Mostrar botón de activación de gestos
        this.addGestureButton();
        
        // Detectar primer click para mostrar sugerencia
        this.addFirstClickListener();
    }
    
    async checkCameraSupport() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return false;
            }
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.some(device => device.kind === 'videoinput');
            
        } catch (error) {
            console.log('Error verificando cámara:', error);
            return false;
        }
    }
    
    addGestureButton() {
        // Crear botón flotante para activar gestos
        const gestureButton = document.createElement('div');
        gestureButton.id = 'maira-gesture-btn';
        gestureButton.innerHTML = `
            <div class="gesture-btn-content">
                <div class="gesture-icon">🤚</div>
                <span class="gesture-text">Gestos</span>
            </div>
        `;
        
        gestureButton.className = 'maira-gesture-button';
        gestureButton.addEventListener('click', () => this.toggleGestureControl());
        
        document.body.appendChild(gestureButton);
        
        // Agregar estilos
        this.addGestureStyles();
    }
    
    addFirstClickListener() {
        let hasShownSuggestion = false;
        
        document.addEventListener('click', () => {
            if (!hasShownSuggestion && !this.isActive) {
                this.showGestureSuggestion();
                hasShownSuggestion = true;
            }
        }, { once: true });
    }
    
    showGestureSuggestion() {
        // Mostrar sugerencia elegante
        const suggestion = document.createElement('div');
        suggestion.id = 'gesture-suggestion';
        suggestion.innerHTML = `
            <div class="suggestion-content">
                <div class="suggestion-icon">🤚</div>
                <div class="suggestion-text">
                    <h4>¿Prefieres usar gestos?</h4>
                    <p>Controla MAIRA con movimientos de mano</p>
                </div>
                <div class="suggestion-actions">
                    <button class="activate-btn" onclick="gestureControl.activateGestures()">
                        Activar
                    </button>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                        ✕
                    </button>
                </div>
            </div>
        `;
        
        suggestion.className = 'gesture-suggestion';
        document.body.appendChild(suggestion);
        
        // Auto-hide después de 10 segundos
        setTimeout(() => {
            if (suggestion.parentElement) {
                suggestion.remove();
            }
        }, 10000);
    }
    
    async toggleGestureControl() {
        if (this.isActive) {
            this.deactivateGestures();
        } else {
            await this.activateGestures();
        }
    }
    
    async activateGestures() {
        console.log('🎯 Activando control por gestos...');
        
        try {
            // Solicitar acceso a cámara
            this.cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user' // Cámara frontal por defecto
                }
            });
            
            console.log('✅ Acceso a cámara obtenido');
            
            // Cargar MediaPipe
            await this.loadMediaPipe();
            
            // Crear interfaz de control
            this.createGestureInterface();
            
            // Inicializar detección
            this.initializeGestureDetection();
            
            this.isActive = true;
            this.updateGestureButton();
            
        } catch (error) {
            console.error('❌ Error activando gestos:', error);
            this.showError('No se pudo acceder a la cámara. Verifica los permisos.');
        }
    }
    
    deactivateGestures() {
        console.log('❌ Desactivando control por gestos...');
        
        this.isActive = false;
        
        // Detener cámara
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        
        // Remover interfaz
        const gestureInterface = document.getElementById('maira-gesture-interface');
        if (gestureInterface) {
            gestureInterface.remove();
        }
        
        // Remover cursor virtual
        if (this.virtualCursor) {
            this.virtualCursor.remove();
            this.virtualCursor = null;
        }
        
        this.updateGestureButton();
    }
    
    async loadMediaPipe() {
        return new Promise((resolve, reject) => {
            if (window.Hands) {
                resolve();
                return;
            }
            
            // Cargar MediaPipe desde CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js';
            script.onload = () => {
                console.log('✅ MediaPipe cargado');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Error cargando MediaPipe'));
            };
            document.head.appendChild(script);
        });
    }
    
    createGestureInterface() {
        const gestureInterface = document.createElement('div');
        gestureInterface.id = 'maira-gesture-interface';
        gestureInterface.innerHTML = `
            <div class="gesture-controls">
                <div class="gesture-header">
                    <span class="status-indicator active"></span>
                    <span class="status-text">Control por Gestos Activo</span>
                    <button class="minimize-btn" onclick="gestureControl.minimizeInterface()">─</button>
                    <button class="close-btn" onclick="gestureControl.deactivateGestures()">✕</button>
                </div>
                
                <div class="gesture-content">
                    <div class="camera-preview">
                        <video id="gesture-video" autoplay muted></video>
                        <canvas id="gesture-canvas"></canvas>
                        <div class="gesture-overlay">
                            <div class="gesture-instructions">
                                <div class="instruction">👆 Apunta para mover cursor</div>
                                <div class="instruction">🤏 Pinza para hacer click</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="gesture-info">
                        <div class="fps-counter">FPS: <span id="fps-display">0</span></div>
                        <div class="gesture-status">Gesto: <span id="gesture-display">Ninguno</span></div>
                    </div>
                </div>
            </div>
        `;
        
        gestureInterface.className = 'maira-gesture-interface';
        document.body.appendChild(gestureInterface);
        
        // Configurar video
        const video = document.getElementById('gesture-video');
        video.srcObject = this.cameraStream;
        
        // Configurar canvas
        this.gestureCanvas = document.getElementById('gesture-canvas');
        this.gestureCtx = this.gestureCanvas.getContext('2d');
        
        // Hacer la interfaz draggable
        this.makeInterfaceDraggable(gestureInterface);
    }
    
    makeInterfaceDraggable(element) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        const header = element.querySelector('.gesture-header');
        
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = element.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            
            element.style.transition = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            element.style.left = (initialX + deltaX) + 'px';
            element.style.top = (initialY + deltaY) + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.transition = '';
            }
        });
    }
    
    initializeGestureDetection() {
        // Configurar MediaPipe Hands
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
            }
        });
        
        this.hands.setOptions({
            maxNumHands: 1, // Solo una mano para control más preciso
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.5
        });
        
        this.hands.onResults((results) => {
            this.processGestureResults(results);
        });
        
        // Iniciar loop de detección
        this.startDetectionLoop();
        
        // Crear cursor virtual
        this.createVirtualCursor();
    }
    
    startDetectionLoop() {
        const video = document.getElementById('gesture-video');
        let frameCount = 0;
        let lastTime = performance.now();
        
        const detect = async () => {
            if (this.isActive && video.readyState >= 2) {
                await this.hands.send({ image: video });
                
                // Calcular FPS
                frameCount++;
                const currentTime = performance.now();
                if (currentTime - lastTime >= 1000) {
                    const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                    document.getElementById('fps-display').textContent = fps;
                    frameCount = 0;
                    lastTime = currentTime;
                }
            }
            
            if (this.isActive) {
                requestAnimationFrame(detect);
            }
        };
        
        detect();
    }
    
    processGestureResults(results) {
        // Limpiar canvas
        this.gestureCtx.clearRect(0, 0, this.gestureCanvas.width, this.gestureCanvas.height);
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0]; // Solo primera mano
            
            // Dibujar landmarks
            this.drawHandLandmarks(landmarks);
            
            // Detectar gesto
            const gesture = this.analyzeGesture(landmarks);
            
            // Actualizar display
            document.getElementById('gesture-display').textContent = gesture.type;
            
            // Ejecutar acción
            this.executeGestureAction(gesture);
            
            this.lastGesture = gesture;
        } else {
            document.getElementById('gesture-display').textContent = 'No detectado';
            this.hideVirtualCursor();
        }
    }
    
    drawHandLandmarks(landmarks) {
        this.gestureCtx.fillStyle = '#00FF00';
        this.gestureCtx.strokeStyle = '#00FF00';
        this.gestureCtx.lineWidth = 2;
        
        // Dibujar puntos clave
        const keyPoints = [4, 8, 12, 16, 20]; // Puntas de dedos
        
        for (const pointIndex of keyPoints) {
            const point = landmarks[pointIndex];
            const x = point.x * this.gestureCanvas.width;
            const y = point.y * this.gestureCanvas.height;
            
            this.gestureCtx.beginPath();
            this.gestureCtx.arc(x, y, 5, 0, 2 * Math.PI);
            this.gestureCtx.fill();
        }
        
        // Línea entre índice y pulgar para mostrar pinza
        const thumb = landmarks[4];
        const index = landmarks[8];
        
        this.gestureCtx.beginPath();
        this.gestureCtx.moveTo(thumb.x * this.gestureCanvas.width, thumb.y * this.gestureCanvas.height);
        this.gestureCtx.lineTo(index.x * this.gestureCanvas.width, index.y * this.gestureCanvas.height);
        this.gestureCtx.stroke();
    }
    
    analyzeGesture(landmarks) {
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        
        // Calcular distancia entre índice y pulgar
        const distance = Math.sqrt(
            Math.pow(indexTip.x - thumbTip.x, 2) + 
            Math.pow(indexTip.y - thumbTip.y, 2)
        );
        
        if (distance < this.config.pinchThreshold) {
            return {
                type: 'pinch',
                position: { x: indexTip.x, y: indexTip.y },
                confidence: 1 - (distance / this.config.pinchThreshold)
            };
        } else {
            return {
                type: 'point',
                position: { x: indexTip.x, y: indexTip.y },
                confidence: 0.8
            };
        }
    }
    
    executeGestureAction(gesture) {
        if (!gesture || !gesture.position) return;
        
        // Convertir coordenadas normalizadas a coordenadas de pantalla
        const screenX = gesture.position.x * window.innerWidth;
        const screenY = gesture.position.y * window.innerHeight;
        
        switch (gesture.type) {
            case 'point':
                this.moveCursor(screenX, screenY);
                break;
                
            case 'pinch':
                this.performClick(screenX, screenY);
                break;
        }
    }
    
    moveCursor(x, y) {
        this.showVirtualCursor(x, y);
        
        // Simular hover en elemento
        const element = document.elementFromPoint(x, y);
        if (element) {
            // Crear evento de mouseover
            const event = new MouseEvent('mouseover', {
                clientX: x,
                clientY: y,
                bubbles: true,
                cancelable: true
            });
            element.dispatchEvent(event);
        }
    }
    
    performClick(x, y) {
        // Cooldown para evitar clicks múltiples
        const now = Date.now();
        if (now - this.lastClickTime < this.config.clickCooldown) {
            return;
        }
        this.lastClickTime = now;
        
        // Encontrar elemento y hacer click
        const element = document.elementFromPoint(x, y);
        if (element) {
            // Crear evento de click
            const clickEvent = new MouseEvent('click', {
                clientX: x,
                clientY: y,
                bubbles: true,
                cancelable: true
            });
            
            element.dispatchEvent(clickEvent);
            
            console.log('🎯 Gesto click en:', element.tagName, element.className);
            
            // Efecto visual
            this.showClickEffect(x, y);
        }
    }
    
    createVirtualCursor() {
        this.virtualCursor = document.createElement('div');
        this.virtualCursor.id = 'maira-virtual-cursor';
        this.virtualCursor.innerHTML = '🎯';
        this.virtualCursor.className = 'virtual-cursor';
        document.body.appendChild(this.virtualCursor);
    }
    
    showVirtualCursor(x, y) {
        if (this.virtualCursor) {
            this.virtualCursor.style.left = (x - 12) + 'px';
            this.virtualCursor.style.top = (y - 12) + 'px';
            this.virtualCursor.style.display = 'block';
        }
    }
    
    hideVirtualCursor() {
        if (this.virtualCursor) {
            this.virtualCursor.style.display = 'none';
        }
    }
    
    showClickEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.style.left = (x - 15) + 'px';
        effect.style.top = (y - 15) + 'px';
        effect.innerHTML = '💥';
        document.body.appendChild(effect);
        
        setTimeout(() => effect.remove(), 600);
    }
    
    updateGestureButton() {
        const btn = document.getElementById('maira-gesture-btn');
        if (btn) {
            if (this.isActive) {
                btn.classList.add('active');
                btn.querySelector('.gesture-text').textContent = 'Activo';
            } else {
                btn.classList.remove('active');
                btn.querySelector('.gesture-text').textContent = 'Gestos';
            }
        }
    }
    
    minimizeInterface() {
        const gestureInterface = document.getElementById('maira-gesture-interface');
        if (gestureInterface) {
            gestureInterface.classList.toggle('minimized');
        }
    }
    
    addGestureStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            .maira-gesture-button {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50px;
                padding: 12px 20px;
                color: white;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
                user-select: none;
            }
            
            .maira-gesture-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.3);
            }
            
            .maira-gesture-button.active {
                background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
                50% { box-shadow: 0 4px 25px rgba(56, 239, 125, 0.4); }
                100% { box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
            }
            
            .gesture-btn-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .gesture-icon {
                font-size: 18px;
            }
            
            .gesture-text {
                font-weight: 600;
                font-size: 14px;
            }
            
            .maira-gesture-interface {
                position: fixed;
                top: 80px;
                right: 20px;
                width: 300px;
                background: rgba(0, 0, 0, 0.9);
                border-radius: 15px;
                overflow: hidden;
                z-index: 9999;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
            }
            
            .maira-gesture-interface.minimized {
                height: 50px;
                overflow: hidden;
            }
            
            .gesture-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 12px 15px;
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: move;
            }
            
            .status-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #ff4444;
            }
            
            .status-indicator.active {
                background: #44ff44;
                animation: blink 1.5s infinite;
            }
            
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.3; }
            }
            
            .status-text {
                flex: 1;
                color: white;
                font-weight: 600;
                font-size: 12px;
            }
            
            .minimize-btn, .close-btn {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                transition: background 0.2s;
            }
            
            .minimize-btn:hover, .close-btn:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .gesture-content {
                padding: 15px;
            }
            
            .camera-preview {
                position: relative;
                width: 100%;
                height: 150px;
                border-radius: 10px;
                overflow: hidden;
                background: #222;
            }
            
            #gesture-video {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            #gesture-canvas {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
            }
            
            .gesture-overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(transparent, rgba(0,0,0,0.8));
                padding: 10px;
            }
            
            .gesture-instructions {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .instruction {
                color: white;
                font-size: 10px;
                opacity: 0.8;
            }
            
            .gesture-info {
                margin-top: 10px;
                display: flex;
                justify-content: space-between;
                color: #ccc;
                font-size: 11px;
            }
            
            .virtual-cursor {
                position: fixed;
                pointer-events: none;
                z-index: 10001;
                font-size: 24px;
                display: none;
                animation: cursorPulse 1s infinite;
            }
            
            @keyframes cursorPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.2); }
            }
            
            .click-effect {
                position: fixed;
                pointer-events: none;
                z-index: 10002;
                font-size: 30px;
                animation: clickEffect 0.6s ease-out forwards;
            }
            
            @keyframes clickEffect {
                0% {
                    transform: scale(0.5) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: scale(2) rotate(360deg);
                    opacity: 0;
                }
            }
            
            .gesture-suggestion {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 300px;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 9998;
                animation: slideInUp 0.5s ease-out;
            }
            
            @keyframes slideInUp {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            .suggestion-content {
                padding: 20px;
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .suggestion-icon {
                font-size: 32px;
            }
            
            .suggestion-text h4 {
                margin: 0 0 5px 0;
                color: #333;
                font-size: 16px;
            }
            
            .suggestion-text p {
                margin: 0;
                color: #666;
                font-size: 14px;
            }
            
            .suggestion-actions {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .activate-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-weight: 600;
                font-size: 12px;
                transition: transform 0.2s;
            }
            
            .activate-btn:hover {
                transform: translateY(-1px);
            }
            
            .close-btn {
                background: #f0f0f0;
                color: #666;
                border: none;
                padding: 4px 8px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 12px;
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    showError(message) {
        const error = document.createElement('div');
        error.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #ff4444;
                color: white;
                padding: 20px;
                border-radius: 10px;
                z-index: 10003;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ">
                <h3>❌ Error</h3>
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: white; color: #ff4444; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                    Cerrar
                </button>
            </div>
        `;
        document.body.appendChild(error);
    }
}

// Inicializar control por gestos
const gestureControl = new MAIRAWebGestureControl();

// Hacer disponible globalmente
window.gestureControl = gestureControl;
