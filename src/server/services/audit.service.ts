import { prisma } from '../db/prisma.js';

export class AuditService {
  static async getAllAuditLogs(filter?: { entityType?: string; search?: string; limit?: number }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (filter?.entityType && filter.entityType !== 'ALL') {
      where.entityType = filter.entityType;
    }
    if (filter?.search) {
      where.OR = [
        { action: { contains: filter.search, mode: 'insensitive' } },
        { actor: { contains: filter.search, mode: 'insensitive' } },
        { details: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    return await prisma.auditEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filter?.limit || 100,
      include: {
        order: true,
        user: true,
      },
    });
  }
}
