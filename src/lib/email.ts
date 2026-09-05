import { Resend } from "resend";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  return new Resend(apiKey);
}

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: {
    name: string;
    sku: string;
    quantity: number;
    price: number;
    attributes: Record<string, string>;
  }[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: {
    address: string;
    city: string;
    province: string;
  };
  notes?: string;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  const resend = getResendClient();
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
        <strong style="font-size: 13px;">${item.name}</strong><br/>
        <span style="color: #888; font-size: 12px;">SKU: ${item.sku}</span>
        ${Object.entries(item.attributes ?? {}).length > 0
          ? `<br/><span style="color: #888; font-size: 12px;">${Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(" · ")}</span>`
          : ""}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: center; color: #666; font-size: 13px;">×${item.quantity}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: bold; font-size: 13px;">K ${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join("");

  await resend.emails.send({
    from: "HemBox Orders <onboarding@resend.dev>",
    to: data.customerEmail,
    subject: `Order Confirmed — ${data.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background: #f5f5f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="background: #111111; padding: 32px 40px;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 4px; text-transform: uppercase;">HEMBOX</h1>
                    <p style="color: rgba(255,255,255,0.5); margin: 4px 0 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Order Confirmation</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <p style="font-size: 15px; color: #111; margin: 0 0 8px;">Hi ${data.customerName.split(" ")[0]},</p>
                    <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 0 0 32px;">Thank you for your order! We have received it and our team will contact you shortly via WhatsApp or phone to arrange payment.</p>
                    <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 32px;">
                      <p style="margin: 0 0 4px; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #999;">Order Number</p>
                      <p style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #111;">${data.orderNumber}</p>
                    </div>
                    <h3 style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #999; margin: 0 0 16px;">Items Ordered</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">${itemsHtml}</table>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                      <tr><td style="padding: 6px 0; font-size: 13px; color: #666;">Subtotal</td><td style="padding: 6px 0; font-size: 13px; color: #666; text-align: right;">K ${data.subtotal.toFixed(2)}</td></tr>
                      <tr><td style="padding: 6px 0; font-size: 13px; color: #666;">Shipping</td><td style="padding: 6px 0; font-size: 13px; color: #666; text-align: right;">${data.shippingCost === 0 ? "Free" : `K ${data.shippingCost.toFixed(2)}`}</td></tr>
                      <tr><td style="padding: 12px 0 0; font-size: 15px; font-weight: 900; color: #111; border-top: 2px solid #111;">Total</td><td style="padding: 12px 0 0; font-size: 15px; font-weight: 900; color: #111; text-align: right; border-top: 2px solid #111;">K ${data.total.toFixed(2)}</td></tr>
                    </table>
                    <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid #f0f0f0;">
                      <h3 style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #999; margin: 0 0 12px;">Shipping To</h3>
                      <p style="margin: 0; font-size: 14px; color: #111; font-weight: 600;">${data.customerName}</p>
                      <p style="margin: 4px 0 0; font-size: 13px; color: #666;">${data.shippingAddress.address}</p>
                      <p style="margin: 2px 0 0; font-size: 13px; color: #666;">${data.shippingAddress.city}, ${data.shippingAddress.province}</p>
                      <p style="margin: 2px 0 0; font-size: 13px; color: #666;">${data.customerPhone}</p>
                    </div>
                    ${data.notes ? `<div style="margin-top: 24px; background: #fffbeb; border-radius: 6px; padding: 16px;"><p style="margin: 0; font-size: 12px; color: #92400e;"><strong>Order Notes:</strong> ${data.notes}</p></div>` : ""}
                    <div style="margin-top: 32px; background: #f8f8f8; border-radius: 8px; padding: 24px;">
                      <h3 style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #999; margin: 0 0 16px;">What Happens Next</h3>
                      <p style="margin: 0 0 8px; font-size: 13px; color: #444;"><strong>01</strong> &nbsp; Our team will contact you to arrange payment</p>
                      <p style="margin: 0 0 8px; font-size: 13px; color: #444;"><strong>02</strong> &nbsp; Once payment is confirmed, we pack your order</p>
                      <p style="margin: 0; font-size: 13px; color: #444;"><strong>03</strong> &nbsp; Your order is dispatched and delivered to you</p>
                    </div>
                  </td>
                </tr>
                <tr><td style="background: #f8f8f8; padding: 24px 40px; text-align: center;"><p style="margin: 0; font-size: 12px; color: #999;">© 2026 HemBox · Zambia</p><p style="margin: 6px 0 0; font-size: 12px; color: #bbb;">Questions? Contact us on WhatsApp</p></td></tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}

export async function sendAdminOrderNotification(data: OrderEmailData) {
  const resend = getResendClient();

  await resend.emails.send({
    from: "HemBox Orders <onboarding@resend.dev>",
    to: process.env.ADMIN_EMAIL!,
    subject: `New Order — ${data.orderNumber} — K ${data.total.toFixed(2)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background: #f5f5f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 0;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr><td style="background: #111111; padding: 24px 40px;"><h1 style="color: #ffffff; margin: 0; font-size: 18px; letter-spacing: 2px;">🛒 NEW ORDER RECEIVED</h1></td></tr>
          <tr><td style="padding: 32px 40px;"><table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding: 8px 0; font-size: 13px; color: #666; border-bottom: 1px solid #f0f0f0;">Order Number</td><td style="padding: 8px 0; font-size: 13px; font-weight: 900; color: #111; text-align: right; border-bottom: 1px solid #f0f0f0;">${data.orderNumber}</td></tr>
            <tr><td style="padding: 8px 0; font-size: 13px; color: #666; border-bottom: 1px solid #f0f0f0;">Customer</td><td style="padding: 8px 0; font-size: 13px; color: #111; text-align: right; border-bottom: 1px solid #f0f0f0;">${data.customerName}</td></tr>
            <tr><td style="padding: 8px 0; font-size: 13px; color: #666; border-bottom: 1px solid #f0f0f0;">Email</td><td style="padding: 8px 0; font-size: 13px; color: #111; text-align: right; border-bottom: 1px solid #f0f0f0;">${data.customerEmail}</td></tr>
            <tr><td style="padding: 8px 0; font-size: 13px; color: #666; border-bottom: 1px solid #f0f0f0;">Phone</td><td style="padding: 8px 0; font-size: 13px; color: #111; text-align: right; border-bottom: 1px solid #f0f0f0;">${data.customerPhone}</td></tr>
            <tr><td style="padding: 8px 0; font-size: 13px; color: #666; border-bottom: 1px solid #f0f0f0;">Items</td><td style="padding: 8px 0; font-size: 13px; color: #111; text-align: right; border-bottom: 1px solid #f0f0f0;">${data.items.length} item${data.items.length !== 1 ? "s" : ""}</td></tr>
            <tr><td style="padding: 12px 0 0; font-size: 16px; font-weight: 900; color: #111;">Total</td><td style="padding: 12px 0 0; font-size: 16px; font-weight: 900; color: #111; text-align: right;">K ${data.total.toFixed(2)}</td></tr>
          </table><div style="margin-top: 24px; background: #f0fdf4; border-radius: 6px; padding: 16px; text-align: center;"><a href="https://hembox.vercel.app/admin/orders" style="color: #111; font-size: 13px; font-weight: bold; text-decoration: none; letter-spacing: 1px;">VIEW ORDER IN DASHBOARD →</a></div></td></tr>
        </table></td></tr></table>
      </body>
      </html>
    `,
  });
}
