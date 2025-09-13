/**
 * SISTEMA JERÁRQUICO MILITAR - MAIRA 4.0
 * ======================================
 * Gestiona formaciones militares con estructura jerárquica
 * Basado en datos JSON de estructuras organizacionales
 */

class SistemaJerarquicoMilitar {
    constructor() {
        this.estructuras = new Map(); // Almacena estructuras organizacionales
        this.formaciones = new Map(); // Formaciones desplegadas
        this.modelos3DManager = window.modelos3DManager;
        this.elementoMapper = window.elementoModelo3DMapper;
        
        console.log('⚔️ Sistema Jerárquico Militar inicializado');
    }

    /**
     * CARGAR ESTRUCTURAS DESDE JSON
     * (Basado en datos extraídos de MySQL/PostgreSQL)
     */
    cargarEstructurasOrganizacionales(estructurasJSON) {
        // Ejemplo de estructura organizacional argentina
        const estructurasEjemplo = {
            "escuadron_caballeria": {
                nombre: "Escuadrón de Caballería",
                tipo: "ESCUADRON",
                simbolo: "🏴‍☠️",
                componentes: [
                    {
                        tipo: "seccion_caballeria",
                        cantidad: 3,
                        nombre: "Sección de Caballería"
                    },
                    {
                        tipo: "puesto_comando",
                        cantidad: 1,
                        nombre: "Puesto de Comando"
                    }
                ],
                formacion: "linea" // linea, cuña, columna
            },
            "seccion_caballeria": {
                nombre: "Sección de Caballería",
                tipo: "SECCION",
                simbolo: "🛡️",
                componentes: [
                    {
                        tipo: "tanque_tam",
                        cantidad: 3,
                        nombre: "Tanque TAM",
                        modelo3d: "TAM"
                    }
                ],
                formacion: "cuña"
            },
            "puesto_comando": {
                nombre: "Puesto de Comando",
                tipo: "COMANDO",
                simbolo: "📡",
                componentes: [
                    {
                        tipo: "camion_comando",
                        cantidad: 1,
                        nombre: "Camión Puesto Comando",
                        modelo3d: "UNIMOG"
                    },
                    {
                        tipo: "soldado_oficial",
                        cantidad: 2,
                        nombre: "Oficial",
                        modelo3d: "SOLDADO_RIFLE"
                    }
                ],
                formacion: "agrupado"
            }
        };

        // Cargar estructuras (usar JSON real o ejemplo)
        const datos = estructurasJSON || estructurasEjemplo;
        
        Object.entries(datos).forEach(([clave, estructura]) => {
            this.estructuras.set(clave, estructura);
            console.log(`📋 Estructura cargada: ${estructura.nombre}`);
        });
    }

    /**
     * DESPLEGAR FORMACIÓN EN EL MAPA
     */
    desplegarFormacion(tipoFormacion, posicionCentral, orientacion = 0) {
        const estructura = this.estructuras.get(tipoFormacion);
        if (!estructura) {
            console.error(`❌ Estructura no encontrada: ${tipoFormacion}`);
            return null;
        }

        const formacionId = `${tipoFormacion}_${Date.now()}`;
        const elementosDesplegados = [];

        console.log(`🎯 Desplegando: ${estructura.nombre}`);

        // Calcular posiciones según tipo de formación
        const posiciones = this.calcularPosicionesFormacion(
            estructura.componentes, 
            posicionCentral, 
            estructura.formacion,
            orientacion
        );

        // Crear elementos individuales
        estructura.componentes.forEach((componente, index) => {
            for (let i = 0; i < componente.cantidad; i++) {
                const posicionElemento = posiciones[elementosDesplegados.length];
                
                const elemento = {
                    id: `${componente.tipo}_${formacionId}_${i}`,
                    nombre: `${componente.nombre} ${i + 1}`,
                    tipo: componente.tipo,
                    modelo3d: componente.modelo3d,
                    posicion: posicionElemento,
                    orientacion: orientacion,
                    formacionPadre: formacionId,
                    nivel: estructura.tipo,
                    estado: {
                        operacional: true,
                        seleccionado: false,
                        enMovimiento: false
                    }
                };

                elementosDesplegados.push(elemento);
            }
        });

        // Almacenar formación
        const formacion = {
            id: formacionId,
            tipo: tipoFormacion,
            estructura: estructura,
            elementos: elementosDesplegados,
            posicionCentral: posicionCentral,
            orientacion: orientacion,
            desplegado: false // Inicialmente agrupado
        };

        this.formaciones.set(formacionId, formacion);
        console.log(`✅ Formación creada: ${formacionId} con ${elementosDesplegados.length} elementos`);
        
        return formacion;
    }

    /**
     * CALCULAR POSICIONES SEGÚN TIPO DE FORMACIÓN
     */
    calcularPosicionesFormacion(componentes, centro, tipoFormacion, orientacion) {
        const posiciones = [];
        let offsetX = 0;
        let offsetY = 0;
        
        // Distancia entre elementos (en coordenadas del mapa)
        const separacion = 0.001; // ~100 metros

        componentes.forEach((componente) => {
            for (let i = 0; i < componente.cantidad; i++) {
                let posX, posY;

                switch (tipoFormacion) {
                    case 'linea':
                        posX = centro.lat + (offsetX * separacion);
                        posY = centro.lng;
                        offsetX = offsetX === 0 ? -1 : (offsetX < 0 ? Math.abs(offsetX) + 1 : -(offsetX + 1));
                        break;

                    case 'cuña':
                        const fila = Math.floor(i / 2);
                        const columna = i % 2;
                        posX = centro.lat + ((fila * separacion) * Math.cos(orientacion));
                        posY = centro.lng + ((columna - 0.5) * separacion * Math.sin(orientacion));
                        break;

                    case 'columna':
                        posX = centro.lat + (offsetY * separacion * Math.cos(orientacion));
                        posY = centro.lng + (offsetY * separacion * Math.sin(orientacion));
                        offsetY++;
                        break;

                    case 'agrupado':
                    default:
                        const radio = separacion * 0.5;
                        const angulo = (i / componente.cantidad) * 2 * Math.PI;
                        posX = centro.lat + (radio * Math.cos(angulo));
                        posY = centro.lng + (radio * Math.sin(angulo));
                        break;
                }

                posiciones.push({ lat: posX, lng: posY });
            }
        });

        return posiciones;
    }

    /**
     * ALTERNAR ENTRE AGRUPADO/DESPLEGADO
     */
    toggleDespliege(formacionId) {
        const formacion = this.formaciones.get(formacionId);
        if (!formacion) return false;

        formacion.desplegado = !formacion.desplegado;
        
        if (formacion.desplegado) {
            console.log(`📤 Desplegando formación: ${formacion.id}`);
            // Mostrar elementos individuales
            return this.mostrarElementosIndividuales(formacion);
        } else {
            console.log(`📥 Agrupando formación: ${formacion.id}`);
            // Mostrar como símbolo único
            return this.mostrarComoSimbolo(formacion);
        }
    }

    /**
     * RENDERIZAR SEGÚN NIVEL DE ZOOM
     */
    renderizarSegunZoom(nivelZoom, formaciones) {
        formaciones.forEach(formacion => {
            switch (nivelZoom) {
                case 'estrategico': // zoom 5-8
                    this.renderizarComoSimbolo(formacion);
                    break;
                    
                case 'tactico': // zoom 9-12
                    this.renderizarComoGrupos(formación);
                    break;
                    
                case 'operacional': // zoom 13-18
                    this.renderizarElementosIndividuales(formacion);
                    break;
            }
        });
    }

    renderizarComoSimbolo(formacion) {
        // Mostrar símbolo militar único en posición central
        console.log(`🏴‍☠️ Renderizando símbolo: ${formacion.estructura.simbolo}`);
    }

    renderizarComoGrupos(formacion) {
        // Mostrar grupos de elementos (secciones)
        console.log(`🛡️ Renderizando grupos de: ${formacion.id}`);
    }

    renderizarElementosIndividuales(formacion) {
        // Mostrar cada tanque/vehículo individual
        console.log(`🎯 Renderizando elementos individuales: ${formacion.elementos.length}`);
        
        if (formacion.desplegado) {
            // Mostrar en posiciones de formación
            formacion.elementos.forEach(elemento => {
                this.renderizarElemento3D(elemento);
            });
        } else {
            // Mostrar agrupados en centro
            this.renderizarElemento3D({
                ...formacion.elementos[0],
                posicion: formacion.posicionCentral,
                nombre: formacion.estructura.nombre
            });
        }
    }

    async renderizarElemento3D(elemento) {
        if (!elemento.modelo3d) return;
        
        try {
            // Usar el sistema existente de modelos 3D
            const modelo = await this.modelos3DManager.obtenerModelo3D(
                elemento.modelo3d,
                elemento.posicion
            );
            
            console.log(`🎮 Modelo 3D cargado: ${elemento.nombre}`);
            return modelo;
        } catch (error) {
            console.error(`❌ Error cargando modelo para ${elemento.nombre}:`, error);
        }
    }

    /**
     * OBTENER FORMACIONES PARA TIPO DE ELEMENTO
     */
    obtenerFormacionesPorTipo(tipoElemento) {
        const formacionesCompatibles = [];
        
        this.estructuras.forEach((estructura, clave) => {
            const tieneElemento = estructura.componentes.some(comp => 
                comp.tipo === tipoElemento || comp.nombre.includes(tipoElemento)
            );
            
            if (tieneElemento) {
                formacionesCompatibles.push({
                    id: clave,
                    nombre: estructura.nombre,
                    tipo: estructura.tipo
                });
            }
        });
        
        return formacionesCompatibles;
    }
}

// Instancia global
window.sistemaJerarquicoMilitar = new SistemaJerarquicoMilitar();
