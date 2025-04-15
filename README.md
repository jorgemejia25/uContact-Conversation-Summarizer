# Web Scrapping API


## Description

This project provides an API that summarizes web content through messages containing URLs. It leverages OpenAI's API to generate summaries in multiple languages, designed for integration with call centers, chatbots, or any system requiring automated web content analysis.

## Features

- URL extraction from free-form messages using regex pattern matching
- Web content scraping with proper headers and timeout handling
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
- **OpenAI API**: GPT-3.5-turbo for summary generation

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

## Descripción

El proyecto consta de un API que permite resumir el contenido de una página web a través de un mensaje que puede contener una URL. Esto funcionando con el uso de la API de OpenAI para generar resúmenes, permitiendo la integración con posibles Call Centers o Chatbots, para poder obtener el contenido de una página web y resumirlo de manera eficiente sin tener que ingresar manualmente el contenido de la página web.

## Características

- Resumen de contenido de una página web a través de un mensaje que puede contener una URL.
- Uso de la API de OpenAI para generar resúmenes.
- Integración con posibles Call Centers o Chatbots.
- Obtención del contenido de una página web y resumirlo de manera eficiente.
- Sin necesidad de ingresar manualmente el contenido de la página web.

## Detalles técnicos

- Se utiliza el framework Fastify para el desarrollo del API.
- Se utiliza Dependency Injection para la inyección de dependencias de forma basada en NestJS.
- Se utiliza el paquete axios para hacer peticiones HTTP.
- Se utiliza el paquete cheerio para parsear HTML.

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
POST /api/summarize
Content-Type: application/json

{
  "message": "Puedes resumir esta página sobre inteligencia artificial: https://es.wikipedia.org/wiki/Inteligencia_artificial",
  "language": "es" 
}
```

## Documentación

La documentación de la API se encuentra en el archivo `samples/request.http`.

