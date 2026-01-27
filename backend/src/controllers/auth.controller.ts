import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { LoginInput } from '../schemas/auth.schema';
import { logger } from '../lib/logger';

export async function login(req: Request, res: Response) {
  const { username, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });

  if (!user || !user.activo) {
    logger.warn({ username }, 'Login fallido: usuario no encontrado o inactivo');
    return res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos' });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    logger.warn({ username }, 'Login fallido: contraseña incorrecta');
    return res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos' });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, rol: user.rol },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRATION } as jwt.SignOptions
  );

  logger.info({ username, rol: user.rol }, 'Login exitoso');

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        rol: user.rol,
        createdAt: user.fechaCreacion.toISOString(),
      },
    },
  });
}
