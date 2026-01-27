import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { CreateUserInput, UpdateUserInput } from '../schemas/user.schema';
import { logger } from '../lib/logger';

export async function getUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    where: { activo: true },
    orderBy: { fechaCreacion: 'asc' },
  });

  const data = users.map((u) => ({
    id: u.id,
    username: u.username,
    nombre: u.nombre,
    rol: u.rol,
    createdAt: u.fechaCreacion.toISOString(),
    activo: u.activo,
  }));

  res.json({ success: true, data });
}

export async function createUser(req: Request, res: Response) {
  const { username, password, nombre, rol } = req.body as CreateUserInput;

  const existing = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });
  if (existing) {
    return res.status(409).json({ success: false, error: 'El usuario ya existe' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      username: username.toLowerCase(),
      passwordHash,
      nombre,
      rol,
    },
  });

  logger.info({ username: user.username, rol }, 'Usuario creado');
  res.status(201).json({ success: true, id: user.id });
}

export async function updateUser(req: Request, res: Response) {
  const id = req.params.id as string;
  const { username, password, nombre, rol } = req.body as UpdateUserInput;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  }

  const updateData: any = {};
  if (username) updateData.username = username.toLowerCase();
  if (nombre) updateData.nombre = nombre;
  if (rol) updateData.rol = rol;
  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 12);
  }

  await prisma.user.update({ where: { id }, data: updateData });
  logger.info({ id, username: username || existing.username }, 'Usuario actualizado');
  res.json({ success: true });
}

export async function deleteUser(req: Request, res: Response) {
  const id = req.params.id as string;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  }

  // Soft delete
  await prisma.user.update({
    where: { id },
    data: { activo: false },
  });

  logger.info({ id, username: existing.username }, 'Usuario desactivado');
  res.json({ success: true });
}
