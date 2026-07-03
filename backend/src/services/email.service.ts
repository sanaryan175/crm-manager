import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  static async sendInvitationEmail(data: {
    to: string;
    inviterName: string;
    organizationName: string;
    roleName: string;
    inviteToken: string;
    frontendUrl: string;
  }) {
    const inviteLink = `${data.frontendUrl}/accept-invitation?token=${data.inviteToken}`;

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM || 'onboarding@yourdomain.com',
        to: data.to,
        subject: `You're invited to join ${data.organizationName}`,
        html: `
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
            <p style="color: #999; font-size: 12px; margin-top: 30px;">This invitation will expire in 7 days.</p>
          </div>
        `,
      });
      console.log(`Invitation email sent to ${data.to}`);
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      throw new Error('Failed to send invitation email');
    }
  }
}
