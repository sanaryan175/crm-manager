import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { validate } from '../middleware/validate';
import { createContactSchema, updateContactSchema, bulkContactSchema } from '../validations/contact.validation';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/',      requirePermission('contact.read'),   ContactController.getContacts);
router.post('/',     requirePermission('contact.create'), validate(createContactSchema), ContactController.createContact);
router.post('/bulk', requirePermission('contact.delete'), validate(bulkContactSchema),  ContactController.bulkOperations);
router.get('/:id',   requirePermission('contact.read'),   ContactController.getContactById);
router.put('/:id',   requirePermission('contact.update'), validate(updateContactSchema), ContactController.updateContact);
router.delete('/:id', requirePermission('contact.delete'), ContactController.deleteContact);

export default router;
