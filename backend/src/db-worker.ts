import 'dotenv/config';
import amqp from 'amqplib';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
// חיבור ל-Redis (ישתמש במשתנה סביבה REDIS_URL או בברירת מחדל מקומית)
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const QUEUE_NAME = 'events_queue';
const RABBITMQ_URL = process.env.RABBITMQ_URL;

async function startWorker() {
  if (!RABBITMQ_URL) {
    throw new Error("FATAL: RABBITMQ_URL environment variable is not set.");
  }

  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  
  // בקרת עומסים למניעת הצפה של המסד והזיכרון
  await channel.prefetch(10);
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log(`[Worker] Heavy-Duty Prisma + Redis Worker is ready. Listening on queue: "${QUEUE_NAME}"`);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (msg !== null) {
      try {
        const rawContent = msg.content.toString();
        console.log(`[📥 Received Raw Message]:`, rawContent);
        
        const payload = JSON.parse(rawContent);

        // מיפוי שדות בטוח
        const userId = payload.userId || payload.user_id || 'system_user';
        const eventType = payload.eventType || payload.event_type || 'default_event';

        console.log(`[2] Processing event for user: ${userId}, type: ${eventType}...`);

        // 1. שמירה היסטורית במסד הנתונים PostgreSQL דרך Prisma
        await prisma.event.create({
          data: {
            userId: String(userId),
            eventType: String(eventType),
            payload: payload,
          },
        });

        // 2. עדכון מונים בזמן אמת ב-Redis (מהירות שליפה מיידית)
        await redis.incr('total_events_count');
        await redis.hincrby('event_types_stats', String(eventType), 1);

        // אישור קבלה לתור (ACK)
        channel.ack(msg);
        console.log(`[✅ Success] Event saved to PostgreSQL and Redis counters updated!`);

      } catch (error) {
        console.error("[❌ Error processing message]:", error);
        // דחיית ההודעה ללא החזרה לתור במקרה של שגיאה
        channel.nack(msg, false, false);
      }
    }
  });
}

startWorker().catch((error) => {
  console.error("Worker failed to start:", error);
  process.exit(1);
});