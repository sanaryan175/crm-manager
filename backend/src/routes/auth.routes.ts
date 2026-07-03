import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate, requireOwner } from '../middleware/auth';
import {
  registerSchema,
  organizationSetupSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validations/auth.validation';

const router = Router();

router.post('/register',           validate(registerSchema),             AuthController.register);
router.post('/login',              validate(loginSchema),                AuthController.login);
router.post('/setup',              authenticate, requireOwner, validate(organizationSetupSchema), AuthController.setup);
router.get('/me',                  authenticate,                         AuthController.getMe);
router.patch('/me',                authenticate, validate(updateProfileSchema),     AuthController.updateMe);
router.post('/change-password',    authenticate, validate(changePasswordSchema),    AuthController.changePassword);
router.post('/complete-onboarding', authenticate,                         AuthController.completeOnboarding);

export default router;
