import { z } from 'zod';

export const queryMenuSchema = z.object({
  query: z.object({
    category: z.string().optional(),
    is_available: z.enum(['true', 'false']).optional()
  }).optional()
});

export const createMenuItemSchema = z.object({
  body: z.object({
    category_id: z.string().min(1, 'Category ID is required'),
    name: z.string().min(2, 'Item name must be at least 2 characters'),
    description: z.string().optional(),
    price: z.number().min(0, 'Price must be non-negative'),
    is_available: z.boolean().default(true),
    image_url: z.string().url().optional(),
    variants: z.array(z.object({
      name: z.string(),
      price: z.number().min(0)
    })).default([]),
    add_ons: z.array(z.object({
      name: z.string(),
      price: z.number().min(0)
    })).default([])
  })
});

export const updateAvailabilitySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Menu item ID is required')
  }),
  body: z.object({
    is_available: z.boolean({ required_error: 'is_available boolean is required' })
  })
});
