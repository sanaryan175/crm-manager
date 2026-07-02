import { Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export class DashboardController {
  static async getMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await DashboardService.getMetrics(req.user!.organizationId);
      sendSuccess(res, metrics);
    } catch (error) { next(error); }
  }
}
