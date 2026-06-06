import * as dotenv from 'dotenv';
dotenv.config();

import amqp from 'amqplib';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const redis = new Redis(); // Connect to Redis using default settings (localhost:6379)
const QUEUE_NAME = 'events_queue';
const RABBITMQ_URL = process.env.RABBITMQ_URL;

async function startWorker() {
  if (!RABBITMQ_URL) {
    throw new Error("RABBITMQ_URL is not defined in environment variables.");
  }
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log("Worker is listening and connected to Redis & DB");

  channel.consume(QUEUE_NAME, async (msg) => {
    if (msg !== null) {
      const eventData = JSON.parse(msg.content.toString());

      try {
        // 1. Save to Postgres
        await prisma.event.create({
          data: {
            userId: eventData.user_id,
            eventType: eventData.event,
            payload: eventData
          }
        });

        // 2. Increment a counter in Redis (e.g., a general counter)
        await redis.incr('total_events_count');
        
        // Bonus: counter by event type
        await redis.hincrby('event_types_stats', eventData.event, 1);

        console.log(`[v] Event processed: ${eventData.event}`);
        channel.ack(msg);
      } catch (err) {
        console.error("Processing error:", err);
      }
    }
  });
}

startWorker();