import { Response, NextFunction } from 'express';
import { ContactService } from '../services/contact.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export class ContactController {
  static async getContacts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, source, q } = req.query;
      const contacts = await ContactService.getContacts(
        req.user!.organizationId,
        req.user!.userId,
        req.user!.roleName,
        { status: status as any, source: source as any, search: q as string }
      );
      sendSuccess(res, contacts);
    } catch (error) { next(error); }
  }

  static async getContactById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const contact = await ContactService.getContactById(req.params.id, req.user!.organizationId);
      sendSuccess(res, contact);
    } catch (error) { next(error); }
  }

  static async createContact(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const contact = await ContactService.createContact(
        req.user!.organizationId, req.user!.userId, req.body
      );
      sendSuccess(res, contact, 'Contact created successfully', 201);
    } catch (error) { next(error); }
  }

  static async updateContact(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const contact = await ContactService.updateContact(
        req.params.id, req.user!.organizationId,
        req.user!.userId, req.user!.roleName, req.body
      );
      sendSuccess(res, contact, 'Contact updated successfully');
    } catch (error) { next(error); }
  }

  static async deleteContact(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ContactService.deleteContact(req.params.id, req.user!.organizationId);
      sendSuccess(res, result, 'Contact deleted successfully');
    } catch (error) { next(error); }
  }

  static async bulkOperations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { action, ids, data } = req.body;
      const result = await ContactService.bulkOperations(
        req.user!.organizationId, action, ids, data
      );
      sendSuccess(res, result, 'Bulk operation completed');
    } catch (error) { next(error); }
  }
}
