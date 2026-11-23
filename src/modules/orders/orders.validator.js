import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    order_type: z.enum(['dine_in', 'takeaway', 'delivery'], {
      errorMap: () => ({ message: 'order_type must be one of: dine_in, takeaway, delivery' })
    }),
    table_id: z.string().optional().nullable(),
    customer_name: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    discount: z.number().min(0, 'Discount must be non-negative').default(0),
    items: z.array(z.object({
      menu_item_id: z.string().min(1, 'Menu item ID is required'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      selected_variant: z.object({
        name: z.string(),
        price: z.number().min(0)
      }).optional().nullable(),
      selected_add_ons: z.array(z.object({
        name: z.string(),
        price: z.number().min(0)
      })).optional().default([]),
      notes: z.string().optional().nullable()
    })).min(1, 'Order must contain at least one item')
  }).refine((data) => {
    if (data.order_type === 'dine_in' && !data.table_id) {
      return false;
    }
    return true;
  }, {
    message: 'table_id is required for dine_in orders',
    path: ['table_id']
  })
});
