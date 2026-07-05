import { BrevoClient } from '@getbrevo/brevo';

function createBrevoClient() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('BREVO_API_KEY not set — emails will not be sent');
    return null;
  }
  try {
    return new BrevoClient({ apiKey });
  } catch (err) {
    console.warn('Failed to initialize Brevo client:', err);
    return null;
  }
}

const client = createBrevoClient();

export class EmailService {
  static async sendInvitationEmail(data: {
    to: string;
    inviterName: string;
    organizationName: string;
    roleName: string;
    inviteToken: string;
    frontendUrl: string;
  }): Promise<boolean> {
    const inviteLink = `${data.frontendUrl}/invitations/accept?token=${data.inviteToken}`;

    if (!client) {
      console.warn(`[EmailService] No Brevo client — would have sent invitation to ${data.to}: ${inviteLink}`);
      return false;
    }

    try {
      console.log('Attempting to send email to:', data.to);
      console.log('Using sender email:', process.env.BREVO_SENDER_EMAIL || 'onboarding@yourdomain.com');

      const result = await client.transactionalEmails.sendTransacEmail({
        sender: {
          email: process.env.BREVO_SENDER_EMAIL || 'onboarding@yourdomain.com',
          name: process.env.BREVO_SENDER_NAME || 'CRM Manager'
        },
        to: [{ email: data.to }],
        subject: `You're invited to join ${data.organizationName}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">You're Invited!</h2>
            <p>Hi there,</p>
            <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> as a <strong>${data.roleName}</strong>.</p>
            <p>Click the button below to accept the invitation and set up your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${inviteLink}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">This invitation will expire in 72 hours.</p>
          </div>
        `,
      });
      console.log(`Invitation email sent successfully to ${data.to}`, result);
      return true;
    } catch (error) {
      console.error('Failed to send invitation email. Error details:', error);
      return false;
    }
  }
}
