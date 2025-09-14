/**
 * SISTEMA DE FORMACIONES MILITARES - MAIRA 4.0
 * =============================================
 * Sistema jerárquico de formaciones militares
 * Escuadrón → Sección → Elemento Individual
 */

class SistemaFormacionesMilitares {
    constructor() {
        this.formaciones = new Map();
        this.jerarquias = {
            // Jerarquía básica: 3 elementos = 1 unidad superior
            soldado: { superior: 'tanque', ratio: 3 },
            tanque: { superior: 'seccion', ratio: 3 },
            seccion: { superior: 'escuadron', ratio: 3 },
            escuadron: { superior: null, ratio: null }
        };

        console.log('🎯 Sistema de Formaciones Militares inicializado');
    }

    /**
     * Crear una nueva formación militar
     */
    crearFormacion(tipo, nombre, posicion, bando = 'azul') {
        const formacion = new FormacionMilitar(tipo, nombre, posicion, bando);
        this.formaciones.set(formacion.id, formacion);
        console.log(`🎯 Formación creada: ${tipo} "${nombre}"`);
        return formacion;
    }

    /**
     * Agregar elemento a una formación
     */
    agregarElementoAFormacion(formacionId, elemento) {
        const formacion = this.formaciones.get(formacionId);
        if (!formacion) {
            console.error(`❌ Formación no encontrada: ${formacionId}`);
            return false;
        }

        return formacion.agregarElemento(elemento);
    }

    /**
     * Gestionar jerarquía automática
     * Cuando se alcanzan los ratios, crear formaciones superiores
     */
    gestionarJerarquia(elementoBase) {
        const jerarquia = this.jerarquias[elementoBase.tipo];
        if (!jerarquia) return null;

        // Buscar formaciones existentes del mismo tipo en el área
        const formacionesCercanas = this.buscarFormacionesCercanas(
            elementoBase.posicion,
            elementoBase.tipo,
            1000 // Radio de búsqueda en metros
        );

        // Si hay suficientes elementos sueltos, crear formación superior
        if (formacionesCercanas.length >= jerarquia.ratio) {
            const nuevaFormacion = this.crearFormacion(
                jerarquia.superior,
                `${jerarquia.superior}_${Date.now()}`,
                elementoBase.posicion,
                elementoBase.bando
            );

            // Agregar elementos a la nueva formación
            formacionesCercanas.forEach(elemento => {
                nuevaFormacion.agregarElemento(elemento);
            });

            console.log(`🎯 Jerarquía creada: ${jerarquia.ratio} ${elementoBase.tipo} → 1 ${jerarquia.superior}`);
            return nuevaFormacion;
        }

        return null;
    }

    /**
     * Buscar formaciones cercanas de un tipo específico
     */
    buscarFormacionesCercanas(posicion, tipo, radio) {
        const formacionesCercanas = [];

        for (const [id, formacion] of this.formaciones) {
            if (formacion.tipo === tipo) {
                const distancia = this.calcularDistancia(posicion, formacion.posicion);
                if (distancia <= radio) {
                    formacionesCercanas.push(formacion);
                }
            }
        }

        return formacionesCercanas;
    }

    /**
     * Calcular distancia entre dos posiciones
     */
    calcularDistancia(pos1, pos2) {
        const R = 6371e3; // Radio de la Tierra en metros
        const φ1 = pos1.lat * Math.PI / 180;
        const φ2 = pos2.lat * Math.PI / 180;
        const Δφ = (pos2.lat - pos1.lat) * Math.PI / 180;
        const Δλ = (pos2.lng - pos1.lng) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    /**
     * Obtener formaciones por nivel de zoom
     */
    obtenerFormacionesPorNivel(nivelZoom) {
        const formacionesFiltradas = new Map();

        for (const [id, formacion] of this.formaciones) {
            if (this.debeMostrarFormacion(formacion, nivelZoom)) {
                formacionesFiltradas.set(id, formacion);
            }
        }

        return formacionesFiltradas;
    }

    /**
     * Determinar si una formación debe mostrarse en un nivel de zoom
     */
    debeMostrarFormacion(formacion, nivelZoom) {
        switch(nivelZoom) {
            case 'estrategico':
                // Solo mostrar escuadrones y unidades grandes
                return ['escuadron', 'brigada', 'division'].includes(formacion.tipo);
            case 'tactico':
                // Mostrar secciones y escuadrones
                return ['seccion', 'escuadron'].includes(formacion.tipo);
            case 'operacional':
                // Mostrar todos los elementos individuales
                return true;
            default:
                return true;
        }
    }

    /**
     * Desplegar formación en elementos individuales
     */
    desplegarFormacion(formacionId) {
        const formacion = this.formaciones.get(formacionId);
        if (!formacion) return [];

        return formacion.desplegar();
    }

    /**
     * Obtener todas las formaciones
     */
    obtenerFormaciones() {
        return this.formaciones;
    }

    /**
     * Remover formación
     */
    removerFormacion(id) {
        return this.formaciones.delete(id);
    }
}

/**
 * Clase FormacionMilitar
 * Representa una formación militar con jerarquía
 */
class FormacionMilitar {
    constructor(tipo, nombre, posicion, bando = 'azul') {
        this.id = `form_${tipo}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.tipo = tipo;
        this.nombre = nombre;
        this.posicion = posicion;
        this.bando = bando;
        this.elementos = new Map(); // Elementos que componen la formación
        this.subFormaciones = new Map(); // Formaciones subordinadas
        this.efectivos = 0;
        this.fechaCreacion = new Date();
    }

    /**
     * Agregar elemento a la formación
     */
    agregarElemento(elemento) {
        if (this.elementos.has(elemento.id)) {
            console.warn(`⚠️ Elemento ya existe en formación: ${elemento.id}`);
            return false;
        }

        this.elementos.set(elemento.id, elemento);
        this.calcularEfectivos();
        console.log(`➕ Elemento agregado a formación ${this.nombre}: ${elemento.nombre}`);
        return true;
    }

    /**
     * Remover elemento de la formación
     */
    removerElemento(elementoId) {
        const removido = this.elementos.delete(elementoId);
        if (removido) {
            this.calcularEfectivos();
            console.log(`➖ Elemento removido de formación ${this.nombre}: ${elementoId}`);
        }
        return removido;
    }

    /**
     * Calcular efectivos totales de la formación
     */
    calcularEfectivos() {
        this.efectivos = 0;
        for (const [id, elemento] of this.elementos) {
            this.efectivos += elemento.efectivos || 1;
        }
        for (const [id, subFormacion] of this.subFormaciones) {
            this.efectivos += subFormacion.efectivos;
        }
    }

    /**
     * Desplegar formación en elementos individuales
     */
    desplegar() {
        const elementosDesplegados = [];

        // Desplegar elementos directos
        for (const [id, elemento] of this.elementos) {
            elementosDesplegados.push(elemento);
        }

        // Desplegar subformaciones recursivamente
        for (const [id, subFormacion] of this.subFormaciones) {
            elementosDesplegados.push(...subFormacion.desplegar());
        }

        return elementosDesplegados;
    }

    /**
     * Obtener información de la formación
     */
    obtenerInfo() {
        return {
            id: this.id,
            tipo: this.tipo,
            nombre: this.nombre,
            posicion: this.posicion,
            bando: this.bando,
            efectivos: this.efectivos,
            elementos: this.elementos.size,
            subFormaciones: this.subFormaciones.size
        };
    }

    /**
     * Verificar si la formación está completa
     */
    estaCompleta() {
        const ratios = {
            'seccion': 3, // 3 tanques
            'escuadron': 3, // 3 secciones
            'brigada': 3, // 3 escuadrones
            'division': 3 // 3 brigadas
        };

        return this.elementos.size >= (ratios[this.tipo] || 1);
    }
}

// Instancia global
let sistemaFormaciones;

// Función de inicialización
window.inicializarSistemaFormaciones = () => {
    sistemaFormaciones = new SistemaFormacionesMilitares();
    window.sistemaFormaciones = sistemaFormaciones;
    return sistemaFormaciones;
};

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SistemaFormacionesMilitares;
}
