import { BrevoClient } from '@getbrevo/brevo';

let client: BrevoClient | null = null;
let clientInitialized = false;

function getClient(): BrevoClient | null {
  if (clientInitialized) return client;

  clientInitialized = true;
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[EmailService] BREVO_API_KEY not set — emails will not be sent');
    return null;
  }
  try {
    client = new BrevoClient({ apiKey });
    console.log('[EmailService] Brevo client initialized successfully');
    return client;
  } catch (err) {
    console.warn('[EmailService] Failed to initialize Brevo client:', err);
    return null;
  }
}

function sender() {
  return {
    email: process.env.BREVO_SENDER_EMAIL || 'onboarding@yourdomain.com',
    name: process.env.BREVO_SENDER_NAME || 'CRM Manager',
  };
}

async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
): Promise<boolean> {
  const c = getClient();
  if (!c) {
    console.warn(`[EmailService] No client — would have sent "${subject}" to ${to}`);
    return false;
  }

  try {
    const result = await c.transactionalEmails.sendTransacEmail({
      sender: sender(),
      to: [{ email: to }],
      subject,
      htmlContent,
    });
    console.log(`[EmailService] Sent "${subject}" to ${to}:`, result.messageId || 'OK');
    return true;
  } catch (error: any) {
    console.error(`[EmailService] Failed to send "${subject}" to ${to}:`, error.message || error);
    return false;
  }
}

// ─── HTML templates ────────────────────────────────────────────────────────────

function wrapper(body: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">C</div>
      </div>
      ${body}
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">CRM Manager &mdash; Manage your customer relationships effortlessly</p>
    </div>
  `;
}

// ─── Email types ────────────────────────────────────────────────────────────────

export class EmailService {
  /** Invitation to join an organization */
  static async sendInvitationEmail(data: {
    to: string;
    inviterName: string;
    organizationName: string;
    roleName: string;
    inviteToken: string;
    frontendUrl: string;
  }): Promise<boolean> {
    const inviteLink = `${data.frontendUrl}/invitations/accept?token=${data.inviteToken}`;
    return sendEmail(
      data.to,
      `You're invited to join ${data.organizationName}`,
      wrapper(`
        <h2 style="color: #111827; margin: 0 0 8px;">You're Invited!</h2>
        <p style="color: #6b7280; margin: 0 0 16px; line-height: 1.6;">
          <strong>${data.inviterName}</strong> has invited you to join
          <strong>${data.organizationName}</strong> as a
          <strong>${data.roleName}</strong>.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${inviteLink}" style="background: #6366f1; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 14px;">Accept Invitation</a>
        </div>
        <p style="color: #9ca3af; font-size: 13px; margin: 0;">Or copy this link: <br/><span style="word-break: break-all; color: #6366f1;">${inviteLink}</span></p>
        <p style="color: #d1d5db; font-size: 11px; margin-top: 16px;">This invitation expires in 72 hours.</p>
      `)
    );
  }

  /** Welcome email after owner registration (onboarding) */
  static async sendWelcomeEmail(data: {
    to: string;
    name: string;
    organizationName: string;
  }): Promise<boolean> {
    return sendEmail(
      data.to,
      `Welcome to CRM Manager, ${data.name}!`,
      wrapper(`
        <h2 style="color: #111827; margin: 0 0 8px;">Welcome to CRM Manager! 🎉</h2>
        <p style="color: #6b7280; margin: 0 0 16px; line-height: 1.6;">
          Hi <strong>${data.name}</strong>, welcome aboard! Your organization
          <strong>${data.organizationName}</strong> has been created successfully.
        </p>
        <p style="color: #6b7280; margin: 0 0 20px; line-height: 1.6;">
          You can now add your team members, import contacts, and start managing deals.
          Head to your dashboard to get started.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="background: #6366f1; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 14px;">Go to Dashboard</a>
        </div>
        <p style="color: #9ca3af; font-size: 13px; margin: 0;">Need help? Check our guides or contact support.</p>
      `)
    );
  }

  /** Welcome email after accepting an invitation */
  static async sendInvitationAcceptedEmail(data: {
    to: string;
    name: string;
    organizationName: string;
    invitedByName: string;
  }): Promise<boolean> {
    return sendEmail(
      data.to,
      `You've joined ${data.organizationName}!`,
      wrapper(`
        <h2 style="color: #111827; margin: 0 0 8px;">Welcome to ${data.organizationName}! 🎉</h2>
        <p style="color: #6b7280; margin: 0 0 16px; line-height: 1.6;">
          Hi <strong>${data.name}</strong>, you've been added to
          <strong>${data.organizationName}</strong> by
          <strong>${data.invitedByName}</strong>.
        </p>
        <p style="color: #6b7280; margin: 0 0 20px; line-height: 1.6;">
          You can now log in and start collaborating with your team.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background: #6366f1; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 14px;">Go to Login</a>
        </div>
      `)
    );
  }

  /** Notification when a deal is assigned to a user */
  static async sendDealAssignedEmail(data: {
    to: string;
    assignedToName: string;
    dealTitle: string;
    dealValue: number;
    currency: string;
    assignedByName: string;
    organizationName: string;
  }): Promise<boolean> {
    return sendEmail(
      data.to,
      `New deal assigned: ${data.dealTitle}`,
      wrapper(`
        <h2 style="color: #111827; margin: 0 0 8px;">Deal Assigned to You</h2>
        <p style="color: #6b7280; margin: 0 0 16px; line-height: 1.6;">
          Hi <strong>${data.assignedToName}</strong>,
        </p>
        <p style="color: #6b7280; margin: 0 0 16px; line-height: 1.6;">
          <strong>${data.assignedByName}</strong> has assigned a deal to you in
          <strong>${data.organizationName}</strong>.
        </p>
        <div style="background: #f9fafb; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 4px;"><strong>${data.dealTitle}</strong></p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Value: ${data.currency} ${data.dealValue.toLocaleString()}</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/deals" style="background: #6366f1; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 14px;">View Deal</a>
        </div>
      `)
    );
  }

  /** Notification when a contact is assigned to a user */
  static async sendContactAssignedEmail(data: {
    to: string;
    assignedToName: string;
    contactName: string;
    contactEmail: string;
    assignedByName: string;
    organizationName: string;
  }): Promise<boolean> {
    return sendEmail(
      data.to,
      `New contact assigned: ${data.contactName}`,
      wrapper(`
        <h2 style="color: #111827; margin: 0 0 8px;">Contact Assigned to You</h2>
        <p style="color: #6b7280; margin: 0 0 16px; line-height: 1.6;">
          Hi <strong>${data.assignedToName}</strong>,
        </p>
        <p style="color: #6b7280; margin: 0 0 16px; line-height: 1.6;">
          <strong>${data.assignedByName}</strong> has assigned a contact to you in
          <strong>${data.organizationName}</strong>.
        </p>
        <div style="background: #f9fafb; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 4px;"><strong>${data.contactName}</strong></p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">${data.contactEmail}</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contacts" style="background: #6366f1; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 14px;">View Contact</a>
        </div>
      `)
    );
  }

  /** Password reset PIN */
  static async sendPasswordResetPinEmail(data: {
    to: string;
    name: string;
    pin: string;
  }): Promise<boolean> {
    return sendEmail(
      data.to,
      'Your Password Reset PIN',
      wrapper(`
        <h2 style="color: #111827; margin: 0 0 8px;">Password Reset</h2>
        <p style="color: #6b7280; margin: 0 0 16px; line-height: 1.6;">
          Hi <strong>${data.name}</strong>,
        </p>
        <p style="color: #6b7280; margin: 0 0 16px; line-height: 1.6;">
          You requested to reset your password. Use the 6-digit PIN below to proceed:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px 32px; display: inline-block; letter-spacing: 12px; font-size: 28px; font-weight: bold; color: #111827;">${data.pin}</div>
        </div>
        <p style="color: #9ca3af; font-size: 13px; margin: 0;">This PIN expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      `)
    );
  }

  /** Notification when an activity is assigned to a user */
  static async sendActivityAssignedEmail(data: {
    to: string;
    assignedToName: string;
    activitySubject: string;
    activityType: string;
    dueDate?: string;
    assignedByName: string;
    organizationName: string;
  }): Promise<boolean> {
    return sendEmail(
      data.to,
      `New task assigned: ${data.activitySubject}`,
      wrapper(`
        <h2 style="color: #111827; margin: 0 0 8px;">Task / Activity Assigned to You</h2>
        <p style="color: #6b7280; margin: 0 0 16px; line-height: 1.6;">
          Hi <strong>${data.assignedToName}</strong>,
        </p>
        <p style="color: #6b7280; margin: 0 0 16px; line-height: 1.6;">
          <strong>${data.assignedByName}</strong> has assigned a task to you in
          <strong>${data.organizationName}</strong>.
        </p>
        <div style="background: #f9fafb; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 4px;"><strong>${data.activitySubject}</strong></p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Type: ${data.activityType}</p>
          ${data.dueDate ? `<p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">Due: ${data.dueDate}</p>` : ''}
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/activities" style="background: #6366f1; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 14px;">View Tasks</a>
        </div>
      `)
    );
  }
}
