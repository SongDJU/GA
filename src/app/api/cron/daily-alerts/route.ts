import { NextResponse } from 'next/server';
import { sendDailyAlerts } from '@/lib/mail';

// This endpoint can be called by a cron job to send daily alerts
export async function GET() {
  try {
    await sendDailyAlerts();
    return NextResponse.json({ success: true, message: 'Daily alerts sent' });
  } catch (error) {
    console.error('Failed to send daily alerts:', error);
    return NextResponse.json(
      { error: 'Failed to send daily alerts' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
