/**
 * GENERADOR DE MODELOS 3D MILITARES - MAIRA 4.0
 * ===============================================
 * Crea modelos 3D simples pero realistas usando geometrías básicas Three.js
 * Optimizado para rendimiento en tiempo real
 */

class GeneradorModelos3D {
    constructor() {
        this.modelos = new Map();
        this.materialesMilitares = this.crearMaterialesMilitares();
        console.log('🎮 Generador de Modelos 3D Militares inicializado');
    }

    crearMaterialesMilitares() {
        return {
            verdeOliva: new THREE.MeshLambertMaterial({ color: 0x556b2f }),
            grisAcorazado: new THREE.MeshLambertMaterial({ color: 0x2f4f4f }),
            marronTierra: new THREE.MeshLambertMaterial({ color: 0x8b4513}),
            negroMetal: new THREE.MeshLambertMaterial({ color: 0x1c1c1c }),
            amarilloIdentificacion: new THREE.MeshLambertMaterial({ color: 0xffd700 })
        };
    }

    // ===============================================
    // TANQUE TAM (Tanque Argentino Mediano)
    // ===============================================
    crearTanqueTAM() {
        const grupo = new THREE.Group();
        
        // Chasis principal
        const chasisGeometry = new THREE.BoxGeometry(8, 2, 4);
        const chasis = new THREE.Mesh(chasisGeometry, this.materialesMilitares.grisAcorazado);
        chasis.position.set(0, 1, 0);
        grupo.add(chasis);
        
        // Torre
        const torreGeometry = new THREE.CylinderGeometry(1.8, 2, 1.5, 8);
        const torre = new THREE.Mesh(torreGeometry, this.materialesMilitares.grisAcorazado);
        torre.position.set(0, 2.75, 0);
        grupo.add(torre);
        
        // Cañón principal
        const canonGeometry = new THREE.CylinderGeometry(0.2, 0.15, 6, 8);
        const canon = new THREE.Mesh(canonGeometry, this.materialesMilitares.negroMetal);
        canon.rotation.z = Math.PI / 2;
        canon.position.set(3, 2.75, 0);
        grupo.add(canon);
        
        // Orugas (simplificadas)
        const orugaIzqGeometry = new THREE.BoxGeometry(7, 1, 1);
        const orugaIzq = new THREE.Mesh(orugaIzqGeometry, this.materialesMilitares.negroMetal);
        orugaIzq.position.set(0, 0.5, -2);
        grupo.add(orugaIzq);
        
        const orugaDerGeometry = new THREE.BoxGeometry(7, 1, 1);
        const orugaDer = new THREE.Mesh(orugaDerGeometry, this.materialesMilitares.negroMetal);
        orugaDer.position.set(0, 0.5, 2);
        grupo.add(orugaDer);
        
        // Marca de identificación argentina
        const marcaGeometry = new THREE.PlaneGeometry(1, 0.5);
        const marca = new THREE.Mesh(marcaGeometry, this.materialesMilitares.amarilloIdentificacion);
        marca.position.set(0, 3, 2.1);
        grupo.add(marca);
        
        // Escala apropiada para el mapa
        grupo.scale.set(0.3, 0.3, 0.3);
        
        return grupo;
    }

    // ===============================================
    // M-113 (Vehículo de Transporte Blindado)
    // ===============================================
    crearM113() {
        const grupo = new THREE.Group();
        
        // Casco principal
        const cascoGeometry = new THREE.BoxGeometry(6, 2.5, 3);
        const casco = new THREE.Mesh(cascoGeometry, this.materialesMilitares.verdeOliva);
        casco.position.set(0, 1.25, 0);
        grupo.add(casco);
        
        // Compuerta trasera
        const compuertaGeometry = new THREE.BoxGeometry(0.3, 2, 2.5);
        const compuerta = new THREE.Mesh(compuertaGeometry, this.materialesMilitares.verdeOliva);
        compuerta.position.set(-3, 1.25, 0);
        grupo.add(compuerta);
        
        // Orugas
        const orugaIzqGeometry = new THREE.BoxGeometry(5.5, 0.8, 0.8);
        const orugaIzq = new THREE.Mesh(orugaIzqGeometry, this.materialesMilitares.negroMetal);
        orugaIzq.position.set(0, 0.4, -1.6);
        grupo.add(orugaIzq);
        
        const orugaDerGeometry = new THREE.BoxGeometry(5.5, 0.8, 0.8);
        const orugaDer = new THREE.Mesh(orugaDerGeometry, this.materialesMilitares.negroMetal);
        orugaDer.position.set(0, 0.4, 1.6);
        grupo.add(orugaDer);
        
        // Ametralladora cupular
        const ametralladoraGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 6);
        const ametralladora = new THREE.Mesh(ametralladoraGeometry, this.materialesMilitares.negroMetal);
        ametralladora.rotation.z = Math.PI / 4;
        ametralladora.position.set(1, 3, 0);
        grupo.add(ametralladora);
        
        grupo.scale.set(0.35, 0.35, 0.35);
        
        return grupo;
    }

    // ===============================================
    // CITER (Artillería Autopropulsada)
    // ===============================================
    crearCITER() {
        const grupo = new THREE.Group();
        
        // Chasis base
        const chasisGeometry = new THREE.BoxGeometry(8, 2, 4);
        const chasis = new THREE.Mesh(chasisGeometry, this.materialesMilitares.verdeOliva);
        chasis.position.set(0, 1, 0);
        grupo.add(chasis);
        
        // Plataforma de artillería
        const plataformaGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 8);
        const plataforma = new THREE.Mesh(plataformaGeometry, this.materialesMilitares.grisAcorazado);
        plataforma.position.set(-1, 2.5, 0);
        grupo.add(plataforma);
        
        // Cañón de 155mm
        const canonGeometry = new THREE.CylinderGeometry(0.25, 0.2, 8, 8);
        const canon = new THREE.Mesh(canonGeometry, this.materialesMilitares.negroMetal);
        canon.rotation.z = Math.PI / 2;
        canon.rotation.x = -Math.PI / 8; // Elevación típica
        canon.position.set(2, 3.5, 0);
        grupo.add(canon);
        
        // Patas estabilizadoras
        const pataGeometry = new THREE.BoxGeometry(0.3, 2, 0.3);
        const pataIzq = new THREE.Mesh(pataGeometry, this.materialesMilitares.negroMetal);
        pataIzq.position.set(-3, 0, -2.5);
        pataIzq.rotation.z = Math.PI / 6;
        grupo.add(pataIzq);
        
        const pataDer = new THREE.Mesh(pataGeometry, this.materialesMilitares.negroMetal);
        pataDer.position.set(-3, 0, 2.5);
        pataDer.rotation.z = -Math.PI / 6;
        grupo.add(pataDer);
        
        // Orugas
        const orugaIzqGeometry = new THREE.BoxGeometry(7, 1, 1);
        const orugaIzq = new THREE.Mesh(orugaIzqGeometry, this.materialesMilitares.negroMetal);
        orugaIzq.position.set(0, 0.5, -2);
        grupo.add(orugaIzq);
        
        const orugaDerGeometry = new THREE.BoxGeometry(7, 1, 1);
        const orugaDer = new THREE.Mesh(orugaDerGeometry, this.materialesMilitares.negroMetal);
        orugaDer.position.set(0, 0.5, 2);
        grupo.add(orugaDer);
        
        grupo.scale.set(0.3, 0.3, 0.3);
        
        return grupo;
    }

    // ===============================================
    // SOLDADO (Figura humana básica)
    // ===============================================
    crearSoldado() {
        const grupo = new THREE.Group();
        
        // Cuerpo
        const cuerpoGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.4);
        const cuerpo = new THREE.Mesh(cuerpoGeometry, this.materialesMilitares.verdeOliva);
        cuerpo.position.set(0, 1.5, 0);
        grupo.add(cuerpo);
        
        // Cabeza
        const cabezaGeometry = new THREE.SphereGeometry(0.3, 8, 6);
        const cabeza = new THREE.Mesh(cabezaGeometry, this.materialesMilitares.marronTierra);
        cabeza.position.set(0, 2.5, 0);
        grupo.add(cabeza);
        
        // Piernas
        const piernaIzqGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
        const piernaIzq = new THREE.Mesh(piernaIzqGeometry, this.materialesMilitares.verdeOliva);
        piernaIzq.position.set(-0.2, 0.6, 0);
        grupo.add(piernaIzq);
        
        const piernaDerGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
        const piernaDer = new THREE.Mesh(piernaDerGeometry, this.materialesMilitares.verdeOliva);
        piernaDer.position.set(0.2, 0.6, 0);
        grupo.add(piernaDer);
        
        // Fusil FAL
        const fusilGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6);
        const fusil = new THREE.Mesh(fusilGeometry, this.materialesMilitares.negroMetal);
        fusil.rotation.z = Math.PI / 4;
        fusil.position.set(0.3, 1.8, 0);
        grupo.add(fusil);
        
        grupo.scale.set(0.8, 0.8, 0.8);
        
        return grupo;
    }

    // ===============================================
    // CAMIÓN MILITAR
    // ===============================================
    crearCamionMilitar() {
        const grupo = new THREE.Group();
        
        // Cabina
        const cabinaGeometry = new THREE.BoxGeometry(2, 2, 3);
        const cabina = new THREE.Mesh(cabinaGeometry, this.materialesMilitares.verdeOliva);
        cabina.position.set(2, 1.5, 0);
        grupo.add(cabina);
        
        // Caja de carga
        const cajaGeometry = new THREE.BoxGeometry(4, 2, 3);
        const caja = new THREE.Mesh(cajaGeometry, this.materialesMilitares.verdeOliva);
        caja.position.set(-1, 1.5, 0);
        grupo.add(caja);
        
        // Lona (simplificada)
        const lonaGeometry = new THREE.CylinderGeometry(1.8, 1.8, 4, 8, 1, false, 0, Math.PI);
        const lona = new THREE.Mesh(lonaGeometry, this.materialesMilitares.marronTierra);
        lona.rotation.z = Math.PI / 2;
        lona.position.set(-1, 2.5, 0);
        grupo.add(lona);
        
        // Ruedas
        const ruedaGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 8);
        ruedaGeometry.rotateX(Math.PI / 2);
        
        // Ruedas delanteras
        const ruedaDelIzq = new THREE.Mesh(ruedaGeometry, this.materialesMilitares.negroMetal);
        ruedaDelIzq.position.set(2, 0.5, -1.8);
        grupo.add(ruedaDelIzq);
        
        const ruedaDelDer = new THREE.Mesh(ruedaGeometry, this.materialesMilitares.negroMetal);
        ruedaDelDer.position.set(2, 0.5, 1.8);
        grupo.add(ruedaDelDer);
        
        // Ruedas traseras
        const ruedaTraIzq = new THREE.Mesh(ruedaGeometry, this.materialesMilitares.negroMetal);
        ruedaTraIzq.position.set(-1, 0.5, -1.8);
        grupo.add(ruedaTraIzq);
        
        const ruedaTraDer = new THREE.Mesh(ruedaGeometry, this.materialesMilitares.negroMetal);
        ruedaTraDer.position.set(-1, 0.5, 1.8);
        grupo.add(ruedaTraDer);
        
        grupo.scale.set(0.4, 0.4, 0.4);
        
        return grupo;
    }

    // ===============================================
    // API PRINCIPAL
    // ===============================================
    obtenerModelo(tipo) {
        if (this.modelos.has(tipo)) {
            return this.modelos.get(tipo).clone();
        }
        
        let modelo;
        switch(tipo.toLowerCase()) {
            case 'tanque':
            case 'tam':
                modelo = this.crearTanqueTAM();
                break;
            case 'mecanizado':
            case 'm113':
                modelo = this.crearM113();
                break;
            case 'artilleria':
            case 'citer':
                modelo = this.crearCITER();
                break;
            case 'infanteria':
            case 'soldado':
                modelo = this.crearSoldado();
                break;
            case 'camion':
                modelo = this.crearCamionMilitar();
                break;
            default:
                // Modelo genérico
                const genericoGeometry = new THREE.BoxGeometry(1, 1, 1);
                modelo = new THREE.Mesh(genericoGeometry, this.materialesMilitares.grisAcorazado);
        }
        
        this.modelos.set(tipo, modelo);
        return modelo.clone();
    }

    // Aplicar efectos de daño visual
    aplicarDaño(modelo, porcentajeDaño) {
        if (porcentajeDaño > 50) {
            // Humo pesado
            this.agregarHumo(modelo, 'pesado');
        } else if (porcentajeDaño > 25) {
            // Humo ligero
            this.agregarHumo(modelo, 'ligero');
        }
        
        if (porcentajeDaño > 75) {
            // Efectos de fuego
            this.agregarFuego(modelo);
        }
    }

    agregarHumo(modelo, intensidad) {
        // Implementar partículas de humo con Three.js
        // Por ahora, simplificado con geometría
        const humoGeometry = new THREE.SphereGeometry(0.5, 6, 4);
        const humoMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x555555, 
            transparent: true, 
            opacity: intensidad === 'pesado' ? 0.8 : 0.4 
        });
        const humo = new THREE.Mesh(humoGeometry, humoMaterial);
        humo.position.set(0, 2, 0);
        modelo.add(humo);
    }

    agregarFuego(modelo) {
        // Efectos de fuego simplificados
        const fuegoGeometry = new THREE.ConeGeometry(0.3, 1, 6);
        const fuegoMaterial = new THREE.MeshBasicMaterial({ color: 0xff4500 });
        const fuego = new THREE.Mesh(fuegoGeometry, fuegoMaterial);
        fuego.position.set(0, 1.5, 0);
        modelo.add(fuego);
    }
}

// Instancia global
let generadorModelos3D;

// Inicialización
window.inicializarGeneradorModelos3D = () => {
    generadorModelos3D = new GeneradorModelos3D();
    window.generadorModelos3D = generadorModelos3D;
    return generadorModelos3D;
};

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeneradorModelos3D;
}
