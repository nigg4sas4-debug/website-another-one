const dotenv = require("dotenv");

dotenv.config();

const config = {
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL || "file:./prisma/dev.db",
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
    : [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5500",
      ],
};

module.exports = config;
