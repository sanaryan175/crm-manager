import { z } from 'zod';

export const createContactSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().nullable().optional(),
    company: z.string().nullable().optional(),
    jobTitle: z.string().nullable().optional(),
    status: z.enum(['active', 'inactive', 'blocked']).optional(),
    source: z.enum(['website', 'referral', 'cold_outreach', 'event', 'partner', 'other']).optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().nullable().optional(),
    assignedToId: z.string().nullable().optional(),
  }),
});

export const updateContactSchema = z.object({
  body: createContactSchema.shape.body.partial(),
});

export const bulkContactSchema = z.object({
  body: z.object({
    action: z.enum(['assign', 'tag', 'delete']),
    ids: z.array(z.string()).min(1, 'At least one contact ID is required'),
    data: z.any().optional(),
  }),
});
