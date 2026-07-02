import prisma from '../config/db';
import { NotFoundError } from '../utils/errors';
import { ContactStatus, ContactSource } from '@prisma/client';

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
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { deals: true, activities: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return contacts.map(this.mapContact);
  }

  static async getContactById(id: string, organizationId: string) {
    const contact = await prisma.contact.findFirst({
      where: { id, organizationId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { deals: true, activities: true } },
      },
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
    const contact = await prisma.contact.create({
      data: { ...data, tags: data.tags || [], organizationId, createdById },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { deals: true, activities: true } },
      },
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
    const existing = await this.getContactById(id, organizationId);

    // Sales rep can only update their own contacts
    if (actorRoleName === 'sales_rep' &&
        existing.createdById !== actorId &&
        existing.assignedToId !== actorId) {
      throw new NotFoundError('Contact not found');
    }

    const contact = await prisma.contact.update({
      where: { id },
      data,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { deals: true, activities: true } },
      },
    });
    return this.mapContact(contact);
  }

  static async deleteContact(id: string, organizationId: string) {
    await this.getContactById(id, organizationId);
    await prisma.contact.delete({ where: { id } });
    return { success: true };
  }

  static async bulkOperations(
    organizationId: string,
    action: 'assign' | 'tag' | 'delete',
    ids: string[],
    data: any
  ) {
    // Verify all IDs belong to this org
    const where = { id: { in: ids }, organizationId };

    if (action === 'delete') {
      const r = await prisma.contact.deleteMany({ where });
      return { success: true, count: r.count };
    }
    if (action === 'assign') {
      const r = await prisma.contact.updateMany({ where, data: { assignedToId: data.userId || null } });
      return { success: true, count: r.count };
    }
    if (action === 'tag') {
      const updates = ids.map((id) =>
        prisma.contact.update({ where: { id }, data: { tags: { set: data.tags || [] } } })
      );
      await prisma.$transaction(updates);
      return { success: true, count: ids.length };
    }
    return { success: false, count: 0 };
  }
}
