
import fastify from 'fastify';
import amqp from 'amqplib';
import fs from 'fs';
import path from 'path';

const server = fastify();

// CORS
server.addHook('preHandler', (req, reply, done) => {
  reply.header('Access-Control-Allow-Origin', '*');
  done();
});

// הגשת ה-HTML
server.get('/', (req, reply) => {
  return reply.type('text/html').send(fs.readFileSync(path.join(__dirname, '../../frontend/index.html')));
});

const RABBITMQ_URL = process.env.RABBITMQ_URL || '';
const QUEUE_NAME = 'events_queue';
let channel: amqp.Channel;

// חיבור ל-RabbitMQ
async function connect() {
    const conn = await amqp.connect(RABBITMQ_URL);
    channel = await conn.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log('Connected to RabbitMQ');
}

server.post('/api/events', async (req, reply) => {
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(req.body)));
    return { status: 'success' };
});

const start = async () => {
    await connect();
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running on 3000');
};
start();
