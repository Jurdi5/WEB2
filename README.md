# WEB2
Tareas y trabajos de web2

# CV Online - Jorge Eduardo Urdiales Gonzalez

Un CV en línea moderno y responsivo construido con un empaquetador personalizado y servidor Express integrado.

## Características

- **Empaquetador personalizado** con soporte para HTML, CSS/SCSS, JavaScript/TypeScript
- **Carga dinámica** de datos desde JSON
- **Formulario de contacto** funcional con validación
- **Envío de emails** automático con confirmación
- **Diseño responsivo** y moderno
- **Modo desarrollo** con recarga automática
- **Optimización automática** para producción
- **Validación robusta** de formularios
- **Seguridad** integrada con helmet y rate limiting

## Estructura del Proyecto

```
cv-online-jorge/
├── src/                    # Código fuente
│   ├── index.html         # Plantilla HTML principal
│   ├── styles.scss        # Estilos SCSS
│   └── script.ts          # JavaScript/TypeScript principal
├── data/                   # Datos del CV
│   └── cv-data.json       # Información personal, experiencia, etc.
├── assets/                 # Recursos estáticos
│   └── images/            # Imágenes (perfil, etc.)
├── bundler/               # Empaquetador personalizado
│   └── bundler.js         # Script de construcción
├── server/                 # Servidor Express
│   └── server.js          # API y servidor web
├── dist/                   # Archivos construidos (generado)
├── package.json           # Dependencias y scripts
└── README.md             # Documentación
```

## Instalación

1. **Clonar el repositorio:**
```bash
git clone https://github.com/jurdi5/cv-online-jorge
cd cv-online-jorge
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno (opcional para emails):**
```bash
# Crear archivo .env
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicación
```

## Configuración de Email

Para que el formulario de contacto funcione correctamente:

1. **Gmail**: Habilita la autenticación de 2 factores y genera una contraseña de aplicación
2. **Otros proveedores**: Ajusta la configuración en `data/cv-data.json`

```json
{
  "contact": {
    "emailRecipient": "jorge.urdialeseduardo@gmail.com",
    "emailService": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false
    }
  }
}
```

## Uso

### Desarrollo

```bash
# Construir y observar cambios
npm run dev

# Solo construir
npm run build

# Limpiar directorio dist
npm run clean
```

### Producción

```bash
# Construir para producción
npm run build

# Iniciar servidor
npm start
```

El servidor estará disponible en `http://localhost:3000`

## Personalización

### Actualizar Datos del CV

Edita el archivo `data/cv-data.json` para actualizar:

- Información personal
- Educación
- Experiencia laboral
- Proyectos
- Habilidades técnicas
- Información de contacto

### Personalizar Estilos

Modifica `src/styles.scss` para cambiar:

- Colores y temas
- Tipografías
- Layouts y espaciado
- Animaciones

### Agregar Funcionalidades

Edita `src/script.ts` para:

- Nuevas interacciones
- Validaciones personalizadas
- Integraciones con APIs
- Animaciones avanzadas

## Empaquetador Personalizado

### Características del Bundler

- **Compilación SCSS** → CSS optimizado
- **Compilación TypeScript** → JavaScript ES2017
- **Minificación** automática en producción
- **Source maps** en desarrollo
- **Copia de assets** y datos
- **Modo watch** para desarrollo

### Comandos del Bundler

```bash
# Desarrollo con watch mode
node bundler/bundler.js --dev

# Producción
node bundler/bundler.js
```

## API del Servidor

### Endpoints Disponibles

#### `GET /api/health`
Verificar estado del servidor
```json
{
  "status": "ok",
  "timestamp": "2025-01-20T10:30:00.000Z",
  "version": "1.0.0"
}
```

#### `GET /api/cv-data`
Obtener datos del CV
```json
{
  "personalInfo": { ... },
  "education": [ ... ],
  "experience": [ ... ],
  "projects": [ ... ],
  "skills": { ... }
}
```

#### `POST /api/contact`
Enviar formulario de contacto
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "subject": "Consulta laboral",
  "message": "Hola, me interesa contactarte..."
}
```

## Seguridad

- **Helmet.js** para headers de seguridad
- **Rate limiting** para prevenir spam
- **CORS** configurado apropiadamente
- **Validación** robusta de datos
- **CSP** (Content Security Policy)

## Responsive Design

- **Mobile-first** approach
- **Breakpoints** optimizados
- **Touch-friendly** interactions
- **Optimizado** para todos los dispositivos

## Performance

- **CSS** minificado en producción
- **JavaScript** optimizado
- **Imágenes** optimizadas
- **Lazy loading** para contenido
- **Caching** estratégico

## Testing

### Validar construcción:
```bash
npm run build
cd dist
python -m http.server 8000
```

### Probar servidor:
```bash
npm start
curl http://localhost:3000/api/health
```

## Troubleshooting

### Problemas Comunes

**Error de compilación TypeScript:**
```bash
npm install -g typescript
```

**Error de email:**
- Verifica las variables de entorno
- Confirma la configuración SMTP
- Revisa los logs del servidor

**Assets no se cargan:**
- Verifica la estructura de directorios
- Ejecuta `npm run clean && npm run build`

**Estilos no se aplican:**
- Confirma que los archivos SCSS se compilen
- Revisa la consola del navegador

## Scripts NPM

```json
{
  "build": "node bundler/bundler.js",
  "dev": "node bundler/bundler.js --dev",
  "start": "node server/server.js",
  "clean": "rimraf dist"
}
```

