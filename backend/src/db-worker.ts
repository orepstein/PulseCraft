import 'dotenv/config';
import amqp from 'amqplib';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const QUEUE_NAME = 'events_queue';
const RABBITMQ_URL = process.env.RABBITMQ_URL;

async function startWorker() {
  if (!RABBITMQ_URL) {
    throw new Error("FATAL: RABBITMQ_URL environment variable is not set.");
  }

  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  
  // הגבלת כמות ההודעות שמעובדות במקביל למניעת עומס יתר על מסד הנתונים
  await channel.prefetch(10);
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log(`[Worker] Heavy-Duty Prisma Worker is ready. Listening on queue: "${QUEUE_NAME}"`);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (msg !== null) {
      try {
        const rawContent = msg.content.toString();
        console.log(`[📥 Received Raw Message]:`, rawContent);
        
        const payload = JSON.parse(rawContent);

        // מיפוי בטוח של השדות כדי לוודא ששדה ה-userId לעולם לא יהיה ריק (מונע את שגיאת Prisma)
        const userId = payload.userId || payload.user_id || 'system_user';
        const eventType = payload.eventType || payload.event_type || 'default_event';

        console.log(`[2] Attempting to save to Prisma for user: ${userId}, type: ${eventType}...`);

        // שמירה במסד הנתונים PostgreSQL דרך Prisma
        await prisma.event.create({
          data: {
            userId: String(userId),
            eventType: String(eventType),
            payload: payload,
          },
        });

        // אישור קבלה למסר ב-RabbitMQ (הסרה מהתור)
        channel.ack(msg);
        console.log(`[✅ Success] Event processed and acknowledged successfully.`);

      } catch (error) {
        console.error("[❌ Error processing message]:", error);
        
        // דחיית ההודעה ללא החזרה לתור (למניעת לופ אינסופי במקרה של נתונים פגומים)
        channel.nack(msg, false, false);
      }
    }
  });
}

startWorker().catch((error) => {
  console.error("Worker failed to start:", error);
  process.exit(1);
});