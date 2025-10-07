#!/usr/bin/env python3
"""
Script para embebed texturas en GLB
Uso: blender --background --python embed_textures.py -- input.glb output.glb
"""

import bpy
import sys
import os

def embed_textures_in_glb(input_path, output_path):
    """Embebed todas las texturas en un GLB"""
    
    print(f"\n🎨 Embebiendo texturas en GLB")
    print(f"📥 Input:  {input_path}")
    print(f"📤 Output: {output_path}")
    
    # Limpiar escena
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    
    # Importar GLB
    print(f"\n📂 Importando GLB...")
    bpy.ops.import_scene.gltf(filepath=input_path)
    
    # Información
    meshes = len([obj for obj in bpy.data.objects if obj.type == 'MESH'])
    materials = len(bpy.data.materials)
    images = len(bpy.data.images)
    
    print(f"✅ Modelo importado:")
    print(f"   - Meshes: {meshes}")
    print(f"   - Materiales: {materials}")
    print(f"   - Imágenes: {images}")
    
    # Embebed texturas
    if images > 0:
        print(f"\n🎨 Embebiendo texturas...")
        embedded_count = 0
        already_embedded = 0
        
        for img in bpy.data.images:
            if img.packed_file is None:
                # Textura no embebida, intentar embebed
                if img.filepath and os.path.exists(bpy.path.abspath(img.filepath)):
                    try:
                        img.pack()
                        embedded_count += 1
                        print(f"   ✅ {img.name} - Embebida")
                    except Exception as e:
                        print(f"   ❌ {img.name} - Error: {e}")
                else:
                    print(f"   ⚠️  {img.name} - Archivo no encontrado: {img.filepath}")
            else:
                already_embedded += 1
                print(f"   ✓  {img.name} - Ya embebida")
        
        print(f"\n📊 Resumen:")
        print(f"   - Embebidas ahora: {embedded_count}")
        print(f"   - Ya embebidas: {already_embedded}")
        print(f"   - Total: {embedded_count + already_embedded}")
    else:
        print(f"\n⚠️  Sin texturas encontradas")
        print(f"   El modelo puede no tener texturas o usar solo colores")
    
    # Verificar materiales
    print(f"\n🎨 Verificando materiales...")
    for mat in bpy.data.materials:
        if mat.use_nodes:
            # Buscar nodos de textura
            has_texture = False
            for node in mat.node_tree.nodes:
                if node.type == 'TEX_IMAGE':
                    has_texture = True
                    img_node = node
                    if img_node.image:
                        print(f"   • {mat.name}: {img_node.image.name}")
                    break
            
            if not has_texture:
                print(f"   • {mat.name}: Sin texturas (solo color)")
        else:
            print(f"   • {mat.name}: Material sin nodos")
    
    # Exportar GLB con texturas embebidas
    print(f"\n💾 Exportando GLB...")
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_image_format='AUTO',  # Mantener formato original
        export_texcoords=True,
        export_normals=True,
        export_tangents=True,
        export_materials='EXPORT',
        export_colors=True,
        export_yup=True,
        export_apply=False
    )
    
    # Verificar salida
    if os.path.exists(output_path):
        size_mb = os.path.getsize(output_path) / (1024 * 1024)
        input_size_mb = os.path.getsize(input_path) / (1024 * 1024)
        
        print(f"\n✅ Exportación exitosa!")
        print(f"📦 Tamaño original: {input_size_mb:.2f} MB")
        print(f"📦 Tamaño con texturas: {size_mb:.2f} MB")
        print(f"📍 Ubicación: {output_path}")
        
        if size_mb > input_size_mb * 1.5:
            print(f"\n💡 Tip: El archivo creció significativamente")
            print(f"   Las texturas ahora están embebidas")
        
        return True
    else:
        print(f"\n❌ Error: No se pudo crear {output_path}")
        return False


if __name__ == "__main__":
    argv = sys.argv
    
    # Encontrar separador --
    try:
        idx = argv.index("--")
        script_args = argv[idx + 1:]
    except ValueError:
        script_args = []
    
    if len(script_args) < 2:
        print("❌ Error: Se requieren 2 argumentos")
        print("Uso: blender --background --python embed_textures.py -- input.glb output.glb")
        print("\nEjemplo:")
        print("  blender --background --python embed_textures.py -- soldier.glb soldier_with_textures.glb")
        sys.exit(1)
    
    input_path = script_args[0]
    output_path = script_args[1]
    
    # Verificar entrada
    if not os.path.exists(input_path):
        print(f"❌ Error: No se encuentra {input_path}")
        sys.exit(1)
    
    # Convertir
    success = embed_textures_in_glb(input_path, output_path)
    
    sys.exit(0 if success else 1)
