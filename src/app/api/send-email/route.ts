import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { subject, message, subscribers } = await request.json();

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    if (!subscribers || !Array.isArray(subscribers) || subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No subscribers provided' },
        { status: 400 }
      );
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json(
        { error: 'Email service not configured. Please add GMAIL_USER and GMAIL_APP_PASSWORD to environment variables.' },
        { status: 500 }
      );
    }

    // Send email to all subscribers
    const emailPromises = subscribers.map((subscriber: { email: string }) => 
      transporter.sendMail({
        from: `"bluetry" <${process.env.GMAIL_USER}>`,
        to: subscriber.email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Update from bluetry</h2>
            <div style="line-height: 1.6; color: #666;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">
              You're receiving this because you subscribed to updates from bluetry.
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(subscriber.email)}" 
                 style="color: #999;">Unsubscribe</a>
            </p>
          </div>
        `,
      })
    );

    // Wait for all emails to be sent
    const results = await Promise.allSettled(emailPromises);
    
    // Count successful sends
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      message: `Email sent to ${successful} subscribers${failed > 0 ? `, ${failed} failed` : ''}`,
      sent: successful,
      failed: failed
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      console.error('Error details:', error.stack);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to send emails. Please try again.' },
      { status: 500 }
    );
  }
}