import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  // Only allow in development or preview environments for safety
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL_URL) {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  try {
    console.log("🌱 Seeding database via API...");

    // 1. Admin User
    const passwordHash = await bcrypt.hash("hembox-admin-2024", 12);
    await db.adminUser.upsert({
      where: { email: "admin@hembox.com" },
      update: {},
      create: { 
        email: "admin@hembox.com", 
        name: "HemBox Admin", 
        passwordHash, 
        role: "SUPER_ADMIN" 
      },
    });

    // 2. Store Settings
    const settingsList = [
      { key: "store_name", value: "HemBox" },
      { key: "store_currency", value: "ZMW" },
      { key: "store_currency_symbol", value: "K" },
      { key: "store_country", value: "Zambia" },
      { key: "store_email", value: "hello@hembox.com" },
      { key: "tax_rate", value: "0" },
      { key: "free_shipping_threshold", value: "500" },
      { key: "default_shipping_cost", value: "50" },
      { key: "about_us", value: "Welcome to HemBox, your number one source for all things fashion. We're dedicated to giving you the very best of clothing, with a focus on dependability, customer service and uniqueness." },
      { key: "privacy_policy", value: "This privacy policy has been compiled to better serve those who are concerned with how their 'Personally Identifiable Information' (PII) is being used online." },
      { key: "terms_conditions", value: "By accessing this website we assume you accept these terms and conditions. Do not continue to use HemBox if you do not agree to take all of the terms and conditions stated on this page." },
    ];

    for (const s of settingsList) {
      await db.storeSetting.upsert({ 
        where: { key: s.key }, 
        update: {}, 
        create: s 
      });
    }

    // 3. Categories
    const men = await db.category.upsert({ where: { slug: "men" }, update: {}, create: { name: "Men", slug: "men", featured: true, position: 0 } });
    const women = await db.category.upsert({ where: { slug: "women" }, update: {}, create: { name: "Women", slug: "women", featured: true, position: 1 } });
    
    await db.category.upsert({ where: { slug: "mens-tshirts" }, update: {}, create: { name: "T-Shirts", slug: "mens-tshirts", parentId: men.id, position: 0 } });
    await db.category.upsert({ where: { slug: "womens-dresses" }, update: {}, create: { name: "Dresses", slug: "womens-dresses", parentId: women.id, position: 0 } });

    return NextResponse.json({ success: true, message: "Database seeded successfully" });
  } catch (error: any) {
    console.error("Seed API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
