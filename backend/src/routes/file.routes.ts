import { Router } from 'express';
import multer from 'multer';
import { FileController } from '../controllers/file.controller';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

// Static routes before parameterized routes
router.get('/folders',     requirePermission('reports.view'), FileController.folders);
router.get('/all',         requirePermission('reports.view'), FileController.listAll);
router.post('/upload',     requirePermission('reports.view'), upload.single('file'), FileController.upload);
router.post('/upload-multiple', requirePermission('reports.view'), upload.array('files', 10), FileController.uploadMultiple);

// Parameterized routes
router.get('/',            requirePermission('reports.view'), FileController.list);
router.get('/:id',         requirePermission('reports.view'), FileController.getById);
router.get('/:id/download', requirePermission('reports.view'), FileController.download);
router.delete('/:id',      requirePermission('reports.view'), FileController.delete);

export default router;
