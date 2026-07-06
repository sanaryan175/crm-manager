import { Router } from 'express';
import authRouter        from './auth.routes';
import contactRouter     from './contact.routes';
import dealRouter        from './deal.routes';
import activityRouter    from './activity.routes';
import dashboardRouter   from './dashboard.routes';
import organizationRouter from './organization.routes';
import invitationRouter  from './invitation.routes';
import userRouter        from './user.routes';
import fileRouter        from './file.routes';
import notificationRouter from './notification.routes';

const router = Router();

router.use('/auth',         authRouter);
router.use('/contacts',     contactRouter);
router.use('/deals',        dealRouter);
router.use('/activities',   activityRouter);
router.use('/dashboard',    dashboardRouter);
router.use('/organization', organizationRouter);
router.use('/invitations',  invitationRouter);
router.use('/users',        userRouter);
router.use('/files',        fileRouter);
router.use('/notifications', notificationRouter);

export default router;
