import { z } from 'zod';

export const updateOrganizationSchema = z.object({
  body: z.object({
    name:          z.string().min(1).optional(),
    logo:          z.string().optional(),
    industry:      z.string().optional(),
    website:       z.string().url().optional().or(z.literal('')),
    country:       z.string().length(2).optional(),
    currency:      z.string().length(3).optional(),
    timezone:      z.string().optional(),
    dateFormat:    z.string().optional(),
    timeFormat:    z.enum(['12h', '24h']).optional(),
    fiscalYear:    z.number().int().min(1).max(12).optional(),
    companySize:   z.string().optional(),
    phone:         z.string().optional().transform(v => v === '' ? undefined : v),
    address:       z.string().optional().transform(v => v === '' ? undefined : v),
    setupComplete: z.boolean().optional(),
  }),
});
