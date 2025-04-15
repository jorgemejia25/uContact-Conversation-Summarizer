# Web Scrapping API

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
