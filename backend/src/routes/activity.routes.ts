import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { validate } from '../middleware/validate';
import { createActivitySchema, updateActivitySchema } from '../validations/activity.validation';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/',             requirePermission('activity.read'),   ActivityController.getActivities);
router.post('/',            requirePermission('activity.create'), validate(createActivitySchema),  ActivityController.createActivity);
router.get('/:id',          requirePermission('activity.read'),   ActivityController.getActivityById);
router.put('/:id',          requirePermission('activity.update'), validate(updateActivitySchema),  ActivityController.updateActivity);
router.put('/:id/complete', requirePermission('activity.update'), ActivityController.completeActivity);
router.delete('/:id',       requirePermission('activity.delete'), ActivityController.deleteActivity);

export default router;
