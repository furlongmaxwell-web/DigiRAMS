import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

const users = [
  {
    name: "Admin",
    email: "admin@taskforce141.com",
    password: hashSync("admin@141", 12),
    role: "ADMIN" as const,
    skills: JSON.stringify(["management", "coordination", "analytics"]),
    region: "Global",
  },
  {
    name: "Mohan Jodaro",
    email: "mohan@sra.com",
    password: hashSync("volunteer@141", 12),
    role: "VOLUNTEER" as const,
    skills: JSON.stringify(["field-survey", "data-collection"]),
    region: "SHAN",
  },
  {
    name: "Sara Ahmed",
    email: "sara@sra.com",
    password: hashSync("volunteer@141", 12),
    role: "VOLUNTEER" as const,
    skills: JSON.stringify(["medical", "first-aid", "translation"]),
    region: "MANDALAY",
  },
];

async function main() {
  console.log("Seeding database...\n");

  for (const user of users) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existing) {
      console.log(`  [skip] ${user.email} already exists`);
      continue;
    }

    await prisma.user.create({ data: user });
    console.log(`  [created] ${user.email} (${user.role})`);
  }

  console.log("\nSeed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
