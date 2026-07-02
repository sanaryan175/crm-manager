import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/',           requirePermission('user.read'),   UserController.listUsers);
router.get('/:id',        requirePermission('user.read'),   UserController.getUserById);
router.patch('/:id/role', requirePermission('user.update'), UserController.changeUserRole);
router.delete('/:id',     requirePermission('user.remove'), UserController.deactivateUser);

export default router;
