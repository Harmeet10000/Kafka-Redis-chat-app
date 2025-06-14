import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

prisma
  .$connect()
  .then(() => {
    console.log("Successfully connected to database");
  })
  .catch((e) => {
    console.error("Error connecting to database:", e);
    process.exit(1);
  });

export default prisma;
