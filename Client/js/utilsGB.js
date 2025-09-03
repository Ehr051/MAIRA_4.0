/**
 * utilsGB.js
 * Utility functions for Gestión de Batalla in MAIRA
 * @version 1.0.0
 */

// Namespace principal
window.MAIRA = window.MAIRA || {};

// Módulo de utilidades
MAIRA.Utils = (function() {
    
    /**
     * Muestra una notificación en la interfaz
     * @param {string} mensaje - Mensaje a mostrar
     * @param {string} tipo - Tipo de notificación (info, success, error, warning)
     * @param {number} duracion - Duración en milisegundos
     * @param {boolean} destacar - Si debe destacarse (para notificaciones importantes)
     */
    function mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000, destacar = false) {
        // Crear contenedor de notificaciones si no existe
        let container = document.getElementById('notificaciones-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificaciones-container';
            container.className = 'notificaciones-container';
            document.body.appendChild(container);
        }
        
        // Crear notificación
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion notificacion-${tipo} ${destacar ? 'destacada' : ''}`;
        
        // Determinar ícono según tipo
        let iconoClase = 'fas fa-info-circle';
        if (tipo === 'success') iconoClase = 'fas fa-check-circle';
        else if (tipo === 'error') iconoClase = 'fas fa-exclamation-circle';
        else if (tipo === 'warning') iconoClase = 'fas fa-exclamation-triangle';
        
        notificacion.innerHTML = `
            <div class="notificacion-contenido">
                <span class="notificacion-icono">
                    <i class="${iconoClase}"></i>
                </span>
                <span class="notificacion-mensaje">${mensaje}</span>
            </div>
            <button class="notificacion-cerrar"><i class="fas fa-times"></i></button>
        `;
        
        container.appendChild(notificacion);
        
        // Añadir clase para animar entrada
        setTimeout(() => {
            notificacion.classList.add('show');
        }, 10);
        
        // Evento para cerrar notificación
        const cerrarBtn = notificacion.querySelector('.notificacion-cerrar');
        cerrarBtn.addEventListener('click', () => {
            notificacion.classList.remove('show');
            setTimeout(() => {
                if (container.contains(notificacion)) {
                    container.removeChild(notificacion);
                }
            }, 300);
        });
        
        // Auto-cerrar después de duración
        setTimeout(() => {
            if (container.contains(notificacion)) {
                notificacion.classList.remove('show');
                setTimeout(() => {
                    if (container.contains(notificacion)) {
                        container.removeChild(notificacion);
                    }
                }, 300);
            }
        }, duracion);
    }

    /**
     * Formatea una fecha ISO a formato legible
     * @param {string} fecha - Fecha en formato ISO
     * @returns {string} Fecha formateada
     */
    function formatearFecha(fecha) {
        if (!fecha) return 'Desconocido';
        
        try {
            const date = new Date(fecha);
            
            // Si la fecha es de hoy, mostrar solo la hora
            const hoy = new Date();
            if (date.toDateString() === hoy.toDateString()) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            
            // Si la fecha es de esta semana, mostrar día y hora
            const unaSemana = 7 * 24 * 60 * 60 * 1000;
            if (hoy - date < unaSemana) {
                return date.toLocaleString([], { 
                    weekday: 'short', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            }
            
            // Para fechas más antiguas, mostrar fecha completa
            return date.toLocaleString([], { 
                day: '2-digit', 
                month: '2-digit', 
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return fecha;
        }
    }
    
    /**
     * Formatea el tamaño de un archivo para mostrar de forma legible
     * @param {number} bytes - Tamaño en bytes
     * @returns {string} Tamaño formateado
     */
    function formatearTamaño(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Genera un ID único
     * @returns {string} ID generado
     */
    function generarId() {
        return 'gb_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
    }
    
    /**
     * Detecta si estamos en un dispositivo móvil
     * @returns {boolean} True si es un dispositivo móvil
     */
    function esDispositivoMovil() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * Actualiza el indicador de estado de conexión
     * @param {boolean} conectado - Estado de la conexión
     */
    function actualizarEstadoConexion(conectado) {
        console.log("Actualizando estado de conexión:", conectado ? "Conectado" : "Desconectado");
        
        const indicator = document.querySelector('.indicator');
        const statusText = document.getElementById('status-text');
        
        if (indicator) {
            indicator.className = conectado ? 'indicator online' : 'indicator offline';
        } else {
            console.warn("Elemento indicator no encontrado");
        }
        
        if (statusText) {
            statusText.textContent = conectado ? 'Conectado' : 'Desconectado';
        } else {
            console.warn("Elemento status-text no encontrado");
        }
    }
    
    /**
     * Obtiene la URL del servidor
     * @returns {string} URL del servidor
     */
    function obtenerURLServidor() {
        // Intentar obtener de la configuración global
        if (window.SERVER_URL) {
            return window.SERVER_URL;
        }
        
        // Obtener URL base del servidor
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        let port = window.location.port;
        
        // Si es localhost, usar puerto específico
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            port = port || '5000';
            return `${protocol}//${hostname}:${port}`;
        }
        
        // Si no hay puerto, usar el mismo protocolo y host
        if (!port) {
            return `${protocol}//${hostname}`;
        }
        
        return `${protocol}//${hostname}:${port}`;
    }
    
    /**
     * Comprime una imagen para reducir su tamaño
     * @param {File} archivo - Archivo de imagen a comprimir
     * @param {number} maxWidth - Ancho máximo
     * @param {number} maxHeight - Alto máximo
     * @param {number} calidad - Calidad de compresión (0-1)
     * @returns {Promise<File>} - Promise que resuelve al archivo comprimido
     */
    function comprimirImagen(archivo, maxWidth = 1024, maxHeight = 1024, calidad = 0.7) {
        return new Promise((resolve, reject) => {
            // Crear elementos temporales
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Manejar carga de imagen
            img.onload = function() {
                // Calcular dimensiones manteniendo proporciones
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                
                // Configurar canvas y dibujar imagen
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convertir a formato de menor tamaño (WebP si es soportado)
                const formato = 'image/jpeg';
                
                // Obtener datos comprimidos
                const dataURL = canvas.toDataURL(formato, calidad);
                
                // Convertir a Blob
                fetch(dataURL)
                    .then(res => res.blob())
                    .then(blob => {
                        // Crear archivo con nuevo tamaño
                        const nombreOriginal = archivo.name.split('.')[0];
                        const extension = formato === 'image/webp' ? 'webp' : 'jpg';
                        const nuevoArchivo = new File(
                            [blob], 
                            `${nombreOriginal}_optimizado.${extension}`,
                            { type: formato }
                        );
                        
                        console.log(`Imagen comprimida: ${(archivo.size/1024).toFixed(2)}KB → ${(blob.size/1024).toFixed(2)}KB`);
                        resolve(nuevoArchivo);
                    })
                    .catch(err => reject(err));
            };
            
            img.onerror = function() {
                reject(new Error('Error al cargar la imagen'));
            };
            
            // Cargar imagen desde archivo
            const reader = new FileReader();
            reader.onload = function(e) {
                img.src = e.target.result;
            };
            reader.onerror = function() {
                reject(new Error('Error al leer el archivo'));
            };
            reader.readAsDataURL(archivo);
        });
    }
    
    /**
     * Comprime un video para reducir su tamaño
     * @param {Blob} videoBlob - Blob de video a comprimir
     * @param {number} duracionMaxima - Duración máxima en segundos
     * @returns {Promise<File>} - Promise que resuelve al archivo comprimido
     */
    function comprimirVideo(videoBlob, duracionMaxima = 30) {
        return new Promise((resolve, reject) => {
            // Crear elemento de video temporal
            const video = document.createElement('video');
            video.muted = true;
            
            // Crear objeto URL para el video
            const videoURL = URL.createObjectURL(videoBlob);
            video.src = videoURL;
            
            video.onloadedmetadata = function() {
                // Verificar duración
                if (video.duration > duracionMaxima) {
                    URL.revokeObjectURL(videoURL);
                    reject(new Error(`El video excede la duración máxima de ${duracionMaxima} segundos`));
                    return;
                }
                
                // Configurar canvas para capturar frames
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const fps = 15; // Reducir cuadros por segundo
                
                // Reducir dimensiones si es necesario
                const maxDimension = 640;
                let width = video.videoWidth;
                let height = video.videoHeight;
                
                if (width > height && width > maxDimension) {
                    height = height * (maxDimension / width);
                    width = maxDimension;
                } else if (height > maxDimension) {
                    width = width * (maxDimension / height);
                    height = maxDimension;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Usar MediaRecorder con menor bitrate
                const mediaRecorder = new MediaRecorder(canvas.captureStream(fps), {
                    mimeType: 'video/webm;codecs=vp9',
                    videoBitsPerSecond: 800000 // 800Kbps
                });
                
                const chunks = [];
                mediaRecorder.ondataavailable = e => chunks.push(e.data);
                
                mediaRecorder.onstop = () => {
                    const nuevoBlob = new Blob(chunks, { type: 'video/webm' });
                    const nombreOriginal = 'video_comprimido';
                    const nuevoArchivo = new File([nuevoBlob], `${nombreOriginal}.webm`, { type: 'video/webm' });
                    
                    console.log(`Video comprimido: ${(videoBlob.size/1024/1024).toFixed(2)}MB → ${(nuevoBlob.size/1024/1024).toFixed(2)}MB`);
                    URL.revokeObjectURL(videoURL);
                    resolve(nuevoArchivo);
                };
                
                // Procesar cada frame
                mediaRecorder.start();
                video.currentTime = 0;
                
                video.onended = () => mediaRecorder.stop();
                
                function processFrame() {
                    if (video.ended || video.paused) return;
                    
                    ctx.drawImage(video, 0, 0, width, height);
                    
                    if (video.currentTime < video.duration) {
                        requestAnimationFrame(processFrame);
                    }
                }
                
                video.onplay = () => processFrame();
                video.play();
            };
            
            video.onerror = () => {
                URL.revokeObjectURL(videoURL);
                reject(new Error('Error al procesar el video'));
            };
        });
    }
    
    // Exponer API pública
    return {
        mostrarNotificacion,
        formatearFecha,
        formatearTamaño,
        generarId,
        esDispositivoMovil,
        actualizarEstadoConexion,
        obtenerURLServidor,
        comprimirImagen,
        comprimirVideo
    };
})();

// ✅ AL FINAL DEL ARCHIVO, AGREGAR:

// ===== EXPORTACIONES GLOBALES =====
window.MAIRA = window.MAIRA || {};
window.MAIRA.Utils = window.MAIRA.Utils || MAIRA.Utils;

// Funciones críticas globalmente disponibles
window.mostrarNotificacion = MAIRA.Utils.mostrarNotificacion;
window.formatearFecha = MAIRA.Utils.formatearFecha;
window.generarId = MAIRA.Utils.generarId;
window.esDispositivoMovil = MAIRA.Utils.esDispositivoMovil;
window.actualizarEstadoConexion = MAIRA.Utils.actualizarEstadoConexion;
window.obtenerURLServidor = MAIRA.Utils.obtenerURLServidor;

console.log('✅ utilsGB.js exportado correctamente');