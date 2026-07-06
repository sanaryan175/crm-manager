import prisma from '../config/db';

export class NotificationService {
  static async getNotifications(userId: string, organizationId: string, limit = 20) {
    const activities = await prisma.activity.findMany({
      where: { assignedToId: userId, organizationId, completed: false },
      include: { contact: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const deals = await prisma.deal.findMany({
      where: {
        assignedToId: userId,
        organizationId,
        stage: { notIn: ['closed_won', 'closed_lost'] },
      },
      include: { contact: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const notifications: Array<{
      id: string;
      type: 'activity' | 'deal';
      title: string;
      resourceId: string;
      createdAt: Date;
      contactName: string | null;
    }> = [
      ...activities.map((a) => ({
        id: `act-${a.id}`,
        type: 'activity' as const,
        title: a.subject,
        resourceId: a.id,
        createdAt: a.createdAt,
        contactName: a.contact ? `${a.contact.firstName} ${a.contact.lastName}` : null,
      })),
      ...deals.map((d) => ({
        id: `deal-${d.id}`,
        type: 'deal' as const,
        title: d.title,
        resourceId: d.id,
        createdAt: d.createdAt,
        contactName: d.contact ? `${d.contact.firstName} ${d.contact.lastName}` : null,
      })),
    ];

    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return { notifications: notifications.slice(0, limit), unread: notifications.length };
  }
}
