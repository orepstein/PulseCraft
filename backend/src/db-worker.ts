import amqp from 'amqplib';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const QUEUE_NAME = 'events_queue';
const RABBITMQ_URL = "amqps://fqhtvebf:zmIU1ZA046Jr4WCoU4y--ldbl6bUIqwu@whale.rmq.cloudamqp.com/fqhtvebf";

async function startWorker() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log(`👷 Prisma Worker is ready and listening on: "${QUEUE_NAME}"`);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (msg !== null) {
      try {
        const eventPayload = JSON.parse(msg.content.toString());
        
        // שמירה מהירה ל-PostgreSQL
        await prisma.event.create({
          data: {
            userId: eventPayload.userId || 'system_test',
            eventType: eventPayload.eventType || 'simulation',
            payload: eventPayload.payload || {}
          }
        });
        
        channel.ack(msg);
      } catch (error) {
        channel.nack(msg, false, false);
      }
    }
  });
}
startWorker().catch(console.error);
