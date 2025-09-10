#!/usr/bin/env python3
"""
🎨 ANALIZADOR DE CSS MAIRA 4.0
Analiza los archivos CSS para identificar cambios, problemas y mejoras potenciales
"""

import os
import re
import json
from datetime import datetime

def analyze_css_file(filepath):
    """Analiza un archivo CSS individual"""
    analysis = {
        'file': filepath,
        'size': 0,
        'lines': 0,
        'rules': 0,
        'selectors': [],
        'custom_properties': [],
        'media_queries': [],
        'potential_issues': [],
        'z_index_values': [],
        'colors': [],
        'responsive_breakpoints': []
    }
    
    if not os.path.exists(filepath):
        analysis['error'] = 'File not found'
        return analysis
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        analysis['size'] = len(content)
        analysis['lines'] = len(content.split('\n'))
        
        # Contar reglas CSS
        analysis['rules'] = len(re.findall(r'\{[^}]*\}', content))
        
        # Extraer selectores
        selectors = re.findall(r'([^{]+)\s*\{', content)
        analysis['selectors'] = [s.strip() for s in selectors if s.strip()]
        
        # Extraer custom properties (variables CSS)
        custom_props = re.findall(r'--[\w-]+', content)
        analysis['custom_properties'] = list(set(custom_props))
        
        # Extraer media queries
        media_queries = re.findall(r'@media[^{]+', content)
        analysis['media_queries'] = [mq.strip() for mq in media_queries]
        
        # Extraer valores de z-index
        z_indexes = re.findall(r'z-index:\s*(\d+)', content)
        analysis['z_index_values'] = [int(z) for z in z_indexes]
        
        # Extraer colores
        colors = re.findall(r'#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)', content)
        analysis['colors'] = list(set(colors))
        
        # Buscar breakpoints responsive
        breakpoints = re.findall(r'(\d+)px', ' '.join(media_queries))
        analysis['responsive_breakpoints'] = sorted(list(set([int(bp) for bp in breakpoints])))
        
        # Detectar problemas potenciales
        if '!important' in content:
            analysis['potential_issues'].append('Uses !important')
        
        if len(analysis['z_index_values']) > 0 and max(analysis['z_index_values']) > 9999:
            analysis['potential_issues'].append('Very high z-index values')
        
        if 'position: fixed' in content and 'overflow: hidden' in content:
            analysis['potential_issues'].append('Fixed positioning with overflow hidden - potential mobile issues')
            
        # Verificar si usa variables CSS modernas
        if analysis['custom_properties']:
            analysis['uses_css_variables'] = True
        else:
            analysis['uses_css_variables'] = False
            
    except Exception as e:
        analysis['error'] = str(e)
    
    return analysis

def compare_css_files(file1, file2):
    """Compara dos archivos CSS"""
    analysis1 = analyze_css_file(file1)
    analysis2 = analyze_css_file(file2)
    
    comparison = {
        'file1': file1,
        'file2': file2,
        'size_diff': analysis2['size'] - analysis1['size'],
        'lines_diff': analysis2['lines'] - analysis1['lines'],
        'rules_diff': analysis2['rules'] - analysis1['rules'],
        'new_selectors': list(set(analysis2['selectors']) - set(analysis1['selectors'])),
        'removed_selectors': list(set(analysis1['selectors']) - set(analysis2['selectors'])),
        'new_colors': list(set(analysis2['colors']) - set(analysis1['colors'])),
        'removed_colors': list(set(analysis1['colors']) - set(analysis2['colors']))
    }
    
    return comparison

def analyze_all_css():
    """Analiza todos los archivos CSS del proyecto"""
    css_files = []
    
    # Buscar archivos CSS
    for root, dirs, files in os.walk('Client/css'):
        for file in files:
            if file.endswith('.css'):
                css_files.append(os.path.join(root, file))
    
    print("🎨 ANÁLISIS COMPLETO DE CSS MAIRA 4.0")
    print("=" * 50)
    print(f"📁 Archivos CSS encontrados: {len(css_files)}")
    print()
    
    all_analyses = []
    
    for css_file in sorted(css_files):
        print(f"📄 Analizando: {css_file}")
        analysis = analyze_css_file(css_file)
        all_analyses.append(analysis)
        
        print(f"   📏 Tamaño: {analysis['size']} bytes ({analysis['lines']} líneas)")
        print(f"   🎯 Reglas: {analysis['rules']}")
        print(f"   🎨 Variables CSS: {len(analysis['custom_properties'])}")
        print(f"   📱 Media queries: {len(analysis['media_queries'])}")
        
        if analysis['potential_issues']:
            print(f"   ⚠️  Problemas: {', '.join(analysis['potential_issues'])}")
        
        if analysis['z_index_values']:
            max_z = max(analysis['z_index_values'])
            print(f"   📐 Z-index máximo: {max_z}")
        
        print()
    
    # Análisis de conflictos de z-index
    all_z_indexes = []
    for analysis in all_analyses:
        all_z_indexes.extend(analysis['z_index_values'])
    
    if all_z_indexes:
        print("📐 ANÁLISIS DE Z-INDEX")
        print("-" * 30)
        print(f"Z-index máximo global: {max(all_z_indexes)}")
        print(f"Z-index mínimo: {min(all_z_indexes)}")
        print(f"Valores únicos: {sorted(list(set(all_z_indexes)))}")
        print()
    
    # Análisis de colores
    all_colors = []
    for analysis in all_analyses:
        all_colors.extend(analysis['colors'])
    
    unique_colors = list(set(all_colors))
    print("🎨 PALETA DE COLORES")
    print("-" * 20)
    print(f"Colores únicos encontrados: {len(unique_colors)}")
    for color in sorted(unique_colors)[:20]:  # Mostrar primeros 20
        print(f"   {color}")
    if len(unique_colors) > 20:
        print(f"   ... y {len(unique_colors) - 20} más")
    print()
    
    # Recomendaciones
    print("💡 RECOMENDACIONES")
    print("-" * 20)
    
    # CSS con !important
    files_with_important = [a['file'] for a in all_analyses if 'Uses !important' in a.get('potential_issues', [])]
    if files_with_important:
        print(f"⚠️  Archivos con !important: {len(files_with_important)}")
        for f in files_with_important:
            print(f"   - {f}")
    
    # Z-index muy altos
    if all_z_indexes and max(all_z_indexes) > 9999:
        print("⚠️  Z-index muy altos detectados - considerar reducir")
    
    # Variables CSS
    files_without_vars = [a['file'] for a in all_analyses if not a.get('uses_css_variables', False)]
    if files_without_vars:
        print(f"💡 Archivos sin variables CSS (considerar migrar): {len(files_without_vars)}")
    
    print()
    print("✅ Análisis completado")
    
    return all_analyses

def generate_css_backup_strategy():
    """Genera estrategia de respaldo y versionado CSS"""
    print("💾 ESTRATEGIA DE RESPALDO CSS")
    print("=" * 30)
    print()
    print("1. 📦 Crear respaldos automáticos:")
    print("   git tag css-backup-$(date +%Y%m%d)")
    print()
    print("2. 🔄 Comparar con versiones anteriores:")
    print("   git show HEAD~1:Client/css/common/CYGMarcha.css > old_version.css")
    print("   diff Client/css/common/CYGMarcha.css old_version.css")
    print()
    print("3. 🎯 Crear versiones de prueba:")
    print("   cp Client/css/common/CYGMarcha.css Client/css/common/CYGMarcha.test.css")
    print("   # Modificar .test.css para pruebas")
    print()
    print("4. 📋 Script de alternancia:")
    print("   # Cambiar entre versión actual y de prueba")
    print("   mv Client/css/common/CYGMarcha.css Client/css/common/CYGMarcha.original.css")
    print("   mv Client/css/common/CYGMarcha.test.css Client/css/common/CYGMarcha.css")
    print()

if __name__ == "__main__":
    try:
        analyze_all_css()
        print()
        generate_css_backup_strategy()
    except Exception as e:
        print(f"❌ Error en análisis: {e}")
