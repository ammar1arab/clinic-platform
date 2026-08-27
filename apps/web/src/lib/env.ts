import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url({
    message:
      'NEXT_PUBLIC_API_URL must be a valid URL, e.g. http://localhost:4000 or https://api.cureva.clinic',
  }),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  throw new Error(
    `Invalid environment variables in apps/web/.env.local:\n${issues}\n\nCheck the file and restart the dev server.`,
  );
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
