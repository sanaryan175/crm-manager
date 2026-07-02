import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export class UserController {
  static async listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await UserService.listUsers(req.user!.organizationId);
      sendSuccess(res, users);
    } catch (error) { next(error); }
  }

  static async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.getUserById(req.params.id, req.user!.organizationId);
      sendSuccess(res, user);
    } catch (error) { next(error); }
  }

  static async changeUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.changeUserRole(
        req.params.id,
        req.user!.organizationId,
        req.body.roleId,
        req.user!.roleName
      );
      sendSuccess(res, user, 'Role updated successfully');
    } catch (error) { next(error); }
  }

  static async deactivateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await UserService.deactivateUser(
        req.params.id,
        req.user!.organizationId,
        req.user!.userId,
        req.user!.roleName
      );
      sendSuccess(res, result, 'User deactivated');
    } catch (error) { next(error); }
  }
}
