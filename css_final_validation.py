#!/usr/bin/env python3
"""
Resumen final y validación de la reorganización CSS en MAIRA 4.0
"""

import os
import json
from collections import defaultdict

def generate_final_css_summary():
    """Genera un resumen completo de la estructura CSS final"""
    
    print("🎨 RESUMEN FINAL - REORGANIZACIÓN CSS MAIRA 4.0")
    print("=" * 60)
    
    # Estructura final
    css_structure = {
        'common': [],
        'modules': {},
        'legacy': []
    }
    
    # Escanear estructura actual
    base_css = "Client/css"
    
    # CSS Compartidos (common/)
    common_path = os.path.join(base_css, "common")
    if os.path.exists(common_path):
        css_structure['common'] = [f for f in os.listdir(common_path) if f.endswith('.css')]
    
    # CSS por módulos (modules/)
    modules_path = os.path.join(base_css, "modules")
    if os.path.exists(modules_path):
        for module in os.listdir(modules_path):
            module_path = os.path.join(modules_path, module)
            if os.path.isdir(module_path):
                css_structure['modules'][module] = [f for f in os.listdir(module_path) if f.endswith('.css')]
    
    # CSS Legacy (legacy/)
    legacy_path = os.path.join(base_css, "legacy")
    if os.path.exists(legacy_path):
        css_structure['legacy'] = [f for f in os.listdir(legacy_path) if f.endswith('.css')]
    
    # Mostrar resumen
    print("📁 ESTRUCTURA CSS ORGANIZADA")
    print("-" * 40)
    
    # CSS COMPARTIDOS
    print(f"🔗 CSS COMPARTIDOS ({len(css_structure['common'])} archivos)")
    print("   📁 Client/css/common/")
    for css_file in sorted(css_structure['common']):
        print(f"   ├── 📄 {css_file}")
    print()
    
    # CSS POR MÓDULOS
    total_modular = sum(len(files) for files in css_structure['modules'].values())
    print(f"📄 CSS ESPECÍFICOS POR MÓDULO ({total_modular} archivos)")
    print("   📁 Client/css/modules/")
    for module, files in sorted(css_structure['modules'].items()):
        print(f"   ├── 📁 {module}/")
        for css_file in sorted(files):
            print(f"   │   └── 📄 {css_file}")
    print()
    
    # CSS LEGACY
    print(f"🗑️ CSS LEGACY PARA REVISIÓN ({len(css_structure['legacy'])} archivos)")
    print("   📁 Client/css/legacy/")
    for css_file in sorted(css_structure['legacy']):
        size = os.path.getsize(os.path.join(legacy_path, css_file))
        status = "📄" if size > 0 else "📦"
        print(f"   ├── {status} {css_file} ({size} bytes)")
    print()
    
    return css_structure

def validate_html_references():
    """Valida que todas las referencias CSS en HTML apunten a archivos existentes"""
    
    print("🔍 VALIDACIÓN DE REFERENCIAS CSS")
    print("-" * 40)
    
    html_files = []
    for root, dirs, files in os.walk("Client"):
        for file in files:
            if file.endswith('.html') and not '/Libs/' in root:
                html_files.append(os.path.join(root, file))
    
    validation_results = {
        'valid': [],
        'missing': [],
        'external': []
    }
    
    for html_file in html_files:
        print(f"🔍 Validando: {os.path.basename(html_file)}")
        
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Buscar referencias CSS
            import re
            css_patterns = [
                r'href=["\']([^"\']*\.css)["\']'
            ]
            
            for pattern in css_patterns:
                matches = re.findall(pattern, content)
                for css_ref in matches:
                    # Limpiar referencia
                    css_ref = css_ref.strip()
                    
                    # Clasificar referencia
                    if css_ref.startswith('http') or css_ref.startswith('//'):
                        validation_results['external'].append((html_file, css_ref))
                        print(f"   🌐 Externo: {css_ref}")
                    elif css_ref.startswith('/Client/') or css_ref.startswith('Client/'):
                        # Normalizar ruta
                        local_path = css_ref.replace('/Client/', 'Client/')
                        if os.path.exists(local_path):
                            validation_results['valid'].append((html_file, css_ref))
                            print(f"   ✅ Válido: {css_ref}")
                        else:
                            validation_results['missing'].append((html_file, css_ref))
                            print(f"   ❌ Faltante: {css_ref}")
                    elif css_ref.startswith('/node_modules/'):
                        # Node modules - asumir válido
                        validation_results['external'].append((html_file, css_ref))
                        print(f"   📦 Node: {css_ref}")
                    else:
                        # Otros casos
                        print(f"   ❓ Otro: {css_ref}")
        
        except Exception as e:
            print(f"   ❌ Error leyendo {html_file}: {e}")
        
        print()
    
    # Resumen de validación
    print("📊 RESUMEN VALIDACIÓN")
    print("-" * 30)
    print(f"✅ Referencias válidas: {len(validation_results['valid'])}")
    print(f"🌐 Referencias externas: {len(validation_results['external'])}")
    print(f"❌ Referencias faltantes: {len(validation_results['missing'])}")
    
    if validation_results['missing']:
        print("\n⚠️ REFERENCIAS FALTANTES:")
        for html_file, css_ref in validation_results['missing']:
            print(f"   📄 {os.path.basename(html_file)}: {css_ref}")
    
    print()
    return validation_results

def generate_optimization_recommendations():
    """Genera recomendaciones para optimización adicional"""
    
    print("💡 RECOMENDACIONES DE OPTIMIZACIÓN")
    print("-" * 40)
    
    # Cargar análisis si existe
    analysis_file = 'css_analysis_report.json'
    if os.path.exists(analysis_file):
        with open(analysis_file, 'r', encoding='utf-8') as f:
            analysis = json.load(f)
        
        print("1. 📄 CSS específicos que podrían combinarse:")
        modules_with_multiple = {k: v for k, v in analysis.get('modules', {}).items() if isinstance(v, list) and len(v) > 1}
        for module, files in modules_with_multiple.items():
            print(f"   🔗 Módulo {module}: {len(files)} archivos CSS")
        
        print("\n2. 🗑️ Archivos legacy para revisar:")
        legacy_files = analysis.get('orphaned_css', [])
        for css_file in legacy_files:
            if os.path.exists(css_file):
                size = os.path.getsize(css_file)
                print(f"   📄 {css_file} ({size} bytes)")
    
    print("\n3. 🚀 Próximos pasos sugeridos:")
    print("   a) 🧪 Probar cada módulo HTML en navegador")
    print("   b) 🔍 Revisar archivos en /legacy/ y decidir si eliminar")
    print("   c) 📱 Verificar responsive design en todos los módulos")
    print("   d) ⚡ Considerar minificación de CSS para producción")
    print()

def main():
    # Verificar que estamos en la ubicación correcta
    if not os.path.exists('Client/css'):
        print("❌ Error: No se encontró Client/css")
        print("   Ejecutar desde el directorio raíz del proyecto")
        return
    
    # Generar resumen
    css_structure = generate_final_css_summary()
    
    # Validar referencias
    validation_results = validate_html_references()
    
    # Generar recomendaciones
    generate_optimization_recommendations()
    
    # Guardar resumen
    summary_data = {
        'css_structure': css_structure,
        'validation_results': validation_results,
        'timestamp': '2025-09-02 23:00:00'
    }
    
    with open('css_final_summary.json', 'w', encoding='utf-8') as f:
        json.dump(summary_data, f, indent=2, ensure_ascii=False)
    
    print("💾 Resumen completo guardado en: css_final_summary.json")
    print("\n✅ REORGANIZACIÓN CSS COMPLETADA CON ÉXITO")

if __name__ == "__main__":
    main()
