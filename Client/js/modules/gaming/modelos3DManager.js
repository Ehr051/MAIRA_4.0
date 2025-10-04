/**
 * GESTOR DE MODELOS 3D - MAIRA 4.0
 * =================================
 * Relaciona elementos militares con modelos 3D disponibles
 */

class Modelos3DManager {
    constructor() {
        // Verificar que THREE.js esté disponible
        if (typeof THREE === 'undefined') {
            console.error('❌ THREE.js no está disponible - Modelos3DManager no puede inicializarse');
            return;
        }

        this.catalogoModelos = this.crearCatalogoModelos();
        this.modelosCache = new Map(); // Cache de modelos cargados
        this.loader = new THREE.GLTFLoader();
        
        // Integración con sistema de formaciones jerárquicas
        this.sistemaFormaciones = null;
        this.inicializarSistemaFormaciones();
        
        console.log('🎮 Gestor de Modelos 3D inicializado');
    }

    /**
     * CATÁLOGO DE MODELOS 3D
     * Relaciona cada tipo de elemento con su modelo correspondiente
     */
    crearCatalogoModelos() {
        return {
            // ============ TANQUES Y BLINDADOS ARGENTINOS ============
            "TAM": {
                modelo: "/Client/assets/models/tam_tank.glb",
                backup: "procedural_tank",
                escala: 1.0,
                categoria: "MBT",
                descripcion: "Tanque Argentino Mediano (105mm L7A1)"
            },
            "TAM_2C": {
                modelo: "/Client/assets/models/tam_2c_tank.glb",
                backup: "procedural_tank_modern",
                escala: 1.0,
                categoria: "MBT",
                descripcion: "TAM 2C Modernizado (120mm L/44)"
            },
            "M113": {
                modelo: "/Client/assets/models/m113_apc.glb", 
                backup: "procedural_apc",
                escala: 0.8,
                categoria: "APC",
                descripcion: "Transporte Blindado de Personal M113"
            },
            "SK105": {
                modelo: "/Client/assets/models/sk105.glb",
                backup: "procedural_tank_light",
                escala: 0.9,
                categoria: "LIGHT_TANK",
                descripcion: "SK-105 Kürassier (105mm)"
            },

            // ============ ARTILLERÍA Y MORTEROS ============
            "ARTILLERY_CANNON": {
                modelo: "/Client/assets/models/artillery_cannon.glb",
                backup: "procedural_cannon",
                escala: 1.0,
                categoria: "CANNON",
                descripcion: "Cañón de Artillería 12 libras"
            },
            "ARTILLERY_HOWITZER": {
                modelo: "/Client/assets/models/artillery_howitzer.glb",
                backup: "procedural_howitzer",
                escala: 1.2,
                categoria: "HOWITZER",
                descripcion: "Obús Palmaria Thunder 155mm"
            },
            "MORTAR_81MM": {
                modelo: "/Client/assets/models/mortar_81mm.glb",
                backup: "procedural_mortar",
                escala: 0.8,
                categoria: "MORTAR",
                descripcion: "Mortero Pindad 81mm"
            },

            // ============ VEHÍCULOS TÁCTICOS Y LOGÍSTICOS ============
            "COMMAND_VEHICLE": {
                modelo: "/Client/assets/models/command_vehicle.glb",
                backup: "procedural_command_vehicle",
                escala: 0.9,
                categoria: "COMMAND",
                descripcion: "Vehículo de Comando HUMVEE"
            },
            "HUMVEE": {
                modelo: "/Client/assets/models/humvee.glb",
                backup: "procedural_jeep",
                escala: 0.7,
                categoria: "LIGHT_VEHICLE", 
                descripcion: "Vehículo Táctico Ligero HUMVEE"
            },
            "MILITARY_JEEP": {
                modelo: "/Client/assets/models/military_jeep.glb",
                backup: "procedural_jeep",
                escala: 0.7,
                categoria: "LIGHT_VEHICLE",
                descripcion: "Jeep Militar de Reconocimiento"
            },
            "SUPPLY_TRUCK": {
                modelo: "/Client/assets/models/supply_truck.glb",
                backup: "procedural_truck",
                escala: 1.0,
                categoria: "LOGISTICS",
                descripcion: "Camión Logístico 4320"
            },
            "LOGISTICS_TRUCK": {
                modelo: "/Client/assets/models/logistics_truck.glb",
                backup: "procedural_truck",
                escala: 1.0,
                categoria: "LOGISTICS",
                descripcion: "Mercedes-Benz Zetros Logístico"
            },

            // ============ VEHÍCULOS MÉDICOS Y APOYO ============
            "AMBULANCE": {
                modelo: "/Client/assets/models/ambulance.glb",
                backup: "procedural_ambulance",
                escala: 0.9,
                categoria: "MEDICAL",
                descripcion: "Ambulancia Militar M725"
            },

            // ============ ESTRUCTURAS Y INSTALACIONES ============
            "COMMAND_TENT": {
                modelo: "/Client/assets/models/command_tent.glb",
                backup: "procedural_tent",
                escala: 1.2,
                categoria: "STRUCTURE",
                descripcion: "Carpa de Comando Militar"
            },

            // ============ INFANTERÍA Y PERSONAL ============
            "SOLDADO_RIFLE": {
                modelo: "/Client/assets/models/soldier_rifle.glb",
                backup: "procedural_soldier",
                escala: 0.3,
                categoria: "INFANTRY",
                descripcion: "Soldado con Fusil FAL"
            },
            "SOLDADO_ENGINEER": {
                modelo: "/Client/assets/models/soldier_engineer.glb",
                backup: "procedural_soldier_engineer",
                escala: 0.3,
                categoria: "ENGINEER",
                descripcion: "Soldado de Ingenieros (NBQ)"
            },
            "SOLDADO_ANTITANK": {
                modelo: "/Client/assets/models/soldier_antitank.glb", 
                backup: "procedural_soldier_antitank",
                escala: 0.3,
                categoria: "INFANTRY_AT",
                descripcion: "Operador Javelin Antitanque"
            },
            "SOLDADO_MOUNTAIN": {
                modelo: "/Client/assets/models/soldier_mountain.glb",
                backup: "procedural_soldier_mountain",
                escala: 0.3,
                categoria: "MOUNTAIN",
                descripcion: "Soldado de Montaña (Bosque)"
            },
            "SOLDADO_DESERT": {
                modelo: "/Client/assets/models/soldier_desert.glb",
                backup: "procedural_soldier_desert",
                escala: 0.3,
                categoria: "DESERT",  
                descripcion: "Soldado del Desierto (Arena)"
            },

            // ============ ELEMENTOS POR ESPECIALIDAD ============
            // Mapeo por tipo de elemento (usado por el mapper)
            "INFANTRY": {
                modelo: "/Client/assets/models/soldier_rifle.glb",
                backup: "procedural_soldier",
                escala: 0.3,
                categoria: "INFANTRY"
            },
            "TANK": {
                modelo: "/Client/assets/models/tam_tank.glb",
                backup: "procedural_tank",
                escala: 1.0,
                categoria: "MBT"
            },
            "ARTILLERY": {
                modelo: "/Client/assets/models/artillery_howitzer.glb",
                backup: "procedural_artillery",
                escala: 1.2,
                categoria: "HOWITZER"
            },
            "ENGINEER": {
                modelo: "/Client/assets/models/soldier_engineer.glb",
                backup: "procedural_soldier_engineer",
                escala: 0.3,
                categoria: "ENGINEER"
            },
            "LOGISTICS": {
                modelo: "/Client/assets/models/supply_truck.glb",
                backup: "procedural_truck",
                escala: 1.0,
                categoria: "LOGISTICS"
            },
            "MEDICAL": {
                modelo: "/Client/assets/models/ambulance.glb",
                backup: "procedural_ambulance",
                escala: 0.9,
                categoria: "MEDICAL"
            },

            // ============ ELEMENTOS GENÉRICOS ============
            "GENERICO": {
                modelo: "/Client/assets/models/soldier_rifle.glb",
                backup: "procedural_soldier",
                escala: 0.3,
                categoria: "INFANTRY",
                descripcion: "Elemento Genérico Militar"
            }
        };
    }

    /**
     * OBTENER MODELO 3D ESPECÍFICO
     * Método principal para obtener cualquier modelo del catálogo
     */
    async obtenerModelo3D(tipoElemento, posicion, escala = 1.0) {
        const config = this.catalogoModelos[tipoElemento.toUpperCase()] || this.catalogoModelos["GENERICO"];
        
        try {
            // Intentar cargar modelo GLB
            if (config.modelo) {
                const modeloGLB = await this.cargarModeloGLB(config.modelo);
                if (modeloGLB) {
                    modeloGLB.scale.setScalar(config.escala * escala);
                    return modeloGLB;
                }
            }
            
            // Fallback a modelo procedural
            console.warn(`⚠️ Usando modelo procedural para: ${tipoElemento}`);
            return this.crearModeloProcedural(config.backup, posicion, config.escala * escala);
            
        } catch (error) {
            console.error(`❌ Error cargando modelo ${tipoElemento}:`, error);
            return this.crearModeloGenerico(posicion, escala);
        }
    }

    /**
     * CARGAR MODELO GLB DESDE ARCHIVO
     */
    async cargarModeloGLB(rutaModelo) {
        const rutaCompleta = `/Client/${rutaModelo}`;
        
        // Verificar caché
        if (this.modelosCache.has(rutaCompleta)) {
            return this.modelosCache.get(rutaCompleta).clone();
        }

        try {
            const gltf = await new Promise((resolve, reject) => {
                this.loader.load(
                    rutaCompleta,
                    resolve,
                    undefined,
                    reject
                );
            });

            const modelo = gltf.scene;
            
            // Configurar modelo
            modelo.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Guardar en caché
            this.modelosCache.set(rutaCompleta, modelo);
            console.log(`✅ Modelo GLB cargado: ${rutaModelo}`);
            
            return modelo.clone();
            
        } catch (error) {
            console.error(`❌ Error cargando GLB ${rutaModelo}:`, error);
            return null;
        }
    }

    /**
     * CREAR MODELO PROCEDURAL DE RESPALDO
     */
    crearModeloProcedural(tipoBackup, posicion, escala = 1.0) {
        let modelo;

        switch (tipoBackup) {
            case 'procedural_tank':
                modelo = this.crearModeloProceduralTank();
                break;
            case 'procedural_tank_modern':
                modelo = this.crearModeloProceduralTankModern();
                break;
            case 'procedural_soldier':
                modelo = this.crearModeloProceduralSoldier();
                break;
            case 'procedural_soldier_engineer':
                modelo = this.crearModeloProceduralSoldierEngineer();
                break;
            case 'procedural_soldier_antitank':
                modelo = this.crearModeloProceduralSoldierAntitank();
                break;
            case 'procedural_soldier_mountain':
                modelo = this.crearModeloProceduralSoldierMountain();
                break;
            case 'procedural_soldier_desert':
                modelo = this.crearModeloProceduralSoldierDesert();
                break;
            case 'procedural_artillery':
                modelo = this.crearModeloProceduralArtillery();
                break;
            case 'procedural_mortar':
                modelo = this.crearModeloProceduralMortar();
                break;
            case 'procedural_truck':
                modelo = this.crearModeloProceduralTruck();
                break;
            case 'procedural_ambulance':
                modelo = this.crearModeloProceduralAmbulance();
                break;
            case 'procedural_tent':
                modelo = this.crearModeloProceduralTent();
                break;
            default:
                modelo = this.crearModeloGenerico();
        }
        
        if (modelo) {
            modelo.scale.setScalar(escala);
        }
        
        return modelo;
    }

    /**
     * MODELOS PROCEDURALES DE RESPALDO
     * Si no hay modelo 3D disponible, genera uno procedural
     */
    crearModeloProceduralTank() {
        const grupo = new THREE.Group();
        
        // Casco del tanque TAM (estilo argentino)
        const cascoGeometria = new THREE.BoxGeometry(2.2, 0.8, 1.1);
        const cascoMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5d23 });
        const casco = new THREE.Mesh(cascoGeometria, cascoMaterial);
        grupo.add(casco);
        
        // Torre
        const torreGeometria = new THREE.BoxGeometry(1.2, 0.6, 0.8);
        const torre = new THREE.Mesh(torreGeometria, cascoMaterial);
        torre.position.y = 0.7;
        grupo.add(torre);
        
        // Cañón
        const canonGeometria = new THREE.CylinderGeometry(0.05, 0.08, 1.5);
        const canonMaterial = new THREE.MeshLambertMaterial({ color: 0x2d3618 });
        const canon = new THREE.Mesh(canonGeometria, canonMaterial);
        canon.rotation.z = Math.PI / 2;
        canon.position.set(0.8, 0.7, 0);
        grupo.add(canon);
        
        return grupo;
    }

    crearModeloProceduralTankModern() {
        const grupo = new THREE.Group();
        
        // Casco del TAM 2C (más moderno, angular)
        const cascoGeometria = new THREE.BoxGeometry(2.3, 0.9, 1.2);
        const cascoMaterial = new THREE.MeshLambertMaterial({ color: 0x556b2f }); // Verde más moderno
        const casco = new THREE.Mesh(cascoGeometria, cascoMaterial);
        grupo.add(casco);
        
        // Torre modernizada (más angular)
        const torreGeometria = new THREE.BoxGeometry(1.4, 0.7, 1.0);
        const torre = new THREE.Mesh(torreGeometria, cascoMaterial);
        torre.position.y = 0.8;
        grupo.add(torre);
        
        // Cañón 120mm (más grueso que TAM original)
        const canonGeometria = new THREE.CylinderGeometry(0.06, 0.09, 1.8);
        const canonMaterial = new THREE.MeshLambertMaterial({ color: 0x2d3618 });
        const canon = new THREE.Mesh(canonGeometria, canonMaterial);
        canon.rotation.z = Math.PI / 2;
        canon.position.set(1.0, 0.8, 0);
        grupo.add(canon);
        
        // Blindaje reactivo (placas adicionales)
        const blindajeGeometria = new THREE.BoxGeometry(0.1, 0.3, 0.8);
        const blindajeMaterial = new THREE.MeshLambertMaterial({ color: 0x3e4a1f });
        
        // Blindaje lateral izquierdo 
        const blindajeL = new THREE.Mesh(blindajeGeometria, blindajeMaterial);
        blindajeL.position.set(-1.2, 0.3, 0);
        grupo.add(blindajeL);
        
        // Blindaje lateral derecho
        const blindajeR = new THREE.Mesh(blindajeGeometria, blindajeMaterial);
        blindajeR.position.set(1.2, 0.3, 0);
        grupo.add(blindajeR);
        
        return grupo;
    }

    crearModeloProceduralAPC() {
        const grupo = new THREE.Group();
        
        // Casco más alto y alargado
        const cascoGeometria = new THREE.BoxGeometry(2.2, 1.0, 1.2);
        const cascoMaterial = new THREE.MeshLambertMaterial({ color: 0x6b7a3a });
        const casco = new THREE.Mesh(cascoGeometria, cascoMaterial);
        grupo.add(casco);
        
        // Ametralladora
        const torretaGeometria = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const torreta = new THREE.Mesh(torretaGeometria, cascoMaterial);
        torreta.position.set(0, 0.8, 0.3);
        grupo.add(torreta);
        
        return grupo;
    }

    crearModeloProceduralSoldier() {
        const grupo = new THREE.Group();
        
        // Cuerpo
        const cuerpoGeometria = new THREE.BoxGeometry(0.3, 0.8, 0.2);
        const cuerpoMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5d23 });
        const cuerpo = new THREE.Mesh(cuerpoGeometria, cuerpoMaterial);
        cuerpo.position.y = 0.4;
        grupo.add(cuerpo);
        
        // Cabeza
        const cabezaGeometria = new THREE.SphereGeometry(0.15);
        const cabezaMaterial = new THREE.MeshLambertMaterial({ color: 0xfdbcb4 });
        const cabeza = new THREE.Mesh(cabezaGeometria, cabezaMaterial);
        cabeza.position.y = 0.95;
        grupo.add(cabeza);
        
        return grupo;
    }

    crearModeloProceduralSoldierEngineer() {
        const grupo = new THREE.Group();
        
        // Cuerpo (similar al soldado básico)
        const cuerpoGeometria = new THREE.BoxGeometry(0.3, 0.8, 0.2);
        const cuerpoMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5d23 });
        const cuerpo = new THREE.Mesh(cuerpoGeometria, cuerpoMaterial);
        cuerpo.position.y = 0.4;
        grupo.add(cuerpo);
        
        // Cabeza con casco/máscara
        const cabezaGeometria = new THREE.BoxGeometry(0.18, 0.18, 0.18);
        const cabezaMaterial = new THREE.MeshLambertMaterial({ color: 0x2c2c2c }); // Gris oscuro para máscara
        const cabeza = new THREE.Mesh(cabezaGeometria, cabezaMaterial);
        cabeza.position.y = 0.95;
        grupo.add(cabeza);
        
        // Equipo especializado (mochila de herramientas)
        const mochilaGeometria = new THREE.BoxGeometry(0.15, 0.4, 0.25);
        const mochilaMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 }); // Marrón
        const mochila = new THREE.Mesh(mochilaGeometria, mochilaMaterial);
        mochila.position.set(0, 0.5, -0.15);
        grupo.add(mochila);
        
        // Herramienta en mano (detector/instrumento)
        const herramientaGeometria = new THREE.CylinderGeometry(0.02, 0.02, 0.3);
        const herramientaMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        const herramienta = new THREE.Mesh(herramientaGeometria, herramientaMaterial);
        herramienta.rotation.z = Math.PI / 4;
        herramienta.position.set(0.2, 0.6, 0);
        grupo.add(herramienta);
        
        return grupo;
    }

    /**
     * OBTENER MODELO 3D PARA UN ELEMENTO
     */
    async obtenerModelo3D(tipoElemento, posicion) {
        // Buscar en catálogo
        const configModelo = this.catalogoModelos[tipoElemento];
        if (!configModelo) {
            console.warn(`⚠️ Modelo no encontrado para: ${tipoElemento}`);
            return this.crearModeloGenerico();
        }

        // Verificar cache
        if (this.modelosCache.has(tipoElemento)) {
            const modeloClonado = this.modelosCache.get(tipoElemento).clone();
            this.posicionarModelo(modeloClonado, posicion, configModelo.escala);
            return modeloClonado;
        }

        try {
            // Intentar cargar modelo 3D real
            const modelo = await this.cargarModeloGLTF(configModelo.modelo);
            this.modelosCache.set(tipoElemento, modelo);
            
            const modeloClonado = modelo.clone();
            this.posicionarModelo(modeloClonado, posicion, configModelo.escala);
            return modeloClonado;
            
        } catch (error) {
            console.warn(`⚠️ Error cargando modelo ${tipoElemento}, usando procedural:`, error);
            return this.crearModeloProcedural(configModelo.backup, posicion, configModelo.escala);
        }
    }

    async cargarModeloGLTF(rutaModelo) {
        return new Promise((resolve, reject) => {
            this.loader.load(
                rutaModelo,
                (gltf) => resolve(gltf.scene),
                (progress) => console.log(`📦 Cargando modelo: ${(progress.loaded / progress.total * 100)}%`),
                (error) => reject(error)
            );
        });
    }

    crearModeloProcedural(tipoBackup, posicion, escala) {
        let modelo;
        
        switch (tipoBackup) {
            case 'procedural_tank': modelo = this.crearModeloProceduralTank(); break;
            case 'procedural_tank_modern': modelo = this.crearModeloProceduralTankModern(); break;
            case 'procedural_apc': modelo = this.crearModeloProceduralAPC(); break;
            case 'procedural_soldier': modelo = this.crearModeloProceduralSoldier(); break;
            case 'procedural_soldier_engineer': modelo = this.crearModeloProceduralSoldierEngineer(); break;
            case 'procedural_soldier_mountain': modelo = this.crearModeloProceduralSoldierMountain(); break;
            case 'procedural_soldier_serva': modelo = this.crearModeloProceduralSoldierServa(); break;
            case 'procedural_soldier_at': modelo = this.crearModeloProceduralSoldierAT(); break;
            case 'procedural_at_weapon': modelo = this.crearModeloProceduralATWeapon(); break;
            default: modelo = this.crearModeloGenerico();
        }
        
        this.posicionarModelo(modelo, posicion, escala);
        return modelo;
    }

    crearModeloGenerico() {
        const geometria = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        return new THREE.Mesh(geometria, material);
    }

    posicionarModelo(modelo, posicion, escala = 1.0) {
        // Validar que posicion existe y tiene propiedades válidas
        if (posicion && typeof posicion === 'object' && posicion.x !== undefined && posicion.z !== undefined) {
            modelo.position.set(posicion.x, 0, posicion.z);
        } else {
            // Posición por defecto si no se proporciona una válida
            modelo.position.set(0, 0, 0);
        }
        
        modelo.scale.set(escala, escala, escala);
        
        // Rotación aleatoria para variedad
        modelo.rotation.y = Math.random() * Math.PI * 2;
    }

    /**
     * INICIALIZA SISTEMA DE FORMACIONES MILITARES
     */
    async inicializarSistemaFormaciones() {
        try {
            // Esperar a que se cargue el sistema de formaciones si no está disponible
            if (typeof window.sistemaFormacionesMilitares === 'undefined') {
                console.log('⏳ Esperando sistema de formaciones...');
                await this.esperarSistemaFormaciones();
            }
            
            this.sistemaFormaciones = window.sistemaFormacionesMilitares;
            console.log('✅ Sistema de formaciones integrado');
        } catch (error) {
            console.warn('⚠️ No se pudo integrar sistema de formaciones:', error);
        }
    }

    async esperarSistemaFormaciones(maxIntentos = 10) {
        for (let i = 0; i < maxIntentos; i++) {
            if (typeof window.sistemaFormacionesMilitares !== 'undefined') {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        throw new Error('Sistema de formaciones no disponible');
    }

    /**
     * CREAR FORMACIÓN MILITAR JERÁRQUICA
     * Genera múltiples modelos 3D basados en la doctrina militar
     */
    async crearFormacionMilitar(elemento, nivelZoom, posicion) {
        if (!this.sistemaFormaciones) {
            console.warn('⚠️ Sistema de formaciones no disponible');
            return this.crearModelo(elemento.tipo || 'GENERICO', posicion);
        }

        try {
            const formacion = this.sistemaFormaciones.generarFormacion(elemento, nivelZoom, [posicion.lat, posicion.lng]);
            
            if (!formacion) {
                // Fallback al modelo individual
                return this.crearModelo(elemento.tipo || 'GENERICO', posicion);
            }

            const grupoFormacion = new THREE.Group();
            grupoFormacion.userData = {
                formacionId: formacion.id,
                elemento: elemento,
                tipo: 'formacion_militar'
            };

            // Crear modelos para cada unidad en la formación
            for (const unidad of formacion.unidades) {
                const modeloUnidad = await this.cargarModeloUnidad(unidad);
                if (modeloUnidad) {
                    const posGeo = this.convertirCoordenadas(unidad.posicion);
                    modeloUnidad.position.set(posGeo.x, 0, posGeo.z);
                    modeloUnidad.rotation.y = THREE.MathUtils.degToRad(unidad.rotacion);
                    modeloUnidad.scale.setScalar(unidad.escala);
                    
                    grupoFormacion.add(modeloUnidad);
                }
            }

            // Crear modelos para vehículos
            for (const vehiculo of formacion.vehiculos) {
                const modeloVehiculo = await this.cargarModeloVehiculo(vehiculo);
                if (modeloVehiculo) {
                    const posGeo = this.convertirCoordenadas(vehiculo.posicion);
                    modeloVehiculo.position.set(posGeo.x, 0, posGeo.z);
                    modeloVehiculo.rotation.y = THREE.MathUtils.degToRad(vehiculo.rotacion);
                    modeloVehiculo.scale.setScalar(vehiculo.escala);
                    
                    grupoFormacion.add(modeloVehiculo);
                }
            }

            console.log(`✅ Formación creada: ${formacion.unidades.length} unidades + ${formacion.vehiculos.length} vehículos`);
            return grupoFormacion;

        } catch (error) {
            console.error('❌ Error creando formación militar:', error);
            return this.crearModelo(elemento.tipo || 'GENERICO', posicion);
        }
    }

    /**
     * Carga modelo para una unidad individual
     */
    async cargarModeloUnidad(unidad) {
        const rutaModelo = `/Client/assets/models/${unidad.modelo3D}`;
        
        try {
            if (this.modelosCache.has(unidad.modelo3D)) {
                return this.modelosCache.get(unidad.modelo3D).clone();
            }

            const modelo = await this.cargarModeloGLB(rutaModelo);
            this.modelosCache.set(unidad.modelo3D, modelo);
            
            const instancia = modelo.clone();
            instancia.userData = {
                unidadId: unidad.id,
                rol: unidad.rol,
                tipo: unidad.tipo,
                estado: unidad.estado,
                salud: unidad.salud,
                municion: unidad.municion
            };

            return instancia;
        } catch (error) {
            console.warn(`⚠️ Error cargando modelo ${unidad.modelo3D}, usando fallback`);
            return this.crearModeloProceduralSoldier();
        }
    }

    /**
     * Carga modelo para un vehículo
     */
    async cargarModeloVehiculo(vehiculo) {
        const rutaModelo = `/Client/assets/models/${vehiculo.modelo}.glb`;
        
        try {
            if (this.modelosCache.has(vehiculo.modelo)) {
                return this.modelosCache.get(vehiculo.modelo).clone();
            }

            const modelo = await this.cargarModeloGLB(rutaModelo);
            this.modelosCache.set(vehiculo.modelo, modelo);
            
            const instancia = modelo.clone();
            instancia.userData = {
                vehiculo: true,
                tipo: vehiculo.modelo
            };

            return instancia;
        } catch (error) {
            console.warn(`⚠️ Error cargando vehículo ${vehiculo.modelo}, usando fallback`);
            return this.crearModeloProceduralTank();
        }
    }

    /**
     * Convierte coordenadas geográficas a posición 3D relativa
     */
    convertirCoordenadas(coordenadas) {
        const [lat, lng] = coordenadas;
        // Conversión simplificada para posicionamiento relativo
        // En implementación real, usar proyección cartográfica
        return {
            x: lng * 111320, // Aproximación metros por grado de longitud
            z: lat * 111320  // Aproximación metros por grado de latitud
        };
    }

    /**
     * MODELOS PROCEDURALES ESPECIALIZADOS PARA NUEVOS ELEMENTOS
     */
    crearModeloProceduralSoldierAntitank() {
        const grupo = new THREE.Group();
        
        // Soldado base (más robusto)
        const cuerpoGeometria = new THREE.CapsuleGeometry(0.15, 0.6, 4, 8);
        const cuerpoMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 }); // Verde militar
        const cuerpo = new THREE.Mesh(cuerpoGeometria, cuerpoMaterial);
        cuerpo.position.y = 0.3;
        grupo.add(cuerpo);
        
        // Cabeza con casco
        const cabezaGeometria = new THREE.SphereGeometry(0.12, 8, 6);
        const cabezaMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const cabeza = new THREE.Mesh(cabezaGeometria, cabezaMaterial);
        cabeza.position.y = 0.75;
        grupo.add(cabeza);
        
        // Sistema Javelin (grande y distintivo)
        const javelinGeometria = new THREE.BoxGeometry(0.05, 0.05, 1.2);
        const javelinMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const javelin = new THREE.Mesh(javelinGeometria, javelinMaterial);
        javelin.position.set(0.2, 0.5, 0);
        javelin.rotation.z = -Math.PI / 4;
        grupo.add(javelin);
        
        // Mochila con equipos
        const mochilaGeometria = new THREE.BoxGeometry(0.25, 0.35, 0.1);
        const mochilaMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const mochila = new THREE.Mesh(mochilaGeometria, mochilaMaterial);
        mochila.position.set(0, 0.4, -0.15);
        grupo.add(mochila);
        
        return grupo;
    }

    crearModeloProceduralSoldierMountain() {
        const grupo = new THREE.Group();
        
        // Soldado base (adaptado al terreno)
        const cuerpoGeometria = new THREE.CapsuleGeometry(0.15, 0.6, 4, 8);
        const cuerpoMaterial = new THREE.MeshLambertMaterial({ color: 0x3d4f2a }); // Verde bosque
        const cuerpo = new THREE.Mesh(cuerpoGeometria, cuerpoMaterial);
        cuerpo.position.y = 0.3;
        grupo.add(cuerpo);
        
        // Cabeza con boina
        const cabezaGeometria = new THREE.SphereGeometry(0.12, 8, 6);
        const cabezaMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const cabeza = new THREE.Mesh(cabezaGeometria, cabezaMaterial);
        cabeza.position.y = 0.75;
        grupo.add(cabeza);
        
        // Boina característica
        const boinaGeometria = new THREE.CylinderGeometry(0.13, 0.13, 0.05, 8);
        const boinaMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        const boina = new THREE.Mesh(boinaGeometria, boinaMaterial);
        boina.position.set(0, 0.82, 0);
        grupo.add(boina);
        
        // Equipo de montaña
        const equipoGeometria = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6);
        const equipoMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const equipo = new THREE.Mesh(equipoGeometria, equipoMaterial);
        equipo.position.set(-0.2, 0.4, 0);
        grupo.add(equipo);
        
        return grupo;
    }

    crearModeloProceduralSoldierDesert() {
        const grupo = new THREE.Group();
        
        // Soldado base (colores desierto)
        const cuerpoGeometria = new THREE.CapsuleGeometry(0.15, 0.6, 4, 8);
        const cuerpoMaterial = new THREE.MeshLambertMaterial({ color: 0xc4a484 }); // Caqui desierto
        const cuerpo = new THREE.Mesh(cuerpoGeometria, cuerpoMaterial);
        cuerpo.position.y = 0.3;
        grupo.add(cuerpo);
        
        // Cabeza con protección
        const cabezaGeometria = new THREE.SphereGeometry(0.12, 8, 6);
        const cabezaMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const cabeza = new THREE.Mesh(cabezaGeometria, cabezaMaterial);
        cabeza.position.y = 0.75;
        grupo.add(cabeza);
        
        // Casco con protección solar
        const cascoGeometria = new THREE.SphereGeometry(0.14, 8, 6);
        const cascoMaterial = new THREE.MeshLambertMaterial({ color: 0xd2b48c });
        const casco = new THREE.Mesh(cascoGeometria, cascoMaterial);
        casco.position.y = 0.75;
        grupo.add(casco);
        
        return grupo;
    }

    crearModeloProceduralArtillery() {
        const grupo = new THREE.Group();
        
        // Base del cañón
        const baseGeometria = new THREE.CylinderGeometry(0.8, 1.0, 0.3, 8);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5d23 });
        const base = new THREE.Mesh(baseGeometria, baseMaterial);
        grupo.add(base);
        
        // Cañón principal
        const canonGeometria = new THREE.CylinderGeometry(0.08, 0.08, 3.0, 12);
        const canonMaterial = new THREE.MeshLambertMaterial({ color: 0x2d2d2d });
        const canon = new THREE.Mesh(canonGeometria, canonMaterial);
        canon.rotation.z = Math.PI / 2;
        canon.position.set(1.5, 0.5, 0);
        grupo.add(canon);
        
        // Sistema de elevación
        const elevacionGeometria = new THREE.BoxGeometry(0.6, 0.8, 0.4);
        const elevacionMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5d23 });
        const elevacion = new THREE.Mesh(elevacionGeometria, elevacionMaterial);
        elevacion.position.set(0, 0.4, 0);
        grupo.add(elevacion);
        
        return grupo;
    }

    crearModeloProceduralMortar() {
        const grupo = new THREE.Group();
        
        // Base tripode
        const baseGeometria = new THREE.ConeGeometry(0.4, 0.2, 3);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x2d2d2d });
        const base = new THREE.Mesh(baseGeometria, baseMaterial);
        grupo.add(base);
        
        // Tubo del mortero
        const tuboGeometria = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 12);
        const tuboMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const tubo = new THREE.Mesh(tuboGeometria, tuboMaterial);
        tubo.rotation.z = Math.PI / 4;
        tubo.position.set(0.4, 0.6, 0);
        grupo.add(tubo);
        
        return grupo;
    }

    crearModeloProceduralTruck() {
        const grupo = new THREE.Group();
        
        // Cabina
        const cabinaGeometria = new THREE.BoxGeometry(1.0, 0.8, 0.6);
        const cabinaMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5d23 });
        const cabina = new THREE.Mesh(cabinaGeometria, cabinaMaterial);
        cabina.position.set(0, 0.4, 0.8);
        grupo.add(cabina);
        
        // Caja de carga
        const cajaGeometria = new THREE.BoxGeometry(1.0, 0.6, 1.8);
        const cajaMaterial = new THREE.MeshLambertMaterial({ color: 0x6b7a3a });
        const caja = new THREE.Mesh(cajaGeometria, cajaMaterial);
        caja.position.set(0, 0.3, -0.5);
        grupo.add(caja);
        
        // Ruedas
        for (let i = 0; i < 6; i++) {
            const ruedaGeometria = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
            const ruedaMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            const rueda = new THREE.Mesh(ruedaGeometria, ruedaMaterial);
            rueda.rotation.z = Math.PI / 2;
            rueda.position.set(i % 2 === 0 ? -0.6 : 0.6, 0, -1.2 + (Math.floor(i / 2) * 0.8));
            grupo.add(rueda);
        }
        
        return grupo;
    }

    crearModeloProceduralAmbulance() {
        const grupo = new THREE.Group();
        
        // Base del vehículo (similar al truck pero más compacto)
        const baseGeometria = new THREE.BoxGeometry(1.0, 0.6, 2.0);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff }); // Blanco médico
        const base = new THREE.Mesh(baseGeometria, baseMaterial);
        base.position.y = 0.3;
        grupo.add(base);
        
        // Cruz roja
        const cruzGeometria = new THREE.BoxGeometry(0.1, 0.3, 0.05);
        const cruzMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const cruzV = new THREE.Mesh(cruzGeometria, cruzMaterial);
        cruzV.position.set(0.51, 0.4, 0);
        grupo.add(cruzV);
        
        const cruzH = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.05), cruzMaterial);
        cruzH.position.set(0.51, 0.4, 0);
        grupo.add(cruzH);
        
        // Ruedas
        for (let i = 0; i < 4; i++) {
            const ruedaGeometria = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 8);
            const ruedaMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            const rueda = new THREE.Mesh(ruedaGeometria, ruedaMaterial);
            rueda.rotation.z = Math.PI / 2;
            rueda.position.set(i % 2 === 0 ? -0.6 : 0.6, 0, i < 2 ? -0.8 : 0.8);
            grupo.add(rueda);
        }
        
        return grupo;
    }

    crearModeloProceduralTent() {
        const grupo = new THREE.Group();
        
        // Base de la carpa
        const baseGeometria = new THREE.CylinderGeometry(1.5, 1.5, 0.05, 8);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        const base = new THREE.Mesh(baseGeometria, baseMaterial);
        grupo.add(base);
        
        // Estructura de la carpa (forma cónica)
        const carpaGeometria = new THREE.ConeGeometry(1.4, 1.8, 8);
        const carpaMaterial = new THREE.MeshLambertMaterial({ color: 0x6b7a3a });
        const carpa = new THREE.Mesh(carpaGeometria, carpaMaterial);
        carpa.position.y = 0.9;
        grupo.add(carpa);
        
        // Mástil central
        const mastilGeometria = new THREE.CylinderGeometry(0.03, 0.03, 2.0, 8);
        const mastilMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const mastil = new THREE.Mesh(mastilGeometria, mastilMaterial);
        mastil.position.y = 1.0;
        grupo.add(mastil);
        
        return grupo;
    }

    /**
     * FUENTES RECOMENDADAS PARA MODELOS 3D GRATUITOS
     */
    obtenerFuentesModelos() {
        return {
            "Sketchfab": "https://sketchfab.com/search?features=downloadable&licenses=322a749bcfa841b29dff1e8a1bb74b0b&sort_by=-relevance&type=models&q=military",
            "TurboSquid Free": "https://www.turbosquid.com/Search/3D-Models/free/military",
            "CGTrader Free": "https://www.cgtrader.com/free-3d-models/military",
            "Free3D": "https://free3d.com/3d-models/military",
            "Poly Haven": "https://polyhaven.com/models (vehículos genéricos)",
            "OpenGameArt": "https://opengameart.org/art-search-advanced?keys=tank&field_art_type_tid%5B%5D=9"
        };
    }
}

// Instancia global
window.modelos3DManager = new Modelos3DManager();
