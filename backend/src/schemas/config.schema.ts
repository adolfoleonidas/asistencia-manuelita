import { z } from 'zod';

export const qrPointSchema = z.object({
  id: z.string().min(1).max(100),
  nombre: z.string().min(1).max(200),
  lat: z.number(),
  lng: z.number(),
  radio: z.number().int().positive().default(150),
  activo: z.boolean().default(true),
});

export const savePointsSchema = z.array(qrPointSchema);

export const updateSettingsSchema = z.record(z.string(), z.string());

export type QrPointInput = z.infer<typeof qrPointSchema>;
