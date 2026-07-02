import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protect dashboard routes
router.use(authenticate);

router.get('/metrics', DashboardController.getMetrics);

export default router;
