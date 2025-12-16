import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local with override to ensure it takes precedence (local dev)
const envLocalPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envLocalPath, override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
