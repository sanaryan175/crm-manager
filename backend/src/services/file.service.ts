import path from 'path';
import fs from 'fs/promises';
import prisma from '../config/db';
import { NotFoundError } from '../utils/errors';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

function normalizeFolder(folder: string): string {
  let f = folder.replace(/\\/g, '/');
  if (!f.startsWith('/')) f = `/${f}`;
  if (f.length > 1 && f.endsWith('/')) f = f.slice(0, -1);
  return f;
}

export class FileService {
  static async ensureUploadsDir() {
    await fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(() => {});
  }

  static async uploadFile(
    organizationId: string,
    uploadedById: string,
    file: Express.Multer.File,
    folder: string = '/'
  ) {
    await this.ensureUploadsDir();

    const normalizedFolder = normalizeFolder(folder);
    const orgDir = path.join(UPLOADS_DIR, organizationId, ...normalizedFolder.split('/').filter(Boolean));
    await fs.mkdir(orgDir, { recursive: true });

    const timestamp = Date.now();
    const storedName = `${timestamp}-${file.originalname}`;
    const destPath = path.join(orgDir, storedName);
    await fs.writeFile(destPath, file.buffer);

    const entry = await prisma.fileEntry.create({
      data: {
        organizationId,
        uploadedById,
        name: storedName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        folder: normalizedFolder,
      },
    });

    return entry;
  }

  static async getFiles(organizationId: string, folder: string = '/') {
    const normalizedFolder = normalizeFolder(folder);
    return prisma.fileEntry.findMany({
      where: { organizationId, folder: normalizedFolder },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getAllFiles(organizationId: string) {
    return prisma.fileEntry.findMany({
      where: { organizationId },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getFileById(id: string, organizationId: string) {
    const file = await prisma.fileEntry.findFirst({
      where: { id, organizationId },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
    if (!file) throw new NotFoundError('File not found');
    return file;
  }

  static async deleteFile(id: string, organizationId: string) {
    const file = await this.getFileById(id, organizationId);
    const filePath = this.getFilePath(file);
    try { await fs.unlink(filePath); } catch { /* file already missing */ }
    await prisma.fileEntry.delete({ where: { id } });
    return { success: true };
  }

  static getFilePath(entry: { organizationId: string; folder: string; name: string }) {
    const parts = entry.folder.split('/').filter(Boolean);
    return path.join(UPLOADS_DIR, entry.organizationId, ...parts, entry.name);
  }

  static async getFolders(organizationId: string) {
    const entries = await prisma.fileEntry.findMany({
      where: { organizationId },
      select: { folder: true },
      distinct: ['folder'],
    });
    const folders = entries.map(e => e.folder).filter(Boolean) as string[];
    if (!folders.includes('/')) folders.unshift('/');
    return folders.sort((a, b) => {
      if (a === '/') return -1;
      if (b === '/') return 1;
      return a.localeCompare(b);
    });
  }

  static async getFolderStructure(organizationId: string) {
    const files = await prisma.fileEntry.findMany({
      where: { organizationId },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const tree: Record<string, any[]> = {};
    for (const file of files) {
      const f = file.folder || '/';
      if (!tree[f]) tree[f] = [];
      tree[f].push(file);
    }

    const folders = Object.keys(tree).sort((a, b) => {
      if (a === '/') return -1;
      if (b === '/') return 1;
      return a.localeCompare(b);
    });

    return { folders, files, tree };
  }
}
