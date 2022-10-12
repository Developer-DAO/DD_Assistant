import { PrismaClient } from '@prisma/client';

// todo maintain [long connection](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#recommended-connection-pool-size)

export const prisma = new PrismaClient();