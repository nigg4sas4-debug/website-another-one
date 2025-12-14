const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  const categories = ["Essentials", "Prints", "Athleisure"];
  const categoryRecords = {};
  for (const name of categories) {
    categoryRecords[name] = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const products = [
    {
      name: "Canvas Sneakers",
      description: "Lightweight everyday sneakers with breathable canvas.",
      price: 59.99,
      imageUrl: "https://placehold.co/300x200?text=Sneakers",
      stock: 50,
      featured: true,
      onSale: true,
      discountPct: 15,
      categoryId: categoryRecords["Essentials"].id,
      variations: [
        {
          name: "Standard",
          sizes: [
            { label: "7", stock: 10, price: 59.99 },
            { label: "8", stock: 15, price: 59.99 },
            { label: "9", stock: 15, price: 59.99 },
            { label: "10", stock: 10, price: 59.99 },
          ],
        },
      ],
    },
    {
      name: "Leather Wallet",
      description: "Minimal bifold wallet with RFID blocking.",
      price: 39.5,
      imageUrl: "https://placehold.co/300x200?text=Wallet",
      stock: 150,
      featured: false,
      onSale: false,
      discountPct: 0,
      categoryId: categoryRecords["Essentials"].id,
      variations: [
        {
          name: "Classic",
          sizes: [
            { label: "OS", stock: 150, price: 39.5 },
          ],
        },
      ],
    },
    {
      name: "Printed Tee",
      description: "Graphic tee with limited-edition artwork.",
      price: 29.0,
      imageUrl: "https://placehold.co/300x200?text=Printed+Tee",
      stock: 90,
      featured: true,
      onSale: true,
      discountPct: 20,
      categoryId: categoryRecords["Prints"].id,
      variations: [
        {
          name: "Printed",
          sizes: [
            { label: "S", stock: 10, price: 29.0 },
            { label: "M", stock: 20, price: 29.0 },
            { label: "L", stock: 20, price: 29.0 },
            { label: "XL", stock: 20, price: 31.0 },
            { label: "XXL", stock: 10, price: 33.0 },
          ],
        },
      ],
    },
  ];

  for (const product of products) {
    try {
      const created = await prisma.product.upsert({
        where: { name: product.name },
        update: {
          description: product.description,
          price: product.price,
          imageUrl: product.imageUrl,
          stock: product.stock,
          featured: product.featured,
          onSale: product.onSale,
          discountPct: product.discountPct,
          categoryId: product.categoryId,
        },
        create: {
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: product.imageUrl,
          stock: product.stock,
          featured: product.featured,
          onSale: product.onSale,
          discountPct: product.discountPct,
          categoryId: product.categoryId,
        },
      });

      // reset variations for idempotent seed
      await prisma.productVariation.deleteMany({ where: { productId: created.id } });
      for (const variation of product.variations) {
        await prisma.productVariation.create({
          data: {
            name: variation.name,
            productId: created.id,
            sizes: {
              create: variation.sizes.map((size) => ({
                label: size.label,
                price: size.price,
                stock: size.stock,
              })),
            },
          },
        });
      }
    } catch (e) {
      console.error("Seed failed for", product.name, e);
      throw e;
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
