import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding HemBox database...");

  const passwordHash = await bcrypt.hash("hembox-admin-2024", 12);
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@hembox.com" },
    update: {},
    create: { email: "admin@hembox.com", name: "HemBox Admin", passwordHash, role: "SUPER_ADMIN" },
  });
  console.log("✅ Admin user:", admin.email);

  const settingsList = [
    { key: "store_name", value: "HemBox" },
    { key: "store_currency", value: "ZMW" },
    { key: "store_currency_symbol", value: "K" },
    { key: "store_country", value: "Zambia" },
    { key: "store_email", value: "hello@hembox.com" },
    { key: "tax_rate", value: "0" },
    { key: "free_shipping_threshold", value: "500" },
    { key: "default_shipping_cost", value: "50" },
  ];
  for (const s of settingsList) {
    await prisma.storeSetting.upsert({ where: { key: s.key }, update: {}, create: s });
  }
  console.log("✅ Store settings created");

  const men = await prisma.category.upsert({ where: { slug: "men" }, update: {}, create: { name: "Men", slug: "men", featured: true, position: 0 } });
  const women = await prisma.category.upsert({ where: { slug: "women" }, update: {}, create: { name: "Women", slug: "women", featured: true, position: 1 } });
  const kids = await prisma.category.upsert({ where: { slug: "kids" }, update: {}, create: { name: "Kids", slug: "kids", featured: true, position: 2 } });

  await prisma.category.upsert({ where: { slug: "mens-tshirts" }, update: {}, create: { name: "T-Shirts", slug: "mens-tshirts", parentId: men.id, position: 0 } });
  await prisma.category.upsert({ where: { slug: "mens-trousers" }, update: {}, create: { name: "Trousers", slug: "mens-trousers", parentId: men.id, position: 1 } });
  await prisma.category.upsert({ where: { slug: "womens-dresses" }, update: {}, create: { name: "Dresses", slug: "womens-dresses", parentId: women.id, position: 0 } });
  await prisma.category.upsert({ where: { slug: "womens-tops" }, update: {}, create: { name: "Tops", slug: "womens-tops", parentId: women.id, position: 1 } });
  await prisma.category.upsert({ where: { slug: "kids-clothing" }, update: {}, create: { name: "Clothing", slug: "kids-clothing", parentId: kids.id, position: 0 } });
  console.log("✅ Categories created");

  for (const tag of ["new-arrival", "sale", "bestseller", "featured", "casual", "formal"]) {
    const name = tag.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase());
    await prisma.tag.upsert({ where: { slug: tag }, update: {}, create: { name, slug: tag } });
  }
  console.log("✅ Tags created");

  console.log("\n🎉 Done! Login with:");
  console.log("   Email:    admin@hembox.com");
  console.log("   Password: hembox-admin-2024");
}

main().catch(console.error).finally(() => prisma.$disconnect());
