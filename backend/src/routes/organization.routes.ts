import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { validate } from '../middleware/validate';
import { authenticate, requirePermission } from '../middleware/auth';
import { updateOrganizationSchema } from '../validations/organization.validation';

const router = Router();

router.use(authenticate);

router.get('/',         OrganizationController.getOrganization);
router.put('/',         requirePermission('org.settings'), validate(updateOrganizationSchema), OrganizationController.updateOrganization);
router.get('/roles',    OrganizationController.listRoles);
router.get('/audit',    requirePermission('audit.view'),   OrganizationController.getAuditLogs);

export default router;
