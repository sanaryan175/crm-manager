import { Response, NextFunction } from 'express';
import fs from 'fs';
import { FileService } from '../services/file.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { BadRequestError } from '../utils/errors';

export class FileController {
  static async upload(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) throw new BadRequestError('No file provided');
      const file = await FileService.uploadFile(
        req.user!.organizationId, req.user!.userId,
        req.file, (req.body.folder as string) || '/'
      );
      sendSuccess(res, file, 'File uploaded successfully', 201);
    } catch (error) { next(error); }
  }

  static async uploadMultiple(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.files || !(req.files as Express.Multer.File[]).length) {
        throw new BadRequestError('No files provided');
      }
      const files = await Promise.all(
        (req.files as Express.Multer.File[]).map(file =>
          FileService.uploadFile(
            req.user!.organizationId, req.user!.userId,
            file, (req.body.folder as string) || '/'
          )
        )
      );
      sendSuccess(res, files, `Uploaded ${files.length} files successfully`, 201);
    } catch (error) { next(error); }
  }

  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const folder = (req.query.folder as string) || '/';
      const files = await FileService.getFiles(req.user!.organizationId, folder);
      sendSuccess(res, files);
    } catch (error) { next(error); }
  }

  static async listAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await FileService.getFolderStructure(req.user!.organizationId);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = await FileService.getFileById(req.params.id, req.user!.organizationId);
      sendSuccess(res, file);
    } catch (error) { next(error); }
  }

  static async download(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = await FileService.getFileById(req.params.id, req.user!.organizationId);
      const filePath = FileService.getFilePath(file);
      if (!fs.existsSync(filePath)) throw new BadRequestError('File not found on disk');
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      stream.on('error', () => {
        if (!res.headersSent) res.status(500).json({ success: false, message: 'Error streaming file' });
      });
    } catch (error) { next(error); }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await FileService.deleteFile(req.params.id, req.user!.organizationId);
      sendSuccess(res, result, 'File deleted successfully');
    } catch (error) { next(error); }
  }

  static async folders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const folders = await FileService.getFolders(req.user!.organizationId);
      sendSuccess(res, folders);
    } catch (error) { next(error); }
  }
}
