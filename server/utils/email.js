const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[EMAIL] SMTP not configured — emails will be logged to console');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

let transporter = null;

/**
 * Send verification email with token link.
 */
const sendVerificationEmail = async (email, token) => {
  if (!transporter) transporter = createTransporter();

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@examplatform.com',
    to: email,
    subject: 'Verify your email — Online Exam Platform',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #00174b; margin-bottom: 24px;">Verify Your Email</h1>
        <p style="color: #45464d; font-size: 16px; line-height: 1.6;">
          Thanks for registering! Click the button below to verify your email address.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #0053db 0%, #00174b 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 700; margin: 24px 0;">
          Verify Email
        </a>
        <p style="color: #76777d; font-size: 14px; margin-top: 24px;">
          If the button doesn't work, copy and paste this link:<br>
          <a href="${verifyUrl}" style="color: #0053db;">${verifyUrl}</a>
        </p>
      </div>
    `,
  };

  if (transporter) {
    await transporter.sendMail(mailOptions);
  } else {
    console.log('[EMAIL] Verification email for:', email);
    console.log('[EMAIL] Verify URL:', verifyUrl);
  }
};

module.exports = { sendVerificationEmail };
