const express = require("express");
const prisma = require("../prisma");
const { authenticate, requireRole } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const ORDER_STATUSES = ["PROCESSING", "SHIPPED", "DELIVERED"];
const CANCELLATION_STATUSES = ["PENDING", "REJECTED", "SUCCESS"];
const ADMIN_ROLE = "ADMIN";

const router = express.Router();

router.use(authenticate(true));

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const shipping = req.body.shipping ? JSON.stringify(req.body.shipping) : null;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const total = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId: req.user.id,
          total,
          shipping,
          status: "PROCESSING",
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          user: { select: { id: true, email: true, role: true } },
        },
      });

      await tx.cartItem.deleteMany({ where: { userId: req.user.id } });
      return createdOrder;
    });

    res.status(201).json({
      ...order,
      shipping: shipping ? JSON.parse(shipping) : null,
    });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const isAdmin = req.user.role === ADMIN_ROLE;

    const orders = await prisma.order.findMany({
      where: isAdmin ? {} : { userId: req.user.id },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true, role: true } },
        cancellations: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      orders.map((order) => ({
        ...order,
        shipping: order.shipping ? JSON.parse(order.shipping) : null,
      }))
    );
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true, role: true } },
        cancellations: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isOwner = order.userId === req.user.id;
    const isAdmin = req.user.role === ADMIN_ROLE;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json({
      ...order,
      shipping: order.shipping ? JSON.parse(order.shipping) : null,
    });
  })
);

router.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!status || !ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isAdmin = req.user?.role === ADMIN_ROLE;

    if (!isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true, role: true } },
        cancellations: true,
      },
    });

    res.json({
      ...updated,
      shipping: updated.shipping ? JSON.parse(updated.shipping) : null,
    });
  })
);

// submit cancellation request
router.post(
  "/:id/cancellation",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const reason = req.body.reason ? String(req.body.reason) : null;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.userId !== req.user.id && req.user.role !== ADMIN_ROLE) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const request = await prisma.cancellationRequest.upsert({
      where: { orderId: id },
      update: { reason, status: "PENDING" },
      create: { orderId: id, userId: order.userId, reason },
      include: { order: true, user: true },
    });

    res.status(201).json(request);
  })
);

router.get(
  "/cancellations",
  asyncHandler(async (req, res) => {
    const isAdmin = req.user.role === ADMIN_ROLE;
    const requests = await prisma.cancellationRequest.findMany({
      where: isAdmin ? {} : { userId: req.user.id },
      include: { order: true, user: { select: { id: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  })
);

router.patch(
  "/cancellations/:id",
  requireRole(ADMIN_ROLE),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!status || !CANCELLATION_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid cancellation status" });
    }

    const updated = await prisma.cancellationRequest.update({
      where: { id },
      data: { status },
      include: { order: true, user: { select: { id: true, email: true } } },
    });

    res.json(updated);
  })
);

module.exports = router;
