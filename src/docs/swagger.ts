import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "SpaceX Launches API",
            version: "1.0.0",
            description:
                "REST API para consultar lanzamientos de SpaceX almacenados en DynamoDB. Los datos son sincronizados periódicamente desde la API pública de SpaceX mediante una AWS Lambda.",
        },
        servers: [
            {
                url: "http://spacex-backend-alb-574561858.us-east-2.elb.amazonaws.com",
                description: "Producción (AWS ECS Fargate)",
            },
            {
                url: "http://localhost:4000",
                description: "Local",
            },
        ],
        components: {
            schemas: {
                Launch: {
                    type: "object",
                    properties: {
                        launch_id: { type: "string", example: "5eb87cd9ffd86e000604b32a" },
                        mission_name: { type: "string", example: "FalconSat" },
                        flight_number: { type: "integer", example: 1 },
                        date_utc: { type: "string", format: "date-time", example: "2006-03-24T22:30:00.000Z" },
                        date_local: { type: "string", example: "2006-03-25T10:30:00+12:00" },
                        status: { type: "string", enum: ["success", "failed", "upcoming", "unknown"], example: "success" },
                        upcoming: { type: "boolean", example: false },
                        success: { type: "boolean", nullable: true, example: true },
                        details: { type: "string", nullable: true, example: "Engine failure at T+33 seconds" },
                        launchpad_id: { type: "string", example: "5e9e4502f5090995de566f86" },
                        rocket_id: { type: "string", example: "5e9d0d95eda69955f709d1eb" },
                        article: { type: "string", nullable: true, example: "https://example.com/article" },
                        webcast: { type: "string", nullable: true, example: "https://youtube.com/watch?v=xyz" },
                        wikipedia: { type: "string", nullable: true, example: "https://en.wikipedia.org/wiki/FalconSat" },
                        patch_small: { type: "string", nullable: true, example: "https://images2.imgbox.com/3c/0e/T8iJcSN3_o.png" },
                        patch_large: { type: "string", nullable: true, example: "https://images2.imgbox.com/40/e3/GypSkayF_o.png" },
                    },
                },
                Summary: {
                    type: "object",
                    properties: {
                        total: { type: "integer", example: 205 },
                        success: { type: "integer", example: 183 },
                        failed: { type: "integer", example: 9 },
                        upcoming: { type: "integer", example: 8 },
                        unknown: { type: "integer", example: 5 },
                    },
                },
                ByYearItem: {
                    type: "object",
                    properties: {
                        year: { type: "integer", example: 2023 },
                        success: { type: "integer", example: 19 },
                        failed: { type: "integer", example: 0 },
                    },
                },
                HealthResponse: {
                    type: "object",
                    properties: {
                        status: { type: "string", example: "ok" },
                        ts: { type: "string", format: "date-time", example: "2024-01-01T00:00:00.000Z" },
                    },
                },
                ValidationError: {
                    type: "object",
                    properties: {
                        error: { type: "string", example: "Invalid query params" },
                        details: { type: "object" },
                    },
                },
                NotFoundError: {
                    type: "object",
                    properties: {
                        error: { type: "string", example: "Launch not found" },
                    },
                },
            },
        },
        paths: {
            "/health": {
                get: {
                    summary: "Health check",
                    description: "Verifica que el servicio esté corriendo.",
                    tags: ["Health"],
                    responses: {
                        "200": {
                            description: "Servicio saludable",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/HealthResponse" },
                                },
                            },
                        },
                    },
                },
            },
            "/launches": {
                get: {
                    summary: "Listar lanzamientos",
                    description: `
Retorna una lista paginada de lanzamientos con filtros opcionales por estado, año y búsqueda de texto.

**Comportamiento general**

- Si no envías **ningún parámetro de query** → se devuelven **todos los lanzamientos** (hasta \`limit\`, por defecto 200).
- Si envías solo \`status\` → se devuelven solo los lanzamientos con ese **estado**.
- Si envías solo \`year\` → se devuelven los lanzamientos de ese **año**.
- Si envías \`search\` → se filtra por texto en el **nombre de la misión**.
- Puedes combinar filtros entre sí (\`status\` + \`year\` + \`search\`).
- \`limit\` controla cuántos resultados se devuelven (1–500, por defecto 200).
- \`offset\` permite paginar resultados (por defecto 0).

**Ejemplos de uso**

- Todos los lanzamientos (máx. 200):
  \`GET /launches\`

- Lanzamientos del año 2010 (50 resultados):
  \`GET /launches?year=2010&limit=50&offset=0\`

- Lanzamientos **exitosos** del año 2022:
  \`GET /launches?status=success&year=2022&limit=50&offset=0\`

- Buscar misiones "Starlink" en 2023:
  \`GET /launches?search=Starlink&year=2023&limit=100&offset=0\`
    `,
                    tags: ["Launches"],
                    parameters: [
                        {
                            name: "status",
                            in: "query",
                            description: "Filtrar por estado del lanzamiento. Si se omite, se incluyen todos los estados.",
                            schema: {
                                type: "string",
                                enum: ["success", "failed", "upcoming", "unknown"],
                                example: "success",
                            },
                        },
                        {
                            name: "year",
                            in: "query",
                            description: "Filtrar por año (1950–2100). Si se omite, se incluyen todos los años.",
                            schema: {
                                type: "integer",
                                minimum: 1950,
                                maximum: 2100,
                                example: 2023,
                            },
                        },
                        {
                            name: "search",
                            in: "query",
                            description:
                                "Búsqueda de texto en el nombre de la misión (máx. 100 caracteres). Si se omite, no se filtra por texto.",
                            schema: {
                                type: "string",
                                maxLength: 100,
                                example: "Starlink",
                            },
                        },
                        {
                            name: "limit",
                            in: "query",
                            description:
                                "Cantidad de resultados a retornar (1–500). Si se omite, el valor por defecto es 200.",
                            schema: {
                                type: "integer",
                                minimum: 1,
                                maximum: 500,
                                default: 200,
                                example: 50,
                            },
                        },
                        {
                            name: "offset",
                            in: "query",
                            description:
                                "Desplazamiento para paginación. Si se omite, el valor por defecto es 0.",
                            schema: {
                                type: "integer",
                                minimum: 0,
                                default: 0,
                                example: 0,
                            },
                        },
                    ],
                    responses: {
                        "200": {
                            description: "Lista de lanzamientos",
                            content: {
                                "application/json": {
                                    schema: { type: "array", items: { $ref: "#/components/schemas/Launch" } },
                                },
                            },
                        },
                        "400": {
                            description: "Parámetros de query inválidos",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/ValidationError" },
                                },
                            },
                        },
                    },
                },
            },
            "/launches/{id}": {
                get: {
                    summary: "Obtener lanzamiento por ID",
                    description: "Retorna un lanzamiento específico por su ID de SpaceX.",
                    tags: ["Launches"],
                    parameters: [
                        {
                            name: "id",
                            in: "path",
                            required: true,
                            description: "ID único del lanzamiento",
                            schema: { type: "string", example: "5eb87cd9ffd86e000604b32a" },
                        },
                    ],
                    responses: {
                        "200": {
                            description: "Lanzamiento encontrado",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/Launch" },
                                },
                            },
                        },
                        "404": {
                            description: "Lanzamiento no encontrado",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/NotFoundError" },
                                },
                            },
                        },
                    },
                },
            },
            "/stats/summary": {
                get: {
                    summary: "Resumen estadístico",
                    description: "Retorna conteos totales de lanzamientos agrupados por estado.",
                    tags: ["Stats"],
                    responses: {
                        "200": {
                            description: "Resumen de lanzamientos",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/Summary" },
                                },
                            },
                        },
                    },
                },
            },
            "/stats/by-year": {
                get: {
                    summary: "Lanzamientos por año",
                    description: `
Retorna el conteo de lanzamientos agrupados por año.

**Comportamiento**

- Agrupa los lanzamientos históricos por año calendario.
- Devuelve únicamente lanzamientos con estado **success** y **failed**.
- Los lanzamientos con estado **upcoming** o **unknown** no se incluyen en el conteo histórico.
- El resultado está ordenado por año ascendente.
- No recibe parámetros de query.

**¿Qué representa cada campo?**

- \`year\` → Año del lanzamiento.
- \`success\` → Número total de lanzamientos exitosos en ese año.
- \`failed\` → Número total de lanzamientos fallidos en ese año.

**Casos de uso**

Este endpoint es ideal para:

- Construir gráficos de tendencia (líneas o barras).
- Analizar evolución histórica del éxito de SpaceX.
- Comparar rendimiento entre años.

**Ejemplo de respuesta**

\`\`\`json
[
  { "year": 2018, "success": 21, "failed": 0 },
  { "year": 2019, "success": 13, "failed": 1 },
  { "year": 2020, "success": 26, "failed": 0 },
  { "year": 2021, "success": 31, "failed": 0 }
]
\`\`\`
    `,
                    tags: ["Stats"],
                    responses: {
                        "200": {
                            description: "Lanzamientos agrupados por año",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/ByYearItem" },
                                    },
                                    examples: {
                                        yearlyStats: {
                                            summary: "Ejemplo de agrupación anual",
                                            value: [
                                                { year: 2018, success: 21, failed: 0 },
                                                { year: 2019, success: 13, failed: 1 },
                                                { year: 2020, success: 26, failed: 0 },
                                                { year: 2021, success: 31, failed: 0 },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customSiteTitle: "SpaceX API Docs",
        customCss: `
/* Aumentar tamaño del texto del description */
.swagger-ui .opblock-description-wrapper p,
.swagger-ui .opblock-description-wrapper li {
  font-size: 15px !important;
  line-height: 1.6 !important;
}

/* Hacer más grande el título interno */
.swagger-ui .opblock-description-wrapper h4 {
  font-size: 17px !important;
  margin-top: 15px !important;
}

/* Mejor contraste en dark mode */
.swagger-ui {
  color: #ffffff;
}

.swagger-ui .opblock-description-wrapper {
  color: #ffffff !important;
}

/* En modo claro forzar negro */
@media (prefers-color-scheme: light) {
  .swagger-ui,
  .swagger-ui .opblock-description-wrapper {
    color: #000000 !important;
  }
}
`
    }));

    // Endpoint para obtener el JSON del spec (útil para herramientas externas)
    app.get("/api-docs.json", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });
}