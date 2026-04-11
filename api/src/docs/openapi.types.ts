/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Minimal subset of OpenAPI v3 types sufficient for our spec.
 * We define our own instead of pulling in a full library dependency.
 */

export interface OpenAPIV3 {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    contact?: { name?: string; email?: string; url?: string };
    license?: { name: string; url?: string };
  };
  servers: { url: string; description: string }[];
  tags: { name: string; description: string }[];
  paths: Record<string, Record<string, any>>;
  components: {
    securitySchemes?: Record<string, any>;
    schemas?: Record<string, any>;
    responses?: Record<string, any>;
  };
}
