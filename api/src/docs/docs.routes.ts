import { Router, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { openApiSpec } from './openapi';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsRouter = Router();

// --- Swagger UI ---
docsRouter.use(
  '/swagger',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec as unknown as swaggerUi.JsonObject, {
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { font-size: 28px; font-weight: 800; }
      .swagger-ui .info .description p { font-size: 14px; line-height: 1.6; }
      .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #3B82F6; }
      .swagger-ui .opblock.opblock-get .opblock-summary { border-color: #10B981; }
      .swagger-ui .btn.execute { background-color: #FF6B35; border-color: #FF6B35; }
      .swagger-ui .btn.execute:hover { background-color: #E55A2B; }
    `,
    customSiteTitle: 'Pasta la Vista — Swagger UI',
    customfavIcon: '',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  })
);

// --- OpenAPI JSON ---
docsRouter.get('/openapi.json', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

// --- ReDoc ---
docsRouter.get('/redoc', (_req: Request, res: Response) => {
  const htmlPath = path.join(__dirname, 'redoc.html');

  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    // Fallback: serve ReDoc inline
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pasta la Vista — ReDoc</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>body { margin: 0; font-family: 'Inter', sans-serif; }</style>
      </head>
      <body>
        <redoc spec-url="/docs/openapi.json" expand-responses="200,201"></redoc>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
      </body>
      </html>
    `);
  }
});

// --- Custom API Reference (HTML estilizado) ---
docsRouter.get('/', (_req: Request, res: Response) => {
  const htmlPath = path.join(__dirname, 'api-reference.html');

  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    res.redirect('/docs/swagger');
  }
});

export default docsRouter;
