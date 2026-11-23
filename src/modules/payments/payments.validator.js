import { z } from 'zod';

export const settlePaymentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Order ID is required')
  }),
  body: z.object({
    payment_method: z.enum(['cash', 'card', 'online'], {
      errorMap: () => ({ message: 'payment_method must be one of: cash, card, online' })
    }),
    amount: z.number().min(0, 'Amount must be non-negative'),
    transaction_reference: z.string().optional().nullable()
  })
});
