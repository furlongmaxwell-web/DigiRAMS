import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { hashSync } from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: "admin@taskforce141.com" },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@taskforce141.com",
        password: hashSync("admin@141", 12),
        role: "ADMIN",
        skills: JSON.stringify(["management", "coordination"]),
        region: "Global",
      },
    });
    console.log("Admin user seeded: admin@taskforce141.com / admin@141");
  } else {
    console.log("Admin user already exists, skipping seed.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
