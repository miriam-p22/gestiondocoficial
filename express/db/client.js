const { PrismaClient } = require("@prisma/client");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida en el archivo .env.");
}

const globalForPrisma = global;

const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

module.exports = prisma;
