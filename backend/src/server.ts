import http from 'http';
import { PrismaClient } from '@prisma/client';
import amqp from 'amqplib';

const prisma = new PrismaClient();

// הגדרות התור - נלקחו ישירות מקובץ ההגדרות שלך
const QUEUE_NAME = 'events_queue';
const RABBITMQ_URL = "amqps://fqhtvebf:zmIU1ZA046Jr4WCoU4y--ldbl6bUIqwu@whale.rmq.cloudamqp.com/fqhtvebf";

let rabbitChannel: amqp.Channel | null = null;

// פונקציה לחיבור מתמיד ל-RabbitMQ כדי לבדוק סטטוס
async function setupRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    rabbitChannel = await connection.createChannel();
    await rabbitChannel.assertQueue(QUEUE_NAME, { durable: true });
    console.log(`[RabbitMQ] Connected successfully to queue: ${QUEUE_NAME}`);
  } catch (error) {
    console.error(`[RabbitMQ] Connection failed:`, error);
  }
}

// הפעלת החיבור מיד עם עליית השרת
setupRabbitMQ();

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API - מחזיר את הסטטוס האמיתי של כל המערכות
  if (req.method === 'GET' && req.url === '/api/metrics') {
    try {
      // 1. שליפת כמות רשומות מ-PostgreSQL
      const eventsCount = await prisma.event.count();
      
      // 2. שליפת סטטוס מ-RabbitMQ
      let messagesInQueue = 0;
      let activeConsumers = 0;
      let rabbitStatus = 'offline';

      if (rabbitChannel) {
        // בודק את מצב התור מבלי למשוך את ההודעות עצמן
        const queueStats = await rabbitChannel.checkQueue(QUEUE_NAME);
        messagesInQueue = queueStats.messageCount;
        activeConsumers = queueStats.consumerCount;
        rabbitStatus = 'online';
      }

      const metrics = {
        rabbitStatus: rabbitStatus,
        rabbitMetric: `${messagesInQueue} msgs waiting`,
        workerStatus: activeConsumers > 0 ? 'online' : 'processing',
        workerMetric: `${activeConsumers} active workers`,
        dbStatus: 'online',
        dbMetric: `Connected (${eventsCount} rows)`
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(metrics));
    } catch (error) {
      console.error('Error fetching metrics:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch metrics' }));
    }
  } 
  else if (req.method === 'POST' && req.url === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'event received' }));
  } 
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const port = 3000;
server.listen(port, '0.0.0.0', () => {
  console.log(`Backend API Server running at port ${port} with Prisma & RabbitMQ`);
});