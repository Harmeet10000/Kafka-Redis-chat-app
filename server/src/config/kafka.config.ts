import Kafka from "node-rdkafka";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOPIC_NAME = process.env.KAFKA_TOPIC || "chats";
const CERT_PATH = path.join(__dirname, "../../certs");

interface KafkaConfig {
  "metadata.broker.list": string | undefined;
  "security.protocol": "plaintext" | "ssl" | "sasl_plaintext" | "sasl_ssl";
  "ssl.key.location": string;
  "ssl.certificate.location": string;
  "ssl.ca.location": string;
  "sasl.mechanisms": string;
  "sasl.username": string | undefined;
  "sasl.password": string | undefined;
  "retry.backoff.ms": number;
  "message.send.max.retries": number;
}

const kafkaConfig: KafkaConfig = {
  "metadata.broker.list": process.env.KAFKA_BROKER,
  "security.protocol": "ssl",
  "ssl.key.location": path.join(CERT_PATH, "service.key"),
  "ssl.certificate.location": path.join(CERT_PATH, "service.cert"),
  "ssl.ca.location": path.join(CERT_PATH, "ca.pem"),
  "sasl.mechanisms": "SCRAM-SHA-256",
  "sasl.username": process.env.KAFKA_USERNAME,
  "sasl.password": process.env.KAFKA_PASSWORD,
  "retry.backoff.ms": 200,
  "message.send.max.retries": 10,
};

// Producer Configuration
export const producer = new Kafka.Producer(kafkaConfig);

// Consumer Configuration
export const consumer = Kafka.createReadStream(
  {
    ...kafkaConfig,
    "group.id": "chats",
  },
  { "auto.offset.reset": "earliest" },
  { topics: [TOPIC_NAME] }
);

// Connect Producer
export const connectKafkaProducer = (): Promise<void> =>
  new Promise((resolve, reject) => {
    producer.setPollInterval(100);

    producer.on("ready", () => {
      console.log("Kafka Producer ready");
      resolve();
    });

    producer.on("connection.failure", (err) => {
      console.error("Failed to connect to Kafka:", err);
      reject(err);
    });

    producer.connect({}, (err) => {
      if (err) {
        console.error("Error connecting to Kafka:", err);
        reject(err);
      }
    });
  });

// Send Message Helper with retries
export const sendMessage = async (
  message: string,
  retries = 3
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (!producer.isConnected()) {
        throw new Error("Producer not connected");
      }

      producer.produce(
        TOPIC_NAME,
        null,
        Buffer.from(message),
        null,
        Date.now(),
        (err: Error | null) => {
          if (err) {
            if (retries > 0) {
              console.warn(
                `Retrying message send. Attempts remaining: ${retries}`
              );
              setTimeout(() => {
                sendMessage(message, retries - 1)
                  .then(resolve)
                  .catch(reject);
              }, 1000);
            } else {
              reject(err);
            }
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

// Event Handlers
producer.on("event.error", (err) => {
  console.error("Producer error:", err);
});

consumer.on("error", (err) => {
  console.error("Consumer error:", err);
});

consumer.on("data", (message: Kafka.Message) => {
  console.log("Received message:", message.value.toString());
});

// Graceful shutdown handler
export const disconnectKafka = async (): Promise<void> => {
  return new Promise((resolve) => {
    producer.disconnect((err: Error | null) => {
      if (err) {
        console.error("Error disconnecting Kafka producer:", err);
      } else {
        console.log("Kafka producer disconnected");
      }
      consumer.destroy();
      resolve();
    });
  });
};
