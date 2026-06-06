import fastify from 'fastify';
import amqp from 'amqplib';

const server = fastify();

// Read the RabbitMQ URL from environment variables, with a fallback for local development
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE_NAME = 'events_queue';

let channel: amqp.Channel;

async function connectToRabbitMQ() {
  try {
    if (!RABBITMQ_URL) {
        throw new Error("RABBITMQ_URL is not defined in environment variables.");
    }
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log('Connected to RabbitMQ (Cloud)');
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
    process.exit(1);
  }
}

server.post('/api/events', async (request, reply) => {
  try {
    const eventData = request.body;
    const message = JSON.stringify(eventData);

    channel.sendToQueue(QUEUE_NAME, Buffer.from(message), { persistent: true });

    console.log(`Event sent to ${QUEUE_NAME}:`, eventData);
    reply.status(200).send({ message: 'Event sent successfully' });
  } catch (error) {
    console.error('Error sending event:', error);
    reply.status(500).send({ message: 'Error sending event' });
  }
});

const start = async () => {
  try {
    await connectToRabbitMQ();
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server listening on http://localhost:3000');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
