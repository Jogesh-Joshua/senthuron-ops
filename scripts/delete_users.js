const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../src/generated/prisma");

const pool = new Pool({
  connectionString: "postgresql://senthuron_ops_owner:npg_NxrS4Bk1zdAI@ep-muddy-cake-b57z5abs-pooler.c-7.us-east-2.aws.neon.tech/senthuron_ops?sslmode=require&channel_binding=require&uselibpqcompat=true"
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.user.deleteMany({});
  console.log("All users deleted.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
