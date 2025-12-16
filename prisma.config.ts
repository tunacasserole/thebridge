import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local with override to ensure it takes precedence
const envLocalPath = path.resolve(process.cwd(), ".env.local");
const result = dotenv.config({ path: envLocalPath, override: true });

// Debug: uncomment to troubleshoot
// console.log("Loaded from:", envLocalPath);
// console.log("DATABASE_URL starts with:", process.env.DATABASE_URL?.substring(0, 30));

export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL!,
  },
});
