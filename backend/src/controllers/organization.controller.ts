import { Response, NextFunction } from 'express';
import { OrganizationService } from '../services/organization.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export class OrganizationController {
  static async getOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await OrganizationService.getOrganization(req.user!.organizationId);
      sendSuccess(res, org);
    } catch (error) { next(error); }
  }

  static async updateOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await OrganizationService.updateOrganization(req.user!.organizationId, req.body);
      sendSuccess(res, org, 'Organization updated successfully');
    } catch (error) { next(error); }
  }

  static async listRoles(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await OrganizationService.listRoles(req.user!.organizationId);
      sendSuccess(res, roles);
    } catch (error) { next(error); }
  }

  static async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await OrganizationService.getAuditLogs(req.user!.organizationId, limit);
      sendSuccess(res, logs);
    } catch (error) { next(error); }
  }
}
