import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    organizationName: z.string().min(2, 'Organization name is required'),
    ownerName:        z.string().min(1, 'Your name is required'),
    ownerEmail:       z.string().email('Invalid email address'),
    ownerPassword:    z.string().min(8, 'Password must be at least 8 characters'),
    country:          z.string().optional(),
    currency:         z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email:    z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name:   z.string().min(1).optional(),
    avatar: z.string().optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword:     z.string().min(8, 'New password must be at least 8 characters'),
  }),
});
