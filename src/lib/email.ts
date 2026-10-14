/**
 * email.ts — Transactional email helpers for AYLI
 *
 * Uses nodemailer with Hostinger SMTP (care@ayli.in).
 * Two exported functions:
 *   sendAdminOrderNotification  – fires when an order is confirmed
 *   sendCustomerOrderConfirmation – fires when an order is confirmed
 *
 * Both are fire-and-forget (non-blocking). Failures are logged but never
 * allowed to break the order flow.
 */

import nodemailer from "nodemailer";

// ── Transporter ──────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.hostinger.com",
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: (process.env.SMTP_SECURE ?? "true") === "true", // SSL on port 465
  auth: {
    user: process.env.SMTP_USER ?? "care@ayli.in",
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM ?? "AYLI <care@ayli.in>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "care@ayli.in";

// ── Types ────────────────────────────────────────────────────────────────────

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: {
    name: string;
    colour: string;
    size: string;
    quantity: number;
    price: number;
    total: number;
    image?: string | null;
  }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  shippingMethod: string;
  address: {
    name: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Admin notification template ───────────────────────────────────────────────

function adminEmailHtml(data: OrderEmailData): string {
  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #f0f0f0;">
          <strong>${item.name}</strong><br/>
          <span style="color:#888;font-size:13px;">${item.colour} &middot; ${item.size}</span>
        </td>
        <td style="padding:10px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #f0f0f0;text-align:right;">${fmt(item.price)}</td>
        <td style="padding:10px;border-bottom:1px solid #f0f0f0;text-align:right;"><strong>${fmt(item.total)}</strong></td>
      </tr>`
    )
    .join("");

  const addr = data.address;
  const addressLines = [addr.line1, addr.line2, `${addr.city}, ${addr.state} - ${addr.pincode}`, addr.country]
    .filter(Boolean)
    .join("<br/>");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>New Order - ${data.orderNumber}</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
        <tr><td style="background:#1a1a1a;padding:24px 32px;">
          <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:2px;">AYLI</h1>
          <p style="margin:4px 0 0;color:#aaa;font-size:13px;">New Order Received</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 4px;font-size:18px;color:#1a1a1a;">Order ${data.orderNumber}</h2>
          <p style="margin:0 0 20px;color:#888;font-size:14px;">Placed just now</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:6px;overflow:hidden;margin-bottom:24px;">
            <thead>
              <tr style="background:#fafafa;">
                <th style="padding:10px;text-align:left;font-size:13px;color:#555;">Item</th>
                <th style="padding:10px;text-align:center;font-size:13px;color:#555;">Qty</th>
                <th style="padding:10px;text-align:right;font-size:13px;color:#555;">Price</th>
                <th style="padding:10px;text-align:right;font-size:13px;color:#555;">Total</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="padding:4px 0;color:#555;font-size:14px;">Subtotal</td>
              <td style="padding:4px 0;text-align:right;font-size:14px;">${fmt(data.subtotal)}</td>
            </tr>
            ${data.discount > 0 ? `<tr><td style="padding:4px 0;color:#c0392b;font-size:14px;">Discount</td><td style="padding:4px 0;text-align:right;font-size:14px;color:#c0392b;">- ${fmt(data.discount)}</td></tr>` : ""}
            <tr>
              <td style="padding:4px 0;color:#555;font-size:14px;">Shipping</td>
              <td style="padding:4px 0;text-align:right;font-size:14px;">${data.shipping === 0 ? "Free" : fmt(data.shipping)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0 0;font-size:16px;font-weight:bold;">Total</td>
              <td style="padding:8px 0 0;text-align:right;font-size:16px;font-weight:bold;">${fmt(data.total)}</td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="vertical-align:top;padding-right:12px;">
                <h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;color:#888;letter-spacing:1px;">Customer</h3>
                <p style="margin:0;font-size:14px;color:#1a1a1a;">${data.customerName}<br/>
                  <a href="mailto:${data.customerEmail}" style="color:#c0392b;text-decoration:none;">${data.customerEmail}</a><br/>
                  ${data.address.phone}
                </p>
              </td>
              <td width="50%" style="vertical-align:top;padding-left:12px;">
                <h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;color:#888;letter-spacing:1px;">Ship To</h3>
                <p style="margin:0;font-size:14px;color:#1a1a1a;">${addr.name}<br/>${addressLines}</p>
              </td>
            </tr>
          </table>

          <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0;"/>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:13px;color:#555;">Payment</td>
              <td style="font-size:13px;text-align:right;">${data.paymentMethod}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#555;">Shipping Method</td>
              <td style="font-size:13px;text-align:right;">${data.shippingMethod}</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="background:#fafafa;padding:16px 32px;text-align:center;color:#bbb;font-size:12px;">
          AYLI Women's Fashion &middot; care@ayli.in
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Customer confirmation template ────────────────────────────────────────────

function customerEmailHtml(data: OrderEmailData): string {
  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #f0f0f0;">
          <strong style="color:#1a1a1a;">${item.name}</strong><br/>
          <span style="color:#999;font-size:13px;">${item.colour} &middot; ${item.size} &middot; Qty ${item.quantity}</span>
        </td>
        <td style="padding:12px;border-bottom:1px solid #f0f0f0;text-align:right;white-space:nowrap;"><strong>${fmt(item.total)}</strong></td>
      </tr>`
    )
    .join("");

  const addr = data.address;
  const addressLines = [addr.line1, addr.line2, `${addr.city}, ${addr.state} - ${addr.pincode}`, addr.country]
    .filter(Boolean)
    .join("<br/>");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Order Confirmed - ${data.orderNumber}</title></head>
<body style="margin:0;padding:0;background:#f9f6f3;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f3;padding:30px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08);">
        <tr><td style="background:#1a1a1a;padding:32px;text-align:center;">
          <h1 style="margin:0 0 4px;color:#fff;font-size:26px;letter-spacing:4px;font-weight:300;">AYLI</h1>
          <p style="margin:0;color:#ccc;font-size:13px;letter-spacing:1px;">WOMEN'S FASHION</p>
        </td></tr>
        <tr><td style="background:#f5f0eb;padding:24px 32px;text-align:center;border-bottom:1px solid #ede8e2;">
          <h2 style="margin:0 0 6px;color:#1a1a1a;font-size:20px;">Order Confirmed!</h2>
          <p style="margin:0;color:#777;font-size:14px;">Hi ${data.customerName}, thank you for your order. We're getting it ready!</p>
        </td></tr>
        <tr><td style="padding:20px 32px 0;">
          <div style="background:#fafafa;border:1px dashed #ddd;border-radius:6px;padding:12px 20px;text-align:center;">
            <span style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Order Number</span><br/>
            <span style="font-size:20px;font-weight:bold;color:#1a1a1a;letter-spacing:1px;">${data.orderNumber}</span>
          </div>
        </td></tr>
        <tr><td style="padding:24px 32px 0;">
          <h3 style="margin:0 0 12px;font-size:14px;text-transform:uppercase;color:#888;letter-spacing:1px;">Your Items</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:6px;overflow:hidden;">
            <tbody>${itemRows}</tbody>
          </table>
        </td></tr>
        <tr><td style="padding:16px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;color:#666;font-size:14px;">Subtotal</td>
              <td style="padding:4px 0;text-align:right;font-size:14px;">${fmt(data.subtotal)}</td>
            </tr>
            ${data.discount > 0 ? `<tr><td style="padding:4px 0;color:#c0392b;font-size:14px;">Savings</td><td style="padding:4px 0;text-align:right;font-size:14px;color:#c0392b;">- ${fmt(data.discount)}</td></tr>` : ""}
            <tr>
              <td style="padding:4px 0;color:#666;font-size:14px;">Shipping</td>
              <td style="padding:4px 0;text-align:right;font-size:14px;">${data.shipping === 0 ? '<span style="color:#27ae60;">Free</span>' : fmt(data.shipping)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0 0;font-size:17px;font-weight:bold;color:#1a1a1a;">Total Paid</td>
              <td style="padding:10px 0 0;text-align:right;font-size:17px;font-weight:bold;color:#1a1a1a;">${fmt(data.total)}</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 0;">
          <h3 style="margin:0 0 10px;font-size:14px;text-transform:uppercase;color:#888;letter-spacing:1px;">Delivery Address</h3>
          <div style="background:#fafafa;border:1px solid #f0f0f0;border-radius:6px;padding:14px 18px;font-size:14px;color:#333;line-height:1.7;">
            ${addr.name}<br/>
            ${addressLines}<br/>
            ${addr.phone}
          </div>
        </td></tr>
        <tr><td style="padding:16px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#777;">
            <tr>
              <td style="padding:3px 0;">Payment Method</td>
              <td style="text-align:right;">${data.paymentMethod}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;">Shipping</td>
              <td style="text-align:right;">${data.shippingMethod}</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 32px 0;">
          <div style="background:#fffbf0;border-left:3px solid #f39c12;padding:12px 16px;border-radius:0 6px 6px 0;font-size:13px;color:#7d6008;">
            <strong>Return Policy:</strong> You have <strong>7 days</strong> from delivery to request a return.
            An unboxing video is mandatory for all return requests.
          </div>
        </td></tr>
        <tr><td style="padding:24px 32px;text-align:center;">
          <p style="margin:0;font-size:14px;color:#777;">
            Questions? Email us at<br/>
            <a href="mailto:care@ayli.in" style="color:#1a1a1a;font-weight:bold;text-decoration:none;">care@ayli.in</a>
          </p>
        </td></tr>
        <tr><td style="background:#1a1a1a;padding:16px 32px;text-align:center;">
          <p style="margin:0;color:#666;font-size:12px;letter-spacing:1px;">&copy; 2025 AYLI WOMEN'S FASHION</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Send an order notification to the admin inbox (care@ayli.in).
 * Fire-and-forget — never throws.
 */
export async function sendAdminOrderNotification(data: OrderEmailData): Promise<void> {
  try {
    await transporter.sendMail({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `New Order: ${data.orderNumber} - ${fmt(data.total)}`,
      html: adminEmailHtml(data),
    });
    console.log(`[email] Admin notification sent for ${data.orderNumber}`);
  } catch (err) {
    console.error("[email] Failed to send admin notification:", err);
  }
}

/**
 * Send an order confirmation email to the customer.
 * Fire-and-forget — never throws.
 */
export async function sendCustomerOrderConfirmation(data: OrderEmailData): Promise<void> {
  if (!data.customerEmail) return;
  try {
    await transporter.sendMail({
      from: FROM,
      to: data.customerEmail,
      subject: `Your AYLI Order is Confirmed - ${data.orderNumber}`,
      html: customerEmailHtml(data),
    });
    console.log(`[email] Customer confirmation sent to ${data.customerEmail} for ${data.orderNumber}`);
  } catch (err) {
    console.error("[email] Failed to send customer confirmation:", err);
  }
}

/**
 * Convenience wrapper: sends both emails in parallel.
 */
export async function sendOrderConfirmationEmails(data: OrderEmailData): Promise<void> {
  await Promise.allSettled([
    sendAdminOrderNotification(data),
    sendCustomerOrderConfirmation(data),
  ]);
}
