import { NextRequest, NextResponse } from 'next/server';
import { otpStore } from '@/otpStore';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const normalizedEmail = (email as string).trim().toLowerCase();

    console.log('STORE ON VERIFY', Array.from(otpStore.entries()), 'email:', normalizedEmail);

    const record = otpStore.get(normalizedEmail);

    if (!record) {
      return NextResponse.json({ error: 'No code found for this email' }, { status: 400 });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalizedEmail);
      return NextResponse.json({ error: 'Code has expired' }, { status: 400 });
    }

    if (record.code !== otp) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    otpStore.delete(normalizedEmail);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Failed to verify code' }, { status: 500 });
  }
}
