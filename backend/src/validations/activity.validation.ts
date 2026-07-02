import { z } from 'zod';

export const createActivitySchema = z.object({
  body: z.object({
    type: z.enum(['call', 'email', 'meeting', 'note', 'task']),
    subject: z.string().min(1, 'Subject is required'),
    description: z.string().nullable().optional(),
    contactId: z.string().nullable().optional(),
    dealId: z.string().nullable().optional(),
    assignedToId: z.string().nullable().optional(),
    dueDate: z.coerce.date().nullable().optional(),
    completed: z.boolean().optional(),
  }),
});

export const updateActivitySchema = z.object({
  body: createActivitySchema.shape.body.partial(),
});
