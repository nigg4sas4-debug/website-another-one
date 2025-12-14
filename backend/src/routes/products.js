const express = require("express");
const prisma = require("../prisma");
const { authenticate, requireRole } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// populate req.user when a token is present but don't require authentication for public endpoints
router.use(authenticate(false));

const TRASH_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

async function purgeExpiredTrashedProducts() {
  const cutoff = new Date(Date.now() - TRASH_TTL_MS);
  await prisma.product.deleteMany({
    where: { deletedAt: { lt: cutoff } },
  });
}

// run cleanup periodically (no-op if nothing to purge)
setInterval(() => {
  purgeExpiredTrashedProducts().catch((err) => console.error("Trash purge failed", err));
}, 1000 * 60 * 30);

function normalizeProductPayload(body) {
  const { name, description, price, imageUrl, base64Image, stock, featured, onSale, discountPct, category } = body;
  const categoryName = category?.name || category;
  const safePrice = price == null ? undefined : Number(price);
  return {
    name,
    description: description ?? "",
    price: safePrice,
    imageUrl: base64Image || (imageUrl ?? null),
    stock: stock == null ? undefined : Number(stock),
    featured: Boolean(featured),
    onSale: Boolean(onSale),
    discountPct: discountPct == null ? 0 : Number(discountPct),
    categoryName: categoryName ? String(categoryName).trim() : undefined,
  };
}

function coerceNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}


router.get(
  "/",
  asyncHandler(async (_req, res) => {
    await purgeExpiredTrashedProducts();
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        variations: { include: { sizes: true } },
      },
    });
    res.json(products);
  })
);

// Admin: view trashed products (and purge expired entries)
router.get(
  "/trash",
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    await purgeExpiredTrashedProducts();
    const trashed = await prisma.product.findMany({
      where: { deletedAt: { not: null } },
      include: { category: true, variations: { include: { sizes: true } } },
      orderBy: { deletedAt: "desc" },
    });

    res.json(trashed);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: { category: true, variations: { include: { sizes: true } } },
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  })
);

async function resolveCategory(categoryName) {
  if (!categoryName) return null;
  return prisma.category.upsert({
    where: { name: categoryName },
    update: {},
    create: { name: categoryName },
  });
}

async function replaceVariations(productId, variations = []) {
  await prisma.productVariation.deleteMany({ where: { productId } });
  if (!Array.isArray(variations) || variations.length === 0) return;
  for (const variation of variations) {
    await prisma.productVariation.create({
      data: {
        name: variation.name || "Default",
        productId,
        sizes: {
          create: (variation.sizes || []).map((size) => ({
            label: size.label || "OS",
            price: Number(size.price ?? 0),
            stock: Number(size.stock ?? 0),
          })),
        },
      },
    });
  }
}

// Admin: create a product
router.post(
  "/",
  asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const payload = normalizeProductPayload(req.body);
    const variations = Array.isArray(req.body.variations) ? req.body.variations : [];
    const derivedPrice = variations?.[0]?.sizes?.[0]?.price;

    if (!payload.name || (payload.price == null && derivedPrice == null)) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    const category = await resolveCategory(payload.categoryName);

    const product = await prisma.product.create({
      data: {
        name: payload.name,
        description: payload.description,
        price: payload.price ?? coerceNumber(derivedPrice),
        imageUrl: payload.imageUrl,
        stock: payload.stock || 0,
        featured: payload.featured,
        onSale: payload.onSale,
        discountPct: payload.discountPct,
        categoryId: category?.id ?? null,
      },
    });

    await replaceVariations(product.id, variations);

    const withRelations = await prisma.product.findUnique({
      where: { id: product.id },
      include: { category: true, variations: { include: { sizes: true } } },
    });

    res.status(201).json(withRelations);
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
    const payload = normalizeProductPayload(req.body);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) return res.status(404).json({ message: "Product not found" });

    const category = payload.categoryName ? await resolveCategory(payload.categoryName) : null;

    const variations = Array.isArray(req.body.variations) ? req.body.variations : null;

    await prisma.product.update({
      where: { id },
      data: {
        name: payload.name ?? existing.name,
        description: payload.description ?? existing.description,
        price:
          payload.price == null
            ? variations?.[0]?.sizes?.[0]?.price ?? existing.price
            : payload.price,
        imageUrl: payload.imageUrl === undefined ? existing.imageUrl : payload.imageUrl,
        stock: payload.stock == null ? existing.stock : payload.stock,
        featured: payload.featured ?? existing.featured,
        onSale: payload.onSale ?? existing.onSale,
        discountPct: payload.discountPct ?? existing.discountPct,
        categoryId: category ? category.id : payload.categoryName === null ? null : existing.categoryId,
      },
    });

    if (variations) {
      await replaceVariations(id, variations);
    }

    const updated = await prisma.product.findUnique({
      where: { id },
      include: { category: true, variations: { include: { sizes: true } } },
    });

  res.json(updated);
})
);

// Admin: move product to trash (soft delete)
router.patch(
  "/:id/delete",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const trashed = await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json(trashed);
  })
);

// Admin: restore a trashed product
router.patch(
  "/:id/restore",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const restored = await prisma.product.update({
      where: { id },
      data: { deletedAt: null },
      include: { category: true, variations: { include: { sizes: true } } },
    });

    res.json(restored);
  })
);

// Admin: permanently delete a trashed product
router.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Product not found" });

    await prisma.product.delete({ where: { id } });
    res.json({ ok: true });
  })
);

// Admin: update stock/price for a single size
router.patch(
  "/sizes/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const payload = {
      stock: req.body.stock == null ? undefined : coerceNumber(req.body.stock),
      price: req.body.price == null ? undefined : coerceNumber(req.body.price),
      label: req.body.label,
    };

    const size = await prisma.variationSize.findUnique({ where: { id } });
    if (!size) return res.status(404).json({ message: "Size not found" });

    const updated = await prisma.variationSize.update({
      where: { id },
      data: {
        stock: payload.stock ?? size.stock,
        price: payload.price ?? size.price,
        label: payload.label ?? size.label,
      },
    });

    res.json(updated);
  })
);

module.exports = router;
