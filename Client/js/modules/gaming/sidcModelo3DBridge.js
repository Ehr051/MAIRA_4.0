/**
 * 🌉 SIDC-MODELO3D BRIDGE - MAIRA 4.0
 * Conecta códigos SIDC militares con modelos 3D específicos
 * Integración completa con sistema argentino de modelos y jerarquías organizacionales
 */

class SIDCModelo3DBridge {
    constructor() {
        this.mapaSIDC = this.crearMapeoSIDC();
        this.categoriasSIDC = this.definirCategoriasSIDC();
        this.metadatosMilitares = this.cargarMetadatosMilitares();
        this.sistemaJerarquico = null;
        
        console.log('🌉 SIDC-Modelo3D Bridge inicializado');
        this.integrarSistemaJerarquico();
    }

    /**
     * INTEGRAR CON SISTEMA JERÁRQUICO
     */
    integrarSistemaJerarquico() {
        if (window.sistemaJerarquicoSIDC) {
            this.sistemaJerarquico = window.sistemaJerarquicoSIDC;
            console.log('🔗 Bridge integrado con sistema jerárquico');
        } else {
            // Esperar a que se cargue
            setTimeout(() => this.integrarSistemaJerarquico(), 1000);
        }
    }

    /**
     * FUNCIÓN PRINCIPAL: Obtener modelo 3D por código SIDC CON JERARQUÍA
     * @param {string} sidc - Código SIDC militar (ej: "SFGPUCI---A-A--")
     * @param {string} tipoVehiculo - Tipo específico de vehículo (ej: "TAM", "SK105")
     * @param {number} nivelZoom - Nivel de zoom actual
     * @returns {Promise<Object>} - Modelo 3D cargado o estructura jerárquica
     */
    async obtenerModeloPorSIDCJerarquico(sidc, tipoVehiculo = null, nivelZoom = 10) {
        if (!sidc) {
            console.warn('⚠️ Bridge: SIDC vacío o inválido');
            return null;
        }

        // Si el sistema jerárquico está disponible, usarlo
        if (this.sistemaJerarquico) {
            const infoJerarquica = this.sistemaJerarquico.obtenerInformacionJerarquica(sidc, tipoVehiculo);
            
            if (infoJerarquica) {
                console.log(`🎖️ Información jerárquica encontrada: ${infoJerarquica.estructura}`);
                
                return {
                    tipo: 'jerarquico',
                    estructura: infoJerarquica,
                    sidc: sidc,
                    tipoVehiculo: tipoVehiculo,
                    nivelZoom: nivelZoom,
                    vehiculosDisponibles: this.sistemaJerarquico.obtenerVehiculosDisponibles(sidc)
                };
            }
        }

        // Fallback al sistema original
        return this.obtenerModeloPorSIDC(sidc);
    }

    /**
     * FUNCIÓN ORIGINAL: Obtener modelo 3D por código SIDC
     * @param {string} sidc - Código SIDC militar (ej: "SFGPUCI---A-A--")
     * @returns {Promise<Object>} - Modelo 3D cargado o null si no se encuentra
     */
    async obtenerModeloPorSIDC(sidc) {
        if (!sidc) {
            console.warn('⚠️ Bridge: SIDC vacío o inválido');
            return null;
        }

        try {
            // PASO 1: Obtener tipo de elemento desde SIDC
            const tipoElemento = this.obtenerTipoDeElemento(sidc);
            
            if (this.debug) {
                console.log(`🔍 Bridge: SIDC ${sidc} -> Tipo: ${tipoElemento}`);
            }

            // PASO 2: Mapear tipo a modelo 3D usando ElementoMapper
            const modeloId = this.mapearTipoAModelo3D(tipoElemento, sidc);
            
            if (!modeloId) {
                console.warn(`⚠️ Bridge: No se encontró modelo para tipo "${tipoElemento}"`);
                return this.crearModeloGenerico(tipoElemento);
            }

            // PASO 3: Cargar modelo 3D usando Modelos3DManager
            const modelo3D = await this.cargarModelo3D(modeloId);
            
            if (modelo3D) {
                // PASO 4: Aplicar metadatos SIDC al modelo
                this.aplicarMetadatosSIDC(modelo3D, sidc, tipoElemento);
                
                if (this.debug) {
                    console.log(`✅ Bridge: Modelo 3D "${modeloId}" cargado para SIDC ${sidc}`);
                }
                
                return {
                    modelo: modelo3D,
                    modeloId: modeloId,
                    tipoElemento: tipoElemento,
                    sidc: sidc,
                    metadatos: this.obtenerMetadatosSIDC(sidc)
                };
            }

            console.warn(`⚠️ Bridge: Error cargando modelo "${modeloId}"`);
            return this.crearModeloGenerico(tipoElemento);

        } catch (error) {
            console.error('❌ Bridge: Error procesando SIDC:', error);
            return this.crearModeloGenerico('unidad_general');
        }
    }

    /**
     * OBTENER TIPO DE ELEMENTO DESDE SIDC
     * Usa la función existente o implementa lógica propia
     */
    obtenerTipoDeElemento(sidc) {
        // Intentar usar función existente del sistema
        if (typeof window.obtenerTipoDeElemento === 'function') {
            return window.obtenerTipoDeElemento(sidc);
        }

        // Lógica propia si no existe la función
        return this.parsearSIDCDirecto(sidc);
    }

    /**
     * PARSER DIRECTO DE SIDC (fallback)
     */
    parsearSIDCDirecto(sidc) {
        if (!sidc || sidc.length < 15) {
            return 'unidad_general';
        }

        try {
            // Extraer código de función (posiciones 4-6)
            const codigoFuncion = sidc.substring(4, 7);
            
            // Mapeo directo de códigos SIDC
            const mapaCodigosSIDC = {
                // UNIDADES DE COMBATE
                'UCI': 'infanteria',           // Infantería
                'UCR': 'caballeria',           // Caballería/Blindados  
                'UCF': 'artilleria',           // Artillería
                'UCE': 'ingenieros',           // Ingenieros
                'UCD': 'defensa_antiaerea',    // Defensa Antiaérea
                
                // UNIDADES DE APOYO
                'UUS': 'comunicaciones',       // Comunicaciones
                'USM': 'sanidad',              // Sanidad
                'USS': 'abastecimiento',       // Abastecimiento  
                'UST': 'transporte',           // Transporte
                'USA': 'personal',             // Personal
                'UUM': 'inteligencia',         // Inteligencia
                'UUA': 'qbn',                  // NBQ
                'UUL': 'policia_militar',      // Policía Militar
                'UUT': 'topografico',          // Topográfico

                // EQUIPOS Y VEHÍCULOS  
                'EVA': 'vehiculo_armado',      // Vehículo Armado
                'EVC': 'vehiculo_combate',     // Vehículo de Combate
                'EVU': 'vehiculo_utilitario',  // Vehículo Utilitario
                'EAI': 'aeronave',             // Aeronave
                'EAH': 'helicoptero'           // Helicóptero
            };

            return mapaCodigosSIDC[codigoFuncion] || 'unidad_general';

        } catch (error) {
            console.error('Error parseando SIDC:', error);
            return 'unidad_general';
        }
    }

    /**
     * MAPEAR TIPO DE ELEMENTO A MODELO 3D
     */
    mapearTipoAModelo3D(tipoElemento, sidc) {
        if (!this.elementoMapper) {
            console.warn('⚠️ Bridge: ElementoModelo3DMapper no disponible');
            return this.mapeoDirecto(tipoElemento);
        }

        // Usar el mapper existente
        const modeloId = this.elementoMapper.obtenerModelo3DParaElemento(tipoElemento);
        
        if (modeloId) {
            return modeloId;
        }

        // Fallback con mapeo directo
        return this.mapeoDirecto(tipoElemento);
    }

    /**
     * MAPEO DIRECTO TIPO -> MODELO (fallback)
     */
    mapeoDirecto(tipoElemento) {
        const mapeoBasico = {
            // COMBATE
            'infanteria': 'SOLDADO_RIFLE',
            'caballeria': 'TAM',
            'artilleria': 'CITER',
            'ingenieros': 'SOLDADO_ENGINEER',
            'defensa_antiaerea': 'ROLAND',
            
            // VEHÍCULOS
            'vehiculo_armado': 'TAM',
            'vehiculo_combate': 'M113',
            'vehiculo_utilitario': 'HUMVEE',
            'tanque': 'TAM',
            'tanque_ligero': 'SK105',
            
            // APOYO
            'transporte': 'UNIMOG',
            'comunicaciones': 'HUMVEE',
            'sanidad': 'AMBULANCIA',
            'abastecimiento': 'UNIMOG',
            
            // GENÉRICOS
            'unidad_general': 'SOLDADO_RIFLE'
        };

        return mapeoBasico[tipoElemento] || 'SOLDADO_RIFLE';
    }

    /**
     * CARGAR MODELO 3D USANDO MODELOS3DMANAGER
     */
    async cargarModelo3D(modeloId) {
        if (!this.modelos3DManager) {
            console.warn('⚠️ Bridge: Modelos3DManager no disponible');
            return null;
        }

        try {
            const modelo = await this.modelos3DManager.obtenerModelo3D(modeloId);
            return modelo;
        } catch (error) {
            console.error(`❌ Bridge: Error cargando modelo "${modeloId}":`, error);
            return null;
        }
    }

    /**
     * APLICAR METADATOS SIDC AL MODELO 3D
     */
    aplicarMetadatosSIDC(modelo3D, sidc, tipoElemento) {
        if (!modelo3D || !modelo3D.userData) {
            return;
        }

        // Agregar metadatos al userData del modelo
        modelo3D.userData.sidc = sidc;
        modelo3D.userData.tipoElemento = tipoElemento;
        modelo3D.userData.metadatos = this.obtenerMetadatosSIDC(sidc);
        modelo3D.userData.timestamp = Date.now();
        
        // Aplicar nombre descriptivo
        if (!modelo3D.name) {
            modelo3D.name = `${tipoElemento}_${sidc.substring(0, 6)}`;
        }
    }

    /**
     * OBTENER METADATOS DETALLADOS DEL SIDC
     */
    obtenerMetadatosSIDC(sidc) {
        if (!sidc || sidc.length < 15) {
            return {
                valido: false,
                error: 'SIDC inválido o incompleto'
            };
        }

        try {
            const metadatos = {
                valido: true,
                esquema: sidc.charAt(0),         // S = APP6
                identidad: sidc.charAt(1),       // F=Friendly, H=Hostile, etc
                dimension: sidc.charAt(2),       // P=Land, A=Air, etc  
                estado: sidc.charAt(3),          // P=Present, A=Anticipated
                funcion: sidc.substring(4, 10),  // Código de función principal
                modificador1: sidc.charAt(10),   // Modificador 1
                modificador2: sidc.charAt(11),   // Modificador 2  
                descriptor: sidc.substring(12, 15), // Descriptor adicional
                
                // Interpretaciones
                esAmigo: sidc.charAt(1) === 'F',
                esEnemigo: sidc.charAt(1) === 'H',
                esTerrestreः: sidc.charAt(2) === 'P',
                esAereo: sidc.charAt(2) === 'A',
                esNaval: sidc.charAt(2) === 'S'
            };

            return metadatos;
            
        } catch (error) {
            return {
                valido: false,
                error: 'Error parseando SIDC: ' + error.message
            };
        }
    }

    /**
     * CREAR MODELO 3D GENÉRICO (fallback)
     */
    crearModeloGenerico(tipoElemento) {
        console.log(`🔧 Bridge: Creando modelo genérico para "${tipoElemento}"`);
        
        // Crear geometría simple
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            metalness: 0.3,
            roughness: 0.7
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = `GENERICO_${tipoElemento}`;
        mesh.userData = {
            esGenerico: true,
            tipoElemento: tipoElemento,
            timestamp: Date.now()
        };

        return {
            modelo: mesh,
            modeloId: 'GENERICO',
            tipoElemento: tipoElemento,
            esGenerico: true
        };
    }

    /**
     * FUNCIÓN DE UTILIDAD: Lista de modelos disponibles
     */
    listarModelosDisponibles() {
        if (!this.modelos3DManager || !this.modelos3DManager.catalogo) {
            console.warn('⚠️ Bridge: Catálogo de modelos no disponible');
            return [];
        }

        return Object.keys(this.modelos3DManager.catalogo);
    }

    /**
     * FUNCIÓN DE UTILIDAD: Validar SIDC
     */
    validarSIDC(sidc) {
        if (!sidc || typeof sidc !== 'string') {
            return { valido: false, error: 'SIDC debe ser una cadena' };
        }

        if (sidc.length !== 15) {
            return { valido: false, error: `SIDC debe tener 15 caracteres, tiene ${sidc.length}` };
        }

        if (sidc.charAt(0) !== 'S') {
            return { valido: false, error: 'SIDC debe comenzar con "S" (APP6)' };
        }

        return { valido: true };
    }
}

// Instancia global
window.sidcModelo3DBridge = new SIDCModelo3DBridge();

// Función global de conveniencia
window.obtenerModeloPorSIDC = function(sidc) {
    return window.sidcModelo3DBridge.obtenerModeloPorSIDC(sidc);
};

console.log('✅ SIDC-Modelo3D Bridge cargado - Función global: window.obtenerModeloPorSIDC()');
