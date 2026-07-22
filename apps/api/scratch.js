const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const data = await prisma.doctorAvailability.findMany({
    where: { doctorId: '20900780-4da7-4965-bb96-ffebc62d990b' }
  });
  console.log(data);
}

run().finally(() => prisma.$disconnect());
