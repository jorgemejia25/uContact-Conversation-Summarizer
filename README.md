# Web Scrapping API


## Description

This project provides an API that summarizes web content through messages containing URLs. It leverages OpenAI's API to generate summaries in multiple languages, designed for integration with call centers, chatbots, or any system requiring automated web content analysis. It also supports audio transcription and summarization using OpenAI's Whisper model.

## Features

- URL extraction from free-form messages using regex pattern matching
- Web content scraping with proper headers and timeout handling
- Audio transcription and summarization via Whisper API
- Multi-language summary generation (Spanish, English, Portuguese)
- Error handling with localized error messages
- Fastify-based REST API with TypeScript support
- Request validation using TypeBox schemas
- Sample HTTP requests for testing

## Technical Implementation

### Core Technologies
- **Fastify**: High-performance web framework
- **TypeBox**: JSON schema validation for TypeScript
- **Axios**: HTTP client for API requests and web scraping
- **Cheerio**: Server-side HTML parsing
- **tsyringe**: Dependency injection container
- **OpenAI API**: GPT-3.5-turbo for summary generation and Whisper for audio transcription

### Architecture
- Controller-Service pattern separation
- Environment configuration via `.env`
- Type-safe request/response interfaces
- Async/await error handling
- Configurable content length limits (3000 characters)

## Requirements

- Node.js v18.16+
- OpenAI API key
- npm/yarn/pnpm package manager

## Installation

```bash
git clone [https://github.com/your-repo/web-scraping-api.git](https://github.com/your-repo/web-scraping-api.git)
cd web-scraping-api
pnpm install
cp .env.example .env
# Edit .env with your OpenAI API key
pnpm start
```

## Español

El proyecto consta de un API que permite resumir el contenido de una página web a través de un mensaje que puede contener una URL. También permite transcribir y resumir archivos de audio usando el modelo Whisper de OpenAI. Esto funciona con el uso de la API de OpenAI para generar resúmenes, permitiendo la integración con posibles Call Centers o Chatbots, para poder obtener el contenido de una página web o archivo de audio y resumirlo de manera eficiente.

## Características

- Resumen de contenido de una página web a través de un mensaje que puede contener una URL.
- Transcripción y resumen de archivos de audio MP3.
- Uso de la API de OpenAI (GPT-3.5 y Whisper) para generar resúmenes.
- Integración con posibles Call Centers o Chatbots.
- Obtención del contenido de una página web o archivo de audio y resumirlo de manera eficiente.
- Sin necesidad de ingresar manualmente el contenido de la página web.

## Detalles técnicos

- Se utiliza el framework Fastify para el desarrollo del API.
- Se utiliza Dependency Injection para la inyección de dependencias de forma basada en NestJS.
- Se utiliza el paquete axios para hacer peticiones HTTP.
- Se utiliza el paquete cheerio para parsear HTML.
- Se utiliza form-data para enviar archivos de audio a la API de Whisper.

## Requisitos

- Node.js 18.16.0 o superior
- Acceso a la API de OpenAI

## Instalación

1. Clonar el repositorio
2. Instalar las dependencias: `npm install`
3. Configurar las variables de entorno en el archivo `.env`
4. Iniciar el servidor: `npm run dev`

## Uso

```http
# Resumir una URL
POST /api/summarize
Content-Type: application/json

{
  "message": "Puedes resumir esta página sobre inteligencia artificial: https://es.wikipedia.org/wiki/Inteligencia_artificial",
  "language": "es" 
}

# Resumir un archivo de audio
POST /api/summarize/audio
Content-Type: application/json

{
  "audioFilePath": "/path/to/your/audio/file.mp3"
}
```

## Documentación

La documentación de la API se encuentra en el archivo `samples/request.http`.

