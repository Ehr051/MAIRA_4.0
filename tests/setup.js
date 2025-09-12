/**
 * Setup global para tests de MAIRA 4.0
 * Configura mocks y utilidades comunes
 */

// Mock global de Socket.IO
global.io = jest.fn(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    connected: true,
    id: 'test-socket-id'
}));

// Mock global de MAIRA
global.MAIRA = {
    UserIdentity: {
        obtenerUsuario: jest.fn(() => ({
            id: 'test-user-123',
            nombre: 'TestUser',
            nivel: 1,
            activo: true
        })),
        actualizarDatos: jest.fn(),
        estaAutenticado: jest.fn(() => true),
        guardarUsuario: jest.fn(),
        eliminarUsuario: jest.fn()
    },
    Config: {
        SERVIDOR_URL: 'http://localhost:5000',
        SOCKET_TIMEOUT: 5000,
        MAX_RECONNECT_ATTEMPTS: 3
    }
};

// Mock de localStorage
const localStorageMock = {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock de document.getElementById
const mockElement = {
    textContent: '',
    innerHTML: '',
    style: {},
    classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(() => false)
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

document.getElementById = jest.fn(() => mockElement);

// Mock de console para tests limpios
global.console = {
    ...console,
    // Mantener error y warn para debugging
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn()
};

// Utilidades de testing
global.TestUtils = {
    // Crear datos de test para partida
    createTestPartidaData: () => ({
        codigo: 'TEST_PARTIDA_123',
        nombre: 'Partida de Test',
        estado: 'esperando',
        jugadores: ['test-user-123'],
        maxJugadores: 4,
        configuracion: {
            mapa: 'test_map',
            duracion: 3600,
            tipo: 'combate'
        }
    }),
    
    // Crear datos de test para usuario
    createTestUserData: () => ({
        id: 'test-user-123',
        nombre: 'TestUser',
        email: 'test@example.com',
        nivel: 1,
        experiencia: 0,
        partidas_jugadas: 0,
        victorias: 0,
        activo: true
    }),
    
    // Crear datos de test para elemento de juego
    createTestElementData: () => ({
        id: 'test-element-123',
        tipo: 'unidad',
        posicion: { lat: 10.5, lng: 20.3 },
        propietario: 'test-user-123',
        salud: 100,
        estado: 'activo'
    }),
    
    // Simular evento Socket.IO
    simulateSocketEvent: (eventName, data, callback) => {
        const mockSocket = global.MAIRA.socket || global.io();
        mockSocket.emit(eventName, data);
        if (callback) callback({ success: true, data });
    },
    
    // Esperar async operations
    waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    
    // Verificar estructura de datos
    validateDataStructure: (data, requiredFields) => {
        return requiredFields.every(field => data.hasOwnProperty(field));
    }
};

// Configuración de timeouts para tests
jest.setTimeout(10000); // 10 segundos para tests que incluyen operaciones async

// Setup antes de cada test
beforeEach(() => {
    // Limpiar todos los mocks
    jest.clearAllMocks();
    
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset MAIRA UserIdentity
    global.MAIRA.UserIdentity.obtenerUsuario.mockReturnValue({
        id: 'test-user-123',
        nombre: 'TestUser',
        nivel: 1,
        activo: true
    });
    
    global.MAIRA.UserIdentity.estaAutenticado.mockReturnValue(true);
});

// Cleanup después de cada test
afterEach(() => {
    // Limpiar timers si existen
    jest.clearAllTimers();
});

console.log('🧪 Setup de testing MAIRA 4.0 cargado exitosamente');
