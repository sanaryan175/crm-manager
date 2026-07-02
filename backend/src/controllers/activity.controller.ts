import { Response, NextFunction } from 'express';
import { ActivityService } from '../services/activity.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export class ActivityController {
  static async getActivities(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { contactId, dealId, type } = req.query;
      const activities = await ActivityService.getActivities(
        req.user!.organizationId, req.user!.userId, req.user!.roleName,
        { contactId: contactId as string, dealId: dealId as string, type: type as any }
      );
      sendSuccess(res, activities);
    } catch (error) { next(error); }
  }

  static async getActivityById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const activity = await ActivityService.getActivityById(req.params.id, req.user!.organizationId);
      sendSuccess(res, activity);
    } catch (error) { next(error); }
  }

  static async createActivity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const activity = await ActivityService.createActivity(
        req.user!.organizationId, req.user!.userId, req.body
      );
      sendSuccess(res, activity, 'Activity created successfully', 201);
    } catch (error) { next(error); }
  }

  static async updateActivity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const activity = await ActivityService.updateActivity(
        req.params.id, req.user!.organizationId,
        req.user!.userId, req.user!.roleName, req.body
      );
      sendSuccess(res, activity, 'Activity updated');
    } catch (error) { next(error); }
  }

  static async completeActivity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const activity = await ActivityService.completeActivity(
        req.params.id, req.user!.organizationId, req.body.completed
      );
      sendSuccess(res, activity, 'Activity completion updated');
    } catch (error) { next(error); }
  }

  static async deleteActivity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ActivityService.deleteActivity(req.params.id, req.user!.organizationId);
      sendSuccess(res, result, 'Activity deleted');
    } catch (error) { next(error); }
  }
}
