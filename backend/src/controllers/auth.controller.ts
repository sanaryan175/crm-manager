import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { OnboardingService } from '../services/onboarding.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  // POST /auth/register — creates org shell + owner user
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await OnboardingService.registerOwner(req.body);
      sendSuccess(res, result, 'Account created successfully', 201);
    } catch (error) { next(error); }
  }

  // POST /auth/setup — completes org setup wizard (owner only, requiresSetup gate)
  static async setup(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await OnboardingService.completeSetup(
        req.user!.organizationId,
        req.user!.userId,
        req.body
      );
      sendSuccess(res, org, 'Organization setup complete');
    } catch (error) { next(error); }
  }

  // POST /auth/login
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      sendSuccess(res, result, 'Logged in successfully');
    } catch (error) { next(error); }
  }

  // GET /auth/me
  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.getUserProfile(req.user!.userId, req.user!.organizationId);
      sendSuccess(res, user);
    } catch (error) { next(error); }
  }

  // PATCH /auth/me
  static async updateMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.updateProfile(req.user!.userId, req.user!.organizationId, req.body);
      sendSuccess(res, user, 'Profile updated');
    } catch (error) { next(error); }
  }

  // POST /auth/change-password
  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.changePassword(req.user!.userId, req.user!.organizationId, req.body);
      sendSuccess(res, result, 'Password changed successfully');
    } catch (error) { next(error); }
  }

  // POST /auth/complete-onboarding
  static async completeOnboarding(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.completeOnboarding(
        req.user!.userId, 
        req.user!.organizationId,
        req.body
      );
      sendSuccess(res, user, 'Onboarding complete');
    } catch (error) { next(error); }
  }
}
