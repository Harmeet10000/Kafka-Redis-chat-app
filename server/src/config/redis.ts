import { Redis } from "ioredis";
let redis: Redis;
if (process.env.NODE_ENV === "production") {
  redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
  });
} else {
  redis = new Redis({
    host: "localhost",
    port: 6379,
  });
}


export default redis;
