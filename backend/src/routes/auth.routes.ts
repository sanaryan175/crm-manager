import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validations/auth.validation';

const router = Router();

router.post('/register',        validate(registerSchema),        AuthController.register);
router.post('/login',           validate(loginSchema),           AuthController.login);
router.get('/me',               authenticate,                    AuthController.getMe);
router.patch('/me',             authenticate, validate(updateProfileSchema),  AuthController.updateMe);
router.post('/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);

export default router;
