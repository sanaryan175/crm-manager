import prisma from '../config/db';
import { DealStage, ActivityType } from '@prisma/client';

export class DashboardService {
  static async getMetrics(organizationId: string) {
    const now           = new Date();
    const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOf7Days  = new Date(now); startOf7Days.setDate(now.getDate() - 7);

    const [
      totalContacts,
      totalDeals,
      activeDeals,
      closedWonDeals,
      wonCount,
      lostCount,
      overdueTasks,
      thisWeekActivities,
    ] = await Promise.all([
      prisma.contact.count({ where: { organizationId } }),
      prisma.deal.count({ where: { organizationId } }),
      prisma.deal.findMany({
        where:  { organizationId, stage: { notIn: [DealStage.closed_won, DealStage.closed_lost] } },
        select: { value: true },
      }),
      prisma.deal.findMany({
        where:  { organizationId, stage: DealStage.closed_won, closedAt: { gte: startOfMonth } },
        select: { value: true },
      }),
      prisma.deal.count({ where: { organizationId, stage: DealStage.closed_won } }),
      prisma.deal.count({ where: { organizationId, stage: DealStage.closed_lost } }),
      prisma.activity.count({
        where: { organizationId, type: ActivityType.task, completed: false, dueDate: { lt: now } },
      }),
      prisma.activity.count({
        where: { organizationId, createdAt: { gte: startOf7Days } },
      }),
    ]);

    const pipelineValue      = activeDeals.reduce((s, d) => s + d.value, 0);
    const closedWonThisMonth = closedWonDeals.reduce((s, d) => s + d.value, 0);
    const totalClosed        = wonCount + lostCount;
    const conversionRate     = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;
    const averageDealSize    = activeDeals.length > 0 ? Math.round(pipelineValue / activeDeals.length) : 0;

    return {
      totalContacts, totalDeals, pipelineValue, closedWonThisMonth,
      conversionRate, averageDealSize, overdueTasks, thisWeekActivities,
    };
  }
}
