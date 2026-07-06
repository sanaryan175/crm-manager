import { Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export class NotificationController {
  static async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await NotificationService.getNotifications(req.user!.userId, req.user!.organizationId);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }
}
