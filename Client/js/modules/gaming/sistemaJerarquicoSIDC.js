/**
 * 🎯 SISTEMA JERÁRQUICO ORGANIZACIONAL SIDC - MAIRA 4.0
 * Mapea códigos SIDC a estructuras organizacionales argentinas específicas
 * Integración con JSON militar y sistema de despliegue 3D jerárquico
 */

class SistemaJerarquicoSIDC {
    constructor() {
        this.datosOrganizacionales = null;
        this.estructurasFormacion = new Map();
        this.elementosActivos = new Map();
        this.modelos3DManager = null;
        this.elementoMapper = null;
        
        console.log('🎖️ Sistema Jerárquico SIDC inicializado');
        this.inicializar();
    }

    async inicializar() {
        await this.cargarDatosOrganizacionales();
        this.configurarEstructurasArgentinas();
        this.integrarSistemas3D();
    }

    /**
     * CARGAR DATOS DESDE military_data.json
     */
    async cargarDatosOrganizacionales() {
        try {
            const response = await fetch('/Client/data/military_data.json');
            this.datosOrganizacionales = await response.json();
            console.log('✅ Datos organizacionales cargados:', this.datosOrganizacionales.metadata);
        } catch (error) {
            console.error('❌ Error cargando datos organizacionales:', error);
        }
    }

    /**
     * ESTRUCTURAS ARGENTINAS ESPECÍFICAS
     * Basado en doctrina militar argentina y TOE real
     */
    configurarEstructurasArgentinas() {
        // ============ CABALLERÍA BLINDADA ============
        this.estructurasFormacion.set('escuadron_caballeria_tam', {
            nombre: 'Escuadrón de Caballería (TAM)',
            sidc_base: 'S*F*UCFRR-',
            magnitud: 'ESCUADRON',
            arma: 'CABALLERIA',
            vehiculo_principal: 'TAM',
            estructura: {
                secciones: 3,
                puesto_comando: 1,
                tren_combate: 1
            },
            componentes: [
                {
                    tipo: 'seccion_caballeria_tam',
                    cantidad: 3,
                    sidc: 'S*F*UCFRR-',
                    magnitud_inferior: 'SECCION'
                },
                {
                    tipo: 'puesto_comando_escuadron',
                    cantidad: 1,
                    sidc: 'S*F*UCF---',
                    vehiculo: 'TAM' // Tanque del jefe
                },
                {
                    tipo: 'tren_escuadron',
                    cantidad: 1,
                    sidc: 'S*F*UCS---',
                    vehiculo: 'UNIMOG' // Camión logístico
                }
            ],
            despliegue_tactico: {
                tanques_totales: 10, // 3 secciones × 3 tanques + 1 comando
                vehiculos_logisticos: 1,
                personal_total: 40,
                separacion_elementos: 100, // metros
                formacion_tipo: 'cuña_escuadron'
            }
        });

        this.estructurasFormacion.set('seccion_caballeria_tam', {
            nombre: 'Sección de Caballería (TAM)',
            sidc_base: 'S*F*UCFRR-',
            magnitud: 'SECCION',
            arma: 'CABALLERIA',
            vehiculo_principal: 'TAM',
            estructura: {
                tanques: 3
            },
            componentes: [
                {
                    tipo: 'tanque_tam',
                    cantidad: 3,
                    sidc: 'S*F*UCFRR-',
                    roles: ['jefe_seccion', 'tanque_2', 'tanque_3']
                }
            ],
            despliegue_tactico: {
                tanques_totales: 3,
                personal_total: 12, // 4 por tanque
                separacion_elementos: 50,
                formacion_tipo: 'cuña_seccion'
            }
        });

        // ============ CABALLERÍA LIGERA (SK105) ============
        this.estructurasFormacion.set('escuadron_caballeria_sk105', {
            nombre: 'Escuadrón de Caballería (SK-105)',
            sidc_base: 'S*F*UCDCR-',
            magnitud: 'ESCUADRON',
            arma: 'CABALLERIA',
            vehiculo_principal: 'SK105',
            estructura: {
                secciones: 3,
                puesto_comando: 1,
                tren_combate: 1
            },
            componentes: [
                {
                    tipo: 'seccion_caballeria_sk105',
                    cantidad: 3,
                    sidc: 'S*F*UCDCR-',
                    magnitud_inferior: 'SECCION'
                },
                {
                    tipo: 'puesto_comando_escuadron',
                    cantidad: 1,
                    sidc: 'S*F*UCD---',
                    vehiculo: 'SK105'
                },
                {
                    tipo: 'tren_escuadron',
                    cantidad: 1,
                    sidc: 'S*F*UCS---',
                    vehiculo: 'UNIMOG'
                }
            ],
            despliegue_tactico: {
                tanques_totales: 10,
                vehiculos_logisticos: 1,
                personal_total: 40,
                separacion_elementos: 80,
                formacion_tipo: 'cuña_escuadron'
            }
        });

        this.estructurasFormacion.set('seccion_caballeria_sk105', {
            nombre: 'Sección de Caballería (SK-105)',
            sidc_base: 'S*F*UCDCR-',
            magnitud: 'SECCION',
            arma: 'CABALLERIA',
            vehiculo_principal: 'SK105',
            estructura: {
                tanques: 3
            },
            componentes: [
                {
                    tipo: 'tanque_sk105',
                    cantidad: 3,
                    sidc: 'S*F*UCDCR-',
                    roles: ['jefe_seccion', 'tanque_2', 'tanque_3']
                }
            ],
            despliegue_tactico: {
                tanques_totales: 3,
                personal_total: 12,
                separacion_elementos: 50,
                formacion_tipo: 'cuña_seccion'
            }
        });

        // ============ INFANTERÍA MECANIZADA ============
        this.estructurasFormacion.set('seccion_infanteria_mecanizada', {
            nombre: 'Sección de Infantería Mecanizada',
            sidc_base: 'S*F*UCIRM-',
            magnitud: 'SECCION',
            arma: 'INFANTERIA',
            vehiculo_principal: 'M113',
            estructura: {
                m113: 4,
                personal: 36
            },
            componentes: [
                {
                    tipo: 'm113_comando',
                    cantidad: 1,
                    sidc: 'S*F*UCIRM-',
                    personal: 8, // Jefe + equipo comando
                    roles: ['jefe_seccion', 'observador', 'radio_operador', 'soldados']
                },
                {
                    tipo: 'm113_grupo',
                    cantidad: 3,
                    sidc: 'S*F*UCIRM-',
                    personal: 28, // 3 grupos × 9-10 hombres c/u
                    roles: ['jefe_grupo', 'tirador_mag', 'tiradores_fal', 'granadero']
                }
            ],
            despliegue_tactico: {
                vehiculos_totales: 4,
                personal_total: 36,
                separacion_elementos: 30,
                formacion_tipo: 'linea_mecanizada'
            }
        });

        // ============ ARTILLERÍA ============
        this.estructurasFormacion.set('bateria_artilleria_155', {
            nombre: 'Batería de Artillería 155mm',
            sidc_base: 'S*F*UCFAR-',
            magnitud: 'BATERIA',
            arma: 'ARTILLERIA',
            vehiculo_principal: 'CITER',
            estructura: {
                seccion_pieza: 1,
                seccion_obtencion: 1,
                seccion_comando: 1
            },
            componentes: [
                {
                    tipo: 'seccion_pieza_155',
                    cantidad: 1,
                    sidc: 'S*F*UCFAR-',
                    personal: 24, // 4 piezas × 6 hombres
                    equipos: ['CITER', 'CITER', 'CITER', 'CITER']
                },
                {
                    tipo: 'seccion_obtencion',
                    cantidad: 1,
                    sidc: 'S*F*UCFAI-',
                    personal: 12,
                    equipos: ['observador_avanzado', 'topografo', 'meteorologo']
                },
                {
                    tipo: 'seccion_comando',
                    cantidad: 1,
                    sidc: 'S*F*UCF---',
                    personal: 8,
                    equipos: ['puesto_comando', 'comunicaciones']
                }
            ],
            despliegue_tactico: {
                piezas_totales: 4,
                personal_total: 44,
                separacion_elementos: 200,
                formacion_tipo: 'linea_artilleria'
            }
        });

        console.log('✅ Estructuras argentinas configuradas:', this.estructurasFormacion.size);
    }

    /**
     * INTEGRAR CON SISTEMAS 3D
     */
    integrarSistemas3D() {
        if (window.modelos3DManager) {
            this.modelos3DManager = window.modelos3DManager;
        }
        if (window.elementoModelo3DMapper) {
            this.elementoMapper = window.elementoModelo3DMapper;
        }
        console.log('🔗 Integración 3D configurada');
    }

    /**
     * OBTENER ESTRUCTURA POR SIDC Y TIPO DE VEHÍCULO
     */
    obtenerEstructuraPorSIDC(sidc, tipoVehiculo = null) {
        // Parsear SIDC para determinar magnitud y arma
        const parsedSIDC = this.parsearSIDC(sidc);
        
        // Buscar estructura específica
        for (const [clave, estructura] of this.estructurasFormacion) {
            if (this.coincideSIDC(estructura.sidc_base, sidc) && 
                estructura.magnitud === parsedSIDC.magnitud) {
                
                // Si se especifica vehículo, verificar compatibilidad
                if (tipoVehiculo && estructura.vehiculo_principal !== tipoVehiculo) {
                    continue;
                }
                
                return estructura;
            }
        }

        return this.crearEstructuraGenerica(parsedSIDC, tipoVehiculo);
    }

    /**
     * PARSEAR CÓDIGO SIDC
     */
    parsearSIDC(sidc) {
        if (!sidc || sidc.length < 10) return null;

        const identidad = sidc[1]; // F=Amigo, H=Hostil, N=Neutral, U=Desconocido
        const dimension = sidc[2]; // P=Espacio, A=Aire, G=Terrestre, S=Mar, U=Subsuperficie
        const estado = sidc[3]; // P=Presente, A=Anticipado
        
        // Funciones específicas (posiciones 4-9)
        const funcion = sidc.substring(4, 10);
        
        let magnitud = 'ELEMENTO';
        let arma = 'GENERICA';
        
        // Determinar magnitud por modificadores
        if (funcion.includes('R')) magnitud = 'ESCUADRON';
        else if (funcion.includes('S')) magnitud = 'SECCION';
        else if (funcion.includes('C')) magnitud = 'COMPANIA';
        else if (funcion.includes('B')) magnitud = 'BATERIA';
        
        // Determinar arma
        if (funcion.includes('I')) arma = 'INFANTERIA';
        else if (funcion.includes('R')) arma = 'CABALLERIA';
        else if (funcion.includes('A')) arma = 'ARTILLERIA';
        else if (funcion.includes('E')) arma = 'INGENIEROS';
        
        return {
            identidad,
            dimension,
            estado,
            funcion,
            magnitud,
            arma,
            sidc_completo: sidc
        };
    }

    /**
     * VERIFICAR COINCIDENCIA SIDC
     */
    coincideSIDC(sidc_base, sidc_comparar) {
        // Comparar posiciones críticas (ignorando modificadores específicos)
        const posicionesCriticas = [1, 2, 4, 5, 6]; // Identidad, dimensión, función principal
        
        for (const pos of posicionesCriticas) {
            if (sidc_base[pos] !== '-' && sidc_base[pos] !== sidc_comparar[pos]) {
                return false;
            }
        }
        return true;
    }

    /**
     * DESPLEGAR ELEMENTO CON ESTRUCTURA JERÁRQUICA
     */
    desplegarElemento(elemento, nivelZoom) {
        const estructura = this.obtenerEstructuraPorSIDC(elemento.sidc, elemento.tipoVehiculo);
        if (!estructura) {
            console.warn('⚠️ Estructura no encontrada para:', elemento.sidc);
            return this.desplegarElementoBasico(elemento);
        }

        // Determinar nivel de despliegue según zoom
        if (nivelZoom >= 13) { // Zoom táctico
            return this.desplegarNivelTactico(elemento, estructura);
        } else if (nivelZoom >= 9) { // Zoom operacional
            return this.desplegarNivelOperacional(elemento, estructura);
        } else { // Zoom estratégico
            return this.desplegarNivelEstrategico(elemento, estructura);
        }
    }

    /**
     * DESPLIEGUE NIVEL TÁCTICO (ZOOM 13+)
     * Muestra todos los elementos individuales 3D
     */
    desplegarNivelTactico(elemento, estructura) {
        const elementosDesplegados = [];
        
        estructura.componentes.forEach((componente, indexComp) => {
            for (let i = 0; i < componente.cantidad; i++) {
                // Calcular posición específica
                const posicion = this.calcularPosicionTactica(
                    elemento.posicion, 
                    estructura.despliegue_tactico.formacion_tipo,
                    elementosDesplegados.length,
                    estructura.despliegue_tactico.separacion_elementos
                );

                // Determinar modelo 3D
                const modelo3D = this.determinarModelo3DPorTipo(componente, elemento.tipoVehiculo);

                const elementoIndividual = {
                    id: `${elemento.id}_${componente.tipo}_${i}`,
                    nombre: `${componente.tipo}_${i + 1}`,
                    tipo: componente.tipo,
                    sidc: componente.sidc,
                    posicion: posicion,
                    modelo3d: modelo3D,
                    nivel: 'TACTICO',
                    elementoPadre: elemento.id,
                    estructura: estructura.nombre,
                    roles: componente.roles || [],
                    personal: componente.personal || 0,
                    estado: {
                        operacional: true,
                        combustible: 100,
                        municion: 100,
                        daños: 0
                    }
                };

                elementosDesplegados.push(elementoIndividual);
            }
        });

        console.log(`🎯 Desplegado táctico: ${elementosDesplegados.length} elementos para ${estructura.nombre}`);
        return elementosDesplegados;
    }

    /**
     * DETERMINAR MODELO 3D POR TIPO DE COMPONENTE
     */
    determinarModelo3DPorTipo(componente, tipoVehiculoEspecificado) {
        // Si se especificó vehículo, usarlo
        if (tipoVehiculoEspecificado && this.elementoMapper) {
            const modeloEspecifico = this.elementoMapper.obtenerModelo3DParaElemento(tipoVehiculoEspecificado);
            if (modeloEspecifico) return modeloEspecifico;
        }

        // Mapeo por tipo de componente
        const mapeoComponentes = {
            'tanque_tam': 'TAM',
            'tanque_sk105': 'SK105',
            'm113_comando': 'M113',
            'm113_grupo': 'M113',
            'pieza_citer': 'CITER',
            'puesto_comando_escuadron': tipoVehiculoEspecificado === 'SK105' ? 'SK105' : 'TAM',
            'tren_escuadron': 'UNIMOG',
            'observador_avanzado': 'HUMVEE',
            'soldado_rifle': 'SOLDADO_RIFLE',
            'soldado_antitanque': 'SOLDADO_AT'
        };

        return mapeoComponentes[componente.tipo] || 'SOLDADO_RIFLE';
    }

    /**
     * CALCULAR POSICIÓN TÁCTICA
     */
    calcularPosicionTactica(posicionBase, tipoFormacion, indice, separacion) {
        const [lat, lng] = posicionBase;
        const separacionKm = separacion / 1000; // Convertir metros a km
        
        let offsetLat = 0;
        let offsetLng = 0;

        switch (tipoFormacion) {
            case 'cuña_escuadron':
                // Formación en cuña para escuadrón
                const fila = Math.floor(indice / 3);
                const columna = indice % 3;
                offsetLat = -fila * separacionKm * 0.008983; // ~1km = 0.008983 grados lat
                offsetLng = (columna - 1) * separacionKm * 0.008983;
                break;
                
            case 'cuña_seccion':
                // Formación en cuña para sección (3 elementos)
                const posicionesCuña = [
                    [-separacionKm * 0.008983, 0], // Adelante centro
                    [-separacionKm * 0.008983 * 2, -separacionKm * 0.008983], // Atrás izquierda
                    [-separacionKm * 0.008983 * 2, separacionKm * 0.008983]   // Atrás derecha
                ];
                if (indice < posicionesCuña.length) {
                    offsetLat = posicionesCuña[indice][0];
                    offsetLng = posicionesCuña[indice][1];
                }
                break;
                
            case 'linea_mecanizada':
                // Línea para infantería mecanizada
                offsetLng = (indice - 1) * separacionKm * 0.008983;
                break;
                
            case 'linea_artilleria':
                // Línea extendida para artillería
                offsetLng = (indice - 1.5) * separacionKm * 0.008983;
                break;
                
            default:
                // Formación columna por defecto
                offsetLat = -indice * separacionKm * 0.008983;
        }

        return [lat + offsetLat, lng + offsetLng];
    }

    /**
     * CREAR ESTRUCTURA GENÉRICA
     */
    crearEstructuraGenerica(parsedSIDC, tipoVehiculo) {
        if (!parsedSIDC) return null;

        return {
            nombre: `${parsedSIDC.arma} ${parsedSIDC.magnitud} (Genérico)`,
            sidc_base: parsedSIDC.sidc_completo,
            magnitud: parsedSIDC.magnitud,
            arma: parsedSIDC.arma,
            vehiculo_principal: tipoVehiculo || 'GENERICO',
            estructura: { elementos: 1 },
            componentes: [{
                tipo: 'elemento_generico',
                cantidad: 1,
                sidc: parsedSIDC.sidc_completo
            }],
            despliegue_tactico: {
                elementos_totales: 1,
                personal_total: 4,
                separacion_elementos: 50,
                formacion_tipo: 'individual'
            }
        };
    }

    /**
     * DESPLIEGUE BÁSICO (FALLBACK)
     */
    desplegarElementoBasico(elemento) {
        return [{
            id: elemento.id,
            nombre: elemento.nombre || 'Elemento Militar',
            tipo: 'generico',
            sidc: elemento.sidc,
            posicion: elemento.posicion,
            modelo3d: this.elementoMapper?.obtenerModelo3DParaElemento(elemento.nombre) || 'SOLDADO_RIFLE',
            nivel: 'BASICO',
            estado: { operacional: true }
        }];
    }

    /**
     * OBTENER INFORMACIÓN JERÁRQUICA
     */
    obtenerInformacionJerarquica(sidc, tipoVehiculo) {
        const estructura = this.obtenerEstructuraPorSIDC(sidc, tipoVehiculo);
        if (!estructura) return null;

        return {
            estructura: estructura.nombre,
            magnitud: estructura.magnitud,
            arma: estructura.arma,
            vehiculo_principal: estructura.vehiculo_principal,
            personal_total: estructura.despliegue_tactico.personal_total,
            elementos_totales: estructura.despliegue_tactico.tanques_totales || 
                              estructura.despliegue_tactico.vehiculos_totales ||
                              estructura.despliegue_tactico.elementos_totales,
            componentes: estructura.componentes.map(c => ({
                tipo: c.tipo,
                cantidad: c.cantidad,
                personal: c.personal
            }))
        };
    }

    /**
     * OBTENER TIPOS DE VEHÍCULOS DISPONIBLES PARA UN SIDC
     */
    obtenerVehiculosDisponibles(sidc) {
        const parsedSIDC = this.parsearSIDC(sidc);
        if (!parsedSIDC) return [];

        const vehiculosDisponibles = [];

        // Buscar todas las estructuras compatibles
        for (const [clave, estructura] of this.estructurasFormacion) {
            if (this.coincideSIDC(estructura.sidc_base, sidc)) {
                vehiculosDisponibles.push({
                    tipo: estructura.vehiculo_principal,
                    nombre: estructura.nombre,
                    descripcion: `${estructura.despliegue_tactico.elementos_totales || estructura.despliegue_tactico.tanques_totales} elementos`
                });
            }
        }

        // Añadir opciones genéricas según el arma
        if (parsedSIDC.arma === 'CABALLERIA') {
            vehiculosDisponibles.push(
                { tipo: 'TAM', nombre: 'Tanque TAM', descripcion: 'MBT Argentino' },
                { tipo: 'SK105', nombre: 'SK-105 Kürassier', descripcion: 'Tanque Ligero' }
            );
        } else if (parsedSIDC.arma === 'INFANTERIA') {
            vehiculosDisponibles.push(
                { tipo: 'M113', nombre: 'M113 APC', descripcion: 'Transporte Blindado' },
                { tipo: 'HUMVEE', nombre: 'Humvee', descripcion: 'Vehículo Táctico' }
            );
        }

        return [...new Set(vehiculosDisponibles)]; // Eliminar duplicados
    }

    /**
     * OBTENER VEHÍCULOS DISPONIBLES MEJORADO
     * Maneja múltiples formatos de parámetros para compatibilidad
     */
    obtenerVehiculosDisponibles(...args) {
        let categoria, arma, tipo, caracteristica;
        
        // Manejar diferentes formatos de llamada
        if (args.length === 1 && typeof args[0] === 'object') {
            // Formato: obtenerVehiculosDisponibles({caracteristica: "...", categoria: "...", etc})
            const config = args[0];
            categoria = config.categoria;
            arma = config.arma;
            tipo = config.tipo;
            caracteristica = config.caracteristica || '';
        } else if (args.length === 1 && typeof args[0] === 'string') {
            // Formato: obtenerVehiculosDisponibles("caracteristica")
            caracteristica = args[0];
        } else if (args.length === 3) {
            // Formato: obtenerVehiculosDisponibles(categoria, arma, tipo)
            categoria = args[0];
            arma = args[1];
            tipo = args[2];
            caracteristica = `${categoria} ${arma} ${tipo}`;
        } else {
            console.warn('⚠️ Formato de parámetros no reconocido en obtenerVehiculosDisponibles');
            caracteristica = '';
        }
        
        console.log(`🚗 Obteniendo vehículos para: "${caracteristica}" (${categoria}/${arma}/${tipo})`);
        
        let vehiculosDisponibles = [];
        const searchText = caracteristica.toLowerCase();
        
        // ANÁLISIS ESPECÍFICO POR TIPO DE ELEMENTO
        
        // CABALLERÍA BLINDADA - Solo tanques principales
        if (searchText.includes('caballería') && searchText.includes('blindada') ||
            searchText.includes('tanque') || searchText.includes('tam') ||
            (categoria === 'Armas' && arma === 'Caballería' && tipo === 'Blindada')) {
            vehiculosDisponibles = [
                { valor: 'TAM', texto: 'TAM - Tanque Argentino Mediano' },
                { valor: 'TAM2C', texto: 'TAM 2C - Tanque Argentino Mediano 2C' },
                { valor: 'SK105', texto: 'SK-105 Kürassier' }
            ];
            console.log('🎯 Detectado: Caballería Blindada - Tanques disponibles');
        }
        // EXPLORACIÓN/RECONOCIMIENTO - Solo vehículos livianos
        else if (searchText.includes('exploración') || searchText.includes('reconocimiento') ||
                 searchText.includes('explorador') ||
                 (categoria === 'Armas' && arma === 'Caballería' && tipo === 'Exploración')) {
            vehiculosDisponibles = [
                { valor: 'HUMVEE', texto: 'HUMVEE - Vehículo de Exploración' },
                { valor: 'UNIMOG', texto: 'UNIMOG - Vehículo Liviano' }
            ];
            console.log('🎯 Detectado: Exploración - Vehículos livianos disponibles');
        }
        // INFANTERÍA MECANIZADA - Solo transportes blindados
        else if ((searchText.includes('infantería') && searchText.includes('mecanizada')) ||
                 (categoria === 'Armas' && arma === 'Infantería' && tipo === 'Mecanizada')) {
            vehiculosDisponibles = [
                { valor: 'VCTP', texto: 'VCTP - Vehículo de Combate de Transporte de Personal' },
                { valor: 'M113', texto: 'M113 - Transporte de Personal Blindado' }
            ];
            console.log('🎯 Detectado: Infantería Mecanizada - Transportes blindados disponibles');
        }
        // INFANTERÍA MOTORIZADA - Vehículos de transporte
        else if ((searchText.includes('infantería') && searchText.includes('motorizada')) ||
                 (categoria === 'Armas' && arma === 'Infantería' && tipo === 'Motorizada')) {
            vehiculosDisponibles = [
                { valor: 'HUMVEE', texto: 'HUMVEE - Vehículo Multipropósito' },
                { valor: 'MERCEDES', texto: 'Mercedes-Benz - Vehículo de Transporte' },
                { valor: 'UNIMOG', texto: 'UNIMOG - Vehículo Logístico' }
            ];
            console.log('🎯 Detectado: Infantería Motorizada - Vehículos de transporte disponibles');
        }
        // ARTILLERÍA BLINDADA - Solo sistemas autopropulsados  
        else if (searchText.includes('artillería') && searchText.includes('blindada')) {
            vehiculosDisponibles = [
                { valor: 'PALMARIA', texto: 'Palmaria - Obús Autopropulsado 155mm' }
            ];
            console.log('🎯 Detectado: Artillería Blindada - Sistemas autopropulsados disponibles');
        }
        // ARTILLERÍA REMOLCADA/GENERAL - Vehículos tractores
        else if (searchText.includes('artillería') ||
                 (categoria === 'Armas' && arma === 'Artillería')) {
            vehiculosDisponibles = [
                { valor: 'UNIMOG', texto: 'UNIMOG - Vehículo de Remolque' },
                { valor: 'MERCEDES', texto: 'Mercedes-Benz - Vehículo Tractor' },
                { valor: 'HUMVEE', texto: 'HUMVEE - Vehículo de Apoyo' }
            ];
            console.log('🎯 Detectado: Artillería - Vehículos tractores disponibles');
        }
        // SERVICIOS/LOGÍSTICA - Vehículos de apoyo
        else if (searchText.includes('servicios') || searchText.includes('logística') ||
                 searchText.includes('apoyo') || categoria === 'Servicios') {
            vehiculosDisponibles = [
                { valor: 'UNIMOG', texto: 'UNIMOG - Vehículo Logístico Principal' },
                { valor: 'MERCEDES', texto: 'Mercedes-Benz - Vehículo de Apoyo' },
                { valor: 'HUMVEE', texto: 'HUMVEE - Vehículo de Servicio' }
            ];
            console.log('🎯 Detectado: Servicios/Logística - Vehículos de apoyo disponibles');
        }
        // INFANTERÍA (A PIE) - Transporte ocasional
        else if (searchText.includes('infantería') && !searchText.includes('mecanizada') && !searchText.includes('motorizada')) {
            vehiculosDisponibles = [
                { valor: 'HUMVEE', texto: 'HUMVEE - Transporte Táctico (ocasional)' },
                { valor: 'UNIMOG', texto: 'UNIMOG - Transporte Logístico' }
            ];
            console.log('🎯 Detectado: Infantería a pie - Transporte ocasional disponible');
        }
        
        // Si no se encontraron vehículos específicos, mostrar mínimos por defecto
        if (vehiculosDisponibles.length === 0) {
            console.warn(`⚠️ Tipo de elemento no reconocido: "${caracteristica}"`);
            vehiculosDisponibles = [
                { valor: 'HUMVEE', texto: 'HUMVEE - Vehículo Estándar' },
                { valor: 'UNIMOG', texto: 'UNIMOG - Vehículo Multipropósito' }
            ];
        }
        
        console.log(`✅ ${vehiculosDisponibles.length} vehículos específicos disponibles para: "${caracteristica}"`);
        return vehiculosDisponibles;
    }
}

// Inicialización automática
window.sistemaJerarquicoSIDC = new SistemaJerarquicoSIDC();

console.log('🎖️ Sistema Jerárquico SIDC cargado y disponible globalmente');
