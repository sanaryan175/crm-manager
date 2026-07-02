import { Response, NextFunction } from 'express';
import { DealService } from '../services/deal.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export class DealController {
  static async getDeals(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const deals = await DealService.getDeals(
        req.user!.organizationId, req.user!.userId, req.user!.roleName,
        { stage: req.query.stage as any }
      );
      sendSuccess(res, deals);
    } catch (error) { next(error); }
  }

  static async getDealById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const deal = await DealService.getDealById(req.params.id, req.user!.organizationId);
      sendSuccess(res, deal);
    } catch (error) { next(error); }
  }

  static async createDeal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const deal = await DealService.createDeal(
        req.user!.organizationId, req.user!.userId, req.body
      );
      sendSuccess(res, deal, 'Deal created successfully', 201);
    } catch (error) { next(error); }
  }

  static async updateDeal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const deal = await DealService.updateDeal(
        req.params.id, req.user!.organizationId,
        req.user!.userId, req.user!.roleName, req.body
      );
      sendSuccess(res, deal, 'Deal updated successfully');
    } catch (error) { next(error); }
  }

  static async updateDealStage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { stage, closeReason } = req.body;
      const deal = await DealService.updateDealStage(
        req.params.id, req.user!.organizationId, stage, closeReason
      );
      sendSuccess(res, deal, 'Deal stage updated');
    } catch (error) { next(error); }
  }

  static async deleteDeal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await DealService.deleteDeal(req.params.id, req.user!.organizationId);
      sendSuccess(res, result, 'Deal deleted successfully');
    } catch (error) { next(error); }
  }
}
