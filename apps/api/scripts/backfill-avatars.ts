import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { defaultAvatarUrl } from "../src/infrastructure";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? undefined
    : { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function backfill() {
  const patients = await prisma.patient.findMany({
    where: { OR: [{ imageUrl: null }, { imageUrl: "" }] },
    select: {
      id: true,
      email: true,
      phone: true,
      firstNameEn: true,
      lastNameEn: true,
    },
  });
  for (const p of patients) {
    const seed =
      p.email || p.phone || `${p.firstNameEn}-${p.lastNameEn}-${p.id}`;
    await prisma.patient.update({
      where: { id: p.id },
      data: { imageUrl: defaultAvatarUrl(seed || p.id) },
    });
  }

  const practitioners = await prisma.clinicUser.findMany({
    where: {
      role: Role.practitioner,
      OR: [{ imageUrl: null }, { imageUrl: "" }],
    },
    select: {
      id: true,
      name: true,
      user: { select: { email: true } },
    },
  });

  for (const p of practitioners) {
    const seed = p.user.email || p.name || p.id;
    await prisma.clinicUser.update({
      where: { id: p.id },
      data: { imageUrl: defaultAvatarUrl(seed) },
    });
  }

  console.log(
    `patients: ${patients.length}, practitioners: ${practitioners.length}`,
  );
}

backfill()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
