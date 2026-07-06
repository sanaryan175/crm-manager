const { PrismaClient } = require("./node_modules/@prisma/client");
const prisma = new PrismaClient();
prisma.user.findMany({ take: 10, select: { id: true, email: true, name: true } })
  .then(users => {
    console.log("Users:", JSON.stringify(users));
    return prisma.organization.findMany({ take: 5, select: { id: true, name: true, currency: true } });
  })
  .then(orgs => {
    console.log("Orgs:", JSON.stringify(orgs));
    return prisma.$disconnect();
  })
  .catch(e => { console.error(e.message); prisma.$disconnect(); });
