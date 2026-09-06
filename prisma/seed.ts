import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const settings = [
    ["store_name", "HemBox"],
    ["store_currency", "ZMW"],
    ["store_currency_symbol", "K"],
    ["store_country", "Zambia"],
    ["store_email", "hello@hembox.com"],
    ["tax_rate", "0"],
  ];
  for (const [key, value] of settings) {
    await prisma.storeSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  for (const [name, slug] of [["Men", "men"], ["Women", "women"], ["Kids", "kids"]]) {
    await prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug } });
  }
  for (const slug of ["new-arrival", "sale", "bestseller", "featured", "casual", "formal"]) {
    const name = slug.replace("-", " ").replace(/\\b\\w/g, (l) => l.toUpperCase());
    await prisma.tag.upsert({ where: { slug }, update: {}, create: { name, slug } });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
