import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from "@/lib/email";

export const dynamic = "force-dynamic";

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HB-${timestamp}-${random}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, shipping, subtotal, shippingCost, total } = body;

    if (!items?.length) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    const orderNumber = generateOrderNumber();

    // Find or create customer
    let customer = await db.customer.findUnique({
      where: { email: shipping.email },
      include: { addresses: true },
    });

    if (!customer) {
      customer = await db.customer.create({
        data: {
          email: shipping.email,
          name: shipping.name,
          phone: shipping.phone,
        },
        include: { addresses: true },
      });
    } else {
      // Update customer info if missing
      const updateData: any = {};
      if (!customer.name) updateData.name = shipping.name;
      if (!customer.phone) updateData.phone = shipping.phone;
      
      if (Object.keys(updateData).length > 0) {
        customer = await db.customer.update({
          where: { id: customer.id },
          data: updateData,
          include: { addresses: true },
        });
      }
    }

    // Create address if customer has none
    if (customer.addresses.length === 0) {
      const nameParts = shipping.name.split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || firstName;

      await db.address.create({
        data: {
          customerId: customer.id,
          firstName,
          lastName,
          line1: shipping.address,
          city: shipping.city,
          state: shipping.province,
          country: "Zambia",
          phone: shipping.phone,
          isDefault: true,
        },
      });
    }

    // Create order
    const order = await db.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        status: "PENDING",
        paymentStatus: "PENDING",
        subtotal,
        shippingCost,
        total,
        guestName: shipping.name,
        guestEmail: shipping.email,
        notes: shipping.notes || null,
        shippingAddress: {
          address: shipping.address,
          city: shipping.city,
          province: shipping.province,
          phone: shipping.phone,
        },
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            priceAtPurchase: item.price,
            variantSnapshot: {
              name: item.name,
              sku: item.sku,
              price: item.price,
              attributes: item.attributes,
            },
          })),
        },
      },
    });

    // Send emails
    const emailData = {
      orderNumber: order.orderNumber,
      customerName: shipping.name,
      customerEmail: shipping.email,
      customerPhone: shipping.phone,
      items: items.map((item: any) => ({
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        attributes: item.attributes ?? {},
      })),
      subtotal,
      shippingCost,
      total,
      shippingAddress: {
        address: shipping.address,
        city: shipping.city,
        province: shipping.province,
      },
      notes: shipping.notes,
    };

    // Send both emails — don't block order creation if email fails
    await Promise.allSettled([
      sendOrderConfirmationEmail(emailData),
      sendAdminOrderNotification(emailData),
    ]);

    return NextResponse.json({ orderNumber: order.orderNumber, orderId: order.id });
  } catch (err: any) {
    console.error("Order error:", err);
    return NextResponse.json({ error: err.message ?? "Failed to create order" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}