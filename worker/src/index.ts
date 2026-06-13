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
      
      const redis = new Redis(process.env.REDIS_URL as string, { tls: { rejectUnauthorized: false } });
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
            const payload = JSON.parse(msg.content.toString());
      
            try {
              // 1. Save to Postgres
              await prisma.event.create({
                data: {
                  userId: payload.user_id,
                  eventType: payload.event_type,
                  payload: payload
                }
              });
      
              // 2. Increment a counter in Redis (e.g., a general counter)
              await redis.incr('total_events_count');
              
              // Bonus: counter by event type
              await redis.hincrby('event_types_stats', payload.event_type, 1);
      
              console.log(`[v] Event processed: ${payload.event_type}`);
              channel.ack(msg);
            } catch (err) {
              console.error("Processing error:", err);
            }
          }
        });
      }
      
      startWorker();
