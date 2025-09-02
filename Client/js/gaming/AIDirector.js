/**
 * 🤖 AI DIRECTOR - SISTEMA INTELIGENTE DE DIRECCIÓN
 * IA avanzada para control dinámico de ejercicios militares
 * Inspirado en Command: Modern Operations y sistemas militares profesionales
 */

class AIDirector {
    constructor(options = {}) {
        this.gameEngine = options.gameEngine;
        this.initialized = false;
        
        // Configuración IA
        this.config = {
            adaptiveDifficulty: options.adaptiveDifficulty || true,
            scenarioGeneration: options.scenarioGeneration || true,
            playerAnalysis: options.playerAnalysis || true,
            eventInjection: options.eventInjection || true,
            learningEnabled: options.learningEnabled || true
        };
        
        // Sistemas IA
        this.playerModel = new PlayerPerformanceModel();
        this.scenarioLibrary = new ScenarioLibrary();
        this.difficultyController = new DifficultyController();
        this.eventScheduler = new EventScheduler();
        this.tacticalAnalyzer = new TacticalAnalyzer();
        
        // Estado interno
        this.currentDifficulty = 0.5; // 0-1 scale
        this.playerProfile = new Map();
        this.activeEvents = new Map();
        this.decisionHistory = [];
        this.performanceMetrics = new Map();
        
        // Referencias militares profesionales
        this.militaryDoctrines = {
            argentina: 'Doctrina Ejército Argentino',
            nato: 'Procedimientos OTAN',
            us_army: 'US Army Field Manual',
            combined_arms: 'Armas Combinadas'
        };
        
        console.log('🤖 AI DIRECTOR - Inicializando sistema inteligente...');
        this.initialize();
    }

    /**
     * INICIALIZACIÓN IA DIRECTOR
     */
    async initialize() {
        console.log('⚡ Inicializando AI Director...');
        
        try {
            // Cargar base conocimiento militar
            await this.loadMilitaryKnowledge();
            
            // Inicializar modelos IA
            await this.initializeAIModels();
            
            // Configurar sistemas análisis
            await this.setupAnalysisSystems();
            
            // Cargar escenarios predefinidos
            await this.loadScenarioLibrary();
            
            this.initialized = true;
            console.log('✅ AI Director inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando AI Director:', error);
            throw error;
        }
    }

    /**
     * CARGAR CONOCIMIENTO MILITAR
     */
    async loadMilitaryKnowledge() {
        console.log('📚 Cargando base conocimiento militar...');
        
        // Doctrina militar argentina
        this.militaryKnowledge = {
            // Principios guerra
            warPrinciples: [
                'Objetivo',
                'Ofensiva', 
                'Masa',
                'Economía de fuerzas',
                'Maniobra',
                'Unidad de comando',
                'Seguridad',
                'Sorpresa',
                'Simplicidad'
            ],
            
            // Tipos de operaciones
            operationTypes: {
                'offensive': {
                    characteristics: ['Iniciativa', 'Momentum', 'Concentración'],
                    phases: ['Preparación', 'Asalto', 'Explotación', 'Persecución']
                },
                'defensive': {
                    characteristics: ['Economía fuerzas', 'Flexibilidad', 'Profundidad'],
                    phases: ['Preparación', 'Combate principal', 'Contraataque']
                },
                'stability': {
                    characteristics: ['Control', 'Legitimidad', 'Seguridad'],
                    phases: ['Estabilización', 'Transición', 'Desarrollo']
                }
            },
            
            // Factores decisión METT-TC
            mettTc: {
                'mission': 'Misión y tareas',
                'enemy': 'Enemigo y amenazas',
                'terrain': 'Terreno y clima',
                'troops': 'Tropas disponibles',
                'time': 'Tiempo disponible',
                'civilians': 'Consideraciones civiles'
            },
            
            // Estructura fuerzas argentinas
            argentineForces: {
                'infantry': {
                    'company': { personnel: 120, vehicles: 8, weapons: ['FAL', 'MAG', 'AT4'] },
                    'battalion': { personnel: 650, vehicles: 40, weapons: ['Morteros 81mm'] }
                },
                'armor': {
                    'platoon': { personnel: 12, vehicles: 3, weapons: ['TAM', 'VCTP'] },
                    'company': { personnel: 50, vehicles: 14, weapons: ['TAM', 'VCTP'] }
                },
                'artillery': {
                    'battery': { personnel: 80, vehicles: 6, weapons: ['CITER 155mm'] },
                    'battalion': { personnel: 400, vehicles: 30, weapons: ['CITER 155mm', 'SLAM'] }
                }
            }
        };
        
        console.log('✅ Base conocimiento militar cargada');
    }

    /**
     * INICIALIZAR MODELOS IA
     */
    async initializeAIModels() {
        console.log('🧠 Inicializando modelos IA...');
        
        // Modelo análisis jugador
        this.playerModel = new PlayerPerformanceModel({
            metrics: [
                'decision_speed',      // Velocidad toma decisiones
                'tactical_accuracy',   // Precisión táctica
                'resource_management', // Gestión recursos
                'adaptability',        // Capacidad adaptación
                'coordination',        // Coordinación unidades
                'doctrine_adherence'   // Adherencia doctrina
            ],
            learningRate: 0.1,
            adaptationThreshold: 0.2
        });
        
        // Controlador dificultad adaptativa
        this.difficultyController = new DifficultyController({
            targetChallengeLevel: 0.7, // Sweet spot challenge
            adjustmentRate: 0.05,
            minDifficulty: 0.2,
            maxDifficulty: 0.9
        });
        
        // Analizador táctico
        this.tacticalAnalyzer = new TacticalAnalyzer({
            doctrines: this.militaryKnowledge,
            analysisDepth: 'detailed',
            realTimeAnalysis: true
        });
        
        console.log('✅ Modelos IA inicializados');
    }

    /**
     * CONFIGURAR SISTEMAS ANÁLISIS
     */
    async setupAnalysisSystems() {
        console.log('📊 Configurando sistemas análisis...');
        
        // Configurar intervalos análisis
        this.analysisIntervals = {
            playerPerformance: 30000,  // 30 segundos
            tacticalSituation: 60000,  // 1 minuto
            difficultyAdjustment: 120000, // 2 minutos
            eventGeneration: 180000    // 3 minutos
        };
        
        // Iniciar loops análisis
        this.startAnalysisLoops();
        
        console.log('✅ Sistemas análisis configurados');
    }

    /**
     * CARGAR LIBRERÍA ESCENARIOS
     */
    async loadScenarioLibrary() {
        console.log('📖 Cargando librería escenarios...');
        
        this.scenarioLibrary = new ScenarioLibrary({
            scenarios: [
                {
                    id: 'basic_defense',
                    name: 'Defensa Básica',
                    type: 'defensive',
                    difficulty: 0.3,
                    duration: 180, // minutos
                    objectives: [
                        { type: 'hold_position', priority: 'critical' },
                        { type: 'minimize_casualties', priority: 'high' }
                    ],
                    enemyForces: ['infantry_company', 'tank_platoon'],
                    terrain: 'mixed',
                    weather: 'clear'
                },
                
                {
                    id: 'mobile_defense',
                    name: 'Defensa Móvil',
                    type: 'defensive',
                    difficulty: 0.6,
                    duration: 240,
                    objectives: [
                        { type: 'delay_enemy', priority: 'critical' },
                        { type: 'preserve_forces', priority: 'high' },
                        { type: 'counterattack', priority: 'medium' }
                    ],
                    enemyForces: ['mechanized_battalion', 'artillery_battery'],
                    terrain: 'open',
                    weather: 'variable'
                },
                
                {
                    id: 'urban_operations',
                    name: 'Operaciones Urbanas',
                    type: 'stability',
                    difficulty: 0.8,
                    duration: 300,
                    objectives: [
                        { type: 'secure_area', priority: 'critical' },
                        { type: 'minimize_collateral', priority: 'critical' },
                        { type: 'establish_control', priority: 'high' }
                    ],
                    enemyForces: ['irregular_forces', 'civilian_population'],
                    terrain: 'urban',
                    weather: 'clear'
                },
                
                {
                    id: 'combined_arms_attack',
                    name: 'Ataque Armas Combinadas',
                    type: 'offensive',
                    difficulty: 0.7,
                    duration: 200,
                    objectives: [
                        { type: 'seize_objective', priority: 'critical' },
                        { type: 'destroy_enemy', priority: 'high' },
                        { type: 'maintain_momentum', priority: 'medium' }
                    ],
                    enemyForces: ['defensive_positions', 'reserves'],
                    terrain: 'mixed',
                    weather: 'limited_visibility'
                }
            ]
        });
        
        console.log('✅ Librería escenarios cargada');
    }

    /**
     * INICIAR LOOPS ANÁLISIS
     */
    startAnalysisLoops() {
        // Análisis performance jugador
        setInterval(() => {
            if (this.gameEngine && this.gameEngine.running) {
                this.analyzePlayerPerformance();
            }
        }, this.analysisIntervals.playerPerformance);
        
        // Análisis situación táctica
        setInterval(() => {
            if (this.gameEngine && this.gameEngine.running) {
                this.analyzeTacticalSituation();
            }
        }, this.analysisIntervals.tacticalSituation);
        
        // Ajuste dificultad
        setInterval(() => {
            if (this.gameEngine && this.gameEngine.running) {
                this.adjustDifficulty();
            }
        }, this.analysisIntervals.difficultyAdjustment);
        
        // Generación eventos
        setInterval(() => {
            if (this.gameEngine && this.gameEngine.running) {
                this.generateDynamicEvents();
            }
        }, this.analysisIntervals.eventGeneration);
    }

    /**
     * GENERAR ESCENARIO INICIAL
     */
    async generateScenario(config = {}) {
        console.log('🎬 Generando escenario dinámico...');
        
        // Seleccionar escenario base
        const baseScenario = this.selectBaseScenario(config);
        
        // Adaptar a jugador
        const adaptedScenario = await this.adaptScenarioToPlayer(baseScenario);
        
        // Generar eventos dinámicos
        const dynamicEvents = this.generateScenarioEvents(adaptedScenario);
        
        // Configurar fuerzas enemigas
        const enemyForces = this.configureEnemyForces(adaptedScenario);
        
        const finalScenario = {
            ...adaptedScenario,
            dynamicEvents: dynamicEvents,
            enemyForces: enemyForces,
            generated: Date.now(),
            generatorVersion: '1.0.0'
        };
        
        console.log(`✅ Escenario generado: ${finalScenario.name}`);
        return finalScenario;
    }

    /**
     * SELECCIONAR ESCENARIO BASE
     */
    selectBaseScenario(config) {
        const scenarios = this.scenarioLibrary.getAvailableScenarios();
        
        // Filtrar por configuración
        let filteredScenarios = scenarios;
        
        if (config.type) {
            filteredScenarios = filteredScenarios.filter(s => s.type === config.type);
        }
        
        if (config.difficulty) {
            const tolerance = 0.2;
            filteredScenarios = filteredScenarios.filter(s => 
                Math.abs(s.difficulty - config.difficulty) <= tolerance
            );
        }
        
        // Seleccionar aleatoriamente entre candidatos
        const selectedScenario = filteredScenarios[
            Math.floor(Math.random() * filteredScenarios.length)
        ];
        
        return selectedScenario || scenarios[0]; // Fallback al primero
    }

    /**
     * ADAPTAR ESCENARIO AL JUGADOR
     */
    async adaptScenarioToPlayer(baseScenario) {
        const playerProfile = this.getPlayerProfile();
        
        // Clonar escenario base
        const adaptedScenario = { ...baseScenario };
        
        // Ajustar dificultad basado en performance
        if (playerProfile.averagePerformance) {
            const performanceModifier = playerProfile.averagePerformance - 0.5;
            adaptedScenario.difficulty += performanceModifier * 0.3;
            adaptedScenario.difficulty = Math.max(0.1, Math.min(0.9, adaptedScenario.difficulty));
        }
        
        // Ajustar objetivos según fortalezas/debilidades
        if (playerProfile.weaknesses) {
            adaptedScenario.trainingFocus = playerProfile.weaknesses;
        }
        
        // Modificar fuerzas enemigas
        if (playerProfile.tacticalPreferences) {
            adaptedScenario.enemyTactics = this.counterPlayerTactics(playerProfile.tacticalPreferences);
        }
        
        return adaptedScenario;
    }

    /**
     * ANÁLISIS PERFORMANCE JUGADOR EN TIEMPO REAL
     */
    analyzePlayerPerformance() {
        if (!this.gameEngine) return;
        
        const gameState = this.gameEngine.gameState.get('current');
        if (!gameState) return;
        
        // Recopilar métricas actuales
        const currentMetrics = {
            decisionSpeed: this.calculateDecisionSpeed(),
            tacticalAccuracy: this.calculateTacticalAccuracy(),
            resourceManagement: this.calculateResourceManagement(),
            adaptability: this.calculateAdaptability(),
            coordination: this.calculateCoordination(),
            doctrineAdherence: this.calculateDoctrineAdherence()
        };
        
        // Actualizar modelo jugador
        this.playerModel.updateMetrics(currentMetrics);
        
        // Generar insights
        const insights = this.generatePlayerInsights(currentMetrics);
        
        // Registrar para análisis histórico
        this.performanceMetrics.set(Date.now(), {
            metrics: currentMetrics,
            insights: insights
        });
        
        console.log('📊 Performance jugador analizada:', insights.summary);
    }

    /**
     * ANÁLISIS SITUACIÓN TÁCTICA
     */
    analyzeTacticalSituation() {
        if (!this.gameEngine) return;
        
        const gameState = this.gameEngine.gameState.get('current');
        if (!gameState) return;
        
        // Análizar situación actual
        const tacticalAnalysis = {
            forceRatio: this.calculateForceRatio(gameState),
            terrainAdvantage: this.assessTerrainAdvantage(gameState),
            logisticalState: this.assessLogisticalState(gameState),
            momentum: this.calculateMomentum(gameState),
            threatAssessment: this.assessThreats(gameState)
        };
        
        // Generar recomendaciones IA
        const aiRecommendations = this.generateAIRecommendations(tacticalAnalysis);
        
        // Detectar oportunidades intervención
        const interventionOpportunities = this.detectInterventionOpportunities(tacticalAnalysis);
        
        console.log('🎯 Situación táctica analizada:', tacticalAnalysis.summary);
        
        return {
            analysis: tacticalAnalysis,
            recommendations: aiRecommendations,
            interventions: interventionOpportunities
        };
    }

    /**
     * AJUSTE DINÁMICO DIFICULTAD
     */
    adjustDifficulty() {
        const playerProfile = this.getPlayerProfile();
        const currentChallenge = this.calculateCurrentChallengeLevel();
        
        // Determinar ajuste necesario
        const adjustment = this.difficultyController.calculateAdjustment(
            currentChallenge,
            playerProfile.targetChallenge || 0.7
        );
        
        if (Math.abs(adjustment) > 0.05) { // Threshold para cambios
            this.applyDifficultyAdjustment(adjustment);
            
            console.log(`⚖️ Dificultad ajustada: ${adjustment > 0 ? '+' : ''}${(adjustment * 100).toFixed(1)}%`);
        }
    }

    /**
     * APLICAR AJUSTE DIFICULTAD
     */
    applyDifficultyAdjustment(adjustment) {
        this.currentDifficulty += adjustment;
        this.currentDifficulty = Math.max(0.1, Math.min(0.9, this.currentDifficulty));
        
        // Aplicar cambios al juego
        if (this.gameEngine) {
            // Ajustar IA enemiga
            this.adjustEnemyAI(this.currentDifficulty);
            
            // Modificar recursos disponibles
            this.adjustResourceAvailability(this.currentDifficulty);
            
            // Cambiar frecuencia eventos
            this.adjustEventFrequency(this.currentDifficulty);
        }
    }

    /**
     * GENERAR EVENTOS DINÁMICOS
     */
    generateDynamicEvents() {
        const gameState = this.gameEngine?.gameState.get('current');
        if (!gameState) return;
        
        // Analizar contexto actual
        const context = this.analyzeCurrentContext(gameState);
        
        // Generar eventos candidatos
        const candidateEvents = this.generateCandidateEvents(context);
        
        // Filtrar y priorizar eventos
        const selectedEvents = this.selectAppropriateEvents(candidateEvents, context);
        
        // Programar eventos
        selectedEvents.forEach(event => {
            this.scheduleEvent(event);
        });
        
        if (selectedEvents.length > 0) {
            console.log(`🎲 ${selectedEvents.length} eventos dinámicos generados`);
        }
    }

    /**
     * PROGRAMAR EVENTO
     */
    scheduleEvent(event) {
        const executeTime = Date.now() + event.delay;
        
        setTimeout(() => {
            this.executeEvent(event);
        }, event.delay);
        
        this.activeEvents.set(event.id, {
            ...event,
            scheduled: Date.now(),
            executeTime: executeTime,
            status: 'scheduled'
        });
    }

    /**
     * EJECUTAR EVENTO
     */
    executeEvent(event) {
        console.log(`🎯 Ejecutando evento: ${event.name}`);
        
        // Aplicar efectos del evento
        this.applyEventEffects(event);
        
        // Notificar al juego
        if (this.gameEngine) {
            this.gameEngine.emit('ai:event', {
                event: event,
                timestamp: Date.now()
            });
        }
        
        // Actualizar estado evento
        const activeEvent = this.activeEvents.get(event.id);
        if (activeEvent) {
            activeEvent.status = 'executed';
            activeEvent.executedAt = Date.now();
        }
    }

    /**
     * GENERAR FEEDBACK INTELIGENTE
     */
    generateIntelligentFeedback(action) {
        const tacticalAnalysis = this.analyzeTacticalSituation();
        const playerProfile = this.getPlayerProfile();
        
        // Evaluar acción contra doctrina
        const doctrineAssessment = this.assessAgainstDoctrine(action);
        
        // Generar feedback contextual
        const feedback = {
            assessment: doctrineAssessment.rating,
            strengths: doctrineAssessment.strengths,
            improvements: doctrineAssessment.improvements,
            alternatives: this.suggestAlternatives(action, tacticalAnalysis),
            doctrineReference: doctrineAssessment.reference,
            timing: this.assessTiming(action),
            resourceUsage: this.assessResourceUsage(action)
        };
        
        return feedback;
    }

    /**
     * CALCULAR MÉTRICAS PERFORMANCE
     */
    calculateDecisionSpeed() {
        if (this.decisionHistory.length < 2) return 0.5;
        
        const recentDecisions = this.decisionHistory.slice(-10);
        const avgTime = recentDecisions.reduce((sum, decision) => {
            return sum + (decision.executedAt - decision.presentedAt);
        }, 0) / recentDecisions.length;
        
        // Normalizar a escala 0-1 (30 segundos = 0.5)
        return Math.max(0, Math.min(1, 1 - (avgTime - 30000) / 60000));
    }

    calculateTacticalAccuracy() {
        // Implementar lógica análisis precisión táctica
        return 0.7; // Placeholder
    }

    calculateResourceManagement() {
        // Implementar análisis gestión recursos
        return 0.6; // Placeholder
    }

    calculateAdaptability() {
        // Implementar análisis capacidad adaptación
        return 0.8; // Placeholder
    }

    calculateCoordination() {
        // Implementar análisis coordinación unidades
        return 0.7; // Placeholder
    }

    calculateDoctrineAdherence() {
        // Implementar análisis adherencia doctrina
        return 0.75; // Placeholder
    }

    /**
     * UTILIDADES
     */
    getPlayerProfile() {
        return {
            averagePerformance: 0.7,
            weaknesses: ['resource_management'],
            strengths: ['tactical_accuracy'],
            tacticalPreferences: ['aggressive'],
            targetChallenge: 0.7
        };
    }

    calculateCurrentChallengeLevel() {
        // Calcular nivel desafío actual basado en métricas juego
        return 0.6; // Placeholder
    }

    generatePlayerInsights(metrics) {
        return {
            summary: 'Performance estable',
            recommendations: ['Mejorar gestión recursos'],
            strengths: ['Buena precisión táctica']
        };
    }

    counterPlayerTactics(preferences) {
        const counterTactics = {
            'aggressive': 'defensive_depth',
            'defensive': 'mobile_offense',
            'cautious': 'time_pressure'
        };
        
        return preferences.map(pref => counterTactics[pref] || 'adaptive');
    }

    // Métodos análisis contextual (implementación completa en versiones futuras)
    analyzeCurrentContext(gameState) { return {}; }
    generateCandidateEvents(context) { return []; }
    selectAppropriateEvents(candidates, context) { return []; }
    applyEventEffects(event) { }
    assessAgainstDoctrine(action) { return { rating: 0.7, strengths: [], improvements: [], reference: '' }; }
    suggestAlternatives(action, analysis) { return []; }
    assessTiming(action) { return 'appropriate'; }
    assessResourceUsage(action) { return 'efficient'; }
    calculateForceRatio(gameState) { return 1.2; }
    assessTerrainAdvantage(gameState) { return 'neutral'; }
    assessLogisticalState(gameState) { return 'adequate'; }
    calculateMomentum(gameState) { return 'stable'; }
    assessThreats(gameState) { return []; }
    generateAIRecommendations(analysis) { return []; }
    detectInterventionOpportunities(analysis) { return []; }
    adjustEnemyAI(difficulty) { }
    adjustResourceAvailability(difficulty) { }
    adjustEventFrequency(difficulty) { }

    /**
     * API PÚBLICA
     */
    onTurnStart(turnData) {
        console.log(`🤖 AI Director procesando turno ${turnData.turn}`);
        this.analyzePlayerPerformance();
        this.generateDynamicEvents();
    }

    update(deltaTime) {
        // Update continuo del AI Director
        this.updateActiveEvents(deltaTime);
    }

    updateActiveEvents(deltaTime) {
        // Actualizar eventos activos
        for (const [id, event] of this.activeEvents) {
            if (event.status === 'executing') {
                event.remainingTime -= deltaTime;
                if (event.remainingTime <= 0) {
                    this.completeEvent(event);
                }
            }
        }
    }

    completeEvent(event) {
        event.status = 'completed';
        event.completedAt = Date.now();
        
        console.log(`✅ Evento completado: ${event.name}`);
    }

    // Event system
    on(event, handler) {
        if (!this.listeners) {
            this.listeners = new Map();
        }
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(handler);
    }

    emit(event, data) {
        if (!this.listeners) return;
        const handlers = this.listeners.get(event) || [];
        handlers.forEach(handler => handler(data));
    }
}

/**
 * CLASES AUXILIARES
 */

class PlayerPerformanceModel {
    constructor(options = {}) {
        this.metrics = options.metrics || [];
        this.learningRate = options.learningRate || 0.1;
        this.adaptationThreshold = options.adaptationThreshold || 0.2;
        this.history = new Map();
        this.currentProfile = new Map();
    }

    updateMetrics(newMetrics) {
        const timestamp = Date.now();
        
        // Actualizar historial
        this.history.set(timestamp, newMetrics);
        
        // Actualizar perfil actual usando suavizado exponencial
        for (const [metric, value] of Object.entries(newMetrics)) {
            const currentValue = this.currentProfile.get(metric) || 0.5;
            const smoothedValue = currentValue * (1 - this.learningRate) + value * this.learningRate;
            this.currentProfile.set(metric, smoothedValue);
        }
        
        // Mantener solo últimas 100 entradas
        if (this.history.size > 100) {
            const oldestKey = Array.from(this.history.keys())[0];
            this.history.delete(oldestKey);
        }
    }

    getProfile() {
        return Object.fromEntries(this.currentProfile);
    }

    getTrend(metric, periods = 10) {
        const recentEntries = Array.from(this.history.entries()).slice(-periods);
        if (recentEntries.length < 2) return 'stable';
        
        const values = recentEntries.map(([_, metrics]) => metrics[metric] || 0);
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
        
        const difference = secondAvg - firstAvg;
        
        if (difference > this.adaptationThreshold) return 'improving';
        if (difference < -this.adaptationThreshold) return 'declining';
        return 'stable';
    }
}

class ScenarioLibrary {
    constructor(options = {}) {
        this.scenarios = options.scenarios || [];
        this.tags = new Map();
        this.indexScenarios();
    }

    indexScenarios() {
        this.scenarios.forEach(scenario => {
            // Indexar por tipo
            if (!this.tags.has('type')) {
                this.tags.set('type', new Map());
            }
            const typeMap = this.tags.get('type');
            if (!typeMap.has(scenario.type)) {
                typeMap.set(scenario.type, []);
            }
            typeMap.get(scenario.type).push(scenario);
            
            // Indexar por dificultad
            if (!this.tags.has('difficulty')) {
                this.tags.set('difficulty', new Map());
            }
            const difficultyMap = this.tags.get('difficulty');
            const difficultyBucket = Math.floor(scenario.difficulty * 10) / 10;
            if (!difficultyMap.has(difficultyBucket)) {
                difficultyMap.set(difficultyBucket, []);
            }
            difficultyMap.get(difficultyBucket).push(scenario);
        });
    }

    getAvailableScenarios() {
        return [...this.scenarios];
    }

    getByType(type) {
        return this.tags.get('type')?.get(type) || [];
    }

    getByDifficulty(difficulty, tolerance = 0.1) {
        const scenarios = [];
        const difficultyMap = this.tags.get('difficulty');
        
        if (difficultyMap) {
            for (const [bucket, bucketScenarios] of difficultyMap) {
                if (Math.abs(bucket - difficulty) <= tolerance) {
                    scenarios.push(...bucketScenarios);
                }
            }
        }
        
        return scenarios;
    }

    addScenario(scenario) {
        this.scenarios.push(scenario);
        this.indexScenarios(); // Re-indexar
    }
}

class DifficultyController {
    constructor(options = {}) {
        this.targetChallengeLevel = options.targetChallengeLevel || 0.7;
        this.adjustmentRate = options.adjustmentRate || 0.05;
        this.minDifficulty = options.minDifficulty || 0.2;
        this.maxDifficulty = options.maxDifficulty || 0.9;
        this.history = [];
    }

    calculateAdjustment(currentChallenge, targetChallenge = null) {
        const target = targetChallenge || this.targetChallengeLevel;
        const difference = currentChallenge - target;
        
        // Usar PID controller simple
        const proportional = difference;
        const adjustment = -proportional * this.adjustmentRate;
        
        // Registrar en historial
        this.history.push({
            timestamp: Date.now(),
            currentChallenge,
            targetChallenge: target,
            adjustment
        });
        
        return adjustment;
    }

    setTarget(newTarget) {
        this.targetChallengeLevel = Math.max(0.1, Math.min(0.9, newTarget));
    }

    getHistory() {
        return [...this.history];
    }
}

class EventScheduler {
    constructor() {
        this.scheduledEvents = new Map();
        this.eventQueue = [];
        this.nextEventId = 1;
    }

    scheduleEvent(event, delay = 0) {
        const eventId = this.nextEventId++;
        const scheduledEvent = {
            ...event,
            id: eventId,
            scheduledAt: Date.now(),
            executeAt: Date.now() + delay,
            status: 'scheduled'
        };
        
        this.scheduledEvents.set(eventId, scheduledEvent);
        this.eventQueue.push(scheduledEvent);
        this.eventQueue.sort((a, b) => a.executeAt - b.executeAt);
        
        return eventId;
    }

    getNextEvents(count = 5) {
        return this.eventQueue.slice(0, count);
    }

    cancelEvent(eventId) {
        const event = this.scheduledEvents.get(eventId);
        if (event) {
            event.status = 'cancelled';
            this.eventQueue = this.eventQueue.filter(e => e.id !== eventId);
            return true;
        }
        return false;
    }

    update() {
        const now = Date.now();
        const readyEvents = this.eventQueue.filter(event => event.executeAt <= now);
        
        readyEvents.forEach(event => {
            if (event.status === 'scheduled') {
                event.status = 'ready';
            }
        });
        
        return readyEvents;
    }
}

class TacticalAnalyzer {
    constructor(options = {}) {
        this.doctrines = options.doctrines || {};
        this.analysisDepth = options.analysisDepth || 'basic';
        this.realTimeAnalysis = options.realTimeAnalysis || false;
    }

    analyzeDecision(decision, context) {
        const analysis = {
            doctrineCompliance: this.assessDoctrineCompliance(decision),
            tacticalSoundness: this.assessTacticalSoundness(decision, context),
            resourceEfficiency: this.assessResourceEfficiency(decision),
            riskAssessment: this.assessRisk(decision, context),
            alternatives: this.generateAlternatives(decision, context)
        };
        
        return analysis;
    }

    assessDoctrineCompliance(decision) {
        // Analizar cumplimiento doctrina militar
        return {
            score: 0.8,
            principles: ['Objective', 'Mass', 'Security'],
            violations: [],
            recommendations: []
        };
    }

    assessTacticalSoundness(decision, context) {
        // Evaluar solidez táctica
        return {
            score: 0.7,
            strengths: ['Good timing'],
            weaknesses: ['Limited reconnaissance'],
            considerations: ['Weather conditions']
        };
    }

    assessResourceEfficiency(decision) {
        // Evaluar eficiencia recursos
        return {
            score: 0.6,
            analysis: 'Moderate resource usage',
            optimization: ['Consider logistics']
        };
    }

    assessRisk(decision, context) {
        // Evaluar riesgo
        return {
            level: 'medium',
            factors: ['Enemy capabilities', 'Terrain'],
            mitigation: ['Increase security']
        };
    }

    generateAlternatives(decision, context) {
        // Generar alternativas tácticas
        return [
            { name: 'Alternative A', description: 'Different approach' },
            { name: 'Alternative B', description: 'Another option' }
        ];
    }
}

// Exportar AI Director
window.AIDirector = AIDirector;

console.log('🤖 AI Director MAIRA 4.0 - Módulo cargado');

export default AIDirector;
