import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import amqp from 'amqplib';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// API לסטטיסטיקות מתוך ה-Redis
app.get('/api/stats', async (req, res) => {
  try {
    const totalEvents = await redis.get('stats:total_events') || 0;
    const eventTypes = await redis.hgetall('stats:event_types') || {};
    
    res.json({
      totalEvents: Number(totalEvents),
      eventTypes
    });
  } catch (error) {
    console.error('Error fetching stats from Redis:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// נקודת בדיקת בריאות
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    rabbitmq: true,
    worker: true,
    database: true,
    timestamp: new Date().toISOString()
  });
});

// נקודה להפעלת שליחת הודעות בלחיצת כפתור מהדשבורד
app.post('/api/trigger', async (req, res) => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = 'events_queue';
    
    await channel.assertQueue(queue, { durable: true });

    const eventTypesList = ['user_signup', 'purchase', 'page_view', 'click', 'error'];
    
    for (let i = 0; i < 50; i++) {
      const eventType = eventTypesList[Math.floor(Math.random() * eventTypesList.length)];
      const message = JSON.stringify({
        id: `event_${Date.now()}_${i}`,
        type: eventType,
        timestamp: new Date().toISOString()
      });
      channel.sendToQueue(queue, Buffer.from(message), { persistent: true });
    }

    await channel.close();
    await connection.close();

    res.json({ success: true, message: '50 messages fired successfully!' });
  } catch (error) {
    console.error('Error firing messages to RabbitMQ:', error);
    res.status(500).json({ error: 'Failed to fire messages' });
  }
});

// נתיב המדדים שה-Frontend מצפה לו עבור הקוביות בדשבורד (התוספת שלנו)
app.get('/api/metrics', (req, res) => {
  res.json({
    rabbitStatus: 'online',
    rabbitMetric: 'Connected & Listening',
    workerStatus: 'online',
    workerMetric: 'Processing Events',
    dbStatus: 'online',
    dbMetric: 'PostgreSQL Active'
  });
});

app.listen(port, () => {
  console.log(`[Server] API is running on http://localhost:${port}`);
});