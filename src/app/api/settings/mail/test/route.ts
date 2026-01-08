import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get SMTP settings
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from'],
        },
      },
    });

    const smtpConfig: Record<string, string> = {};
    settings.forEach((s) => {
      smtpConfig[s.key] = s.value;
    });

    if (!smtpConfig.smtp_host || !smtpConfig.smtp_port) {
      return NextResponse.json({ error: 'SMTP settings not configured' }, { status: 400 });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.smtp_host,
      port: parseInt(smtpConfig.smtp_port),
      secure: parseInt(smtpConfig.smtp_port) === 465,
      auth: smtpConfig.smtp_user && smtpConfig.smtp_pass ? {
        user: smtpConfig.smtp_user,
        pass: smtpConfig.smtp_pass,
      } : undefined,
    });

    // Send test email
    await transporter.sendMail({
      from: smtpConfig.smtp_from || smtpConfig.smtp_user,
      to: email,
      subject: '[이지켐 총무 자산관리] 테스트 메일',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .success-box { background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; }
            .success-icon { font-size: 48px; margin-bottom: 10px; }
            .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>이지켐 총무 자산관리</h1>
            </div>
            <div class="content">
              <div class="success-box">
                <div class="success-icon">✅</div>
                <h2 style="color: #10b981; margin: 0 0 10px 0;">테스트 메일 발송 성공!</h2>
                <p style="color: #374151; margin: 0;">SMTP 설정이 정상적으로 작동합니다.</p>
              </div>
              <p style="margin-top: 20px; color: #6b7280; text-align: center;">
                발송 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
              </p>
            </div>
            <div class="footer">
              <p>이 메일은 이지켐 총무 자산관리 시스템에서 발송되었습니다.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to send test email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send test email' },
      { status: 500 }
    );
  }
}
