import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    ownerName:       z.string().min(1, 'Your name is required'),
    ownerEmail:      z.string().email('Invalid email address'),
    ownerPassword:   z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  }).refine((d) => d.ownerPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

export const organizationSetupSchema = z.object({
  body: z.object({
    name:          z.string().min(2, 'Organization name is required'),
    industry:      z.string().min(1, 'Industry is required'),
    companySize:   z.string().min(1, 'Company size is required'),
    country:       z.string().length(2, 'Select a country'),
    currency:      z.string().length(3, 'Select a currency'),
    timezone:      z.string().min(1, 'Select a timezone'),
    website:       z.string().url('Enter a valid URL').optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
    phone:         z.string().optional().transform(v => v === '' ? undefined : v),
    address:       z.string().optional().transform(v => v === '' ? undefined : v),
    fiscalYear:    z.number().int().min(1).max(12).optional(),
    logo:          z.string().optional(),
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
