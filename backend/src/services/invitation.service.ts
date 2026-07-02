import prisma from '../config/db';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { INVITE_PERMISSIONS } from '../rbac/permissions';
import { TokenPayload } from '../utils/jwt';

const INVITE_EXPIRY_HOURS = 72;

export class InvitationService {
  /**
   * Send an invitation. Validates:
   * - Inviter has user.invite permission
   * - Inviter's role can invite the target role (hierarchy)
   * - No pending invite already exists for this email in this org
   */
  static async sendInvitation(
    inviter:   TokenPayload,
    data: { email: string; roleId: string }
  ) {
    // Resolve target role
    const targetRole = await prisma.role.findFirst({
      where: { id: data.roleId, organizationId: inviter.organizationId },
    });
    if (!targetRole) throw new NotFoundError('Role not found');

    // Check inviter's role hierarchy
    const allowedToInvite = INVITE_PERMISSIONS[inviter.roleName] ?? [];
    if (!allowedToInvite.includes(targetRole.name)) {
      throw new ForbiddenError(
        `Your role (${inviter.roleName}) cannot invite users with role: ${targetRole.displayName}`
      );
    }

    // Check if user already exists in this org
    const existing = await prisma.user.findFirst({
      where: { email: data.email.toLowerCase(), organizationId: inviter.organizationId },
    });
    if (existing) {
      throw new BadRequestError('A user with this email already exists in your organization');
    }

    // Expire any previous pending invites for this email+org
    await prisma.invitation.updateMany({
      where: {
        email:          data.email.toLowerCase(),
        organizationId: inviter.organizationId,
        status:         'pending',
      },
      data: { status: 'expired' },
    });

    // Generate secure random token (stored as bcrypt hash for security)
    const rawToken  = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 10);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + INVITE_EXPIRY_HOURS);

    const invitation = await prisma.invitation.create({
      data: {
        organizationId: inviter.organizationId,
        email:          data.email.toLowerCase(),
        roleId:         data.roleId,
        invitedById:    inviter.userId,
        token:          tokenHash,
        expiresAt,
      },
      include: {
        role:         { select: { name: true, displayName: true } },
        invitedBy:    { select: { name: true, email: true } },
        organization: { select: { name: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        organizationId: inviter.organizationId,
        userId:         inviter.userId,
        action:         'invite_sent',
        resource:       'invitation',
        resourceId:     invitation.id,
        metadata:       { invitedEmail: data.email, role: targetRole.name },
      },
    });

    // In production: send email with rawToken embedded in link.
    // For now we return the raw token so caller can send it.
    return { invitation, inviteToken: rawToken };
  }

  /**
   * Accept an invitation — creates the user account.
   */
  static async acceptInvitation(data: {
    token:    string;
    name:     string;
    password: string;
  }) {
    // Find all pending invitations (we need to check token hash)
    const pending = await prisma.invitation.findMany({
      where:   { status: 'pending' },
      include: { organization: true, role: true },
    });

    // Find matching token via bcrypt compare
    let matched: (typeof pending)[0] | undefined;
    for (const inv of pending) {
      const isMatch = await bcrypt.compare(data.token, inv.token);
      if (isMatch) { matched = inv; break; }
    }

    if (!matched) throw new BadRequestError('Invalid or expired invitation token');

    if (new Date() > matched.expiresAt) {
      await prisma.invitation.update({
        where: { id: matched.id },
        data:  { status: 'expired' },
      });
      throw new BadRequestError('This invitation has expired. Please request a new one.');
    }

    // Check email not already registered in this org
    const existing = await prisma.user.findFirst({
      where: { email: matched.email, organizationId: matched.organizationId },
    });
    if (existing) throw new BadRequestError('An account with this email already exists');

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          organizationId: matched!.organizationId,
          roleId:         matched!.roleId,
          name:           data.name,
          email:          matched!.email,
          password:       hashedPassword,
          avatar:         data.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
        },
      });

      // Mark invitation accepted
      await tx.invitation.update({
        where: { id: matched!.id },
        data:  { status: 'accepted', acceptedAt: new Date() },
      });

      // Audit
      await tx.auditLog.create({
        data: {
          organizationId: matched!.organizationId,
          userId:         user.id,
          action:         'invite_accepted',
          resource:       'invitation',
          resourceId:     matched!.id,
        },
      });

      return user;
    });

    const { password: _pw, ...userSafe } = result;

    const token = generateToken({
      userId:         result.id,
      organizationId: matched.organizationId,
      roleId:         matched.roleId,
      roleName:       matched.role.name,
    });

    return { user: userSafe, organization: matched.organization, token };
  }

  /**
   * List pending invitations for an organization.
   */
  static async listInvitations(organizationId: string) {
    return prisma.invitation.findMany({
      where:   { organizationId, status: 'pending' },
      include: {
        role:      { select: { name: true, displayName: true } },
        invitedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Revoke a pending invitation.
   */
  static async revokeInvitation(
    invitationId:   string,
    organizationId: string,
    userId:         string
  ) {
    const inv = await prisma.invitation.findFirst({
      where: { id: invitationId, organizationId, status: 'pending' },
    });
    if (!inv) throw new NotFoundError('Invitation not found');

    await prisma.invitation.update({
      where: { id: invitationId },
      data:  { status: 'revoked' },
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action:     'invite_sent',
        resource:   'invitation',
        resourceId: invitationId,
        metadata:   { action: 'revoked' },
      },
    });

    return { success: true };
  }
}
