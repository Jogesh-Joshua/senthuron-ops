import { PrismaClient } from '../src/generated/prisma';
const prisma = new PrismaClient();

async function main() {
  // Prisma cascade deletes activities when enquiry is deleted (onDelete: Cascade in schema)
  const deleted = await prisma.enquiry.deleteMany({
    where: {
      clientName: {
        contains: 'Test',
        mode: 'insensitive',
      },
    },
  });
  console.log(`Deleted ${deleted.count} test enquiry(ies)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
