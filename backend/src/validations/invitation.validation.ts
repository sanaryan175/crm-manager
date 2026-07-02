import { z } from 'zod';

export const sendInvitationSchema = z.object({
  body: z.object({
    email:  z.string().email('Invalid email address'),
    roleId: z.string().min(1, 'Role is required'),
  }),
});

export const acceptInvitationSchema = z.object({
  body: z.object({
    token:    z.string().min(1, 'Token is required'),
    name:     z.string().min(1, 'Your name is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});
