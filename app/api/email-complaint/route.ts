import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📧 COMPLAINT DATA:', body);

    if (!body.title || !body.category || !body.priority || !body.priority) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // build attachments array from base64 images
    const imageAttachments =
      Array.isArray(body.images)
        ? body.images.map((img: any, idx: number) => ({
            filename: img.name || `photo-${idx + 1}.png`,
            content: img.base64.split(',')[1], // strip "data:image/..;base64,"
            encoding: 'base64',
            contentType: img.type || 'image/png',
          }))
        : [];
const voiceAttachment =
  body.voiceRecording && body.voiceRecording.base64
    ? [{
        filename: body.voiceRecording.name || 'voice-complaint.webm',
        content: body.voiceRecording.base64.split(',')[1],
        encoding: 'base64',
        contentType: body.voiceRecording.type || 'audio/webm',
      }]
    : [];

const attachments = [...imageAttachments, ...voiceAttachment];
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.RECIPIENT_EMAIL,
      cc: process.env.GMAIL_USER,
      subject: `🆘 NEW GRAM-SEVAK COMPLAINT: ${body.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <h1 style="color: #1e40af; text-align: center;">🚨 NEW VILLAGE COMPLAINT</h1>
          <div style="background: #f0f9ff; padding: 24px; border-radius: 12px; border-left: 6px solid #3b82f6;">
            <h2 style="color: #1e293b;">📋 Complaint Details</h2>
            <p><strong>🎯 Title:</strong> ${body.title}</p>
            <p><strong>🏷️ Category:</strong> <span style="background: #dbeafe; padding: 6px 12px; border-radius: 20px;">${body.category}</span></p>
            <p><strong>🔥 Priority:</strong> <span style="color: #dc2626; font-weight: bold;">${body.priority.toUpperCase()}</span></p>
            <p><strong>📍 Location:</strong> ${body.location || 'Not specified'}</p>
            <p><strong>📸 No of Attachments:</strong> ${attachments.length}</p>
            <p><strong>🎙 Voice note attached:</strong> ${voiceAttachment.length ? 'Yes' : 'No'}</p>
          </div>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; border-left: 6px solid #10b981; margin-top: 20px;">
            <h3 style="color: #065f46;">📝 Description</h3>
            <p>${body.description || 'No description provided'}</p>
          </div>
          <div style="margin-top: 24px; padding: 16px; background: #eff6ff; border-radius: 8px; text-align: center;">
            <p><strong>⏰ Submitted:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            <p style="font-style: italic;">Via Gram-Sevak Portal</p>
          </div>
        </div>
      `,
      attachments, // ← this actually attaches the files
    });

    console.log('✅ EMAIL SENT SUCCESSFULLY WITH ATTACHMENTS!');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('💥 EMAIL ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
