/**
 * @fileoverview Servicio de datos militares
 * @version 1.0.0
 * @description Carga y gestiona datos militares desde JSON
 * Reemplaza consultas a DB para datos sensibles/estáticos
 */

class MilitaryDataService {
    constructor() {
        this.data = null;
        this.loaded = false;
        this.loading = false;
        
        console.log('🔒 MilitaryDataService inicializado');
    }

    /**
     * Carga datos militares desde JSON
     */
    async loadData() {
        if (this.loaded) {
            return this.data;
        }
        
        if (this.loading) {
            // Esperar a que termine la carga actual
            while (this.loading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.data;
        }
        
        try {
            this.loading = true;
            console.log('📂 Cargando datos militares...');
            
            const response = await fetch('/Client/data/military_data.json');
            if (!response.ok) {
                throw new Error(`Error al cargar datos: ${response.status}`);
            }
            
            this.data = await response.json();
            this.loaded = true;
            
            console.log(`✅ Datos militares cargados - Versión: ${this.data.metadata.version}`);
            console.log(`🔫 Armamento: ${this.data.armamento.length} tipos`);
            console.log(`🚗 Vehículos: ${this.data.vehicles.length} tipos`);
            console.log(`👥 Unidades: ${this.data.unidades.length} tipos`);
            console.log(`🎖️ Roles: ${this.data.roles_combate.length} roles`);
            
            return this.data;
            
        } catch (error) {
            console.error('❌ Error cargando datos militares:', error);
            this.loading = false;
            throw error;
        } finally {
            this.loading = false;
        }
    }

    /**
     * Obtiene información de armamento por nombre
     */
    async getWeapon(weaponName) {
        await this.loadData();
        
        return this.data.armamento.find(arma => 
            arma.nombre.toLowerCase() === weaponName.toLowerCase()
        );
    }

    /**
     * Obtiene vehículos disponibles para un tipo de unidad
     */
    async getVehiclesForUnit(unitType) {
        await this.loadData();
        
        // Buscar vehículos por tipo de unidad
        const availableVehicles = [];
        
        // Ejemplo: Caballería Blindada puede usar TAM, TAM 2C, SK 105
        const vehicleMapping = {
            'caballeria_blindada': ['VC TAM', 'VC TAM 2C', 'VC SK 105'],
            'infanteria_mecanizada': ['M113', 'VCTP', 'VCTM'],
            'reconocimiento': ['Agrale Marruá', 'Yamaha XT 350', 'Honda Tornado 250'],
            'logistica': ['Mercedes-Benz 1114', 'Mercedes-Benz 1518', 'Unimog U416']
        };
        
        const vehicleNames = vehicleMapping[unitType] || [];
        
        for (const name of vehicleNames) {
            const vehicle = this.data.vehicles.find(v => v.name === name);
            if (vehicle) {
                availableVehicles.push(vehicle);
            }
        }
        
        return availableVehicles;
    }

    /**
     * Calcula transitabilidad basada en vehículo y terreno
     */
    async calculateMobility(vehicleName, terrainType, weatherCondition = 'clear') {
        await this.loadData();
        
        const vehicle = this.data.vehicles.find(v => v.name === vehicleName);
        if (!vehicle) {
            console.warn(`⚠️ Vehículo no encontrado: ${vehicleName}`);
            return 0.5; // Valor por defecto
        }
        
        // Obtener factor de movilidad por terreno
        const terrainKey = `mobility_${terrainType}`;
        const mobilityFactor = parseFloat(vehicle[terrainKey]) || 0.5;
        
        // Aplicar factor climático
        const weatherFactors = {
            'clear': 1.0,
            'rain': 0.8,
            'snow': 0.6,
            'fog': 0.9,
            'storm': 0.5
        };
        
        const weatherFactor = weatherFactors[weatherCondition] || 1.0;
        
        return mobilityFactor * weatherFactor;
    }

    /**
     * Obtiene roles disponibles para una unidad específica
     */
    async getRolesForUnit(unitId) {
        await this.loadData();
        
        // Buscar relaciones unidad-roles
        const unitRoles = this.data.unidades_roles.filter(ur => ur.unidad_id == unitId);
        const roles = [];
        
        for (const ur of unitRoles) {
            const role = this.data.roles_combate.find(r => r.id == ur.role_id);
            if (role) {
                roles.push({
                    ...role,
                    cantidad: ur.cantidad,
                    certificacion: ur.certificacion === '1'
                });
            }
        }
        
        return roles;
    }

    /**
     * Calcula personal y equipamiento para una magnitud específica
     */
    async calculateUnitComposition(unitType, magnitude) {
        await this.loadData();
        
        const magnitudeData = this.data.jerarquia_militar.magnitudes[magnitude];
        if (!magnitudeData) {
            console.warn(`⚠️ Magnitud no válida: ${magnitude}`);
            return null;
        }
        
        // Cálculo base de personal (promedio del rango)
        const avgPersonnel = Math.round(
            (magnitudeData.personnel_min + magnitudeData.personnel_max) / 2
        );
        
        return {
            magnitude: magnitude,
            name: magnitudeData.name,
            personnel: avgPersonnel,
            personnel_range: [magnitudeData.personnel_min, magnitudeData.personnel_max],
            subordinates: magnitudeData.subordinates,
            typical_roles: magnitudeData.typical_roles
        };
    }

    /**
     * Obtiene munición total de un arma
     */
    async getWeaponAmmunition(weaponName) {
        const weapon = await this.getWeapon(weaponName);
        
        if (!weapon) {
            return null;
        }
        
        return {
            weapon: weaponName,
            capacity_per_magazine: weapon.capacidad_cargador || 0,
            magazines_carried: weapon.cantidad_cargadores || 0,
            total_rounds: weapon.total_municiones || 0,
            load_type: weapon.tipo_carga || 'cargadores',
            ammunition_types: [
                weapon.municion_tipoA,
                weapon.municion_tipoB,
                weapon.municion_tipoC,
                weapon.municion_tipoD
            ].filter(Boolean)
        };
    }

    /**
     * Busca unidades por especialidad y subtipo
     */
    async getUnitsBySpecialty(specialty, subtype = null) {
        await this.loadData();
        
        let units = this.data.unidades.filter(u => 
            u.especialidad.toLowerCase() === specialty.toLowerCase()
        );
        
        if (subtype) {
            units = units.filter(u => 
                u.subtipo && u.subtipo.toLowerCase() === subtype.toLowerCase()
            );
        }
        
        return units;
    }
}

// Crear instancia global
window.militaryDataService = new MilitaryDataService();

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MilitaryDataService;
}

console.log('🔒 MilitaryDataService disponible globalmente');
