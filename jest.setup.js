// jest.setup.js
const { JSDOM } = require('jsdom');

// Configurar JSDOM global
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.HTMLImageElement = dom.window.HTMLImageElement;

// Mock de Socket.IO
global.io = jest.fn(() => ({
  on: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(() => this),
  disconnect: jest.fn(),
  connected: true
}));

// Mock de Leaflet
global.L = {
  map: jest.fn(() => ({
    setView: jest.fn(),
    addLayer: jest.fn(),
    remove: jest.fn()
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn()
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn(),
    remove: jest.fn()
  })),
  polygon: jest.fn(() => ({
    addTo: jest.fn(),
    remove: jest.fn()
  }))
};

// Mock de EventEmitter
global.EventEmitter = class EventEmitter {
  constructor() {
    this.events = {};
  }
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }
  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(...args));
    }
  }
};

// Variables globales de MAIRA
global.userId = 'jugador_test';
global.equipoJugador = 'azul';
global.DEBUG_MODE = false;
global.SERVER_URL = 'http://localhost:5000';

// Mock de console para reducir ruido en tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
};

// Restaurar console original después de cada test
afterEach(() => {
  jest.clearAllMocks();
});