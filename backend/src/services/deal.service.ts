import prisma from '../config/db';
import { NotFoundError } from '../utils/errors';
import { DealStage, DealPriority, DealCloseReason } from '@prisma/client';
import { EmailService } from './email.service';

const DEAL_INCLUDE = {
  contact:    { select: { id: true, firstName: true, lastName: true, company: true, email: true } },
  assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
};

export class DealService {
  private static async ensureAssignableUser(organizationId: string, assignedToId?: string | null) {
    if (!assignedToId) return;
    const user = await prisma.user.findFirst({
      where: { id: assignedToId, organizationId, isActive: true },
    });
    if (!user) throw new NotFoundError('Assigned user not found');
  }

  private static async notifyAssigned(
    organizationId: string,
    dealTitle: string,
    dealValue: number,
    baseCurrency: string,
    assignedToId: string | null | undefined,
    assignedByName: string,
  ) {
    try {
      if (!assignedToId) return;
      const assignedUser = await prisma.user.findFirst({
        where: { id: assignedToId, organizationId, isActive: true, emailNotifications: true },
        select: { id: true, name: true, email: true },
      });
      if (!assignedUser) return;
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true },
      });
      await EmailService.sendDealAssignedEmail({
        to: assignedUser.email,
        assignedToName: assignedUser.name,
        dealTitle,
        dealValue,
        currency: baseCurrency,
        assignedByName,
        organizationName: org?.name || 'CRM',
      });
    } catch { /* notification errors are non-critical */ }
  }

  private static async ensureContact(organizationId: string, contactId?: string | null) {
    if (!contactId) return null;
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, organizationId },
    });
    if (!contact) throw new NotFoundError('Contact not found');
    return contact;
  }

  static async getDeals(
    organizationId: string,
    _actorId: string,
    _actorRoleName: string,
    filters?: { stage?: DealStage }
  ) {
    const where: any = { organizationId };

    if (filters?.stage) where.stage = filters.stage;

    return prisma.deal.findMany({ where, include: DEAL_INCLUDE, orderBy: { createdAt: 'desc' } });
  }

  static async getDealById(
    id: string,
    organizationId: string,
    _actorId?: string,
    _actorRoleName?: string
  ) {
    const deal = await prisma.deal.findFirst({
      where: { id, organizationId },
      include: DEAL_INCLUDE,
    });
    if (!deal) throw new NotFoundError('Deal not found');
    return deal;
  }

  static async createDeal(
    organizationId: string,
    createdById: string,
    data: {
      title: string; contactId?: string | null; company?: string | null;
      value: number;
      stage?: DealStage; priority?: DealPriority;
      expectedCloseDate?: Date | null; notes?: string | null; assignedToId?: string | null;
    }
  ) {
    await this.ensureAssignableUser(organizationId, data.assignedToId);

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { currency: true },
    });
    if (!organization) throw new NotFoundError('Organization not found');

    const baseCurrency = organization.currency;

    let finalCompany = data.company;
    if (data.contactId && !finalCompany) {
      const contact = await this.ensureContact(organizationId, data.contactId);
      finalCompany = contact?.company;
    } else {
      await this.ensureContact(organizationId, data.contactId);
    }

    let closedAt: Date | null = null;
    let closeReason: DealCloseReason | null = null;
    if (data.stage === DealStage.closed_won) { closedAt = new Date(); closeReason = DealCloseReason.won; }
    if (data.stage === DealStage.closed_lost) { closedAt = new Date(); closeReason = DealCloseReason.lost; }

    if (data.contactId === '') data.contactId = null;

    const createdDeal = await prisma.deal.create({
      data: {
        title: data.title,
        contactId: data.contactId,
        company: finalCompany,
        value: data.value,
        stage: data.stage ?? DealStage.new,
        priority: data.priority ?? DealPriority.medium,
        expectedCloseDate: data.expectedCloseDate,
        notes: data.notes,
        assignedToId: data.assignedToId,
        closedAt,
        closeReason,
        organizationId,
        createdById,
      },
      include: DEAL_INCLUDE,
    });

    // Notify assignee (non-blocking)
    const creator = await prisma.user.findFirst({
      where: { id: createdById, organizationId },
      select: { name: true },
    });
    this.notifyAssigned(
      organizationId, createdDeal.title,
      createdDeal.value, baseCurrency,
      data.assignedToId, creator?.name || 'Someone'
    ).catch(() => {});

    return createdDeal;
  }

  static async updateDeal(
    id: string,
    organizationId: string,
    actorId: string,
    actorRoleName: string,
    data: {
      title?: string; contactId?: string | null; company?: string | null;
      value?: number;
      stage?: DealStage; priority?: DealPriority;
      expectedCloseDate?: Date | null; closeReason?: DealCloseReason | null;
      notes?: string | null; assignedToId?: string | null;
    }
  ) {
    const existing = await this.getDealById(id, organizationId, actorId, actorRoleName);
    await this.ensureAssignableUser(organizationId, data.assignedToId);
    await this.ensureContact(organizationId, data.contactId);

    if (data.contactId === '') data.contactId = null;

    const updatedData: any = { ...data };
    if (data.stage && data.stage !== existing.stage) {
      if (data.stage === DealStage.closed_won)  { updatedData.closedAt = new Date(); updatedData.closeReason = DealCloseReason.won; }
      else if (data.stage === DealStage.closed_lost) { updatedData.closedAt = new Date(); updatedData.closeReason = data.closeReason || DealCloseReason.lost; }
      else { updatedData.closedAt = null; updatedData.closeReason = null; }
    }

    const updatedDeal = await prisma.deal.update({ where: { id }, data: updatedData, include: DEAL_INCLUDE });

    // Notify if assignee changed (non-blocking)
    if (data.assignedToId && data.assignedToId !== existing.assignedToId) {
      const actor = await prisma.user.findFirst({
        where: { id: actorId, organizationId },
        select: { name: true },
      });
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { currency: true },
      });
      this.notifyAssigned(
        organizationId, updatedDeal.title,
        updatedDeal.value, org?.currency || 'USD',
        data.assignedToId, actor?.name || 'Someone'
      ).catch(() => {});
    }

    return updatedDeal;
  }

  static async updateDealStage(
    id: string, organizationId: string,
    actorId: string, actorRoleName: string,
    stage: DealStage, closeReason?: DealCloseReason
  ) {
    const existing = await this.getDealById(id, organizationId, actorId, actorRoleName);
    const updateData: any = { stage };
    if (stage === DealStage.closed_won) { updateData.closedAt = new Date(); updateData.closeReason = DealCloseReason.won; }
    else if (stage === DealStage.closed_lost) { updateData.closedAt = new Date(); updateData.closeReason = closeReason || DealCloseReason.lost; }
    else if ([DealStage.closed_won as DealStage, DealStage.closed_lost as DealStage].includes(existing.stage)) {
      updateData.closedAt = null; updateData.closeReason = null;
    }
    return prisma.deal.update({ where: { id }, data: updateData, include: DEAL_INCLUDE });
  }

  static async deleteDeal(id: string, organizationId: string, actorId: string, actorRoleName: string) {
    await this.getDealById(id, organizationId, actorId, actorRoleName);
    await prisma.deal.delete({ where: { id } });
    return { success: true };
  }
}
