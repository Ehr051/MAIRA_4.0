/**
 * Integrador de Sistema de Combate 3D para MAIRA 4.0
 * Integra combate existente con capacidades 3D
 */

class CombatSystem3DIntegrator {
    constructor() {
        this.combatEngine = null;
        this.threeDService = null;
        this.combatMarkers = new Map();
        this.trajectoryLines = new Map();
        this.explosionEffects = new Map();
        this.enabled = false;
    }

    /**
     * Inicializar integrador
     */
    async initialize() {
        try {
            // Verificar servicios base
            this.combatEngine = window.combatEngine || window.gestorCombate;
            this.threeDService = window.threeDMapService;

            if (!this.combatEngine) {
                console.warn('⚠️ Motor de combate no encontrado');
                return false;
            }

            if (!this.threeDService) {
                console.warn('⚠️ Servicio 3D no encontrado');
                return false;
            }

            // Integrar eventos de combate
            this.integrateCombatEvents();
            
            // Configurar efectos visuales
            this.setupVisualEffects();
            
            this.enabled = true;
            console.log('✅ CombatSystem3DIntegrator inicializado');
            
            return true;
        } catch (error) {
            console.error('❌ Error inicializando CombatSystem3DIntegrator:', error);
            return false;
        }
    }

    /**
     * Integrar eventos del sistema de combate existente
     */
    integrateCombatEvents() {
        // Detectar disparos
        if (this.combatEngine.on) {
            this.combatEngine.on('disparo', (event) => {
                this.handleShot(event);
            });

            this.combatEngine.on('explosion', (event) => {
                this.handleExplosion(event);
            });

            this.combatEngine.on('unidad_destruida', (event) => {
                this.handleUnitDestroyed(event);
            });
        }

        // Hook alternativo para sistemas sin eventos
        if (this.combatEngine.realizarDisparo) {
            const originalDisparo = this.combatEngine.realizarDisparo;
            this.combatEngine.realizarDisparo = (...args) => {
                const result = originalDisparo.apply(this.combatEngine, args);
                this.handleShot({ 
                    origen: args[0], 
                    objetivo: args[1], 
                    arma: args[2] 
                });
                return result;
            };
        }
    }

    /**
     * Manejar disparos en 3D
     */
    handleShot(shotData) {
        if (!this.enabled || !this.threeDService.scene) return;

        const { origen, objetivo, arma } = shotData;
        
        // Crear línea de trayectoria
        this.createTrajectoryLine(origen, objetivo, arma);
        
        // Crear efecto de proyectil
        this.createProjectileEffect(origen, objetivo, arma);
        
        // Verificar línea de visión 3D
        const hasLOS = this.threeDService.checkLineOfSight(
            { x: origen.x, y: this.getElevationAt(origen), z: origen.y },
            { x: objetivo.x, y: this.getElevationAt(objetivo), z: objetivo.y }
        );
        
        if (!hasLOS) {
            console.log('🚫 Disparo bloqueado por terreno en vista 3D');
            // Aplicar penalización de precisión
            shotData.precision *= 0.3;
        }
    }

    /**
     * Crear línea de trayectoria
     */
    createTrajectoryLine(origen, objetivo, arma) {
        const points = [];
        const start = new THREE.Vector3(
            origen.x, 
            this.getElevationAt(origen) + 10, 
            origen.y
        );
        const end = new THREE.Vector3(
            objetivo.x, 
            this.getElevationAt(objetivo) + 10, 
            objetivo.y
        );

        // Calcular trayectoria parabólica
        const distance = start.distanceTo(end);
        const steps = Math.floor(distance / 100);
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const point = start.clone().lerp(end, t);
            
            // Agregar curvatura parabólica
            const height = Math.sin(t * Math.PI) * (distance * 0.1);
            point.y += height;
            
            points.push(point);
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0xff4444,
            transparent: true,
            opacity: 0.8
        });
        
        const line = new THREE.Line(geometry, material);
        this.threeDService.scene.add(line);
        
        // Animar desvanecimiento
        this.animateTrajectoryFade(line);
        
        const trajectoryId = `traj_${Date.now()}`;
        this.trajectoryLines.set(trajectoryId, line);
    }

    /**
     * Crear efecto de proyectil
     */
    createProjectileEffect(origen, objetivo, arma) {
        const geometry = new THREE.SphereGeometry(2, 8, 6);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        
        const projectile = new THREE.Mesh(geometry, material);
        projectile.position.set(
            origen.x, 
            this.getElevationAt(origen) + 10, 
            origen.y
        );
        
        this.threeDService.scene.add(projectile);
        
        // Animar movimiento del proyectil
        this.animateProjectile(projectile, origen, objetivo, arma);
    }

    /**
     * Animar proyectil
     */
    animateProjectile(projectile, origen, objetivo, arma) {
        const start = new THREE.Vector3(
            origen.x, 
            this.getElevationAt(origen) + 10, 
            origen.y
        );
        const end = new THREE.Vector3(
            objetivo.x, 
            this.getElevationAt(objetivo) + 10, 
            objetivo.y
        );
        
        const duration = 2000; // 2 segundos
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 1) {
                const position = start.clone().lerp(end, progress);
                
                // Agregar curvatura
                const distance = start.distanceTo(end);
                const height = Math.sin(progress * Math.PI) * (distance * 0.1);
                position.y += height;
                
                projectile.position.copy(position);
                requestAnimationFrame(animate);
            } else {
                // Remover proyectil al llegar
                this.threeDService.scene.remove(projectile);
                projectile.geometry.dispose();
                projectile.material.dispose();
                
                // Crear explosión
                this.createExplosionEffect(end);
            }
        };
        
        animate();
    }

    /**
     * Crear efecto de explosión
     */
    createExplosionEffect(position) {
        // Partículas de explosión
        const particleCount = 50;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = position.x + (Math.random() - 0.5) * 20;
            positions[i3 + 1] = position.y + Math.random() * 50;
            positions[i3 + 2] = position.z + (Math.random() - 0.5) * 20;
            
            velocities.push({
                x: (Math.random() - 0.5) * 100,
                y: Math.random() * 100 + 50,
                z: (Math.random() - 0.5) * 100
            });
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xff4400,
            size: 5,
            transparent: true,
            opacity: 1
        });
        
        const particles = new THREE.Points(geometry, material);
        this.threeDService.scene.add(particles);
        
        // Animar explosión
        this.animateExplosion(particles, velocities);
    }

    /**
     * Animar explosión
     */
    animateExplosion(particles, velocities) {
        const duration = 3000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                const positions = particles.geometry.attributes.position.array;
                
                for (let i = 0; i < velocities.length; i++) {
                    const i3 = i * 3;
                    const velocity = velocities[i];
                    
                    positions[i3] += velocity.x * 0.016;
                    positions[i3 + 1] += velocity.y * 0.016;
                    positions[i3 + 2] += velocity.z * 0.016;
                    
                    // Aplicar gravedad
                    velocity.y -= 9.8 * 0.016;
                }
                
                particles.geometry.attributes.position.needsUpdate = true;
                particles.material.opacity = 1 - progress;
                
                requestAnimationFrame(animate);
            } else {
                // Limpiar explosión
                this.threeDService.scene.remove(particles);
                particles.geometry.dispose();
                particles.material.dispose();
            }
        };
        
        animate();
    }

    /**
     * Animar desvanecimiento de trayectoria
     */
    animateTrajectoryFade(line) {
        const duration = 5000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                line.material.opacity = 0.8 * (1 - progress);
                requestAnimationFrame(animate);
            } else {
                this.threeDService.scene.remove(line);
                line.geometry.dispose();
                line.material.dispose();
            }
        };
        
        animate();
    }

    /**
     * Manejar explosión
     */
    handleExplosion(explosionData) {
        if (!this.enabled) return;
        
        const { posicion, radio, tipo } = explosionData;
        this.createExplosionEffect(new THREE.Vector3(
            posicion.x,
            this.getElevationAt(posicion),
            posicion.y
        ));
    }

    /**
     * Manejar unidad destruida
     */
    handleUnitDestroyed(unitData) {
        if (!this.enabled) return;
        
        // Crear efecto de destrucción
        this.createDestructionEffect(unitData.posicion);
        
        // Remover marcador 3D si existe
        const marker = this.combatMarkers.get(unitData.id);
        if (marker) {
            this.threeDService.scene.remove(marker);
            this.combatMarkers.delete(unitData.id);
        }
    }

    /**
     * Crear efecto de destrucción
     */
    createDestructionEffect(position) {
        // Humo negro persistente
        const geometry = new THREE.PlaneGeometry(100, 100);
        const material = new THREE.MeshBasicMaterial({
            color: 0x222222,
            transparent: true,
            opacity: 0.7
        });
        
        const smoke = new THREE.Mesh(geometry, material);
        smoke.position.set(
            position.x,
            this.getElevationAt(position) + 50,
            position.y
        );
        smoke.lookAt(this.threeDService.camera.position);
        
        this.threeDService.scene.add(smoke);
        
        // Animar humo
        this.animateSmoke(smoke);
    }

    /**
     * Animar humo
     */
    animateSmoke(smoke) {
        const duration = 10000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                smoke.position.y += 1;
                smoke.material.opacity = 0.7 * (1 - progress);
                smoke.lookAt(this.threeDService.camera.position);
                requestAnimationFrame(animate);
            } else {
                this.threeDService.scene.remove(smoke);
                smoke.geometry.dispose();
                smoke.material.dispose();
            }
        };
        
        animate();
    }

    /**
     * Configurar efectos visuales
     */
    setupBackwardCompatibility() {
        // Mantener compatibilidad con código existente
        // Temporalmente comentado para evitar errores de bind
        /*
        if (typeof window !== 'undefined') {
            window.MAIRA = window.MAIRA || {};
            window.MAIRA.Combat3D = this.getLegacyInterface();
        }
        */
    }

    /**
     * Obtener elevación en posición
     */
    getElevationAt(position) {
        // Usar servicio de elevación existente
        if (window.elevationHandler && window.elevationHandler.getElevationAtPosition) {
            return window.elevationHandler.getElevationAtPosition(position.lat || position.x, position.lng || position.y) || 0;
        }
        return 0;
    }

    /**
     * Activar/desactivar integración
     */
    toggle() {
        this.enabled = !this.enabled;
        console.log(`🎯 Integración 3D de combate: ${this.enabled ? 'ACTIVADA' : 'DESACTIVADA'}`);
    }

    /**
     * Limpiar recursos
     */
    dispose() {
        // Limpiar marcadores
        this.combatMarkers.forEach((marker) => {
            this.threeDService.scene.remove(marker);
        });
        this.combatMarkers.clear();
        
        // Limpiar trayectorias
        this.trajectoryLines.forEach((line) => {
            this.threeDService.scene.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        });
        this.trajectoryLines.clear();
        
        this.enabled = false;
    }
}

// Instancia global
window.combatSystem3DIntegrator = new CombatSystem3DIntegrator();

// Auto-inicializar
// Exportar para sistema MAIRA
if (typeof window !== 'undefined') {
    window.CombatSystem3DIntegrator = CombatSystem3DIntegrator;
    
    // Integración con namespace MAIRA
    if (!window.MAIRA) window.MAIRA = {};
    if (!window.MAIRA.Services) window.MAIRA.Services = {};
    window.MAIRA.Services.CombatSystem3D = CombatSystem3DIntegrator;
    
    console.log('✅ CombatSystem3DIntegrator registrado en MAIRA.Services.CombatSystem3D');
    
    // Auto-inicialización opcional (comentada para control manual)
    // if (document.readyState === 'loading') {
    //     document.addEventListener('DOMContentLoaded', () => {
    //         setTimeout(() => {
    //             const integrator = new CombatSystem3DIntegrator();
    //             integrator.initialize();
    //         }, 2000);
    //     });
    // }
}
