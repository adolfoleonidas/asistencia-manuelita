import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import employeesRoutes from './employees.routes';
import attendanceRoutes from './attendance.routes';
import usersRoutes from './users.routes';
import configRoutes from './config.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/employees', employeesRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/users', usersRoutes);
router.use('/config', configRoutes);

router.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

export default router;
