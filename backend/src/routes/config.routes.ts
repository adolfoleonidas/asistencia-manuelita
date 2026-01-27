import { Router } from 'express';
import { getPoints, savePoints, getSettings, updateSettings } from '../controllers/config.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { savePointsSchema, updateSettingsSchema } from '../schemas/config.schema';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// Points: GET is public (marcar.html needs it), PUT requires super_admin
router.get('/points', asyncHandler(getPoints));
router.put('/points', requireAuth, requireRole('super_admin'), validate(savePointsSchema), asyncHandler(savePoints));

// Settings: requires super_admin
router.get('/settings', requireAuth, requireRole('super_admin'), asyncHandler(getSettings));
router.put('/settings', requireAuth, requireRole('super_admin'), validate(updateSettingsSchema), asyncHandler(updateSettings));

export default router;
