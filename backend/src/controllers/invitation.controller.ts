import { Request, Response, NextFunction } from 'express';
import { InvitationService } from '../services/invitation.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export class InvitationController {
  static async sendInvitation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InvitationService.sendInvitation(req.user!, req.body);
      sendSuccess(res, result, 'Invitation sent successfully', 201);
    } catch (error) { next(error); }
  }

  static async acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InvitationService.acceptInvitation(req.body);
      sendSuccess(res, result, 'Invitation accepted. Welcome aboard!');
    } catch (error) { next(error); }
  }

  static async listInvitations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const invitations = await InvitationService.listInvitations(req.user!.organizationId);
      sendSuccess(res, invitations);
    } catch (error) { next(error); }
  }

  static async revokeInvitation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InvitationService.revokeInvitation(
        req.params.id,
        req.user!.organizationId,
        req.user!.userId
      );
      sendSuccess(res, result, 'Invitation revoked');
    } catch (error) { next(error); }
  }
}
