# Web Scraping API

API para resumir contenido web y funcionalidad de agente de chat inteligente.

## Características

- ✅ Extracción de contenido web usando múltiples métodos (Axios/Cheerio y Puppeteer)
- ✅ Generación de resúmenes usando OpenAI GPT
- ✅ Soporte para múltiples idiomas (Español, Inglés, Portugués)  
- ✅ Transcripción y resumen de archivos de audio
- ✅ **Nuevo: Agente de chat inteligente con historial conversacional**
- ✅ Consultas de base de datos para historial de llamadas y conversaciones
- ✅ Manejo de webhooks de Respond.io

## Endpoints

### 1. Resumen de URL

**POST** `/api/summarize`

Extrae y resume contenido de URLs proporcionadas en mensajes.

```json
{
  "message": "Revisa este artículo: https://example.com",
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

### 3. **Nuevo: Agente de Chat Inteligente**

**POST** `/api/agent/chat`

Chat inteligente que utiliza historial conversacional del usuario y contexto opcional de URLs.

#### Características del Agente:
- 🧠 Acceso al historial de conversaciones previas del usuario
- 🔗 Capacidad de usar URLs como contexto adicional
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

#### Ejemplos de uso:

**Chat simple:**
```json
{
  "number": "50231573100", 
  "message": "Hola, ¿cómo estás?",
  "language": "es"
}
```

**Chat con contexto de URL:**
```json
{
  "number": "50231573100",
  "message": "¿Podrías explicarme más sobre este producto?",
  "contextUrl": "https://tienda.com/producto",
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
- MySQL2 - Conexión a base de datos
- TypeScript - Tipado estático

## Uso del Agente de Chat

El agente de chat es ideal para:

1. **Soporte al cliente personalizado** - Accede al historial del usuario para respuestas contextualizadas
2. **Asistencia con productos/servicios** - Proporciona una URL de contexto para información específica  
3. **Seguimiento de conversaciones** - Mantiene continuidad en interacciones múltiples
4. **Soporte multiidioma** - Responde en el idioma preferido del usuario

El agente utiliza las últimas 3 conversaciones del usuario para personalizar sus respuestas y puede incorporar información adicional de URLs proporcionadas como contexto.

