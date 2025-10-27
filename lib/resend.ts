import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender email
export const DEFAULT_FROM_EMAIL = 'UPSC Aspirant Platform <noreply@yourdomain.com>';

// Email sending utility with error handling
export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to,
      subject,
      react,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

// Test email function
export async function sendTestEmail(to: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to,
      subject: 'Test Email from UPSC Aspirant Platform',
      html: '<p>This is a test email to verify Resend configuration.</p>',
    });

    if (error) {
      console.error('Test email error:', error);
      return { success: false, error };
    }

    console.log('Test email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Test email exception:', error);
    return { success: false, error };
  }
}
