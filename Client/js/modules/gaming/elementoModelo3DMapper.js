/**
 * MAPEO ELEMENTOS → MODELOS 3D - MAIRA 4.0
 * =========================================
 * Relaciona cada elemento del juego con su modelo 3D correspondiente
 */

class ElementoModelo3DMapper {
    constructor() {
        this.mapeoElementos = this.crearMapeoCompleto();
        this.categorias = this.definirCategorias();
        
        console.log('🗺️ Mapeador Elemento-Modelo3D inicializado');
    }

    /**
     * MAPEO COMPLETO: ELEMENTOS DEL JUEGO → MODELOS 3D
     */
    crearMapeoCompleto() {
        return {
            // TANQUES PRINCIPALES (MBT) - ARGENTINOS ESPECÍFICOS
            "Tanque TAM": "TAM",
            "Tanque TAM 2C": "TAM_2C", 
            "TAM": "TAM",
            "TAM 2C": "TAM_2C",
            "TAM Mediano": "TAM",
            "TAM 2C Modernizado": "TAM_2C",
            "MBT Argentino": "TAM",
            "Argentine Medium Tank": "TAM",
            "Tanque Argentino Mediano": "TAM",
            
            // TANQUES LIGEROS
            "SK-105": "SK105",
            "SK 105": "SK105",
            "SK105": "SK105",
            "Kürassier": "SK105",
            "Tanque Ligero SK": "SK105",
            "Light Tank SK105": "SK105",
            
            // VEHÍCULOS BLINDADOS
            "M113": "M113",
            "M113A2": "M113", 
            "APC M113": "M113",
            "VCTP": "VCTP",
            "Vehículo Combate": "VCTP",
            "Blindado Transporte": "M113",
            
            // ARTILLERÍA
            "CITER 155": "CITER",
            "Obús CITER": "CITER", 
            "Artillería 155mm": "CITER",
            "Howitzer 155": "CITER",
            "Mortero 120mm": "MORTERO_120mm",
            "Mortero Pesado": "MORTERO_120mm",
            
            // VEHÍCULOS LIGEROS  
            "Humvee": "HUMVEE",
            "HMMWV": "HUMVEE",
            "Vehículo Táctico": "HUMVEE", 
            "Jeep Militar": "HUMVEE",
            "Unimog": "UNIMOG",
            "Camión Militar": "UNIMOG",
            "Transporte Logístico": "UNIMOG",
            
            // DEFENSA AÉREA
            "Roland SAM": "ROLAND",
            "Sistema Roland": "ROLAND",
            "Defensa Aérea": "ROLAND",
            "SAM Roland": "ROLAND",
            
            // INFANTERÍA
            "Soldado": "SOLDADO_RIFLE", 
            "Infantería": "SOLDADO_RIFLE",
            "Fusil FAL": "SOLDADO_RIFLE",
            "Soldado Antitanque": "SOLDADO_AT",
            "AT Soldier": "SOLDADO_AT",
            "Carl Gustav": "SOLDADO_AT",
            "Tirador Selecto": "SOLDADO_RIFLE",
            
            // INGENIEROS Y ESPECIALISTAS
            "Ingeniero": "SOLDADO_ENGINEER",
            "Soldado Ingeniero": "SOLDADO_ENGINEER",
            "Ingeniero Militar": "SOLDADO_ENGINEER",
            "Especialista NBQ": "SOLDADO_ENGINEER",
            "Soldado NBQ": "SOLDADO_ENGINEER",
            "Ingenieros": "SOLDADO_ENGINEER",
            "Engineer": "SOLDADO_ENGINEER",
            
            // ELEMENTOS GENÉRICOS POR CATEGORÍA
            "Tank": "TAM",
            "Light Tank": "SK105",
            "APC": "M113", 
            "IFV": "VCTP",
            "Artillery": "CITER",
            "SAM": "ROLAND",
            "Infantry": "SOLDADO_RIFLE",
            "Truck": "UNIMOG",
            "Jeep": "HUMVEE"
        };
    }

    /**
     * CATEGORÍAS DE ELEMENTOS MILITARES
     */
    definirCategorias() {
        return {
            "MBT": {
                descripcion: "Main Battle Tank",
                elementos: ["TAM", "Tanque TAM", "MBT Argentino"],
                colorMapa: "#8B4513",
                prioridad: 10
            },
            "LIGHT_TANK": {
                descripcion: "Light Tank",
                elementos: ["SK105", "SK-105", "Kürassier"],
                colorMapa: "#A0522D",
                prioridad: 9
            },
            "APC": {
                descripcion: "Armored Personnel Carrier", 
                elementos: ["M113", "M113A2", "Blindado Transporte"],
                colorMapa: "#556B2F",
                prioridad: 8
            },
            "IFV": {
                descripcion: "Infantry Fighting Vehicle",
                elementos: ["VCTP", "Vehículo Combate"],
                colorMapa: "#6B8E23", 
                prioridad: 9
            },
            "ARTILLERY": {
                descripcion: "Sistemas de Artillería",
                elementos: ["CITER", "Mortero 120mm", "Obús"],
                colorMapa: "#B22222",
                prioridad: 9
            },
            "SAM": {
                descripcion: "Surface-to-Air Missile",
                elementos: ["Roland", "Defensa Aérea"],
                colorMapa: "#4682B4",
                prioridad: 7
            },
            "LIGHT_VEHICLE": {
                descripcion: "Vehículos Ligeros",
                elementos: ["Humvee", "Jeep Militar"],
                colorMapa: "#DAA520",
                prioridad: 5
            },
            "LOGISTICS": {
                descripcion: "Transporte y Logística", 
                elementos: ["Unimog", "Camión"],
                colorMapa: "#708090",
                prioridad: 3
            },
            "INFANTRY": {
                descripcion: "Infantería",
                elementos: ["Soldado", "Infantería"],
                colorMapa: "#2F4F4F",
                prioridad: 6
            },
            "ENGINEER": {
                descripcion: "Ingenieros Militares",
                elementos: ["Ingeniero", "Soldado Ingeniero", "NBQ"],
                colorMapa: "#FF8C00",
                prioridad: 7
            }
        };
    }

    /**
     * OBTENER MODELO 3D PARA UN ELEMENTO
     */
    obtenerModelo3DParaElemento(nombreElemento) {
        // Búsqueda exacta
        if (this.mapeoElementos[nombreElemento]) {
            return this.mapeoElementos[nombreElemento];
        }
        
        // Búsqueda parcial (contiene texto)
        for (const [clave, modelo] of Object.entries(this.mapeoElementos)) {
            if (nombreElemento.toLowerCase().includes(clave.toLowerCase()) ||
                clave.toLowerCase().includes(nombreElemento.toLowerCase())) {
                return modelo;
            }
        }
        
        // Búsqueda por categoría
        const categoria = this.determinarCategoria(nombreElemento);
        if (categoria) {
            return this.obtenerModeloDeCategoria(categoria);
        }
        
        // Modelo genérico por defecto
        console.warn(`⚠️ No se encontró modelo para: ${nombreElemento}`);
        return "SOLDADO_RIFLE"; // Modelo por defecto
    }

    /**
     * DETERMINAR CATEGORÍA DE UN ELEMENTO
     */
    determinarCategoria(nombreElemento) {
        const nombre = nombreElemento.toLowerCase();
        
        // Palabras clave por categoría
        const palabrasClave = {
            "MBT": ["tanque", "tank", "tam", "mbt", "blindado pesado"],
            "APC": ["m113", "apc", "transporte", "blindado"],
            "IFV": ["vctp", "ifv", "combate", "vehículo combate"],
            "ARTILLERY": ["artillería", "obús", "mortero", "citer", "howitzer", "cañón"],
            "SAM": ["roland", "sam", "misil", "defensa aérea"],
            "LIGHT_VEHICLE": ["humvee", "jeep", "vehículo", "hmmwv"],
            "LOGISTICS": ["unimog", "camión", "truck", "transporte"],
            "INFANTRY": ["soldado", "infantería", "soldier", "fusil"]
        };
        
        for (const [categoria, palabras] of Object.entries(palabrasClave)) {
            if (palabras.some(palabra => nombre.includes(palabra))) {
                return categoria;
            }
        }
        
        return null;
    }

    /**
     * OBTENER MODELO REPRESENTATIVO DE UNA CATEGORÍA
     */
    obtenerModeloDeCategoria(categoria) {
        const modelosCategoria = {
            "MBT": "TAM",
            "APC": "M113", 
            "IFV": "VCTP",
            "ARTILLERY": "CITER",
            "SAM": "ROLAND",
            "LIGHT_VEHICLE": "HUMVEE",
            "LOGISTICS": "UNIMOG", 
            "INFANTRY": "SOLDADO_RIFLE"
        };
        
        return modelosCategoria[categoria] || "SOLDADO_RIFLE";
    }

    /**
     * OBTENER INFORMACIÓN COMPLETA DE UN ELEMENTO
     */
    obtenerInfoElemento(nombreElemento) {
        const modelo3D = this.obtenerModelo3DParaElemento(nombreElemento);
        const categoria = this.determinarCategoria(nombreElemento);
        
        return {
            elemento: nombreElemento,
            modelo3D: modelo3D,
            categoria: categoria,
            infoCategoria: this.categorias[categoria] || null,
            colorMapa: categoria ? this.categorias[categoria].colorMapa : "#808080",
            prioridad: categoria ? this.categorias[categoria].prioridad : 1
        };
    }

    /**
     * LISTAR TODOS LOS ELEMENTOS DISPONIBLES
     */
    listarElementosDisponibles() {
        const elementos = {};
        
        for (const [categoria, info] of Object.entries(this.categorias)) {
            elementos[categoria] = {
                descripcion: info.descripcion,
                elementos: info.elementos,
                color: info.colorMapa
            };
        }
        
        return elementos;
    }

    /**
     * VALIDAR SI UN ELEMENTO TIENE MODELO 3D
     */
    tieneModelo3D(nombreElemento) {
        return this.obtenerModelo3DParaElemento(nombreElemento) !== "SOLDADO_RIFLE";
    }
}

// Instancia global
window.elementoModelo3DMapper = new ElementoModelo3DMapper();
