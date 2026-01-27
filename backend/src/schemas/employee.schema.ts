import { z } from 'zod';

export const createEmployeeSchema = z.object({
  DNI: z.string().regex(/^\d{8}$/, 'El DNI debe tener exactamente 8 dígitos'),
  NOMBRE: z.string().min(1, 'El nombre es requerido').max(200),
  CARGO: z.string().min(1, 'El cargo es requerido').max(100),
  AREA: z.string().min(1, 'El área es requerida').max(100),
});

export const updateEmployeeSchema = z.object({
  NOMBRE: z.string().min(1).max(200),
  CARGO: z.string().min(1).max(100),
  AREA: z.string().min(1).max(100),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
