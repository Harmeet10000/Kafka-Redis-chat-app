import prisma from "./config/db.config.js";
import { producer, consumer } from "./config/kafka.config.js";

export const produceMessage = async (
  topic: string,
  message: any
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (!producer.isConnected()) {
        reject(new Error("Producer not connected"));
        return;
      }

      producer.produce(
        topic,
        null,
        Buffer.from(JSON.stringify(message)),
        null,
        Date.now(),
        (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        }
      );
    } catch (err) {
      reject(err);
    }
  });
};

export const consumeMessages = async (topic: string): Promise<void> => {
  // Consumer is already configured as a ReadStream in kafka.config.ts
  consumer.on("data", async (message) => {
    try {
      const data = JSON.parse(message.value.toString());
      console.log({
        partition: message.partition,
        offset: message.offset,
        value: data,
      });

      await prisma.chats.create({
        data: data,
      });
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  // Error handling
  consumer.on("error", (error) => {
    console.error("Consumer error:", error);
  });
};
