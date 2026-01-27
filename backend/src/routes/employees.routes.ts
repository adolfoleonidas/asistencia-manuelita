import { Router } from 'express';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../controllers/employees.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createEmployeeSchema, updateEmployeeSchema } from '../schemas/employee.schema';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// GET and POST are public (marcar.html registers and looks up employees without login)
router.get('/', asyncHandler(getEmployees));
router.post('/', validate(createEmployeeSchema), asyncHandler(createEmployee));
router.put('/:dni', requireAuth, validate(updateEmployeeSchema), asyncHandler(updateEmployee));
router.delete('/:dni', requireAuth, asyncHandler(deleteEmployee));

export default router;
