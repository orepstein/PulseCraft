import http from 'http';
import { PrismaClient } from '@prisma/client';
import amqp from 'amqplib';

const prisma = new PrismaClient();
const QUEUE_NAME = 'events_queue';
const RABBITMQ_URL = "amqps://fqhtvebf:zmIU1ZA046Jr4WCoU4y--ldbl6bUIqwu@whale.rmq.cloudamqp.com/fqhtvebf";

let cachedConnection: any = null;
let cachedChannel: any = null;

async function getOrCreateChannel() {
  if (cachedChannel) {
    return cachedChannel;
  }
  
  try {
    if (!cachedConnection) {
      cachedConnection = await amqp.connect(RABBITMQ_URL);
      cachedConnection.on('error', (err: any) => {
        console.error('❌ RabbitMQ connection error:', err?.message || err);
        cachedConnection = null;
        cachedChannel = null;
      });
      cachedConnection.on('close', () => {
        console.warn('⚠️ RabbitMQ connection closed. Reconnecting...');
        cachedConnection = null;
        cachedChannel = null;
      });
    }

    cachedChannel = await cachedConnection.createChannel();
    await cachedChannel.assertQueue(QUEUE_NAME, { durable: true });
    console.log(`[RabbitMQ] Channel ready and verified on queue: ${QUEUE_NAME}`);
    return cachedChannel;
  } catch (error) {
    cachedChannel = null;
    throw error;
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- מחזיר נתונים סטטיסטיים לדאשבורד ---
  if (req.method === 'GET' && req.url === '/api/metrics') {
    try {
      const eventsCount = await prisma.event.count();
      let messagesInQueue = 0;
      let activeConsumers = 0;
      let rabbitStatus = 'offline';

      try {
        const channel = await getOrCreateChannel();
        const queueStats = await channel.checkQueue(QUEUE_NAME);
        messagesInQueue = queueStats.messageCount;
        activeConsumers = queueStats.consumerCount;
        rabbitStatus = 'online';
      } catch (e) {
        rabbitStatus = 'error';
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        rabbitStatus: rabbitStatus,
        rabbitMetric: `${messagesInQueue} msgs waiting`,
        workerStatus: activeConsumers > 0 ? 'online' : 'processing',
        workerMetric: `${activeConsumers} active workers`,
        dbStatus: 'online',
        dbMetric: `Connected (${eventsCount} rows)`
      }));
    } catch (error) {
      res.writeHead(500); res.end(JSON.stringify({ error: 'Failed to fetch metrics' }));
    }
  } 
  
  // --- פעולה: ירי הודעות ל-RabbitMQ ---
  else if (req.method === 'POST' && req.url === '/api/action/fire') {
    try {
      console.log('⚡ [Server] Fire action requested. Securing channel...');
      const channel = await getOrCreateChannel();

      for (let i = 0; i < 50; i++) {
        const payload = { 
          userId: `ui_user_${Math.floor(Math.random() * 100)}`, 
          eventType: 'ui_burst', 
          payload: { ts: Date.now(), index: i + 1 } 
        };
        channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(payload)));
      }

      console.log('🔥 [Server] Successfully pushed 50 messages to RabbitMQ!');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Fired 50 messages successfully!' }));
    } catch (error: any) {
      console.error('❌ [Server Error] Failed to fire messages:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Action failed: ' + error.message }));
    }
  }

  // --- פעולה: איפוס מסד הנתונים ---
  else if (req.method === 'POST' && req.url === '/api/action/clear') {
    try {
      await prisma.event.deleteMany({});
      console.log('🗑️ [Server] Database cleared.');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Database cleared to 0 rows!' }));
    } catch (error: any) {
      console.error('❌ [Server Error] Failed to clear DB:', error.message);
      res.writeHead(500); res.end(JSON.stringify({ error: 'Action failed' }));
    }
  }
  
  else {
    res.writeHead(404); res.end('Not Found');
  }
});

const port = 3000;
server.listen(port, '0.0.0.0', () => {
  console.log(`Backend API Server running cleanly at port ${port}`);
});