import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { CreateEmployeeInput, UpdateEmployeeInput } from '../schemas/employee.schema';
import { syncEmployeesToSheets } from '../services/sheets-sync.service';

export async function getEmployees(_req: Request, res: Response) {
  const employees = await prisma.employee.findMany({
    orderBy: { nombre: 'asc' },
  });

  const data = employees.map((e) => ({
    DNI: e.dni,
    NOMBRE: e.nombre,
    CARGO: e.cargo,
    AREA: e.area,
  }));

  res.json({ success: true, data });
}

export async function createEmployee(req: Request, res: Response) {
  const { DNI, NOMBRE, CARGO, AREA } = req.body as CreateEmployeeInput;

  const existing = await prisma.employee.findUnique({ where: { dni: DNI } });
  if (existing) {
    return res.status(409).json({ success: false, error: 'El DNI ya existe' });
  }

  await prisma.employee.create({
    data: {
      dni: DNI,
      nombre: NOMBRE,
      cargo: CARGO,
      area: AREA,
    },
  });

  res.status(201).json({ success: true });

  // Async sync (non-blocking)
  syncEmployeesToSheets().catch(() => {});
}

export async function updateEmployee(req: Request, res: Response) {
  const dni = req.params.dni as string;
  const { NOMBRE, CARGO, AREA } = req.body as UpdateEmployeeInput;

  const existing = await prisma.employee.findUnique({ where: { dni } });
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Empleado no encontrado' });
  }

  await prisma.employee.update({
    where: { dni },
    data: { nombre: NOMBRE, cargo: CARGO, area: AREA },
  });

  res.json({ success: true });

  syncEmployeesToSheets().catch(() => {});
}

export async function deleteEmployee(req: Request, res: Response) {
  const dni = req.params.dni as string;

  const existing = await prisma.employee.findUnique({ where: { dni } });
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Empleado no encontrado' });
  }

  await prisma.employee.delete({ where: { dni } });
  res.json({ success: true });

  syncEmployeesToSheets().catch(() => {});
}
