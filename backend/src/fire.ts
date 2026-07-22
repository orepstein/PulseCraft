import amqp from 'amqplib';

const QUEUE_NAME = 'events_queue';
const RABBITMQ_URL = "amqps://fqhtvebf:zmIU1ZA046Jr4WCoU4y--ldbl6bUIqwu@whale.rmq.cloudamqp.com/fqhtvebf";

async function fireMessages() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log(`🔥 Starting Live Traffic Simulation! Firing into: ${QUEUE_NAME} 🔥`);
  console.log('Press Ctrl+C to stop.');

  let count = 0;
  setInterval(() => {
    const eventPayload = {
      userId: `user_${Math.floor(Math.random() * 1000)}`,
      eventType: 'live_test',
      payload: { status: 'active', timestamp: Date.now() }
    };

    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(eventPayload)));
    count++;
    process.stdout.write(`\r🚀 Fired ${count} messages...`);
  }, 20); // יורה 50 הודעות בשנייה
}
fireMessages().catch(console.error);
