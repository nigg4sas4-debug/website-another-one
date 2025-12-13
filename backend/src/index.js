const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("./config");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, "../../ecommerce-frontend")));
app.use(express.static(path.join(__dirname, "../../ecommerce-frontend/pages")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

// Serve index.html for any route not matched (SPA fallback)
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../../ecommerce-frontend/pages/index.html"));
});

const server = app.listen(config.port, () => {
  console.log(`API + Frontend listening on http://localhost:${config.port}`);
});

// Handle EADDRINUSE error
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${config.port} is already in use. Kill the process using: lsof -t -i:${config.port} | xargs kill`
    );
    process.exit(1);
  }
  throw err;
});

// Graceful shutdown on SIGINT / SIGTERM
async function shutdown() {
  console.log("Shutting down gracefully...");
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Database connection closed");
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
