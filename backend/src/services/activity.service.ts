import prisma from '../config/db';
import { NotFoundError } from '../utils/errors';
import { ActivityType } from '@prisma/client';
import { EmailService } from './email.service';

const ACTIVITY_INCLUDE = {
  contact:    { select: { id: true, firstName: true, lastName: true, company: true } },
  deal:       { select: { id: true, title: true, value: true } },
  assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
};

export class ActivityService {
  private static canAccess(activity: { createdById: string; assignedToId: string | null }, actorId: string, actorRoleName: string) {
    return actorRoleName !== 'sales_rep' || activity.createdById === actorId || activity.assignedToId === actorId;
  }

  private static async ensureAssignableUser(organizationId: string, assignedToId?: string | null) {
    if (!assignedToId) return;
    const user = await prisma.user.findFirst({
      where: { id: assignedToId, organizationId, isActive: true },
    });
    if (!user) throw new NotFoundError('Assigned user not found');
  }

  private static async notifyAssigned(
    organizationId: string, activity: { subject: string; type: string; dueDate?: Date | null },
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
      const typeLabel = activity.type.charAt(0).toUpperCase() + activity.type.slice(1);
      await EmailService.sendActivityAssignedEmail({
        to: assignedUser.email,
        assignedToName: assignedUser.name,
        activitySubject: activity.subject,
        activityType: typeLabel,
        dueDate: activity.dueDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        assignedByName,
        organizationName: org?.name || 'CRM',
      });
    } catch { /* notification errors are non-critical */ }
  }

  private static async ensureContact(organizationId: string, contactId?: string | null) {
    if (!contactId) return;
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, organizationId },
    });
    if (!contact) throw new NotFoundError('Contact not found');
  }

  private static async ensureDeal(organizationId: string, dealId?: string | null) {
    if (!dealId) return;
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, organizationId },
    });
    if (!deal) throw new NotFoundError('Deal not found');
  }

  static async getActivities(
    organizationId: string,
    actorId: string,
    actorRoleName: string,
    filters?: { contactId?: string; dealId?: string; type?: ActivityType }
  ) {
    const where: any = { organizationId };

    if (actorRoleName === 'sales_rep') {
      where.OR = [{ createdById: actorId }, { assignedToId: actorId }];
    }
    if (filters?.contactId) where.contactId = filters.contactId;
    if (filters?.dealId)    where.dealId    = filters.dealId;
    if (filters?.type)      where.type      = filters.type;

    return prisma.activity.findMany({
      where,
      include: ACTIVITY_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getActivityById(
    id: string,
    organizationId: string,
    actorId?: string,
    actorRoleName?: string
  ) {
    const activity = await prisma.activity.findFirst({
      where: { id, organizationId },
      include: ACTIVITY_INCLUDE,
    });
    if (!activity) throw new NotFoundError('Activity not found');
    if (actorId && actorRoleName && !this.canAccess(activity, actorId, actorRoleName)) {
      throw new NotFoundError('Activity not found');
    }
    return activity;
  }

  static async createActivity(
    organizationId: string,
    createdById: string,
    data: {
      type: ActivityType; subject: string; description?: string | null;
      contactId?: string | null; dealId?: string | null;
      assignedToId?: string | null; dueDate?: Date | null; completed?: boolean;
    }
  ) {
    await this.ensureAssignableUser(organizationId, data.assignedToId);
    await this.ensureContact(organizationId, data.contactId);
    await this.ensureDeal(organizationId, data.dealId);

    const completed   = data.completed || false;
    const completedAt = completed ? new Date() : null;
    const createdActivity = await prisma.activity.create({
      data: { ...data, completed, completedAt, organizationId, createdById },
      include: ACTIVITY_INCLUDE,
    });

    const creator = await prisma.user.findFirst({
      where: { id: createdById, organizationId },
      select: { name: true },
    });
    this.notifyAssigned(organizationId, createdActivity, data.assignedToId, creator?.name || 'Someone').catch(() => {});

    return createdActivity;
  }

  static async updateActivity(
    id: string, organizationId: string, actorId: string, actorRoleName: string,
    data: {
      type?: ActivityType; subject?: string; description?: string | null;
      contactId?: string | null; dealId?: string | null;
      assignedToId?: string | null; dueDate?: Date | null; completed?: boolean;
    }
  ) {
    const existing = await this.getActivityById(id, organizationId, actorId, actorRoleName);
    await this.ensureAssignableUser(organizationId, data.assignedToId);
    await this.ensureContact(organizationId, data.contactId);
    await this.ensureDeal(organizationId, data.dealId);

    const updatedData: typeof data & { completedAt?: Date | null } = { ...data };
    if (data.completed !== undefined && data.completed !== existing.completed) {
      updatedData.completedAt = data.completed ? new Date() : null;
    }

    const updatedActivity = await prisma.activity.update({ where: { id }, data: updatedData, include: ACTIVITY_INCLUDE });

    if (data.assignedToId && data.assignedToId !== existing.assignedToId) {
      const actor = await prisma.user.findFirst({
        where: { id: actorId, organizationId },
        select: { name: true },
      });
      this.notifyAssigned(organizationId, updatedActivity, data.assignedToId, actor?.name || 'Someone').catch(() => {});
    }

    return updatedActivity;
  }

  static async completeActivity(
    id: string,
    organizationId: string,
    actorId: string,
    actorRoleName: string,
    completed: boolean
  ) {
    await this.getActivityById(id, organizationId, actorId, actorRoleName);
    return prisma.activity.update({
      where: { id },
      data:  { completed, completedAt: completed ? new Date() : null },
      include: ACTIVITY_INCLUDE,
    });
  }

  static async deleteActivity(id: string, organizationId: string, actorId: string, actorRoleName: string) {
    await this.getActivityById(id, organizationId, actorId, actorRoleName);
    await prisma.activity.delete({ where: { id } });
    return { success: true };
  }
}
