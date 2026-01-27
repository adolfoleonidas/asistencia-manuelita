import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { CreateAttendanceInput } from '../schemas/attendance.schema';
import { syncAttendanceToSheets } from '../services/sheets-sync.service';

export async function getAttendance(req: Request, res: Response) {
  const { date } = req.query;

  const where = date ? { fecha: date as string } : {};

  const records = await prisma.attendance.findMany({
    where,
    orderBy: { timestamp: 'desc' },
  });

  const data = records.map((r) => ({
    id: r.id,
    dni: r.dni,
    nombre: r.nombre,
    cargo: r.cargo,
    tipo: r.tipo,
    date: r.fecha,
    time: r.hora,
    punto: r.punto,
    lat: r.lat,
    lng: r.lng,
    timestamp: r.timestamp.toISOString(),
  }));

  res.json({ success: true, data });
}

export async function createAttendance(req: Request, res: Response) {
  const { dni, nombre, cargo, tipo, date, time, punto, lat, lng } = req.body as CreateAttendanceInput;

  // Check daily limit: max 1 ENTRADA + 1 SALIDA per day per employee
  const todayRecords = await prisma.attendance.findMany({
    where: { dni, fecha: date },
  });

  const hasEntrada = todayRecords.some((r) => r.tipo === 'ENTRADA');
  const hasSalida = todayRecords.some((r) => r.tipo === 'SALIDA');

  if (hasEntrada && hasSalida) {
    return res.status(409).json({
      success: false,
      error: 'Ya registraste entrada y salida hoy',
    });
  }

  if (tipo === 'ENTRADA' && hasEntrada) {
    return res.status(409).json({
      success: false,
      error: 'Ya registraste entrada hoy',
    });
  }

  if (tipo === 'SALIDA' && hasSalida) {
    return res.status(409).json({
      success: false,
      error: 'Ya registraste salida hoy',
    });
  }

  const record = await prisma.attendance.create({
    data: {
      dni,
      nombre,
      cargo: cargo || '',
      tipo,
      fecha: date,
      hora: time,
      punto: punto || null,
      lat: lat || null,
      lng: lng || null,
    },
  });

  res.status(201).json({
    success: true,
    data: {
      id: record.id,
      dni: record.dni,
      nombre: record.nombre,
      cargo: record.cargo,
      tipo: record.tipo,
      date: record.fecha,
      time: record.hora,
      punto: record.punto,
      lat: record.lat,
      lng: record.lng,
      timestamp: record.timestamp.toISOString(),
    },
  });

  // Async sync (non-blocking)
  syncAttendanceToSheets().catch(() => {});
}
