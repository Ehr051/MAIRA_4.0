/**
 * 🔍 MAIRA TILES DIAGNOSTIC CHECKER
 * Diagnostica problemas de carga de tiles de altimetría y vegetación
 */

window.MAIRATilesChecker = {
    
    async checkAllTileSources() {
        console.log('🔍 === MAIRA TILES DIAGNOSTIC CHECKER ===');
        
        const results = {
            localAltimetria: await this.checkLocalAltimetria(),
            localVegetacion: await this.checkLocalVegetacion(),
            githubReleases: await this.checkGitHubReleases(),
            masterIndices: await this.checkMasterIndices(),
            networkAccess: await this.checkNetworkAccess()
        };
        
        this.generateTilesReport(results);
        return results;
    },
    
    async checkLocalAltimetria() {
        console.log('\n📋 TEST: Local Altimetria Files');
        const paths = [
            'Client/Libs/datos_argentina/Altimetria_Mini_Tiles/',
            'Client/Libs/datos_argentina/Altimetria_Mini_Tiles/master_mini_tiles_index.json',
            'Client/Libs/datos_argentina/Altimetria_Mini_Tiles/centro/',
            'Client/Libs/datos_argentina/Altimetria_Mini_Tiles/norte/'
        ];
        
        const results = {};
        for (const path of paths) {
            try {
                const response = await fetch(path);
                results[path] = {
                    status: response.status,
                    accessible: response.ok,
                    contentType: response.headers.get('content-type'),
                    size: response.headers.get('content-length')
                };
                
                if (path.endsWith('.json') && response.ok) {
                    const content = await response.text();
                    results[path].contentPreview = content.substring(0, 200);
                }
            } catch (error) {
                results[path] = { error: error.message, accessible: false };
            }
        }
        
        return results;
    },
    
    async checkLocalVegetacion() {
        console.log('\n📋 TEST: Local Vegetacion Files');
        const paths = [
            'Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/',
            'Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/vegetation_master_index.json',
            'Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/vegetation_ndvi_batch_01/',
            'Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/vegetation_ndvi_batch_02/'
        ];
        
        const results = {};
        for (const path of paths) {
            try {
                const response = await fetch(path);
                results[path] = {
                    status: response.status,
                    accessible: response.ok,
                    contentType: response.headers.get('content-type'),
                    size: response.headers.get('content-length')
                };
                
                if (path.endsWith('.json') && response.ok) {
                    const content = await response.text();
                    results[path].contentPreview = content.substring(0, 200);
                }
            } catch (error) {
                results[path] = { error: error.message, accessible: false };
            }
        }
        
        return results;
    },
    
    async checkGitHubReleases() {
        console.log('\n📋 TEST: GitHub Releases Access');
        const releases = [
            'https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/master_mini_tiles_index.json',
            'https://github.com/Ehr051/MAIRA-4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz',
            'https://api.github.com/repos/Ehr051/MAIRA/releases',
            'https://api.github.com/repos/Ehr051/MAIRA-4.0/releases'
        ];
        
        const results = {};
        for (const url of releases) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
                
                const response = await fetch(url, { 
                    signal: controller.signal,
                    mode: 'cors'
                });
                clearTimeout(timeoutId);
                
                results[url] = {
                    status: response.status,
                    accessible: response.ok,
                    contentType: response.headers.get('content-type'),
                    size: response.headers.get('content-length')
                };
                
                if (url.includes('/releases') && response.ok) {
                    const releases = await response.json();
                    results[url].releasesFound = releases.length;
                    results[url].latestRelease = releases[0]?.tag_name;
                }
            } catch (error) {
                results[url] = { 
                    error: error.message, 
                    accessible: false,
                    isTimeout: error.name === 'AbortError'
                };
            }
        }
        
        return results;
    },
    
    async checkMasterIndices() {
        console.log('\n📋 TEST: Master Index Files');
        const indices = [
            'external_storage/indices/index_tiles_altimetria.json',
            'external_storage/indices/vegetacion_tile_index.json',
            'external_storage/tiles_config.json'
        ];
        
        const results = {};
        for (const path of indices) {
            try {
                const response = await fetch(path);
                results[path] = {
                    status: response.status,
                    accessible: response.ok,
                    contentType: response.headers.get('content-type'),
                    size: response.headers.get('content-length')
                };
                
                if (response.ok) {
                    const content = await response.text();
                    results[path].contentPreview = content.substring(0, 300);
                    
                    try {
                        const json = JSON.parse(content);
                        results[path].isValidJSON = true;
                        results[path].keysFound = Object.keys(json);
                        
                        if (json.tiles) {
                            results[path].tilesCount = Object.keys(json.tiles).length;
                        }
                    } catch (e) {
                        results[path].isValidJSON = false;
                        results[path].parseError = e.message;
                    }
                }
            } catch (error) {
                results[path] = { error: error.message, accessible: false };
            }
        }
        
        return results;
    },
    
    async checkNetworkAccess() {
        console.log('\n📋 TEST: Network & CORS Access');
        const testUrls = [
            'https://raw.githubusercontent.com/Ehr051/MAIRA-4.0/main/README.md',
            'https://cdn.jsdelivr.net/gh/Ehr051/MAIRA-4.0@main/package.json',
            'https://github.com/Ehr051/MAIRA-4.0/releases'
        ];
        
        const results = {};
        for (const url of testUrls) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const response = await fetch(url, { 
                    signal: controller.signal,
                    mode: 'cors'
                });
                clearTimeout(timeoutId);
                
                results[url] = {
                    status: response.status,
                    accessible: response.ok,
                    cors: true
                };
            } catch (error) {
                results[url] = { 
                    error: error.message, 
                    accessible: false,
                    cors: error.message.includes('CORS') || error.message.includes('cors')
                };
            }
        }
        
        return results;
    },
    
    generateTilesReport(results) {
        console.log('\n🎯 === RESUMEN DIAGNÓSTICO DE TILES ===');
        
        // Analizar problemas críticos
        const issues = [];
        
        // Verificar acceso local
        const localAltOk = Object.values(results.localAltimetria).some(r => r.accessible);
        const localVegOk = Object.values(results.localVegetacion).some(r => r.accessible);
        
        if (!localAltOk) issues.push('❌ CRÍTICO: Altimetría local no accesible');
        if (!localVegOk) issues.push('❌ CRÍTICO: Vegetación local no accesible');
        
        // Verificar GitHub Releases
        const githubOk = Object.values(results.githubReleases).some(r => r.accessible);
        if (!githubOk) issues.push('⚠️ WARNING: GitHub Releases no accesible');
        
        // Verificar master indices
        const indicesOk = Object.values(results.masterIndices).every(r => r.accessible);
        if (!indicesOk) issues.push('⚠️ WARNING: Master indices con problemas');
        
        // Verificar red
        const networkOk = Object.values(results.networkAccess).some(r => r.accessible);
        if (!networkOk) issues.push('❌ CRÍTICO: Problemas de conectividad');
        
        console.log(`📊 PROBLEMAS ENCONTRADOS: ${issues.length}`);
        if (issues.length === 0) {
            console.log('🎉 ¡TODOS LOS SOURCES DE TILES FUNCIONANDO!');
        } else {
            issues.forEach(issue => console.log(issue));
        }
        
        // Recomendaciones
        console.log('\n💡 RECOMENDACIONES:');
        if (!localAltOk || !localVegOk) {
            console.log('1. 🔧 Verificar que Flask esté sirviendo archivos estáticos correctamente');
            console.log('2. 📁 Verificar permisos de carpeta Client/Libs/datos_argentina/');
        }
        
        if (!githubOk) {
            console.log('3. 🌐 Problemas de CORS o conectividad con GitHub');
            console.log('4. 📦 Verificar que releases v3.0 y v4.0 existan');
        }
        
        console.log('\n📋 DETALLES COMPLETOS:', results);
    }
};

// Auto-ejecutar después de 5 segundos
setTimeout(() => {
    if (document.readyState === 'complete') {
        window.MAIRATilesChecker.checkAllTileSources();
    }
}, 5000);

console.log('🔍 MAIRA Tiles Checker cargado. Ejecutar: window.MAIRATilesChecker.checkAllTileSources()');
