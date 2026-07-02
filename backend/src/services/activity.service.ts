import prisma from '../config/db';
import { NotFoundError } from '../utils/errors';
import { ActivityType } from '@prisma/client';

const ACTIVITY_INCLUDE = {
  contact:    { select: { id: true, firstName: true, lastName: true, company: true } },
  deal:       { select: { id: true, title: true, value: true } },
  assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
};

export class ActivityService {
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

  static async getActivityById(id: string, organizationId: string) {
    const activity = await prisma.activity.findFirst({
      where: { id, organizationId },
      include: ACTIVITY_INCLUDE,
    });
    if (!activity) throw new NotFoundError('Activity not found');
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
    const completed   = data.completed || false;
    const completedAt = completed ? new Date() : null;
    return prisma.activity.create({
      data: { ...data, completed, completedAt, organizationId, createdById },
      include: ACTIVITY_INCLUDE,
    });
  }

  static async updateActivity(
    id: string, organizationId: string, actorId: string, actorRoleName: string,
    data: {
      type?: ActivityType; subject?: string; description?: string | null;
      contactId?: string | null; dealId?: string | null;
      assignedToId?: string | null; dueDate?: Date | null; completed?: boolean;
    }
  ) {
    const existing = await this.getActivityById(id, organizationId);

    if (actorRoleName === 'sales_rep' &&
        existing.createdById !== actorId &&
        existing.assignedToId !== actorId) {
      throw new NotFoundError('Activity not found');
    }

    const updatedData: typeof data & { completedAt?: Date | null } = { ...data };
    if (data.completed !== undefined && data.completed !== existing.completed) {
      updatedData.completedAt = data.completed ? new Date() : null;
    }

    return prisma.activity.update({ where: { id }, data: updatedData, include: ACTIVITY_INCLUDE });
  }

  static async completeActivity(id: string, organizationId: string, completed: boolean) {
    await this.getActivityById(id, organizationId);
    return prisma.activity.update({
      where: { id },
      data:  { completed, completedAt: completed ? new Date() : null },
      include: ACTIVITY_INCLUDE,
    });
  }

  static async deleteActivity(id: string, organizationId: string) {
    await this.getActivityById(id, organizationId);
    await prisma.activity.delete({ where: { id } });
    return { success: true };
  }
}
