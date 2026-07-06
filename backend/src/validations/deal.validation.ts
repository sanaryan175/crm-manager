import { z } from 'zod';

export const createDealSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    contactId: z.string().nullable().optional(),
    company: z.string().nullable().optional(),
    value: z.number().nonnegative('Value must be positive'),
    stage: z.enum(['new', 'contacted', 'demo_scheduled', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    expectedCloseDate: z.coerce.date().nullable().optional(),
    closeReason: z.enum(['won', 'lost', 'no_decision', 'cancelled', '']).nullable().optional(),
    notes: z.string().nullable().optional(),
    assignedToId: z.string().nullable().optional(),
  }),
});

export const updateDealSchema = z.object({
  body: createDealSchema.shape.body.partial(),
});

export const updateDealStageSchema = z.object({
  body: z.object({
    stage: z.enum(['new', 'contacted', 'demo_scheduled', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost']),
    closeReason: z.enum(['won', 'lost', 'no_decision', 'cancelled', '']).nullable().optional(),
  }),
});
