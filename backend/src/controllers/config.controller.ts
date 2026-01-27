import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { QrPointInput } from '../schemas/config.schema';
import { syncConfigToSheets } from '../services/sheets-sync.service';
import { logger } from '../lib/logger';

export async function getPoints(_req: Request, res: Response) {
  const points = await prisma.qrPoint.findMany({
    where: { activo: true },
  });

  const data = points.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    lat: p.lat,
    lng: p.lng,
    radio: p.radio,
    activo: p.activo,
  }));

  res.json({ success: true, data });
}

export async function savePoints(req: Request, res: Response) {
  const points = req.body as QrPointInput[];

  // Delete all existing points and replace with new ones (transaction)
  await prisma.$transaction(async (tx) => {
    await tx.qrPoint.deleteMany();

    for (const p of points) {
      await tx.qrPoint.create({
        data: {
          id: p.id,
          nombre: p.nombre,
          lat: p.lat,
          lng: p.lng,
          radio: p.radio,
          activo: p.activo ?? true,
        },
      });
    }
  });

  logger.info({ count: points.length }, 'Puntos QR actualizados');
  res.json({ success: true, count: points.length });

  syncConfigToSheets().catch(() => {});
}

export async function getSettings(_req: Request, res: Response) {
  const configs = await prisma.systemConfig.findMany();

  const data: Record<string, string> = {};
  configs.forEach((c) => {
    data[c.key] = c.value;
  });

  res.json({ success: true, data });
}

export async function updateSettings(req: Request, res: Response) {
  const settings = req.body as Record<string, string>;

  for (const [key, value] of Object.entries(settings)) {
    await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  logger.info({ keys: Object.keys(settings) }, 'Configuración actualizada');
  res.json({ success: true });
}
