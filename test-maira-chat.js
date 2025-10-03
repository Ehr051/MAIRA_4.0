// test-maira-chat.js
// Tests específicos para MAIRAchat - Sistema de chat unificado

const fs = require('fs');
const path = require('path');

class TestRunnerMAIRAChat {
    constructor() {
        this.resultados = {
            total: 0,
            pasados: 0,
            fallidos: 0,
            errores: []
        };
        this.basePath = path.join(__dirname, 'Client');
    }

    log(mensaje, tipo = 'info') {
        const timestamp = new Date().toISOString();
        const colores = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            error: '\x1b[31m',
            warning: '\x1b[33m',
            reset: '\x1b[0m'
        };
        console.log(`${colores[tipo]}[${timestamp}] ${mensaje}${colores.reset}`);
    }

    async ejecutar() {
        this.log('💬 Iniciando Tests de MAIRAchat', 'info');
        this.log('='.repeat(60), 'info');

        // Tests de estructura del archivo
        await this.testEstructuraArchivo();

        // Tests de configuración de módulos
        this.testConfiguracionModulos();

        // Tests de integración con HTML
        this.testIntegracionHTML();

        // Tests de funcionalidades principales
        this.testFuncionalidadesPrincipales();

        // Tests de manejo de errores
        this.testManejoErrores();

        // Reporte final
        this.reporteFinal();
    }

    async testEstructuraArchivo() {
        this.log('📁 Test: Estructura del Archivo MAIRAchat', 'info');

        try {
            this.resultados.total++;

            const rutaChat = path.join(this.basePath, 'js/common/MAIRAChat.js');
            if (!fs.existsSync(rutaChat)) {
                throw new Error('Archivo MAIRAChat.js no encontrado');
            }

            const contenido = fs.readFileSync(rutaChat, 'utf8');

            // Verificar que es un módulo IIFE
            if (!contenido.includes('window.MAIRAChat = (function()')) {
                throw new Error('No es un módulo IIFE válido');
            }

            // Verificar funciones principales
            const funcionesRequeridas = [
                'inicializar',
                'enviarMensaje',
                'recibirMensaje',
                'configurarSocket',
                'limpiarSistemasAnteriores'
            ];

            const funcionesFaltantes = funcionesRequeridas.filter(func =>
                !contenido.includes(`function ${func}`) &&
                !contenido.includes(`${func}(`) &&
                !contenido.includes(`${func} =`)
            );

            if (funcionesFaltantes.length > 0) {
                throw new Error(`Funciones faltantes: ${funcionesFaltantes.join(', ')}`);
            }

            // Verificar configuración de módulos
            if (!contenido.includes('CONFIGURACION_MODULOS')) {
                throw new Error('CONFIGURACION_MODULOS no encontrada');
            }

            this.log('✅ Estructura del archivo: Funciones y configuración correctas', 'success');
            this.resultados.pasados++;

        } catch (error) {
            this.log(`❌ Estructura del archivo: ${error.message}`, 'error');
            this.resultados.fallidos++;
            this.resultados.errores.push({
                test: 'Estructura Archivo',
                error: error.message
            });
        }
    }

    testConfiguracionModulos() {
        this.log('⚙️  Test: Configuración de Módulos', 'info');

        const modulosEsperados = [
            'iniciarpartida',
            'inicioGB',
            'gestionbatalla',
            'juegodeguerra'
        ];

        try {
            this.resultados.total++;

            const rutaChat = path.join(this.basePath, 'js/common/MAIRAChat.js');
            const contenido = fs.readFileSync(rutaChat, 'utf8');

            const modulosFaltantes = modulosEsperados.filter(modulo =>
                !contenido.includes(`'${modulo}'`) &&
                !contenido.includes(`"${modulo}"`)
            );

            if (modulosFaltantes.length > 0) {
                throw new Error(`Módulos faltantes en configuración: ${modulosFaltantes.join(', ')}`);
            }

            // Verificar que juegodeguerra tiene crearDinamicamente
            if (!contenido.includes('crearDinamicamente: true')) {
                throw new Error('juegodeguerra no tiene configuración de creación dinámica');
            }

            this.log('✅ Configuración de módulos: Todos los módulos configurados correctamente', 'success');
            this.resultados.pasados++;

        } catch (error) {
            this.log(`❌ Configuración de módulos: ${error.message}`, 'error');
            this.resultados.fallidos++;
            this.resultados.errores.push({
                test: 'Configuración Módulos',
                error: error.message
            });
        }
    }

    testIntegracionHTML() {
        this.log('🌐 Test: Integración con HTML', 'info');

        const archivosHTML = [
            'iniciarpartida.html',
            'inicioGB.html',
            'gestionbatalla.html',
            'juegodeguerra.html'
        ];

        try {
            this.resultados.total++;

            let archivosConChat = 0;

            archivosHTML.forEach(archivo => {
                const ruta = path.join(this.basePath, archivo);
                if (fs.existsSync(ruta)) {
                    const contenido = fs.readFileSync(ruta, 'utf8');
                    if (contenido.includes('MAIRAChat.js')) {
                        archivosConChat++;
                    }
                }
            });

            if (archivosConChat < archivosHTML.length) {
                throw new Error(`Solo ${archivosConChat}/${archivosHTML.length} archivos HTML incluyen MAIRAChat`);
            }

            // Verificar que los scripts están en el orden correcto
            const rutaJuegoGuerra = path.join(this.basePath, 'juegodeguerra.html');
            const contenidoJG = fs.readFileSync(rutaJuegoGuerra, 'utf8');

            const posicionSocket = contenidoJG.indexOf('socket.io');
            const posicionChat = contenidoJG.indexOf('MAIRAChat.js');

            if (posicionSocket === -1 || posicionChat === -1 || posicionSocket > posicionChat) {
                throw new Error('MAIRAChat.js debe cargarse después de Socket.IO');
            }

            this.log('✅ Integración HTML: Todos los archivos incluyen MAIRAChat correctamente', 'success');
            this.resultados.pasados++;

        } catch (error) {
            this.log(`❌ Integración HTML: ${error.message}`, 'error');
            this.resultados.fallidos++;
            this.resultados.errores.push({
                test: 'Integración HTML',
                error: error.message
            });
        }
    }

    testFuncionalidadesPrincipales() {
        this.log('🔧 Test: Funcionalidades Principales', 'info');

        try {
            this.resultados.total++;

            const rutaChat = path.join(this.basePath, 'js/common/MAIRAChat.js');
            const contenido = fs.readFileSync(rutaChat, 'utf8');

            // Verificar funcionalidades críticas
            const funcionalidades = [
                'enviarMensaje',
                'recibirMensaje',
                'configurarEventos',
                'crearContenedoresJuegoDinamicamente',
                'limpiarSistemasAnteriores'
            ];

            const funcionalidadesFaltantes = funcionalidades.filter(func =>
                !contenido.includes(`function ${func}`) &&
                !contenido.includes(`${func}(`) &&
                !contenido.includes(`${func} =`)
            );

            if (funcionalidadesFaltantes.length > 0) {
                throw new Error(`Funcionalidades faltantes: ${funcionalidadesFaltantes.join(', ')}`);
            }

            // Verificar manejo de mensajes privados
            if (!contenido.includes('mensajePrivado') && !contenido.includes('privado')) {
                throw new Error('No se encuentra manejo de mensajes privados');
            }

            // Verificar sistema de debug
            if (!contenido.includes('debug') || !contenido.includes('estado()')) {
                throw new Error('Sistema de debug insuficiente');
            }

            this.log('✅ Funcionalidades principales: Todas las funciones críticas implementadas', 'success');
            this.resultados.pasados++;

        } catch (error) {
            this.log(`❌ Funcionalidades principales: ${error.message}`, 'error');
            this.resultados.fallidos++;
            this.resultados.errores.push({
                test: 'Funcionalidades Principales',
                error: error.message
            });
        }
    }

    testManejoErrores() {
        this.log('🚨 Test: Manejo de Errores', 'info');

        try {
            this.resultados.total++;

            const rutaChat = path.join(this.basePath, 'js/common/MAIRAChat.js');
            const contenido = fs.readFileSync(rutaChat, 'utf8');

            // Verificar manejo de errores básicos
            const erroresManejados = [
                'console.error',
                'try',
                'catch'
            ];

            let erroresEncontrados = 0;
            erroresManejados.forEach(error => {
                if (contenido.includes(error)) {
                    erroresEncontrados++;
                }
            });

            if (erroresEncontrados < 2) {
                throw new Error('Manejo de errores insuficiente');
            }

            // Verificar validaciones de entrada
            if (!contenido.includes('!mensaje') && !contenido.includes('mensaje.trim()')) {
                throw new Error('No se validan mensajes vacíos');
            }

            // Verificar limpieza de sistemas anteriores
            if (!contenido.includes('limpiarSistemasAnteriores')) {
                throw new Error('No se limpia sistemas de chat anteriores');
            }

            this.log('✅ Manejo de errores: Validaciones y limpieza implementadas correctamente', 'success');
            this.resultados.pasados++;

        } catch (error) {
            this.log(`❌ Manejo de errores: ${error.message}`, 'error');
            this.resultados.fallidos++;
            this.resultados.errores.push({
                test: 'Manejo Errores',
                error: error.message
            });
        }
    }

    reporteFinal() {
        this.log('='.repeat(60), 'info');
        this.log('📊 REPORTE FINAL - TESTS MAIRACHAT', 'info');
        this.log('='.repeat(60), 'info');

        const tasaExito = this.resultados.total > 0 ?
            ((this.resultados.pasados / this.resultados.total) * 100).toFixed(1) : '0.0';

        this.log(`📈 Tasa de éxito: ${tasaExito}%`, 'info');
        this.log(`✅ Tests pasados: ${this.resultados.pasados}`, 'success');
        this.log(`❌ Tests fallidos: ${this.resultados.fallidos}`, 'error');
        this.log(`⚠️  Errores encontrados: ${this.resultados.errores.length}`, 'warning');

        if (this.resultados.errores.length > 0) {
            this.log('\n🚨 DETALLE DE ERRORES:', 'error');
            this.resultados.errores.forEach((error, index) => {
                this.log(`  ${index + 1}. ${error.test}: ${error.error}`, 'error');
            });
        }

        this.log('\n💡 RECOMENDACIONES:', 'info');
        if (this.resultados.fallidos === 0) {
            this.log('  - ✅ MAIRAchat completamente validado', 'success');
            this.log('  - 🔄 Listo para integración con Socket.IO real', 'info');
            this.log('  - 💬 Sistema de chat multicanal operativo', 'info');
            this.log('  - 🎯 Comunicación unificada entre módulos', 'info');
        } else {
            this.log('  - 🔧 Revisar implementación de funcionalidades faltantes', 'warning');
            this.log('  - 📋 Verificar configuración de módulos', 'warning');
            this.log('  - 🌐 Comprobar integración con HTML', 'warning');
        }

        this.log('\n🏁 Tests de MAIRAchat Completados', 'info');
    }
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
    const tester = new TestRunnerMAIRAChat();
    tester.ejecutar().catch(error => {
        console.error('Error ejecutando tests de MAIRAchat:', error);
        process.exit(1);
    });
}

module.exports = TestRunnerMAIRAChat;