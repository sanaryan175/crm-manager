import prisma from '../config/db';
import { NotFoundError } from '../utils/errors';
import { ContactStatus, ContactSource } from '@prisma/client';

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

  private static canAccess(contact: { createdById: string; assignedToId: string | null }, actorId: string, actorRoleName: string) {
    return actorRoleName !== 'sales_rep' || contact.createdById === actorId || contact.assignedToId === actorId;
  }

  private static async ensureAssignableUser(organizationId: string, assignedToId?: string | null) {
    if (!assignedToId) return;
    const user = await prisma.user.findFirst({
      where: { id: assignedToId, organizationId, isActive: true },
    });
    if (!user) throw new NotFoundError('Assigned user not found');
  }

  static async getContacts(
    organizationId: string,
    actorId: string,
    actorRoleName: string,
    filters: { status?: ContactStatus; source?: ContactSource; search?: string }
  ) {
    const where: any = { organizationId };

    // Sales reps only see their own contacts
    if (actorRoleName === 'sales_rep') {
      where.OR = [{ createdById: actorId }, { assignedToId: actorId }];
    }

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
    actorId?: string,
    actorRoleName?: string
  ) {
    const contact = await prisma.contact.findFirst({
      where: { id, organizationId },
      include: CONTACT_INCLUDE,
    });
    if (!contact) throw new NotFoundError('Contact not found');
    if (actorId && actorRoleName && !this.canAccess(contact, actorId, actorRoleName)) {
      throw new NotFoundError('Contact not found');
    }
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
    return this.mapContact(contact);
  }

  static async updateContact(
    id: string,
    organizationId: string,
    actorId: string,
    actorRoleName: string,
    data: any
  ) {
    await this.getContactById(id, organizationId, actorId, actorRoleName);
    await this.ensureAssignableUser(organizationId, data.assignedToId);

    const contact = await prisma.contact.update({
      where: { id },
      data,
      include: CONTACT_INCLUDE,
    });
    return this.mapContact(contact);
  }

  static async deleteContact(id: string, organizationId: string, actorId: string, actorRoleName: string) {
    await this.getContactById(id, organizationId, actorId, actorRoleName);
    await prisma.contact.delete({ where: { id } });
    return { success: true };
  }

  static async bulkOperations(
    organizationId: string,
    actorId: string,
    actorRoleName: string,
    action: 'assign' | 'tag' | 'delete',
    ids: string[],
    data: any
  ) {
    const where: any = { id: { in: ids }, organizationId };
    if (actorRoleName === 'sales_rep') {
      where.OR = [{ createdById: actorId }, { assignedToId: actorId }];
    }

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
