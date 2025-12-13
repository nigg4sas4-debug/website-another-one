const bcrypt = require("bcryptjs");
const express = require("express");
const jwt = require("jsonwebtoken");
const config = require("../config");
const prisma = require("../prisma");
const { authenticate } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

function signUser(user) {
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
  return { token, user: { id: user.id, email: user.email, role: user.role } };
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    return res.status(201).json(signUser(user));
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json(signUser(user));
  })
);

router.get(
  "/me",
  authenticate(true),
  asyncHandler(async (req, res) => {
    const { id, email, role } = req.user;
    res.json({ id, email, role });
  })
);

module.exports = router;
