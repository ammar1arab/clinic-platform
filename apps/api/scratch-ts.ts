import { Prisma } from '@prisma/client';

console.log('AppointmentUpdateInput fields:');
// We can't reflect TypeScript types easily at runtime, but we can cause a TS error and catch it, or just use Prisma namespace.
