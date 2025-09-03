## 🔧 CONFIGURACIÓN RENDER - TROUBLESHOOTING

### 1. CONECTAR BASE DE DATOS A MAIRA_4.0:

1. **Ir a maira-database:**
   - Click en "maira-database"
   - Tab "Info" 
   - Copiar "External Database URL"

2. **Configurar en MAIRA_4.0:**
   - Click en "MAIRA_4.0"
   - Tab "Environment"
   - Add Environment Variable:
     ```
     Name: DATABASE_URL
     Value: [Pegar External Database URL]
     ```

### 2. VARIABLES DE ENTORNO REQUERIDAS:

Agregar estas variables en MAIRA_4.0 > Environment:

```bash
DATABASE_URL = postgresql://usuario:password@host:port/database
SECRET_KEY = tu_clave_secreta_aleatoria_aqui
JWT_SECRET_KEY = otra_clave_secreta_diferente
FLASK_ENV = production
PORT = 10000
PYTHONPATH = /opt/render/project/src
```

### 3. COMANDOS DE BUILD/START:

Verificar en MAIRA_4.0 > Settings:

```bash
Build Command: pip install -r requirements.txt
Start Command: gunicorn --config gunicorn.conf.py app:app
```

### 4. ERRORES COMUNES Y SOLUCIONES:

**Error: Module not found**
- Verificar que requirements.txt esté completo
- Verificar PYTHONPATH

**Error: Database connection**
- Verificar DATABASE_URL está configurado
- Verificar formato de URL de PostgreSQL

**Error: Port binding**
- Verificar PORT=10000 en variables de entorno
- Verificar gunicorn.conf.py usa PORT correcto

**Error: Static files**
- Verificar que Client/ existe en repositorio
- Verificar rutas en app.py

### 5. VERIFICAR DEPLOYMENT:

Una vez que esté "Deployed":

```bash
# Health check
https://maira-4-0.onrender.com/health

# Página principal  
https://maira-4-0.onrender.com/Client/index.html

# Módulo CO
https://maira-4-0.onrender.com/Client/CO.html
```

### 6. SI SIGUE FALLANDO:

1. **Revisar logs detallados** en Render dashboard
2. **Redeploy** desde último commit
3. **Verificar que main branch** tiene todos los cambios

¿Qué error específico ves en los logs de MAIRA_4.0?
