# Guardar como server/install_deps.py
import subprocess
import sys

def install_dependencies():
    dependencies = [
        "opencv-python",
        "mediapipe",
        "numpy",
        "pyautogui"
    ]
    
    for dependency in dependencies:
        print(f"Instalando {dependency}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", dependency])
    
    print("Todas las dependencias instaladas correctamente.")

if __name__ == "__main__":
    install_dependencies()