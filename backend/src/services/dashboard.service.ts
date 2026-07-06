import prisma from '../config/db';
import { DealStage, ActivityType } from '@prisma/client';

export class DashboardService {
  static async getMetrics(organizationId: string) {
    const now             = new Date();
    const startOfMonth    = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOf7Days    = new Date(now); startOf7Days.setDate(now.getDate() - 7);

    const [
      totalContacts,
      totalDeals,
      activeDeals,
      closedWonDeals,
      wonDeals,
      wonCount,
      overdueTasks,
      thisWeekActivities,
      contactsThisMonth,
      contactsLastMonth,
      dealsCreatedThisMonth,
      dealsCreatedLastMonth,
      closedWonLastMonth,
      wonThisMonth,
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
      prisma.deal.findMany({
        where:  { organizationId, stage: DealStage.closed_won },
        select: { value: true },
      }),
      prisma.deal.count({ where: { organizationId, stage: DealStage.closed_won } }),
      prisma.activity.count({
        where: { organizationId, type: ActivityType.task, completed: false, dueDate: { lt: now } },
      }),
      prisma.activity.count({
        where: { organizationId, createdAt: { gte: startOf7Days } },
      }),
      prisma.contact.count({
        where: { organizationId, createdAt: { gte: startOfMonth } },
      }),
      prisma.contact.count({
        where: { organizationId, createdAt: { gte: startOfPrevMonth, lt: startOfMonth } },
      }),
      prisma.deal.findMany({
        where:  { organizationId, createdAt: { gte: startOfMonth } },
        select: { value: true },
      }),
      prisma.deal.findMany({
        where:  { organizationId, createdAt: { gte: startOfPrevMonth, lt: startOfMonth } },
        select: { value: true },
      }),
      prisma.deal.findMany({
        where:  { organizationId, stage: DealStage.closed_won, closedAt: { gte: startOfPrevMonth, lt: startOfMonth } },
        select: { value: true },
      }),
      prisma.deal.count({
        where: { organizationId, stage: DealStage.closed_won, closedAt: { gte: startOfMonth } },
      }),
    ]);

    const pipelineValue       = activeDeals.reduce((s, d) => s + d.value, 0);
    const closedWonThisMonth  = closedWonDeals.reduce((s, d) => s + d.value, 0);
    const conversionRate      = totalDeals > 0 ? Math.round((wonCount / totalDeals) * 100) : 0;
    const totalClosedWonValue = wonDeals.reduce((s, d) => s + d.value, 0);
    const averageDealSize     = wonCount > 0 ? Math.round(totalClosedWonValue / wonCount) : 0;

    const closedWonLastMonthValue = closedWonLastMonth.reduce((s, d) => s + d.value, 0);
    const dealsValueThisMonth     = dealsCreatedThisMonth.reduce((s, d) => s + d.value, 0);
    const dealsValueLastMonth     = dealsCreatedLastMonth.reduce((s, d) => s + d.value, 0);

    const pct = (a: number, b: number) => b > 0 ? Math.round(((a - b) / b) * 100) : a > 0 ? 100 : 0;

    const trends = {
      contacts:   pct(contactsThisMonth, contactsLastMonth),
      pipeline:   pct(dealsValueThisMonth, dealsValueLastMonth),
      conversion: pct(wonThisMonth, closedWonLastMonth.length),
      closed:     pct(closedWonThisMonth, closedWonLastMonthValue),
    };

    return {
      totalContacts, totalDeals, pipelineValue, closedWonThisMonth,
      conversionRate, averageDealSize, overdueTasks, thisWeekActivities,
      trends,
    };
  }
}
