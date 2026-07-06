import prisma from '../config/db';
import * as bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../utils/errors';

export class AuthService {
  static async login(data: { email: string; password: string }) {
    const user = await prisma.user.findFirst({
      where:   { email: data.email.toLowerCase(), isActive: true },
      include: {
        role:         { select: { id: true, name: true, displayName: true } },
        organization: { select: { id: true, name: true, setupComplete: true, country: true, currency: true } },
      },
    });

    if (!user) throw new UnauthorizedError('Invalid email or password');

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedError('Invalid email or password');

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data:  { lastLoginAt: new Date() },
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId:         user.id,
        action:         'login',
        resource:       'user',
        resourceId:     user.id,
      },
    });

    const { password: _pw, ...userSafe } = user;

    const token = generateToken({
      userId:         user.id,
      organizationId: user.organizationId,
      roleId:         user.roleId,
      roleName:       user.role.name,
    });

    return { user: userSafe, token };
  }

  static async completeOnboarding(userId: string, organizationId: string, preferences?: {
    timezone?: string;
    language?: string;
    phone?: string;
    jobTitle?: string;
    emailNotifications?: boolean;
    taskReminders?: boolean;
    meetingReminders?: boolean;
    dateFormat?: string;
    timeFormat?: string;
  }) {
    const user = await prisma.user.findFirst({ where: { id: userId, organizationId } });
    if (!user) throw new NotFoundError('User not found');

    const updated = await prisma.user.update({
      where: { id: userId },
      data:  {
        onboardingComplete: true,
        ...(preferences?.timezone       && { timezone: preferences.timezone }),
        ...(preferences?.language       && { language: preferences.language }),
        ...(preferences?.phone          && { phone: preferences.phone }),
        ...(preferences?.jobTitle       && { jobTitle: preferences.jobTitle }),
        ...(preferences?.dateFormat     && { dateFormat: preferences.dateFormat }),
        ...(preferences?.timeFormat     && { timeFormat: preferences.timeFormat }),
        ...(preferences?.emailNotifications  !== undefined && { emailNotifications:  preferences.emailNotifications }),
        ...(preferences?.taskReminders       !== undefined && { taskReminders:       preferences.taskReminders }),
        ...(preferences?.meetingReminders    !== undefined && { meetingReminders:    preferences.meetingReminders }),
      },
      include: {
        role: { select: { id: true, name: true, displayName: true } },
        organization: { select: { id: true, name: true, country: true, currency: true, setupComplete: true } },
      },
    });

    const { password: _pw, ...safe } = updated;
    return safe;
  }

  static async getUserProfile(userId: string, organizationId: string) {
    const user = await prisma.user.findFirst({
      where:   { id: userId, organizationId },
      include: {
        role: { select: { id: true, name: true, displayName: true } },
        organization: { select: { id: true, name: true, country: true, currency: true, setupComplete: true } },
      },
    });

    if (!user) throw new NotFoundError('User not found');

    const { password: _pw, ...userSafe } = user;
    return userSafe;
  }

  static async updateProfile(
    userId:         string,
    organizationId: string,
    data: { name?: string; avatar?: string; phone?: string; jobTitle?: string; profileCompleted?: boolean }
  ) {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
    });
    if (!user) throw new NotFoundError('User not found');

    const updated = await prisma.user.update({
      where:   { id: userId },
      data: {
        name: data.name,
        avatar: data.avatar,
        phone: data.phone,
        jobTitle: data.jobTitle,
        ...(data.profileCompleted !== undefined && { profileCompleted: data.profileCompleted }),
      },
      include: {
        role: { select: { id: true, name: true, displayName: true } },
        organization: { select: { id: true, name: true, country: true, currency: true, setupComplete: true } },
      },
    });

    const { password: _pw, ...safe } = updated;
    return safe;
  }

  static async changePassword(
    userId:         string,
    organizationId: string,
    data: { currentPassword: string; newPassword: string }
  ) {
    const user = await prisma.user.findFirst({ where: { id: userId, organizationId } });
    if (!user) throw new NotFoundError('User not found');

    const valid = await bcrypt.compare(data.currentPassword, user.password);
    if (!valid) throw new BadRequestError('Current password is incorrect');

    const hashed = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    return { success: true };
  }
}
