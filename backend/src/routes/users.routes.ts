import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/users.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.get('/', requireAuth, requireRole('super_admin'), asyncHandler(getUsers));
router.post('/', requireAuth, requireRole('super_admin'), validate(createUserSchema), asyncHandler(createUser));
router.put('/:id', requireAuth, requireRole('super_admin'), validate(updateUserSchema), asyncHandler(updateUser));
router.delete('/:id', requireAuth, requireRole('super_admin'), asyncHandler(deleteUser));

export default router;
