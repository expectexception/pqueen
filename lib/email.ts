import nodemailer from "nodemailer";

/**
 * PQN PARTY QUEEN - Haute Couture Luxury Email Service
 * Powered by Gmail SMTP & Nodemailer
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export function getEmailTransporter() {
  const isEnabled = process.env.SMTP_ENABLED !== "false";
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = (process.env.SMTP_USER || "").trim();
  // Strip any accidental spaces from Google App Password
  const rawPass = (process.env.SMTP_PASS || "").trim();
  const pass = rawPass.replace(/\s+/g, "");
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!isEnabled || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Base email dispatcher
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const fromName = process.env.EMAIL_FROM_NAME || "PQN PARTY QUEEN";
  const fromEmail = (process.env.EMAIL_FROM || process.env.SMTP_USER || "thep4rtyqueen@gmail.com").trim();
  const from = `"${fromName}" <${fromEmail}>`;

  const transporter = getEmailTransporter();

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[EMAIL SIMULATION / SMTP MUTED]`);
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`From: ${from}`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text || options.subject,
      html: options.html,
    });
    console.log(`[Email Dispatched]: MessageId=${info.messageId} To=${options.to}`);
    return { success: true };
  } catch (error: any) {
    console.error("[Email Dispatch Error]:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Ultra-Luxury Haute Couture HTML Email Shell (Royal Emerald & Gold)
 */
function renderEmailShell(content: string, previewText: string = ""): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>PQN PARTY QUEEN</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f4;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #152018;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f4f6f4;
      padding: 30px 0 50px 0;
    }
    .main-table {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #dce8e0;
      box-shadow: 0 8px 30px rgba(7, 40, 24, 0.08);
    }
    .header-bar {
      background: linear-gradient(135deg, #072818 0%, #0d4428 100%);
      padding: 36px 24px 28px 24px;
      text-align: center;
      border-bottom: 2px solid #c59b27;
    }
    .brand-title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 4px;
      color: #f5d77f;
      margin: 0;
      text-transform: uppercase;
      text-shadow: 0 2px 10px rgba(0,0,0,0.5);
    }
    .brand-sub {
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 2.5px;
      color: #ffffff;
      text-transform: uppercase;
      margin-top: 6px;
      opacity: 0.9;
    }
    .content-area {
      padding: 36px 32px;
      line-height: 1.65;
      color: #27272a;
    }
    .footer-bar {
      background: #072818;
      padding: 28px 24px;
      text-align: center;
      font-size: 11.5px;
      color: #d1d5db;
      border-top: 1px solid rgba(197, 155, 39, 0.3);
    }
    .btn-gold {
      display: inline-block;
      background: linear-gradient(135deg, #c59b27 0%, #e5b83b 100%);
      color: #072818 !important;
      text-decoration: none;
      padding: 13px 32px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin: 20px 0;
      box-shadow: 0 4px 14px rgba(197, 155, 39, 0.35);
    }
    .btn-emerald {
      display: inline-block;
      background: #0d4428;
      color: #f5d77f !important;
      text-decoration: none;
      padding: 13px 32px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      border: 1px solid #c59b27;
      margin: 20px 0;
      box-shadow: 0 4px 14px rgba(13, 68, 40, 0.25);
    }
    .gold-accent {
      color: #c59b27;
      font-weight: 700;
    }
    .emerald-accent {
      color: #0d4428;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}
  </div>

  <table class="wrapper" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table class="main-table" width="100%" cellpadding="0" cellspacing="0" border="0">
          <!-- HEADER -->
          <tr>
            <td class="header-bar">
              <h1 class="brand-title">PQN PARTY QUEEN</h1>
              <div class="brand-sub">✦ HAUTE COUTURE • BRIDAL & FESTIVE ATELIER ✦</div>
            </td>
          </tr>

          <!-- BODY CONTENT -->
          <tr>
            <td class="content-area">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td class="footer-bar">
              <p style="margin: 0 0 6px 0; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #f5d77f;">
                PQN PARTY QUEEN LUXURY ATELIER
              </p>
              <p style="margin: 0 0 12px 0; color: #a1a1aa; font-size: 11px;">
                Connaught Place, New Delhi &bull; Express Worldwide Courier &bull; Made-to-Measure Fit
              </p>
              <div style="margin: 14px 0; display: inline-block;">
                <a href="https://wa.me/919876543210" style="color: #86efac; text-decoration: none; margin: 0 8px; font-weight: 700;">
                  WhatsApp Concierge: +91 98765 43210
                </a>
              </div>
              <p style="margin: 12px 0 4px 0; font-size: 11px; color: #71717a;">
                Powered by <a href="https://expectexception.com" target="_blank" style="color: #f5d77f; text-decoration: none; font-weight: 700;">expectexception.com</a>
              </p>
              <p style="margin: 0; color: #52525b; font-size: 10.5px;">
                &copy; ${currentYear} PQN PARTY QUEEN. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * 👑 Welcome / New Member Registration Email
 */
export async function sendWelcomeEmail({ email, name }: { email: string; name: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: #0d4428; font-weight: 800; background: #eef7f2; border: 1px solid #cce2d3; padding: 4px 12px; border-radius: 12px; display: inline-block;">
        👑 WELCOME TO THE VIP CIRCLE
      </span>
      <h2 style="font-family: Georgia, serif; font-size: 24px; color: #0d1f13; margin: 12px 0 4px 0;">
        Welcome to PQN Party Queen, ${name}
      </h2>
      <p style="color: #64748b; font-size: 13.5px; margin: 0;">Your Haute Couture Member Account is Active</p>
    </div>

    <p style="font-size: 14.5px; color: #374151; line-height: 1.7;">
      Namaste <strong>${name}</strong>,<br /><br />
      We are delighted to welcome you to our exclusive circle of discerning patrons. As an esteemed member of PQN Party Queen, you now enjoy curated privileges across our bridal and festive couture collections:
    </p>

    <div style="background: #f8faf8; border: 1px solid #e2ebe4; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
      <ul style="margin: 0; padding-left: 20px; color: #1f2937; font-size: 13.5px; line-height: 1.8;">
        <li>✨ <strong>Artisan Curations:</strong> Hand-embroidered bridal lehengas, silk sarees, and bespoke gowns.</li>
        <li>👗 <strong>AI Sizing & Fit Profiling:</strong> Multi-family measurement profiles with bespoke tailoring.</li>
        <li>🚀 <strong>Complimentary Express Air Transit:</strong> Fast, insured shipping across India and worldwide.</li>
        <li>💬 <strong>VIP Concierge Support:</strong> 1-on-1 styling advice via dedicated WhatsApp stylist.</li>
      </ul>
    </div>

    <div style="background: linear-gradient(135deg, #072818 0%, #0d4428 100%); border: 1.5px solid #c59b27; padding: 20px; border-radius: 8px; margin: 28px 0; text-align: center; color: #ffffff;">
      <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #f5d77f; font-weight: 800;">
        INAUGURAL VIP MEMBER WELCOME GIFT
      </p>
      <p style="margin: 0 0 8px 0; font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #ffffff;">
        Use Code: <span style="color: #f5d77f;">PQN10</span> for 10% OFF
      </p>
      <span style="font-size: 11.5px; color: #d1fae5;">Valid on your first bespoke order across all collections</span>
    </div>

    <div style="text-align: center; margin: 28px 0 10px 0;">
      <a href="${appUrl}/shop" class="btn-gold">Explore The Collection</a>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `✨ Welcome to PQN PARTY QUEEN Haute Couture, ${name}`,
    html: renderEmailShell(content, `Welcome to PQN Party Queen Haute Couture, ${name}.`),
  });
}

/**
 * 🔢 OTP Verification & Security Passcode Email
 */
export async function sendOtpEmail({
  email,
  name,
  otp,
  purpose = "Account Verification",
}: {
  email: string;
  name?: string;
  otp: string;
  purpose?: string;
}) {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: #0d4428; font-weight: 800; background: #eef7f2; border: 1px solid #cce2d3; padding: 4px 12px; border-radius: 12px; display: inline-block;">
        🔒 ONE-TIME SECURITY PASSCODE
      </span>
      <h2 style="font-family: Georgia, serif; font-size: 24px; color: #0d1f13; margin: 12px 0 4px 0;">
        ${purpose}
      </h2>
      <p style="color: #64748b; font-size: 13.5px; margin: 0;">PQN Party Queen Security Verification</p>
    </div>

    <p style="font-size: 14px; color: #374151; line-height: 1.6;">
      ${name ? `Dear <strong>${name}</strong>,<br /><br />` : ""}
      Use the following 6-digit One-Time Passcode (OTP) to proceed with your <strong>${purpose}</strong>. This passcode is confidential and valid for <strong>10 minutes</strong>.
    </p>

    <!-- OTP DISPLAY BOX -->
    <div style="background: #fdfbf7; border: 2px dashed #c59b27; border-radius: 10px; padding: 24px; margin: 28px 0; text-align: center;">
      <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #78716c; font-weight: 700; display: block; margin-bottom: 8px;">
        Your Verification Code
      </span>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #0d4428; margin: 0; padding-left: 12px;">
        ${otp}
      </div>
      <span style="font-size: 11px; color: #dc2626; font-weight: 700; display: block; margin-top: 10px;">
        ⏱️ Expires in 10 minutes &bull; Do not share this code with anyone
      </span>
    </div>

    <p style="font-size: 12.5px; color: #6b7280; line-height: 1.5;">
      If you did not request this verification code, please disregard this email or notify our concierge immediately at <a href="mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || process.env.SMTP_USER || 'thep4rtyqueen@gmail.com'}" style="color: #0d4428; font-weight: bold;">${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || process.env.SMTP_USER || 'thep4rtyqueen@gmail.com'}</a>.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `🔐 Your PQN Verification Code: ${otp} (${purpose})`,
    html: renderEmailShell(content, `Your PQN verification code is ${otp}.`),
  });
}

/**
 * 🛍️ Order Confirmation & Invoice Email
 */
export async function sendOrderConfirmationEmail(order: {
  email: string;
  name: string;
  orderNumber: string;
  totalAmount: number | string;
  items: Array<{ productName: string; size?: string | null; quantity: number; price: number | string }>;
  shippingAddress: string;
  courierName?: string;
  awbNumber?: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 0;">
          <strong style="color: #111827; font-size: 14px;">${item.productName}</strong>
          ${item.size ? `<br><span style="font-size: 12px; color: #6b7280; font-weight: 600;">Size: ${item.size}</span>` : ""}
        </td>
        <td style="padding: 12px 0; text-align: center; color: #4b5563; font-weight: 600;">× ${item.quantity}</td>
        <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #0d4428; font-size: 14.5px;">₹${Number(item.price).toLocaleString("en-IN")}</td>
      </tr>
    `
    )
    .join("");

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: #15803d; font-weight: 800; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 4px 12px; border-radius: 12px; display: inline-block;">
        ✓ ORDER CONFIRMED & DISPATCH ALLOCATED
      </span>
      <h2 style="font-family: Georgia, serif; font-size: 24px; color: #0d1f13; margin: 12px 0 4px 0;">
        Thank You for Your Order, ${order.name}
      </h2>
      <p style="color: #6b7280; font-size: 13.5px; margin: 0;">Order Reference: <strong>#${order.orderNumber}</strong></p>
    </div>

    ${order.awbNumber ? `
    <div style="background: linear-gradient(135deg, #072818 0%, #0d4428 100%); border: 1.5px solid #c59b27; border-radius: 8px; padding: 18px 20px; margin: 20px 0; color: #ffffff;">
      <div style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #f5d77f; font-weight: 800;">
        ⚡ AUTOMATED COURIER DISPATCH ALLOCATION
      </div>
      <div style="margin-top: 6px; font-size: 15px; font-weight: 700;">
        Carrier: <span style="color: #ffffff;">${order.courierName || "Express Courier Air"}</span>
      </div>
      <div style="margin-top: 4px; font-size: 13px; color: #d1fae5;">
        Air Waybill (AWB): <strong style="font-family: monospace; letter-spacing: 1.5px; color: #f5d77f; font-size: 14px;">${order.awbNumber}</strong>
      </div>
    </div>
    ` : ''}

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="border-bottom: 2px solid #0d4428; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #4b5563;">
          <th style="text-align: left; padding-bottom: 10px;">Ensemble</th>
          <th style="text-align: center; padding-bottom: 10px;">Qty</th>
          <th style="text-align: right; padding-bottom: 10px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding-top: 16px; font-weight: 800; font-size: 14px; color: #111827;">Total Grand Amount:</td>
          <td style="padding-top: 16px; text-align: right; font-weight: 900; font-size: 18px; color: #0d4428;">₹${Number(order.totalAmount).toLocaleString("en-IN")}</td>
        </tr>
      </tfoot>
    </table>

    <div style="background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <h4 style="margin: 0 0 6px 0; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #0d4428; font-weight: 800;">
        📍 Shipping Destination:
      </h4>
      <p style="margin: 0; font-size: 13px; color: #374151; line-height: 1.5;">${order.shippingAddress}</p>
    </div>

    <div style="text-align: center; margin: 28px 0 10px 0;">
      <a href="${appUrl}/track-order?order=${encodeURIComponent(order.orderNumber)}" class="btn-emerald">
        🛰️ Track Real-Time Transit
      </a>
    </div>
  `;

  return sendEmail({
    to: order.email,
    subject: `🛍️ Order Confirmed: #${order.orderNumber} ${order.awbNumber ? `| AWB: ${order.awbNumber}` : ''} | PQN PARTY QUEEN`,
    html: renderEmailShell(content, `Your order #${order.orderNumber} is confirmed.`),
  });
}

/**
 * 🔒 Password Reset Email
 */
export async function sendPasswordResetEmail({ email, resetUrl }: { email: string; resetUrl: string }) {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: #0d4428; font-weight: 800; background: #eef7f2; border: 1px solid #cce2d3; padding: 4px 12px; border-radius: 12px; display: inline-block;">
        🔒 PASSWORD RESET
      </span>
      <h2 style="font-family: Georgia, serif; font-size: 24px; color: #0d1f13; margin: 12px 0 4px 0;">
        Reset Your Account Password
      </h2>
      <p style="color: #6b7280; font-size: 13.5px; margin: 0;">PQN Party Queen Security</p>
    </div>

    <p style="font-size: 14px; color: #374151; line-height: 1.6;">
      We received a request to reset the password for your PQN Party Queen member account. Click the secure button below to choose your new password. This link is valid for <strong>1 hour</strong>.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetUrl}" class="btn-gold">Reset My Password</a>
    </div>

    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      If you did not request a password reset, you can safely ignore this email. Your account remains protected.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `🔒 Reset Your PQN Account Password`,
    html: renderEmailShell(content, "Reset your password for PQN Party Queen."),
  });
}

/**
 * 🚚 Real-time Fulfillment Pipeline & Tracking Status Email to Customer
 */
export async function sendOrderStatusUpdateEmail({
  email,
  name,
  orderNumber,
  status,
  carrier = "Blue Dart Express",
  awb,
  trackingUrl,
}: {
  email: string;
  name: string;
  orderNumber: string;
  status: string;
  carrier?: string;
  awb?: string;
  trackingUrl?: string;
}) {
  let statusBadge = "Processing in Atelier";
  let statusDescription = "Our master tailors have initiated embroidery and tailoring quality inspection for your ensemble.";

  if (status === "SHIPPED") {
    statusBadge = "🚀 Dispatched & In Air Transit";
    statusDescription = `Your parcel has been handed over to ${carrier} with Air Waybill (AWB) #${awb || "BD982104"}. Estimated delivery within 1-3 business days.`;
  } else if (status === "DELIVERED") {
    statusBadge = "🟢 Delivered to Doorstep";
    statusDescription = "Your Haute Couture ensemble has been successfully delivered. We hope you adore your PQN outfit!";
  } else if (status === "CANCELLED") {
    statusBadge = "🔴 Order Cancelled";
    statusDescription = "Your order has been cancelled and any refund has been initiated back to your original payment source.";
  } else if (status === "RETURNED") {
    statusBadge = "🔄 Return & Size Exchange Received";
    statusDescription = "We have received your returned parcel at our central atelier and processed your request.";
  }

  const liveTrackLink =
    trackingUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/track-order?order=${encodeURIComponent(orderNumber)}`;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #0d4428; font-weight: 800; background: #eef7f2; border: 1px solid #cce2d3; padding: 4px 14px; border-radius: 12px; display: inline-block;">
        ${statusBadge}
      </span>
      <h2 style="font-family: Georgia, serif; font-size: 24px; color: #0d1f13; margin: 12px 0 4px 0;">Fulfillment Milestone Update</h2>
      <p style="color: #6b7280; font-size: 13.5px; margin: 0;">Order Reference: <strong>#${orderNumber}</strong></p>
    </div>

    <p style="font-size: 14.5px; color: #374151; line-height: 1.6;">
      Dear <strong>${name}</strong>,<br /><br />
      ${statusDescription}
    </p>

    ${
      awb
        ? `
    <div style="background: #fafaf9; border: 1.5px solid #d4e2d8; border-radius: 8px; padding: 18px; margin: 24px 0;">
      <table style="width: 100%; font-size: 13px;">
        <tr>
          <td style="color: #0d4428; font-weight: 800; text-transform: uppercase;">Air Waybill (AWB):</td>
          <td style="text-align: right; font-family: monospace; font-weight: 900; font-size: 15px; color: #111827;">${awb}</td>
        </tr>
        <tr>
          <td style="padding-top: 8px; color: #0d4428; font-weight: 800; text-transform: uppercase;">Courier Partner:</td>
          <td style="padding-top: 8px; text-align: right; font-weight: 700; color: #111827;">${carrier} Priority</td>
        </tr>
      </table>
    </div>
    `
        : ""
    }

    <div style="text-align: center; margin: 28px 0 10px 0;">
      <a href="${liveTrackLink}" class="btn-emerald">🛰️ Track Real-Time Transit</a>
    </div>

    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      Questions regarding your delivery? Reply directly to this email or chat with our styling concierge on WhatsApp.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `📦 Status Update: Order #${orderNumber} is now ${status} | PQN PARTY QUEEN`,
    html: renderEmailShell(content, `Order #${orderNumber} is now ${status}.`),
  });
}

/**
 * 👑 Instant Store Owner & Atelier Manager Alert for New Orders
 */
export async function sendAdminNewOrderNotificationEmail(order: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number | string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  itemsCount: number;
}) {
  const adminRecipient = process.env.ADMIN_ALERT_EMAIL || process.env.SMTP_USER || "thep4rtyqueen@gmail.com";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const content = `
    <div style="background: #0d4428; color: #f5d77f; padding: 14px; border-radius: 8px; text-align: center; margin-bottom: 24px; border: 1px solid #c59b27;">
      <span style="font-size: 12px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">
        🔔 NEW HAUTE COUTURE ORDER RECEIVED
      </span>
    </div>

    <h2 style="font-family: Georgia, serif; font-size: 22px; color: #111827; margin: 0 0 12px 0;">
      Order #${order.orderNumber} &bull; ₹${Number(order.totalAmount).toLocaleString("en-IN")}
    </h2>

    <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; margin-bottom: 24px;">
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 9px 0; font-weight: 700; color: #4b5563; width: 140px;">Customer:</td>
        <td style="padding: 9px 0; color: #111827; font-weight: 600;">${order.customerName} (${order.customerEmail})</td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 9px 0; font-weight: 700; color: #4b5563;">Contact Phone:</td>
        <td style="padding: 9px 0; color: #111827; font-weight: 600;">+91 ${order.customerPhone}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 9px 0; font-weight: 700; color: #4b5563;">Ship To:</td>
        <td style="padding: 9px 0; color: #111827;">${order.shippingAddress}, ${order.shippingCity}, ${order.shippingState}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 9px 0; font-weight: 700; color: #4b5563;">Total Pieces:</td>
        <td style="padding: 9px 0; font-weight: 800; color: #0d4428;">${order.itemsCount} Ensembles</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 24px 0 10px 0;">
      <a href="${appUrl}/admin/orders" class="btn-emerald">Open Atelier Order Dossier</a>
    </div>
  `;

  return sendEmail({
    to: adminRecipient,
    subject: `🚨 [NEW ORDER] #${order.orderNumber} - ₹${Number(order.totalAmount).toLocaleString("en-IN")} from ${order.customerName}`,
    html: renderEmailShell(content, `New order #${order.orderNumber} received.`),
  });
}

/**
 * 🧪 Test Email Dispatcher for Admin Settings verification
 */
export async function sendTestEmail({ toEmail }: { toEmail: string }) {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: #15803d; font-weight: 800; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 4px 12px; border-radius: 12px; display: inline-block;">
        ✓ SMTP SYSTEM TEST
      </span>
      <h2 style="font-family: Georgia, serif; font-size: 24px; color: #0d1f13; margin: 12px 0 4px 0;">
        Gmail SMTP Connected Successfully!
      </h2>
      <p style="color: #6b7280; font-size: 13.5px; margin: 0;">PQN Party Queen Email Dispatcher</p>
    </div>

    <p style="font-size: 14px; color: #374151; line-height: 1.6;">
      This is a test email confirming that your Google App Password and SMTP dispatcher are active and verified. All future emails (Welcome, OTP, Invoices, Delivery Status, and Admin alerts) will be dispatched smoothly from <strong>${process.env.SMTP_USER || "thep4rtyqueen@gmail.com"}</strong>.
    </p>

    <div style="background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 12.5px; color: #44403c;">
      <div><strong>Host:</strong> ${process.env.SMTP_HOST || "smtp.gmail.com"}</div>
      <div style="margin-top: 4px;"><strong>Port:</strong> ${process.env.SMTP_PORT || "465"} (SSL Secure)</div>
      <div style="margin-top: 4px;"><strong>Sender:</strong> ${process.env.SMTP_USER || "thep4rtyqueen@gmail.com"}</div>
      <div style="margin-top: 4px;"><strong>Timestamp:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</div>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject: `🧪 [SMTP TEST] PQN PARTY QUEEN Email System is Active & Operational`,
    html: renderEmailShell(content, "PQN Party Queen SMTP Test Successful."),
  });
}
