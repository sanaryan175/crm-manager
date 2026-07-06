import prisma from '../config/db';
import { NotFoundError } from '../utils/errors';
import { ContactStatus, ContactSource } from '@prisma/client';
import { EmailService } from './email.service';

const CONTACT_INCLUDE = {
  assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
  _count: { select: { deals: true, activities: true } },
};

export class ContactService {
  private static mapContact(contact: any) {
    const { _count, ...rest } = contact;
    return {
      ...rest,
      _links: _count
        ? { dealsCount: _count.deals, activitiesCount: _count.activities }
        : undefined,
    };
  }

  private static async ensureAssignableUser(organizationId: string, assignedToId?: string | null) {
    if (!assignedToId) return;
    const user = await prisma.user.findFirst({
      where: { id: assignedToId, organizationId, isActive: true },
    });
    if (!user) throw new NotFoundError('Assigned user not found');
  }

  private static async notifyAssigned(
    organizationId: string, contact: { id: string; firstName: string; lastName: string; email: string },
    assignedToId: string | null | undefined, assignedByName: string,
  ) {
    try {
      if (!assignedToId) return;
      const assignedUser = await prisma.user.findFirst({
        where: { id: assignedToId, organizationId, isActive: true, emailNotifications: true },
        select: { id: true, name: true, email: true },
      });
      if (!assignedUser) return;
      const org = await prisma.organization.findUnique({
        where: { id: organizationId }, select: { name: true },
      });
      await EmailService.sendContactAssignedEmail({
        to: assignedUser.email,
        assignedToName: assignedUser.name,
        contactName: `${contact.firstName} ${contact.lastName}`,
        contactEmail: contact.email,
        assignedByName,
        organizationName: org?.name || 'CRM',
      });
    } catch { /* notification errors are non-critical */ }
  }

  static async getContacts(
    organizationId: string,
    _actorId: string,
    _actorRoleName: string,
    filters: { status?: ContactStatus; source?: ContactSource; search?: string }
  ) {
    const where: any = { organizationId };

    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;
    if (filters.search) {
      where.AND = [{
        OR: [
          { firstName:  { contains: filters.search, mode: 'insensitive' } },
          { lastName:   { contains: filters.search, mode: 'insensitive' } },
          { email:      { contains: filters.search, mode: 'insensitive' } },
          { company:    { contains: filters.search, mode: 'insensitive' } },
        ],
      }];
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: CONTACT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return contacts.map(this.mapContact);
  }

  static async getContactById(
    id: string,
    organizationId: string,
    _actorId?: string,
    _actorRoleName?: string
  ) {
    const contact = await prisma.contact.findFirst({
      where: { id, organizationId },
      include: CONTACT_INCLUDE,
    });
    if (!contact) throw new NotFoundError('Contact not found');
    return this.mapContact(contact);
  }

  static async createContact(
    organizationId: string,
    createdById: string,
    data: {
      firstName: string; lastName: string; email: string;
      phone?: string | null; company?: string | null; jobTitle?: string | null;
      status?: ContactStatus; source?: ContactSource;
      tags?: string[]; notes?: string | null; assignedToId?: string | null;
    }
  ) {
    await this.ensureAssignableUser(organizationId, data.assignedToId);

    const contact = await prisma.contact.create({
      data: { ...data, tags: data.tags || [], organizationId, createdById },
      include: CONTACT_INCLUDE,
    });

    const creator = await prisma.user.findFirst({
      where: { id: createdById, organizationId },
      select: { name: true },
    });
    this.notifyAssigned(organizationId, contact, data.assignedToId, creator?.name || 'Someone').catch(() => {});

    return this.mapContact(contact);
  }

  static async updateContact(
    id: string,
    organizationId: string,
    actorId: string,
    actorRoleName: string,
    data: any
  ) {
    const existing = await this.getContactById(id, organizationId, actorId, actorRoleName);
    await this.ensureAssignableUser(organizationId, data.assignedToId);

    const contact = await prisma.contact.update({
      where: { id },
      data,
      include: CONTACT_INCLUDE,
    });

    const existingAssignedId = existing.assignedTo && typeof existing.assignedTo === 'object' ? (existing.assignedTo as any).id : existing.assignedTo;
    if (data.assignedToId && data.assignedToId !== existingAssignedId) {
      const actor = await prisma.user.findFirst({
        where: { id: actorId, organizationId },
        select: { name: true },
      });
      this.notifyAssigned(organizationId, contact, data.assignedToId, actor?.name || 'Someone').catch(() => {});
    }

    return this.mapContact(contact);
  }

  static async deleteContact(id: string, organizationId: string, actorId: string, actorRoleName: string) {
    await this.getContactById(id, organizationId, actorId, actorRoleName);
    await prisma.contact.delete({ where: { id } });
    return { success: true };
  }

  static async bulkOperations(
    organizationId: string,
    _actorId: string,
    _actorRoleName: string,
    action: 'assign' | 'tag' | 'delete',
    ids: string[],
    data: any
  ) {
    const where: any = { id: { in: ids }, organizationId };
    const allowedCount = await prisma.contact.count({ where });
    if (allowedCount !== ids.length) throw new NotFoundError('One or more contacts not found');

    if (action === 'delete') {
      const r = await prisma.contact.deleteMany({ where });
      return { success: true, count: r.count };
    }
    if (action === 'assign') {
      await this.ensureAssignableUser(organizationId, data?.userId);
      const r = await prisma.contact.updateMany({ where, data: { assignedToId: data.userId || null } });
      return { success: true, count: r.count };
    }
    if (action === 'tag') {
      const updates = ids.map((id) =>
        prisma.contact.update({ where: { id }, data: { tags: { set: data?.tags || [] } } })
      );
      await prisma.$transaction(updates);
      return { success: true, count: ids.length };
    }
    return { success: false, count: 0 };
  }
}
