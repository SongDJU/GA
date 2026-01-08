import nodemailer from 'nodemailer';
import { prisma } from './prisma';

interface VoucherData {
  description: string;
  accountName: string;
  amount: number | null;
  repeatDay: number;
}

interface ContractData {
  name: string;
  company: string | null;
  amount: number | null;
  endDate: Date;
  categoryName: string;
  daysUntil: number;
}

interface AlertData {
  userName: string;
  vouchers: VoucherData[];
  contracts: ContractData[];
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return '-';
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function getRepeatDayText(day: number): string {
  if (day === 0) return '매월 말일';
  return `매월 ${day}일`;
}

function getDaysUntilClass(days: number): string {
  if (days <= 3) return 'background-color: #fee2e2; color: #dc2626;';
  if (days <= 10) return 'background-color: #fef3c7; color: #d97706;';
  return 'background-color: #e0e7ff; color: #4f46e5;';
}

export function generateEmailTemplate(data: AlertData): string {
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  let voucherSection = '';
  if (data.vouchers.length > 0) {
    const voucherRows = data.vouchers
      .map(
        (v) => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${v.description}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${v.accountName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(v.amount)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
              <span style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                ${getRepeatDayText(v.repeatDay)}
              </span>
            </td>
          </tr>
        `
      )
      .join('');

    voucherSection = `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 16px; display: flex; align-items: center;">
          <span style="background-color: #3b82f6; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 14px;">📋</span>
          이번 달 처리 전표 (${data.vouchers.length}건)
        </h2>
        <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e5e7eb;">적요명</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e5e7eb;">계정과목</th>
              <th style="padding: 12px; text-align: right; font-weight: 600; color: #475569; border-bottom: 2px solid #e5e7eb;">금액</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #475569; border-bottom: 2px solid #e5e7eb;">반복일자</th>
            </tr>
          </thead>
          <tbody>
            ${voucherRows}
          </tbody>
        </table>
      </div>
    `;
  }

  let contractSection = '';
  if (data.contracts.length > 0) {
    const contractRows = data.contracts
      .map(
        (c) => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${c.name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
              <span style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                ${c.categoryName}
              </span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${c.company || '-'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(c.amount)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${formatDate(c.endDate)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
              <span style="${getDaysUntilClass(c.daysUntil)} padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                D-${c.daysUntil}
              </span>
            </td>
          </tr>
        `
      )
      .join('');

    contractSection = `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 16px; display: flex; align-items: center;">
          <span style="background-color: #ef4444; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 14px;">⚠️</span>
          만료 임박 계약 (${data.contracts.length}건)
        </h2>
        <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e5e7eb;">계약명</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e5e7eb;">카테고리</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e5e7eb;">계약업체</th>
              <th style="padding: 12px; text-align: right; font-weight: 600; color: #475569; border-bottom: 2px solid #e5e7eb;">금액</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e5e7eb;">만료일</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #475569; border-bottom: 2px solid #e5e7eb;">D-Day</th>
            </tr>
          </thead>
          <tbody>
            ${contractRows}
          </tbody>
        </table>
      </div>
    `;
  }

  const noDataSection =
    data.vouchers.length === 0 && data.contracts.length === 0
      ? `
        <div style="text-align: center; padding: 40px; background-color: #f0fdf4; border-radius: 8px;">
          <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
          <h3 style="color: #16a34a; margin: 0 0 8px 0;">오늘의 알림이 없습니다!</h3>
          <p style="color: #6b7280; margin: 0;">처리할 전표와 만료 임박 계약이 없습니다.</p>
        </div>
      `
      : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 24px;">이지켐 총무 자산관리</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">일일 업무 알림</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <!-- Greeting -->
          <div style="margin-bottom: 24px;">
            <p style="color: #374151; font-size: 16px; margin: 0;">
              안녕하세요, <strong>${data.userName}</strong>님!
            </p>
            <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0;">
              ${today} 업무 알림입니다.
            </p>
          </div>

          ${noDataSection}
          ${voucherSection}
          ${contractSection}

          <!-- Alert Info -->
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-top: 20px;">
            <h4 style="color: #475569; margin: 0 0 12px 0; font-size: 14px;">📌 알림 안내</h4>
            <ul style="color: #6b7280; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>전표: 해당 월의 미처리 전표가 알림됩니다. (처리 완료 시 제외)</li>
              <li>계약: 만료 45일, 30일, 20일, 10일, 3일, 2일, 1일 전에만 알림됩니다.</li>
              <li>알림 설정은 시스템 설정에서 변경할 수 있습니다.</li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            이 메일은 이지켐 총무 자산관리 시스템에서 자동 발송되었습니다.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
            © ${new Date().getFullYear()} EasyChem. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendDailyAlerts() {
  try {
    // Get SMTP settings
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from'] },
      },
    });

    const smtpConfig: Record<string, string> = {};
    settings.forEach((s) => {
      smtpConfig[s.key] = s.value;
    });

    if (!smtpConfig.smtp_host || !smtpConfig.smtp_port) {
      console.log('SMTP not configured, skipping email');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtpConfig.smtp_host,
      port: parseInt(smtpConfig.smtp_port),
      secure: parseInt(smtpConfig.smtp_port) === 465,
      auth:
        smtpConfig.smtp_user && smtpConfig.smtp_pass
          ? {
              user: smtpConfig.smtp_user,
              pass: smtpConfig.smtp_pass,
            }
          : undefined,
    });

    // Get users with active mail settings
    const mailSettings = await prisma.mailSetting.findMany({
      where: { isActive: true, email: { not: '' } },
    });

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Alert days for contracts
    const alertDays = [45, 30, 20, 10, 3, 2, 1];

    for (const mailSetting of mailSettings) {
      try {
        // Get user
        const user = await prisma.user.findUnique({
          where: { id: mailSetting.userId },
        });

        if (!user) continue;

        // Get vouchers for this user
        const vouchers = await prisma.voucher.findMany({
          where: {
            userId: mailSetting.userId,
            deletedAt: null,
            isCompleted: false,
          },
          orderBy: { repeatDay: 'asc' },
        });

        // Filter vouchers that should appear this month
        const thisMonthVouchers = vouchers.filter((v) => {
          const repeatDay = v.repeatDay === 0 ? lastDayOfMonth : v.repeatDay;
          return repeatDay >= currentDay;
        });

        // Get contracts for this user
        const contracts = await prisma.contract.findMany({
          where: {
            userId: mailSetting.userId,
            deletedAt: null,
          },
          include: {
            category: { select: { name: true } },
          },
        });

        // Filter contracts by alert days
        const alertContracts = contracts
          .map((c) => {
            const end = new Date(c.endDate);
            end.setHours(0, 0, 0, 0);
            const todayMidnight = new Date(today);
            todayMidnight.setHours(0, 0, 0, 0);
            const diffTime = end.getTime() - todayMidnight.getTime();
            const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
              ...c,
              categoryName: c.category.name,
              daysUntil,
            };
          })
          .filter((c) => alertDays.includes(c.daysUntil));

        // Skip if no alerts
        if (thisMonthVouchers.length === 0 && alertContracts.length === 0) {
          continue;
        }

        // Generate email
        const emailHtml = generateEmailTemplate({
          userName: user.name,
          vouchers: thisMonthVouchers.map((v) => ({
            description: v.description,
            accountName: v.accountName,
            amount: v.amount,
            repeatDay: v.repeatDay,
          })),
          contracts: alertContracts.map((c) => ({
            name: c.name,
            company: c.company,
            amount: c.amount,
            endDate: c.endDate,
            categoryName: c.categoryName,
            daysUntil: c.daysUntil,
          })),
        });

        // Send email
        await transporter.sendMail({
          from: smtpConfig.smtp_from || smtpConfig.smtp_user,
          to: mailSetting.email,
          subject: `[이지켐] ${today.getMonth() + 1}월 ${today.getDate()}일 업무 알림`,
          html: emailHtml,
        });

        console.log(`Email sent to ${mailSetting.email}`);
      } catch (error) {
        console.error(`Failed to send email to ${mailSetting.email}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to send daily alerts:', error);
  }
}
