import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/http-error';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: 'VALIDATION', message: 'Invalid input', details: err.flatten() },
    });
  }
  if (err instanceof AppError) {
    return res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal error' } });
};
