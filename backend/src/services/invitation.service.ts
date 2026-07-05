import prisma from '../config/db';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { INVITE_PERMISSIONS } from '../rbac/permissions';
import { TokenPayload } from '../utils/jwt';
import { EmailService } from './email.service';

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
    const rawToken    = crypto.randomBytes(32).toString('hex');
    const tokenHash   = await bcrypt.hash(rawToken, 10);
    const tokenPrefix = rawToken.slice(0, 8);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + INVITE_EXPIRY_HOURS);

    const invitation = await prisma.invitation.create({
      data: {
        organizationId: inviter.organizationId,
        email:          data.email.toLowerCase(),
        roleId:         data.roleId,
        invitedById:    inviter.userId,
        token:          tokenHash,
        tokenPrefix,
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

    // Fetch inviter's name for email
    const inviterUser = await prisma.user.findFirst({
      where: { id: inviter.userId },
      select: { name: true },
    });

    // Send invitation email
    const emailSent = await EmailService.sendInvitationEmail({
      to: data.email,
      inviterName: inviterUser?.name || 'Someone',
      organizationName: invitation.organization.name,
      roleName: targetRole.displayName,
      inviteToken: rawToken,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    });

    if (!emailSent) {
      console.warn('Invitation created but email delivery failed — invite token available for manual sharing');
    }

    return { invitation, inviteToken: rawToken, emailSent };
  }

  /**
   * Accept an invitation — creates the user account.
   */
  static async acceptInvitation(data: {
    token:    string;
    name:     string;
    password: string;
  }) {
    console.log('=== INVITATION ACCEPT DEBUG ===');
    console.log('Received token length:', data.token.length);
    console.log('Received token prefix:', data.token.slice(0, 8));
    
    // Find pending invitations matching the token prefix (O(1) narrowing before bcrypt)
    const pending = await prisma.invitation.findMany({
      where:   { status: 'pending', tokenPrefix: data.token.slice(0, 8) },
      include: { organization: true, role: true },
    });

    console.log('Found pending invitations with matching prefix:', pending.length);
    
    // Find matching token via bcrypt compare
    let matched: (typeof pending)[0] | undefined;
    for (const inv of pending) {
      const isMatch = await bcrypt.compare(data.token, inv.token);
      console.log(`Checking invitation ${inv.id}: match=${isMatch}, email=${inv.email}`);
      if (isMatch) { matched = inv; break; }
    }

    console.log('Matched invitation:', matched ? matched.id : 'none');
    console.log('============================');

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
      // Create user with onboardingComplete = false (invited users need to complete setup)
      const user = await tx.user.create({
        data: {
          organizationId:     matched!.organizationId,
          roleId:             matched!.roleId,
          name:               data.name,
          email:              matched!.email,
          password:           hashedPassword,
          avatar:             data.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
          onboardingComplete: false,
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
          metadata:       { invitedEmail: matched!.email, role: matched!.role.name },
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
   * Resend an invitation — expires old one and creates fresh token.
   */
  static async resendInvitation(
    invitationId:   string,
    organizationId: string,
    inviterId:      string,
    inviterRoleName: string
  ) {
    const inv = await prisma.invitation.findFirst({
      where:   { id: invitationId, organizationId },
      include: { role: true },
    });
    if (!inv) throw new NotFoundError('Invitation not found');

    // Validate hierarchy again on resend
    const allowedToInvite = INVITE_PERMISSIONS[inviterRoleName] ?? [];
    if (!allowedToInvite.includes(inv.role.name)) {
      throw new ForbiddenError('You cannot resend this invitation');
    }

    // Expire old
    await prisma.invitation.update({
      where: { id: invitationId },
      data:  { status: 'expired' },
    });

    // Create fresh invitation
    const rawToken    = crypto.randomBytes(32).toString('hex');
    const tokenHash   = await bcrypt.hash(rawToken, 10);
    const tokenPrefix = rawToken.slice(0, 8);
    const expiresAt   = new Date();
    expiresAt.setHours(expiresAt.getHours() + INVITE_EXPIRY_HOURS);

    const newInvitation = await prisma.invitation.create({
      data: {
        organizationId,
        email:        inv.email,
        roleId:       inv.roleId,
        invitedById:  inviterId,
        token:        tokenHash,
        tokenPrefix,
        expiresAt,
      },
      include: {
        role:         { select: { name: true, displayName: true } },
        invitedBy:    { select: { name: true, email: true } },
        organization: { select: { name: true } },
      },
    });

    // Send invitation email
    const inviterUser = await prisma.user.findFirst({
      where: { id: inviterId },
      select: { name: true },
    });

    const emailSent = await EmailService.sendInvitationEmail({
      to: inv.email,
      inviterName: inviterUser?.name || 'Someone',
      organizationName: newInvitation.organization.name,
      roleName: inv.role.displayName,
      inviteToken: rawToken,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    });

    if (!emailSent) {
      console.warn('Resend: invitation created but email delivery failed — invite token available for manual sharing');
    }

    return { invitation: newInvitation, inviteToken: rawToken, emailSent };
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
        action:     'invite_revoked',
        resource:   'invitation',
        resourceId: invitationId,
        metadata:   { action: 'revoked' },
      },
    });

    return { success: true };
  }
}
