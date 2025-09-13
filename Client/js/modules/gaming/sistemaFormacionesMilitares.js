/**
 * Sistema de Formaciones Militares Jerárquicas
 * Maneja la composición y despliegue automático de unidades según doctrina argentina
 * 
 * @author MAIRA 4.0 Team
 * @version 1.0.0
 * @since 2025-09-13
 */

class SistemaFormacionesMilitares {
    constructor() {
        this.datosEstructurales = null;
        this.formacionesActivas = new Map();
        this.configuracionesFormacion = this.inicializarConfiguraciones();
        
        // Cargar datos estructurales del JSON
        this.cargarDatosEstructurales();
    }

    /**
     * Configuraciones predefinidas de formaciones tácticas
     */
    inicializarConfiguraciones() {
        return {
            // INFANTERÍA
            equipoInfanteria: {
                personal: 5,
                composicion: [
                    { role_id: 7, cantidad: 1, tipo: 'jefe_equipo' },      // Jefe de Equipo
                    { role_id: 1, cantidad: 2, tipo: 'soldier_rifle' },    // Tiradores FAL
                    { role_id: 2, cantidad: 1, tipo: 'soldier_machine_gunner' }, // Tirador MAG
                    { role_id: 5, cantidad: 1, tipo: 'soldier_antitank' }  // Tirador ATAN
                ],
                formacion: 'linea',
                separacion: 5, // metros entre soldados
                frente: 25     // metros de frente total
            },
            
            grupoInfanteria: {
                personal: 10,
                equipos: 2,
                composicion: [
                    { role_id: 8, cantidad: 1, tipo: 'jefe_grupo' },       // Jefe de Grupo
                    { type: 'equipo', cantidad: 2, referencia: 'equipoInfanteria' }
                ],
                formacion: 'cuña',
                separacion: 30,
                frente: 60
            },

            seccionInfanteria: {
                personal: 30,
                grupos: 3,
                vehiculos: ['M113', 'M113', 'M113', 'command_vehicle'],
                composicion: [
                    { role_id: 9, cantidad: 1, tipo: 'jefe_seccion' },     // Jefe de Sección
                    { type: 'grupo', cantidad: 3, referencia: 'grupoInfanteria' },
                    { role_id: 11, cantidad: 1, tipo: 'observador' }       // Observador Adelantado
                ],
                formacion: 'columna',
                separacion: 50,
                frente: 150
            },

            // CABALLERÍA BLINDADA
            tanqueIndividual: {
                personal: 4,
                composicion: [
                    { role_id: 25, cantidad: 1, tipo: 'jefe_tanque' },     // Jefe de Tanque
                    { role_id: 22, cantidad: 1, tipo: 'conductor' },       // Conductor
                    { role_id: 23, cantidad: 1, tipo: 'apuntador' },       // Apuntador
                    { role_id: 24, cantidad: 1, tipo: 'cargador' }         // Cargador
                ],
                vehiculo: 'tam_tank',
                separacion: 50,
                frente: 8
            },

            seccionTanques: {
                tanques: 3,
                personal: 12,
                composicion: [
                    { role_id: 26, cantidad: 1, tipo: 'jefe_seccion_tanques' }, // Jefe de Sección
                    { type: 'tanque', cantidad: 3, referencia: 'tanqueIndividual' }
                ],
                formacion: 'cuña',
                separacion: 100,
                frente: 200
            },

            escuadronTanques: {
                secciones: 3,
                puestoComando: 1,
                personal: 40,
                composicion: [
                    { role_id: 27, cantidad: 1, tipo: 'jefe_escuadron' },  // Jefe de Escuadrón
                    { type: 'seccion_tanques', cantidad: 3, referencia: 'seccionTanques' },
                    { type: 'puesto_comando', cantidad: 1, vehiculo: 'command_vehicle' }
                ],
                formacion: 'linea',
                separacion: 300,
                frente: 600
            },

            // ARTILLERÍA
            piezaArtilleria: {
                personal: 6,
                composicion: [
                    { role_id: 28, cantidad: 1, tipo: 'jefe_pieza' },      // Jefe de Pieza
                    { role_id: 29, cantidad: 1, tipo: 'apuntador_art' },   // Apuntador
                    { role_id: 30, cantidad: 1, tipo: 'cargador_art' },    // Cargador
                    { role_id: 31, cantidad: 3, tipo: 'sirviente' }        // Sirvientes
                ],
                equipo: 'artillery_piece',
                separacion: 20,
                frente: 15
            }
        };
    }

    /**
     * Carga los datos estructurales del JSON militar
     */
    async cargarDatosEstructurales() {
        try {
            const response = await fetch('/Client/data/military_data.json');
            this.datosEstructurales = await response.json();
            console.log('✅ Datos estructurales cargados:', this.datosEstructurales.metadata);
        } catch (error) {
            console.error('❌ Error cargando datos estructurales:', error);
        }
    }

    /**
     * Genera una formación militar basada en el nivel de zoom y tipo de elemento
     */
    generarFormacion(elemento, nivelZoom, posicion) {
        const tipoFormacion = this.determinarTipoFormacion(elemento, nivelZoom);
        
        if (!tipoFormacion) {
            console.warn('⚠️ No se pudo determinar tipo de formación para:', elemento);
            return null;
        }

        const configuracion = this.configuracionesFormacion[tipoFormacion];
        if (!configuracion) {
            console.warn('⚠️ Configuración no encontrada para:', tipoFormacion);
            return null;
        }

        return this.crearFormacionDetallada(configuracion, posicion, elemento);
    }

    /**
     * Determina el tipo de formación según el elemento y zoom
     */
    determinarTipoFormacion(elemento, nivelZoom) {
        const especialidad = elemento.especialidad?.toLowerCase() || '';
        const tipo = elemento.tipo?.toLowerCase() || '';
        const subtipo = elemento.subtipo?.toLowerCase() || '';

        // NIVEL ESTRATÉGICO (zoom 5-8) - Símbolos únicos
        if (nivelZoom <= 8) {
            return null; // Solo símbolo, sin formación 3D
        }

        // NIVEL TÁCTICO (zoom 9-12) - Formaciones medias
        if (nivelZoom <= 12) {
            if (especialidad.includes('infantería')) {
                if (tipo.includes('sección')) return 'seccionInfanteria';
                if (tipo.includes('grupo')) return 'grupoInfanteria';
            }
            if (especialidad.includes('caballería')) {
                if (tipo.includes('escuadrón')) return 'escuadronTanques';
                if (tipo.includes('sección')) return 'seccionTanques';
            }
            if (especialidad.includes('artillería')) {
                return 'piezaArtilleria';
            }
        }

        // NIVEL OPERACIONAL (zoom 13-18) - Formaciones detalladas
        if (nivelZoom >= 13) {
            if (especialidad.includes('infantería')) {
                if (tipo.includes('equipo')) return 'equipoInfanteria';
                if (tipo.includes('grupo')) return 'grupoInfanteria';
                if (tipo.includes('sección')) return 'seccionInfanteria';
            }
            if (especialidad.includes('caballería')) {
                if (subtipo?.includes('tanque')) return 'tanqueIndividual';
                if (tipo.includes('sección')) return 'seccionTanques';
            }
        }

        return null;
    }

    /**
     * Crea una formación detallada con posiciones específicas
     */
    crearFormacionDetallada(configuracion, posicionBase, elemento) {
        const formacion = {
            id: `formacion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            tipo: configuracion,
            elemento: elemento,
            posicionBase: posicionBase,
            unidades: [],
            vehiculos: [],
            timestamp: Date.now()
        };

        // Calcular posiciones según el tipo de formación
        const posiciones = this.calcularPosicionesFormacion(
            configuracion.formacion || 'linea',
            configuracion.composicion.length,
            configuracion.separacion || 20,
            posicionBase
        );

        // Generar unidades individuales
        configuracion.composicion.forEach((componente, index) => {
            if (componente.type === 'tanque' || componente.type === 'equipo' || componente.type === 'grupo') {
                // Formación recursiva para subunidades
                const subFormacion = this.generarSubFormacion(componente, posiciones[index], elemento);
                if (subFormacion) {
                    formacion.unidades.push(...subFormacion.unidades);
                    formacion.vehiculos.push(...subFormacion.vehiculos);
                }
            } else {
                // Unidad individual
                for (let i = 0; i < componente.cantidad; i++) {
                    const unidad = this.crearUnidadIndividual(
                        componente,
                        posiciones[index + i] || posiciones[index],
                        elemento
                    );
                    formacion.unidades.push(unidad);
                }
            }
        });

        // Agregar vehículos si están especificados
        if (configuracion.vehiculos) {
            configuracion.vehiculos.forEach((vehiculo, index) => {
                const posicionVehiculo = this.calcularPosicionVehiculo(posicionBase, index);
                formacion.vehiculos.push({
                    modelo: vehiculo.toLowerCase(),
                    posicion: posicionVehiculo,
                    rotacion: this.calcularRotacionFormacion(configuracion.formacion),
                    escala: 1.0
                });
            });
        }

        this.formacionesActivas.set(formacion.id, formacion);
        return formacion;
    }

    /**
     * Crea una unidad individual con su modelo 3D correspondiente
     */
    crearUnidadIndividual(componente, posicion, elemento) {
        const rolData = this.obtenerDatosRol(componente.role_id);
        
        return {
            id: `unidad_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            tipo: componente.tipo,
            rol: rolData?.role_name || 'Soldado',
            modelo3D: this.mapearModeloSegunRol(componente.tipo, rolData),
            posicion: posicion,
            rotacion: this.calcularRotacionIndividual(),
            escala: 1.0,
            estado: 'activo',
            salud: 100,
            municion: 100
        };
    }

    /**
     * Obtiene datos del rol desde el JSON cargado
     */
    obtenerDatosRol(roleId) {
        if (!this.datosEstructurales?.roles_combate) return null;
        
        return this.datosEstructurales.roles_combate.find(
            rol => rol.id === roleId.toString()
        );
    }

    /**
     * Mapea el modelo 3D según el rol del soldado
     */
    mapearModeloSegunRol(tipo, rolData) {
        const mapeoModelos = {
            'soldier_rifle': 'soldier_rifle.glb',
            'soldier_machine_gunner': 'soldier_machine_gunner.glb',
            'soldier_antitank': 'soldier_antitank.glb',
            'soldier_engineer': 'soldier_engineer.glb',
            'soldier_grenadier': 'soldier_grenadier.glb',
            'soldier_sniper': 'soldier_sniper.glb',
            'soldier_mountain': 'soldier_mountain.glb',
            'soldier_navy': 'soldier_navy.glb',
            'jefe_equipo': 'soldier_rifle.glb',
            'jefe_grupo': 'soldier_rifle.glb',
            'jefe_seccion': 'soldier_rifle.glb',
            'jefe_tanque': 'tam_tank.glb',
            'tam_tank': 'tam_tank.glb',
            'tam_2c': 'tam_2c_tank.glb',
            'm113': 'm113_apc.glb',
            'command_vehicle': 'humvee.glb',
            'jeep': 'military_jeep.glb'
        };

        return mapeoModelos[tipo] || 'soldier_rifle.glb';
    }

    /**
     * Calcula posiciones según el tipo de formación
     */
    calcularPosicionesFormacion(tipoFormacion, cantidadUnidades, separacion, posicionBase) {
        const posiciones = [];
        const [lat, lng] = posicionBase;

        switch (tipoFormacion) {
            case 'linea':
                for (let i = 0; i < cantidadUnidades; i++) {
                    posiciones.push([
                        lat,
                        lng + (i - cantidadUnidades / 2) * (separacion / 111320) // Conversión metros a grados
                    ]);
                }
                break;

            case 'columna':
                for (let i = 0; i < cantidadUnidades; i++) {
                    posiciones.push([
                        lat - i * (separacion / 111320),
                        lng
                    ]);
                }
                break;

            case 'cuña':
                const mitad = Math.floor(cantidadUnidades / 2);
                for (let i = 0; i < cantidadUnidades; i++) {
                    const fila = Math.floor(i / 2);
                    const lado = i % 2 === 0 ? -1 : 1;
                    posiciones.push([
                        lat - fila * (separacion / 111320),
                        lng + lado * fila * (separacion / 111320)
                    ]);
                }
                break;

            default:
                // Formación por defecto: dispersión circular
                for (let i = 0; i < cantidadUnidades; i++) {
                    const angulo = (2 * Math.PI * i) / cantidadUnidades;
                    const radio = separacion / 111320;
                    posiciones.push([
                        lat + radio * Math.cos(angulo),
                        lng + radio * Math.sin(angulo)
                    ]);
                }
        }

        return posiciones;
    }

    /**
     * Calcula rotación base según el tipo de formación
     */
    calcularRotacionFormacion(tipoFormacion) {
        const rotaciones = {
            'linea': 0,
            'columna': 90,
            'cuña': 45,
            'default': 0
        };
        return rotaciones[tipoFormacion] || rotaciones.default;
    }

    /**
     * Calcula rotación individual para cada unidad
     */
    calcularRotacionIndividual() {
        return Math.random() * 30 - 15; // Variación de ±15 grados
    }

    /**
     * Obtiene formación por ID
     */
    obtenerFormacion(formacionId) {
        return this.formacionesActivas.get(formacionId);
    }

    /**
     * Actualiza posición de una formación completa
     */
    moverFormacion(formacionId, nuevaPosicion) {
        const formacion = this.formacionesActivas.get(formacionId);
        if (!formacion) return false;

        const desplazamiento = [
            nuevaPosicion[0] - formacion.posicionBase[0],
            nuevaPosicion[1] - formacion.posicionBase[1]
        ];

        // Actualizar posición base
        formacion.posicionBase = nuevaPosicion;

        // Actualizar todas las unidades
        formacion.unidades.forEach(unidad => {
            unidad.posicion[0] += desplazamiento[0];
            unidad.posicion[1] += desplazamiento[1];
        });

        formacion.vehiculos.forEach(vehiculo => {
            vehiculo.posicion[0] += desplazamiento[0];
            vehiculo.posicion[1] += desplazamiento[1];
        });

        return true;
    }

    /**
     * Elimina formación del sistema
     */
    eliminarFormacion(formacionId) {
        return this.formacionesActivas.delete(formacionId);
    }

    /**
     * Obtiene estadísticas del sistema
     */
    obtenerEstadisticas() {
        const stats = {
            formacionesActivas: this.formacionesActivas.size,
            unidadesTotales: 0,
            vehiculosTotales: 0,
            memoryUsage: 0
        };

        this.formacionesActivas.forEach(formacion => {
            stats.unidadesTotales += formacion.unidades.length;
            stats.vehiculosTotales += formacion.vehiculos.length;
        });

        stats.memoryUsage = JSON.stringify([...this.formacionesActivas.values()]).length;
        
        return stats;
    }
}

// Instancia global del sistema
window.sistemaFormacionesMilitares = new SistemaFormacionesMilitares();

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SistemaFormacionesMilitares;
}
