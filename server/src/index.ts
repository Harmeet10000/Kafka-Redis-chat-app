import express, { Application, Request, Response } from "express";
import "dotenv/config";
import cors from "cors";
const app: Application = express();
const PORT = process.env.PORT || 8000;
import Routes from "./routes/index.js";
import { Server } from "socket.io";
import { createServer } from "http";
import { setupSocket } from "./socket.js";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import redis from "./config/redis.js";
import { instrument } from "@socket.io/admin-ui";
import { connectKafkaProducer, producer } from "./config/kafka.config.js";
import { consumeMessages } from "./helper.js";

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_APP_URL, "https://admin.socket.io"],
  },
  adapter: createAdapter(redis),
});

instrument(io, {
  auth: false,
  mode: "development",
});

export { io };
setupSocket(io);

// * Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req: Request, res: Response) => {
  return res.send("It's working Guys 🙌");
});

// * Initialize Kafka Producer and Consumer
const initializeKafka = async () => {
  try {
    await connectKafkaProducer();
    console.log("Kafka producer connected successfully");

    // Start consuming messages
    await consumeMessages("chats");
    console.log("Kafka consumer started successfully");
  } catch (error) {
    console.error("Failed to initialize Kafka:", error);
    process.exit(1);
  }
};

// Initialize Kafka
initializeKafka();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Closing Kafka producer...");
  producer.disconnect();
  process.exit(0);
});

// * Routes
app.use("/api", Routes);

server.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
