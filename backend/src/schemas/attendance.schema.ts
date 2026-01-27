import { z } from 'zod';

export const createAttendanceSchema = z.object({
  dni: z.string().regex(/^\d{8}$/, 'El DNI debe tener exactamente 8 dígitos'),
  nombre: z.string().min(1).max(200),
  cargo: z.string().max(100).default(''),
  tipo: z.enum(['ENTRADA', 'SALIDA']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha: YYYY-MM-DD'),
  time: z.string().min(1),
  punto: z.string().max(100).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const attendanceQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
