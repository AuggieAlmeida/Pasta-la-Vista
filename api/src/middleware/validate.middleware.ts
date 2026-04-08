import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validateMiddleware = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      const formattedErrors = error.errors?.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      })) || [];

      res.status(400).json({
        status: 'error',
        message: 'Dados inválidos',
        errors: formattedErrors,
      });
    }
  };
};
