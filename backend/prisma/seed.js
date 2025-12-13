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

  const products = [
    {
      name: "Canvas Sneakers",
      description: "Lightweight everyday sneakers with breathable canvas.",
      price: 59.99,
      imageUrl: "https://via.placeholder.com/300x200?text=Sneakers",
      stock: 50,
    },
    {
      name: "Leather Wallet",
      description: "Minimal bifold wallet with RFID blocking.",
      price: 39.5,
      imageUrl: "https://via.placeholder.com/300x200?text=Wallet",
      stock: 150,
    },
    {
      name: "Bluetooth Headphones",
      description: "Over-ear headphones with 30h battery life.",
      price: 129.0,
      imageUrl: "https://via.placeholder.com/300x200?text=Headphones",
      stock: 75,
    },
  ];

  for (const product of products) {
    try {
      await prisma.product.create({ data: product });
    } catch (e) {
      // unique constraint violation -> update existing
      if (e.code === "P2002") {
        await prisma.product.update({
          where: { name: product.name },
          data: product,
        });
      } else {
        throw e;
      }
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
