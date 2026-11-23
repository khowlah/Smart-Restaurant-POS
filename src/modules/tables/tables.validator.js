import { z } from 'zod';

export const updateTableStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Table ID is required')
  }),
  body: z.object({
    status: z.enum(['available', 'occupied', 'billing_pending'], {
      errorMap: () => ({ message: 'Status must be one of: available, occupied, billing_pending' })
    })
  })
});
