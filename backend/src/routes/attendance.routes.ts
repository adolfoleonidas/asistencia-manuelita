import { Router } from 'express';
import { getAttendance, createAttendance } from '../controllers/attendance.controller';
import { validate } from '../middleware/validate';
import { createAttendanceSchema } from '../schemas/attendance.schema';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// Public endpoints: workers scan QR without login
router.get('/', asyncHandler(getAttendance));
router.post('/', validate(createAttendanceSchema), asyncHandler(createAttendance));

export default router;
