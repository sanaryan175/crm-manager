import { BrevoClient } from '@getbrevo/brevo';

const apiKey = process.env.BREVO_API_KEY;
if (!apiKey) {
  throw new Error('BREVO_API_KEY is not defined');
}

const client = new BrevoClient({ apiKey });

export class EmailService {
  static async sendInvitationEmail(data: {
    to: string;
    inviterName: string;
    organizationName: string;
    roleName: string;
    inviteToken: string;
    frontendUrl: string;
  }) {
    const inviteLink = `${data.frontendUrl}/invitations/accept?token=${data.inviteToken}`;

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
            <p style="color: #999; font-size: 12px; margin-top: 30px;">This invitation will expire in 7 days.</p>
          </div>
        `,
      });
      console.log(`Invitation email sent successfully to ${data.to}`, result);
    } catch (error) {
      console.error('Failed to send invitation email. Error details:', error);
      console.error('Error response:', JSON.stringify(error, null, 2));
      throw new Error('Failed to send invitation email');
    }
  }
}
