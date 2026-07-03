import prisma from '../config/db';
import { NotFoundError } from '../utils/errors';
import { DealStage, DealPriority, DealCloseReason } from '@prisma/client';

const DEAL_INCLUDE = {
  contact:    { select: { id: true, firstName: true, lastName: true, company: true, email: true } },
  assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
};

export class DealService {
  private static canAccess(deal: { createdById: string; assignedToId: string | null }, actorId: string, actorRoleName: string) {
    return actorRoleName !== 'sales_rep' || deal.createdById === actorId || deal.assignedToId === actorId;
  }

  private static async ensureAssignableUser(organizationId: string, assignedToId?: string | null) {
    if (!assignedToId) return;
    const user = await prisma.user.findFirst({
      where: { id: assignedToId, organizationId, isActive: true },
    });
    if (!user) throw new NotFoundError('Assigned user not found');
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
    actorId: string,
    actorRoleName: string,
    filters?: { stage?: DealStage }
  ) {
    const where: any = { organizationId };

    // Sales reps only see their own deals
    if (actorRoleName === 'sales_rep') {
      where.OR = [{ createdById: actorId }, { assignedToId: actorId }];
    }
    if (filters?.stage) where.stage = filters.stage;

    return prisma.deal.findMany({ where, include: DEAL_INCLUDE, orderBy: { createdAt: 'desc' } });
  }

  static async getDealById(
    id: string,
    organizationId: string,
    actorId?: string,
    actorRoleName?: string
  ) {
    const deal = await prisma.deal.findFirst({
      where: { id, organizationId },
      include: DEAL_INCLUDE,
    });
    if (!deal) throw new NotFoundError('Deal not found');
    if (actorId && actorRoleName && !this.canAccess(deal, actorId, actorRoleName)) {
      throw new NotFoundError('Deal not found');
    }
    return deal;
  }

  static async createDeal(
    organizationId: string,
    createdById: string,
    data: {
      title: string; contactId?: string | null; company?: string | null;
      value: number; currency?: string;
      stage?: DealStage; priority?: DealPriority;
      expectedCloseDate?: Date | null; notes?: string | null; assignedToId?: string | null;
    }
  ) {
    await this.ensureAssignableUser(organizationId, data.assignedToId);

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

    return prisma.deal.create({
      data: { ...data, company: finalCompany, closedAt, closeReason, organizationId, createdById },
      include: DEAL_INCLUDE,
    });
  }

  static async updateDeal(
    id: string,
    organizationId: string,
    actorId: string,
    actorRoleName: string,
    data: {
      title?: string; contactId?: string | null; company?: string | null;
      value?: number; currency?: string;
      stage?: DealStage; priority?: DealPriority;
      expectedCloseDate?: Date | null; closeReason?: DealCloseReason | null;
      notes?: string | null; assignedToId?: string | null;
    }
  ) {
    const existing = await this.getDealById(id, organizationId, actorId, actorRoleName);
    await this.ensureAssignableUser(organizationId, data.assignedToId);
    await this.ensureContact(organizationId, data.contactId);

    const updatedData: typeof data & { closedAt?: Date | null; closeReason?: DealCloseReason | null } = { ...data };
    if (data.stage && data.stage !== existing.stage) {
      if (data.stage === DealStage.closed_won)  { updatedData.closedAt = new Date(); updatedData.closeReason = DealCloseReason.won; }
      else if (data.stage === DealStage.closed_lost) { updatedData.closedAt = new Date(); updatedData.closeReason = data.closeReason || DealCloseReason.lost; }
      else { updatedData.closedAt = null; updatedData.closeReason = null; }
    }

    return prisma.deal.update({ where: { id }, data: updatedData, include: DEAL_INCLUDE });
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
