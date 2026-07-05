import prisma from '../config/db';
import { NotFoundError } from '../utils/errors';

export class OrganizationService {
  static async getOrganization(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) throw new NotFoundError('Organization not found');
    return org;
  }

  static async updateOrganization(
    organizationId: string,
    data: {
      name?:          string;
      logo?:          string;
      industry?:      string;
      website?:       string;
      country?:       string;
      currency?:      string;
      timezone?:      string;
      fiscalYear?:    number;
      companySize?:   string;
      phone?:         string;
      address?:       string;
      setupComplete?: boolean;
    }
  ) {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new NotFoundError('Organization not found');

    return prisma.organization.update({
      where: { id: organizationId },
      data,
    });
  }

  static async listRoles(organizationId: string) {
    return prisma.role.findMany({
      where:   { organizationId },
      include: {
        rolePermissions: {
          include: { permission: { select: { name: true, resource: true, action: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async getAuditLogs(organizationId: string, limit = 50) {
    return prisma.auditLog.findMany({
      where:   { organizationId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take:    limit,
    });
  }
}
