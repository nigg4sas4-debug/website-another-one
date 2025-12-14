const express = require("express");
const prisma = require("../prisma");
const { authenticate, requireRole } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate(false));

// List categories for admin/customer selection
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    res.json(categories);
  })
);

// Create a category (admin only)
router.post(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Name is required" });

    const category = await prisma.category.create({ data: { name } });
    res.status(201).json(category);
  })
);

// Rename a category (admin only)
router.patch(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Name is required" });

    const updated = await prisma.category.update({ where: { id }, data: { name } });
    res.json(updated);
  })
);

// Delete a category (admin only). Products fall back to null category via FK rule.
router.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await prisma.category.delete({ where: { id } });
    res.status(204).end();
  })
);

module.exports = router;
