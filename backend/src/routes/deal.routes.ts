import { Router } from 'express';
import { DealController } from '../controllers/deal.controller';
import { validate } from '../middleware/validate';
import { createDealSchema, updateDealSchema, updateDealStageSchema } from '../validations/deal.validation';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/',           requirePermission('deal.read'),   DealController.getDeals);
router.post('/',          requirePermission('deal.create'), validate(createDealSchema),      DealController.createDeal);
router.get('/:id',        requirePermission('deal.read'),   DealController.getDealById);
router.put('/:id',        requirePermission('deal.update'), validate(updateDealSchema),      DealController.updateDeal);
router.put('/:id/stage',  requirePermission('deal.update'), validate(updateDealStageSchema), DealController.updateDealStage);
router.delete('/:id',     requirePermission('deal.delete'), DealController.deleteDeal);

export default router;
