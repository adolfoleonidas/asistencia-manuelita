import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número');

export const createUserSchema = z.object({
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres').max(50),
  password: passwordSchema,
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
  rol: z.enum(['admin', 'super_admin']).default('admin'),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  password: passwordSchema.optional().nullable(),
  nombre: z.string().min(1).max(200).optional(),
  rol: z.enum(['admin', 'super_admin']).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
