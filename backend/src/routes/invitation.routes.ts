import { Router } from 'express';
import { InvitationController } from '../controllers/invitation.controller';
import { validate } from '../middleware/validate';
import { authenticate, requirePermission } from '../middleware/auth';
import { sendInvitationSchema, acceptInvitationSchema } from '../validations/invitation.validation';

const router = Router();

// Accept invite — public (no auth needed, token is the credential)
router.post('/accept', validate(acceptInvitationSchema), InvitationController.acceptInvitation);

// All other routes require auth
router.use(authenticate);

router.get('/',           requirePermission('user.invite'), InvitationController.listInvitations);
router.post('/',          requirePermission('user.invite'), validate(sendInvitationSchema), InvitationController.sendInvitation);
router.post('/:id/resend',requirePermission('user.invite'), InvitationController.resendInvitation);
router.delete('/:id',     requirePermission('user.invite'), InvitationController.revokeInvitation);

export default router;
