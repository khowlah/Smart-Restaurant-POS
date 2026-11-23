import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SUPABASE_URL: z.string().url().default('https://smart-restaurant-pos.supabase.co'),
  SUPABASE_ANON_KEY: z.string().min(1).default('your_supabase_anon_key_here'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('your_supabase_service_role_key_here'),
  JWT_SECRET: z.string().default('super_secure_jwt_secret_change_in_production_pos_key_2026'),
  CORS_ORIGIN: z.string().default('*'),
  DEFAULT_TAX_RATE: z.coerce.number().default(0.15),
  RESTAURANT_NAME: z.string().default('Smart Restaurant & Café POS')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment variable validation error:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
