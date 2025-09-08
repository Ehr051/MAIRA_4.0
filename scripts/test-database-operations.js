#!/usr/bin/env node

/**
 * MAIRA 4.0 - Script de Verificación de Base de Datos
 * ===================================================
 * Prueba todas las operaciones críticas de la base de datos
 * para asegurar que los tipos boolean funcionen correctamente
 */

const API_BASE_URL = 'https://maira-4-0.onrender.com';

async function testAPI(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();
        
        return {
            success: response.ok,
            status: response.status,
            data
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

async function runTests() {
    console.log('🧪 INICIANDO TESTS DE BASE DE DATOS MAIRA 4.0');
    console.log('=' .repeat(50));

    // Test 1: Health Check
    console.log('\n1️⃣ Test: Health Check');
    const health = await testAPI('/health');
    console.log('   Resultado:', health.success ? '✅' : '❌', health.data);

    if (!health.success) {
        console.log('❌ Error: Servidor no disponible. Abortando tests.');
        return;
    }

    // Test 2: Crear Usuario
    console.log('\n2️⃣ Test: Crear Usuario');
    const testUser = {
        username: `test_db_${Date.now()}`,
        password: 'test123',
        email: `test_${Date.now()}@maira.test`,
        unidad: 'Test Unit DB'
    };
    
    const createUser = await testAPI('/api/crear-usuario', 'POST', testUser);
    console.log('   Resultado:', createUser.success ? '✅' : '❌', createUser.data);
    
    if (!createUser.success) {
        console.log('❌ Error creando usuario. Verifica campos boolean.');
        return;
    }

    // Test 3: Login
    console.log('\n3️⃣ Test: Login Usuario');
    const login = await testAPI('/api/login', 'POST', {
        username: testUser.username,
        password: testUser.password
    });
    console.log('   Resultado:', login.success ? '✅' : '❌', login.data);
    
    if (!login.success) {
        console.log('❌ Error en login. Verifica is_online boolean.');
        return;
    }

    const userId = login.data.user_id;
    console.log(`   User ID obtenido: ${userId}`);

    // Test 4: Crear Partida
    console.log('\n4️⃣ Test: Crear Partida');
    const createGame = await testAPI('/api/crear-partida', 'POST', {
        user_id: userId,
        configuracion: { test: true }
    });
    console.log('   Resultado:', createGame.success ? '✅' : '❌', createGame.data);

    if (createGame.success) {
        const gameCode = createGame.data.codigo;
        console.log(`   Código de partida: ${gameCode}`);

        // Test 5: Unirse a Partida
        console.log('\n5️⃣ Test: Unirse a Partida');
        const joinGame = await testAPI('/api/unirse-partida', 'POST', {
            codigo_partida: gameCode,
            user_id: userId
        });
        console.log('   Resultado:', joinGame.success ? '✅' : '❌', joinGame.data);
        
        if (!joinGame.success) {
            console.log('⚠️ Error uniéndose a partida. Verifica campos listo/esCreador boolean.');
        }
    }

    // Test 6: Listado de Partidas
    console.log('\n6️⃣ Test: Listar Partidas');
    const listGames = await testAPI('/api/partidas');
    console.log('   Resultado:', listGames.success ? '✅' : '❌');
    
    if (listGames.success && listGames.data.partidas) {
        console.log(`   Partidas encontradas: ${listGames.data.partidas.length}`);
    }

    console.log('\n🎉 TESTS COMPLETADOS');
    console.log('=' .repeat(50));
    console.log('✅ Si todos los tests pasaron, la base de datos está funcionando correctamente.');
    console.log('❌ Si algún test falló, hay problemas con tipos de datos boolean.');
}

// Ejecutar tests
runTests().catch(console.error);
