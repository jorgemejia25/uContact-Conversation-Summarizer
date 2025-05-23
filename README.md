# Web Scraping API

API para resumir contenido web y funcionalidad de agente de chat inteligente.

## Características

- ✅ Extracción de contenido web usando múltiples métodos (Axios/Cheerio y Puppeteer)
- ✅ **Nuevo: Procesamiento de documentos PDF** - Extrae y analiza texto de URLs de PDF
- ✅ Generación de resúmenes usando OpenAI GPT
- ✅ Soporte para múltiples idiomas (Español, Inglés, Portugués)  
- ✅ Transcripción y resumen de archivos de audio
- ✅ **Agente de chat inteligente con historial conversacional**
- ✅ Consultas de base de datos para historial de llamadas y conversaciones
- ✅ Manejo de webhooks de Respond.io

## Endpoints

### 1. Resumen de URL y PDF

**POST** `/api/summarize`

Extrae y resume contenido de URLs de páginas web o documentos PDF.

**Páginas web:**
```json
{
  "message": "Revisa este artículo: https://example.com",
  "language": "es"
}
```

**Documentos PDF:**
```json
{
  "message": "Resume este documento: https://example.com/document.pdf",
  "language": "es"
}
```

### 2. Resumen de Audio  

**POST** `/api/summarize/audio`

Transcribe y resume archivos de audio MP3.

```json
{
  "audioFilePath": "/path/to/audio.mp3"
}
```

### 3. **Agente de Chat Inteligente**

**POST** `/api/agent/chat`

Chat inteligente que utiliza historial conversacional del usuario y contexto opcional de URLs o PDFs.

#### Características del Agente:
- 🧠 Acceso al historial de conversaciones previas del usuario
- 🔗 Capacidad de usar URLs como contexto adicional (`contextUrl`)
- 📄 **Soporte dedicado para documentos PDF** (`pdfUrl`)
- 🌍 Soporte multiidioma
- 📱 Identificación por número de teléfono
- 🤖 Respuestas personalizadas basadas en IA

#### Parámetros:
```json
{
  "number": "50231573100",
  "message": "¿Puedes ayudarme con información sobre este tema?",
  "contextUrl": "https://example.com/context",
  "language": "es"
}
```

**Para documentos PDF, usa `pdfUrl`:**
```json
{
  "number": "50231573100",
  "message": "¿Puedes analizar este documento?",
  "pdfUrl": "https://example.com/document.pdf",
  "language": "es"
}
```

#### Ejemplos de uso:

**Chat simple:**
```json
{
  "number": "50231573100", 
  "message": "Hola, ¿cómo estás?",
  "language": "es"
}
```

**Chat con contexto de página web:**
```json
{
  "number": "50231573100",
  "message": "¿Podrías explicarme más sobre este producto?",
  "contextUrl": "https://tienda.com/producto",
  "language": "es"
}
```

**Chat con contexto de PDF:**
```json
{
  "number": "50231573100",
  "message": "Analiza este documento y explícame los puntos clave",
  "pdfUrl": "https://example.com/report.pdf",
  "language": "es"
}
```

**Chat en inglés:**
```json
{
  "number": "50231573100",
  "message": "What can you tell me about my conversation history?",
  "language": "en"
}
```

### 4. Base de Datos

#### Obtener fechas de chat
**GET** `/api/db/chat/dates?callerId={phoneNumber}`

#### Obtener resumen de chat por fecha  
**GET** `/api/db/chat/summary?callerId={phoneNumber}&date={YYYY-MM-DD}`

#### Obtener llamadas por fuente
**GET** `/api/db/calls/{phoneNumber}`

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Configurar OPENAI_API_KEY en .env
OPENAI_API_KEY=tu_api_key_aqui

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
npm start
```

## Variables de Entorno

```
OPENAI_API_KEY=tu_openai_api_key
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=tu_base_datos
```

## Dependencias Principales

- Fastify - Framework web
- OpenAI API - Generación de resúmenes y chat
- Puppeteer - Extracción de contenido web con JavaScript
- Cheerio - Parsing HTML
- pdf-parse - Extracción de texto de documentos PDF
- MySQL2 - Conexión a base de datos
- TypeScript - Tipado estático

## Uso del Agente de Chat

El agente de chat es ideal para:

1. **Soporte al cliente personalizado** - Accede al historial del usuario para respuestas contextualizadas
2. **Asistencia con productos/servicios** - Proporciona una URL de contexto para información específica  
3. **Análisis de documentos PDF** - Procesa y analiza documentos PDF como contexto adicional
4. **Seguimiento de conversaciones** - Mantiene continuidad en interacciones múltiples
5. **Soporte multiidioma** - Responde en el idioma preferido del usuario

El agente utiliza las últimas 3 conversaciones del usuario para personalizar sus respuestas y puede incorporar información adicional de URLs (páginas web o documentos PDF) proporcionadas como contexto.

### Capacidades con PDF:
- ✅ **Detección automática** de URLs que apuntan a archivos PDF
- ✅ **Descarga segura** con límites de tamaño (10MB máximo)
- ✅ **Sistema de caché inteligente** - Evita descargas repetidas
- ✅ **Extracción de texto** completa del contenido del PDF
- ✅ **Procesamiento inteligente** con límite de caracteres optimizado para IA
- ✅ **Manejo de errores** robusto para PDFs corruptos o inaccesibles
- ⚡ **Timeout optimizado** (15 segundos) para mejor rendimiento

### 🚀 Sistema de Caché de PDF:

**Características del Caché:**
- 🗄️ **Almacenamiento en memoria** de PDFs procesados
- ⏱️ **Expiración automática** después de 24 horas
- 📊 **Límites inteligentes:** 50 PDFs o 100MB máximo
- 🔄 **LRU (Least Recently Used)** para gestión automática de espacio
- 📈 **Estadísticas detalladas** de hit/miss ratio

**Endpoints de Gestión de Caché:**

#### Obtener estadísticas del caché
**GET** `/api/summarize/cache/stats`
```json
{
  "message": "PDF Cache statistics",
  "stats": {
    "totalEntries": 5,
    "totalSizeInBytes": 2048576,
    "cacheHits": 12,
    "cacheMisses": 8,
    "hitRate": 60.0,
    "lastCleanup": 1647890123456
  }
}
```

#### Listar URLs cacheadas
**GET** `/api/summarize/cache/list`
```json
{
  "message": "Cached PDF URLs",
  "count": 3,
  "urls": [
    {
      "url": "https://example.com/doc.pdf",
      "pages": 25,
      "title": "Sample Document",
      "timestamp": 1647890123456,
      "sizeInMB": 1.5
    }
  ]
}
```

#### Limpiar todo el caché
**DELETE** `/api/summarize/cache/clear`

#### Remover URL específica del caché
**DELETE** `/api/summarize/cache/remove`
```json
{
  "url": "https://example.com/document.pdf"
}
```

### ⚠️ Limitaciones y Mejores Prácticas para PDF:

**Limitaciones:**
- 📏 **Tamaño máximo:** 10MB por archivo
- ⏱️ **Timeout:** 15 segundos de descarga
- 📄 **Texto únicamente:** PDFs basados en imágenes no son procesables
- 🔒 **Acceso público:** Solo PDFs accesibles públicamente

**Mejores Prácticas:**
- ✅ Usa PDFs pequeños (< 5MB) para mejor rendimiento
- ✅ Verifica que el PDF contenga texto seleccionable
- ✅ Usa URLs directas a archivos PDF
- ✅ El agente continuará funcionando aunque falle el PDF
- ⚡ **URLs frecuentes se cargan instantáneamente desde caché**
- 📊 **Monitorea estadísticas de caché** para optimizar uso

**Beneficios del Caché:**
- 🚀 **Respuesta instantánea** para PDFs previamente procesados
- 💾 **Ahorro de ancho de banda** - no re-descarga archivos
- ⚡ **Mejor experiencia de usuario** - sin esperas repetidas
- 📈 **Escalabilidad mejorada** - menos carga en el servidor

**URLs de PDF recomendadas para pruebas:**
```
https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf
https://www.clickdimensions.com/links/TestPDFfile.pdf
https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf
```