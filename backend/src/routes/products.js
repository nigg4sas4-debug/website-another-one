const express = require("express");
const prisma = require("../prisma");
const { authenticate } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// populate req.user when a token is present but don't require authentication for public endpoints
router.use(authenticate(false));

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
    res.json(products);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  })
);

// Admin: create a product
router.post(
  "/",
  asyncHandler(async (req, res) => {
    // simple admin check should be applied by route mounting or middleware; check here conservatively
    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { name, description, price, imageUrl, stock } = req.body;
    if (!name || price == null) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || "",
        price: Number(price),
        imageUrl: imageUrl || null,
        stock: Number(stock) || 0,
      },
    });

    res.status(201).json(product);
  })
);

// Admin: update product
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const id = Number(req.params.id);
    const { name, description, price, imageUrl, stock } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        description: description ?? existing.description,
        price: price == null ? existing.price : Number(price),
        imageUrl: imageUrl === undefined ? existing.imageUrl : imageUrl,
        stock: stock == null ? existing.stock : Number(stock),
      },
    });

    res.json(updated);
  })
);

module.exports = router;
