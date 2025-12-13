const express = require("express");
const prisma = require("../prisma");
const { authenticate } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate(true));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const cart = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true },
    });
    res.json({ items: cart });
  })
);

router.post(
  "/items",
  asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ message: "productId and quantity are required" });
    }

    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId: product.id } },
      update: { quantity },
      create: {
        quantity,
        userId: req.user.id,
        productId: product.id,
      },
      include: { product: true },
    });

    // return full cart to match frontend shape { items: [...] }
    const cart = await prisma.cartItem.findMany({ where: { userId: req.user.id }, include: { product: true } });
    res.status(201).json({ items: cart });
  })
);

router.patch(
  "/items/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const existing = await prisma.cartItem.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: { product: true },
    });
    const cart = await prisma.cartItem.findMany({ where: { userId: req.user.id }, include: { product: true } });
    res.json({ items: cart });
  })
);

router.delete(
  "/items/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await prisma.cartItem.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    await prisma.cartItem.delete({ where: { id } });
    const cart = await prisma.cartItem.findMany({ where: { userId: req.user.id }, include: { product: true } });
    res.json({ items: cart });
  })
);

module.exports = router;
