import { z } from 'zod';

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Order ID is required')
  }),
  body: z.object({
    status: z.enum(['new', 'preparing', 'ready', 'completed', 'cancelled'], {
      errorMap: () => ({ message: 'Status must be one of: new, preparing, ready, completed, cancelled' })
    })
  })
});
