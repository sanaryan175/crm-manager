import prisma from '../config/db';
import { ForbiddenError, NotFoundError } from '../utils/errors';

export class UserService {
  static async listUsers(organizationId: string) {
    const users = await prisma.user.findMany({
      where:   { organizationId },
      include: { role: { select: { id: true, name: true, displayName: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return users.map(({ password: _pw, ...safe }) => safe);
  }

  static async getUserById(userId: string, organizationId: string) {
    const user = await prisma.user.findFirst({
      where:   { id: userId, organizationId },
      include: { role: { select: { id: true, name: true, displayName: true } } },
    });
    if (!user) throw new NotFoundError('User not found');
    const { password: _pw, ...safe } = user;
    return safe;
  }

  static async changeUserRole(
    targetUserId:   string,
    organizationId: string,
    newRoleId:      string,
    actorRoleName:  string
  ) {
    const target = await prisma.user.findFirst({
      where:   { id: targetUserId, organizationId },
      include: { role: true },
    });
    if (!target) throw new NotFoundError('User not found');

    // Cannot change the owner's role
    if (target.isOwner) throw new ForbiddenError('Cannot change the owner\'s role');

    // Only owner and admin can change roles
    if (!['owner', 'admin'].includes(actorRoleName)) {
      throw new ForbiddenError('Insufficient permissions to change user roles');
    }

    const newRole = await prisma.role.findFirst({
      where: { id: newRoleId, organizationId },
    });
    if (!newRole) throw new NotFoundError('Role not found');

    // Admins cannot assign owner or admin roles
    if (actorRoleName === 'admin' && ['owner', 'admin'].includes(newRole.name)) {
      throw new ForbiddenError('Admins cannot assign owner or admin roles');
    }

    const updated = await prisma.user.update({
      where:   { id: targetUserId },
      data:    { roleId: newRoleId },
      include: { role: { select: { id: true, name: true, displayName: true } } },
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId:     targetUserId,
        action:     'role_changed',
        resource:   'user',
        resourceId: targetUserId,
        metadata:   { from: target.role.name, to: newRole.name },
      },
    });

    const { password: _pw, ...safe } = updated;
    return safe;
  }

  static async deactivateUser(
    targetUserId:   string,
    organizationId: string,
    actorId:        string,
    actorRoleName:  string
  ) {
    const target = await prisma.user.findFirst({
      where: { id: targetUserId, organizationId },
    });
    if (!target) throw new NotFoundError('User not found');
    if (target.isOwner) throw new ForbiddenError('Cannot deactivate the organization owner');
    if (targetUserId === actorId) throw new ForbiddenError('Cannot deactivate yourself');
    if (!['owner', 'admin'].includes(actorRoleName)) {
      throw new ForbiddenError('Insufficient permissions to deactivate users');
    }

    await prisma.user.update({ where: { id: targetUserId }, data: { isActive: false } });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId:     actorId,
        action:     'update',
        resource:   'user',
        resourceId: targetUserId,
        metadata:   { action: 'deactivated' },
      },
    });

    return { success: true };
  }
}
