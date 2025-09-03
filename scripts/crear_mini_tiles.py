import rasterio
from rasterio.windows import Window
from rasterio.merge import merge
from rasterio.warp import reproject, Resampling
import os
import json
import tarfile
import tempfile
from pathlib import Path

# Configuración para tiles pequeños
TILE_SIZE_KM = 25  # Cada tile será de 25x25 km aprox
MAX_TAR_SIZE_MB = 45  # Límite para GitHub (menos que 50MB para seguridad)

def calcular_tile_size_pixels(src, tile_size_km):
    """
    Calcula el tamaño en píxeles para un tile de X km
    """
    # Obtener resolución del raster (grados por píxel)
    transform = src.transform
    pixel_width = abs(transform[0])  # grados por píxel en X
    pixel_height = abs(transform[4])  # grados por píxel en Y
    
    # Aproximación: 1 grado ≈ 111 km
    km_per_degree = 111
    
    # Calcular píxeles necesarios para el tile_size_km
    degrees_per_tile = tile_size_km / km_per_degree
    pixels_x = int(degrees_per_tile / pixel_width)
    pixels_y = int(degrees_per_tile / pixel_height)
    
    return max(pixels_x, pixels_y)  # Usar el mayor para tiles cuadrados

def crear_mini_tiles_provincia(provincia_json_path, tif_files_dir, output_dir):
    """
    Toma un JSON de provincia y crea mini-tiles compatibles con GitHub
    """
    
    print(f"🔧 Procesando provincia: {provincia_json_path}")
    
    # Leer el JSON de la provincia
    with open(provincia_json_path, 'r') as f:
        provincia_data = json.load(f)
    
    provincia_name = provincia_data['metadata']['provincia']
    tiles_info = provincia_data['tiles']
    
    print(f"📦 Provincia {provincia_name}: {len(tiles_info)} tiles originales")
    
    # Crear directorio para esta provincia
    provincia_output_dir = os.path.join(output_dir, provincia_name)
    os.makedirs(provincia_output_dir, exist_ok=True)
    
    # Lista de archivos TIF de esta provincia
    tif_files = []
    missing_files = []
    
    for tile_id, tile_info in tiles_info.items():
        tif_path = os.path.join(tif_files_dir, tile_info['filename'])
        if os.path.exists(tif_path):
            tif_files.append(tif_path)
        else:
            missing_files.append(tile_info['filename'])
    
    if missing_files:
        print(f"⚠️  Archivos faltantes: {len(missing_files)}")
        if len(missing_files) < 10:
            for f in missing_files[:5]:
                print(f"   - {f}")
    
    if not tif_files:
        print(f"❌ No se encontraron archivos TIF para {provincia_name}")
        return
    
    print(f"✅ Encontrados {len(tif_files)} archivos TIF")
    
    # Crear un mosaico temporal de todos los TIF de la provincia
    print("🔄 Creando mosaico temporal...")
    
    try:
        # Abrir todos los TIF
        src_files = [rasterio.open(tif) for tif in tif_files]
        
        # Hacer merge
        mosaic, out_trans = merge(src_files)
        
        # Obtener metadata del primer archivo
        out_meta = src_files[0].meta.copy()
        out_meta.update({
            "driver": "GTiff",
            "height": mosaic.shape[1],
            "width": mosaic.shape[2],
            "transform": out_trans,
        })
        
        # Guardar mosaico temporal
        temp_mosaic_path = os.path.join(provincia_output_dir, f"{provincia_name}_mosaic_temp.tif")
        
        with rasterio.open(temp_mosaic_path, "w", **out_meta) as dest:
            dest.write(mosaic)
        
        # Cerrar archivos fuente
        for src in src_files:
            src.close()
        
        print(f"✅ Mosaico creado: {temp_mosaic_path}")
        
        # Ahora cortar el mosaico en mini-tiles
        cortar_en_mini_tiles(temp_mosaic_path, provincia_output_dir, provincia_name)
        
        # Limpiar archivo temporal
        os.remove(temp_mosaic_path)
        print(f"🧹 Mosaico temporal eliminado")
        
    except Exception as e:
        print(f"❌ Error procesando {provincia_name}: {str(e)}")
        # Cerrar archivos si hay error
        try:
            for src in src_files:
                src.close()
        except:
            pass

def cortar_en_mini_tiles(mosaic_path, output_dir, provincia_name):
    """
    Corta un mosaico en mini-tiles pequeños
    """
    
    print(f"✂️  Cortando {provincia_name} en mini-tiles de {TILE_SIZE_KM}km...")
    
    with rasterio.open(mosaic_path) as src:
        # Calcular tamaño de tile en píxeles
        tile_pixels = calcular_tile_size_pixels(src, TILE_SIZE_KM)
        
        print(f"📏 Tamaño de tile: {tile_pixels}x{tile_pixels} píxeles")
        
        # Obtener dimensiones del mosaico
        height, width = src.height, src.width
        
        mini_tiles_data = []
        tile_count = 0
        current_tar_files = []
        current_tar_size = 0
        tar_index = 1
        
        # Recorrer el mosaico en bloques
        for i in range(0, height, tile_pixels):
            for j in range(0, width, tile_pixels):
                
                # Crear ventana para este mini-tile
                window = Window(
                    j, i,
                    min(tile_pixels, width - j),
                    min(tile_pixels, height - i)
                )
                
                # Solo procesar si el tile tiene un tamaño mínimo
                if window.width < tile_pixels // 4 or window.height < tile_pixels // 4:
                    continue
                
                # Leer datos del tile
                tile_data = src.read(window=window)
                
                # Verificar que no esté vacío (todos los valores son no-data)
                if tile_data.size == 0:
                    continue
                
                # Crear perfil para el mini-tile
                profile = src.profile.copy()
                profile.update({
                    'height': window.height,
                    'width': window.width,
                    'transform': rasterio.windows.transform(window, src.transform)
                })
                
                # Nombre del archivo
                mini_tile_filename = f"{provincia_name}_tile_{tile_count:04d}.tif"
                mini_tile_path = os.path.join(output_dir, mini_tile_filename)
                
                # Guardar mini-tile
                with rasterio.open(mini_tile_path, 'w', **profile) as dst:
                    dst.write(tile_data)
                
                # Calcular bounds geográficos
                bounds = rasterio.windows.bounds(window, src.transform)
                
                # Agregar a metadata
                mini_tiles_data.append({
                    'id': f"{provincia_name}_tile_{tile_count:04d}",
                    'filename': mini_tile_filename,
                    'bounds': {
                        'west': bounds[0],
                        'south': bounds[1], 
                        'east': bounds[2],
                        'north': bounds[3]
                    },
                    'tile_index': tile_count,
                    'tar_file': f"{provincia_name}_part_{tar_index:02d}.tar.gz"
                })
                
                # Agregar a lista para TAR actual
                current_tar_files.append(mini_tile_path)
                current_tar_size += os.path.getsize(mini_tile_path) / (1024 * 1024)  # MB
                
                tile_count += 1
                
                # Si el TAR actual está lleno, crear el archivo
                if current_tar_size >= MAX_TAR_SIZE_MB or len(current_tar_files) >= 100:
                    crear_tar_file(current_tar_files, output_dir, provincia_name, tar_index)
                    current_tar_files = []
                    current_tar_size = 0
                    tar_index += 1
        
        # Crear último TAR si hay archivos pendientes
        if current_tar_files:
            crear_tar_file(current_tar_files, output_dir, provincia_name, tar_index)
        
        # Guardar índice JSON
        index_data = {
            'provincia': provincia_name,
            'total_tiles': tile_count,
            'tile_size_km': TILE_SIZE_KM,
            'total_tar_files': tar_index,
            'tiles': {tile['id']: tile for tile in mini_tiles_data}
        }
        
        index_path = os.path.join(output_dir, f"{provincia_name}_mini_tiles_index.json")
        with open(index_path, 'w') as f:
            json.dump(index_data, f, indent=2)
        
        print(f"✅ {provincia_name}: {tile_count} mini-tiles en {tar_index} archivos TAR")
        print(f"📄 Índice guardado: {index_path}")

def crear_tar_file(tif_files, output_dir, provincia_name, tar_index):
    """
    Crea un archivo TAR.GZ con los TIF especificados
    """
    
    tar_filename = f"{provincia_name}_part_{tar_index:02d}.tar.gz"
    tar_path = os.path.join(output_dir, tar_filename)
    
    with tarfile.open(tar_path, 'w:gz') as tar:
        for tif_path in tif_files:
            # Agregar solo el nombre del archivo, no la ruta completa
            arcname = os.path.basename(tif_path)
            tar.add(tif_path, arcname=arcname)
    
    # Eliminar archivos TIF individuales después de agregarlos al TAR
    for tif_path in tif_files:
        try:
            os.remove(tif_path)
        except:
            pass
    
    # Verificar tamaño
    tar_size = os.path.getsize(tar_path) / (1024 * 1024)
    print(f"📦 Creado: {tar_filename} ({tar_size:.1f} MB)")
    
    if tar_size > 95:  # Advertencia si está cerca del límite
        print(f"⚠️  ADVERTENCIA: {tar_filename} es grande ({tar_size:.1f} MB)")

def procesar_todas_las_provincias(tif_files_dir):
    """
    Procesa todas las provincias disponibles
    """
    
    # Directorios (usar rutas relativas desde el script)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = script_dir
    provincias_json_dir = os.path.join(base_dir, "tiles_por_provincias")
    output_dir = os.path.join(base_dir, "mini_tiles_github")
    
    print("🚀 GENERADOR DE MINI-TILES PARA GITHUB")
    print("=" * 50)
    print(f"📁 JSON Provincias: {provincias_json_dir}")
    print(f"📁 Archivos TIF: {tif_files_dir}")
    print(f"📁 Salida: {output_dir}")
    print(f"📏 Tamaño de tile: {TILE_SIZE_KM} km")
    print(f"📦 Límite TAR: {MAX_TAR_SIZE_MB} MB")
    print()
    
    # Crear directorio de salida
    os.makedirs(output_dir, exist_ok=True)
    
    # Buscar archivos JSON de provincias (solo altimetría por ahora)
    json_files = []
    if os.path.exists(provincias_json_dir):
        for file in os.listdir(provincias_json_dir):
            if file.startswith("altimetria_") and file.endswith(".json") and file != "altimetria_otros.json":
                json_files.append(os.path.join(provincias_json_dir, file))
    
    print(f"📄 Encontradas {len(json_files)} provincias para procesar")
    
    # Verificar si existen archivos TIF
    if not os.path.exists(tif_files_dir):
        print("❌ ERROR: Directorio de archivos TIF no encontrado")
        print("💡 Necesitas extraer los archivos TIF de altimetria_tiles.tar.gz")
        print("   Ejemplo: tar -xzf altimetria_tiles.tar.gz -C /tmp/tif_extract/")
        return
    
    # Contar archivos TIF disponibles
    tif_count = len([f for f in os.listdir(tif_files_dir) if f.endswith('.tif')])
    print(f"📊 Archivos TIF disponibles: {tif_count}")
    
    if tif_count == 0:
        print("❌ No se encontraron archivos TIF en el directorio especificado")
        return
    
    # Procesar cada provincia
    success_count = 0
    for i, json_path in enumerate(json_files, 1):
        print(f"\n📍 [{i}/{len(json_files)}] Procesando: {os.path.basename(json_path)}")
        try:
            crear_mini_tiles_provincia(json_path, tif_files_dir, output_dir)
            success_count += 1
        except Exception as e:
            print(f"❌ Error en {os.path.basename(json_path)}: {str(e)}")
    
    print(f"\n🎉 ¡Procesamiento completado!")
    print(f"✅ Provincias procesadas exitosamente: {success_count}/{len(json_files)}")
    print(f"📁 Resultado en: {output_dir}")
    print("💡 Cada archivo TAR.GZ debería ser < 50MB y compatible con GitHub")
    
    # Crear índice maestro de mini-tiles
    crear_indice_maestro_mini_tiles(output_dir)

def crear_indice_maestro_mini_tiles(output_dir):
    """
    Crea el índice maestro que lista todas las provincias y sus archivos
    """
    print("\n📋 Creando índice maestro de mini-tiles...")
    
    master_index = {
        'version': '3.0',
        'description': 'Índice maestro de mini-tiles para MAIRA',
        'tile_size_km': TILE_SIZE_KM,
        'max_tar_size_mb': MAX_TAR_SIZE_MB,
        'provincias': {},
        'total_provincias': 0,
        'total_tar_files': 0
    }
    
    # Buscar todos los índices de provincias
    total_tar_files = 0
    for root, dirs, files in os.walk(output_dir):
        for file in files:
            if file.endswith('_mini_tiles_index.json'):
                provincia_name = file.replace('_mini_tiles_index.json', '')
                index_path = os.path.join(root, file)
                
                try:
                    with open(index_path, 'r') as f:
                        provincia_index = json.load(f)
                    
                    master_index['provincias'][provincia_name] = {
                        'index_file': file,
                        'total_tiles': provincia_index.get('total_tiles', 0),
                        'total_tar_files': provincia_index.get('total_tar_files', 0)
                    }
                    
                    total_tar_files += provincia_index.get('total_tar_files', 0)
                    
                except Exception as e:
                    print(f"⚠️ Error leyendo índice de {provincia_name}: {e}")
    
    master_index['total_provincias'] = len(master_index['provincias'])
    master_index['total_tar_files'] = total_tar_files
    
    # Guardar índice maestro
    master_path = os.path.join(output_dir, 'master_mini_tiles_index.json')
    with open(master_path, 'w') as f:
        json.dump(master_index, f, indent=2)
    
    print(f"✅ Índice maestro creado: {master_path}")
    print(f"📊 Resumen: {master_index['total_provincias']} provincias, {master_index['total_tar_files']} archivos TAR")

if __name__ == "__main__":
    print("🔧 Script para crear mini-tiles compatibles con GitHub")
    print("📋 Configuración actual:")
    print(f"   - Tamaño de tile: {TILE_SIZE_KM} km")
    print(f"   - Límite TAR: {MAX_TAR_SIZE_MB} MB")
    print()
    
    # Usar directorio predeterminado donde extrajimos los archivos
    tif_dir = "/tmp/tif_extract/Altimetria"
    
    print(f"✅ Usando directorio TIF: {tif_dir}")
    
    if os.path.exists(tif_dir):
        procesar_todas_las_provincias(tif_dir)
    else:
        print("❌ Directorio no encontrado. Extrae primero los archivos TIF.")
        print("💡 Comando sugerido:")
        print("   tar -xzf altimetria_tiles.tar.gz -C /tmp/tif_extract/")
