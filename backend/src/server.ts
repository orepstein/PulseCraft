import express from 'express';
import cors from 'cors';
import amqp from 'amqplib';
import Redis from 'ioredis';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = 'events_queue';

const redis = new Redis(REDIS_URL);
let channel: amqp.Channel;

// חיבור ל-RabbitMQ
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log(`[Server] Connected to RabbitMQ. Queue: "${QUEUE_NAME}"`);
  } catch (error) {
    console.error('[Server] Failed to connect to RabbitMQ:', error);
  }
}

connectRabbitMQ();

// 1. קליטת אירועים ושליחה ל-RabbitMQ
app.post('/api/events', async (req, res) => {
  try {
    const eventData = req.body;
    
    if (!channel) {
      return res.status(500).json({ error: 'RabbitMQ channel not ready' });
    }

    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(eventData)), {
      persistent: true
    });

    res.status(200).json({ message: 'Event queued successfully', event: eventData });
  } catch (error) {
    console.error('[Server] Error queuing event:', error);
    res.status(500).json({ error: 'Failed to queue event' });
  }
});

// 2. שליפת מונים מ-Redis בזמן אמת עבור ה-Dashboard
app.get('/api/stats', async (req, res) => {
  try {
    const totalEvents = await redis.get('total_events_count') || '0';
    const eventTypes = await redis.hgetall('event_types_stats') || {};

    res.status(200).json({
      totalEvents: parseInt(totalEvents, 10),
      eventTypes: eventTypes
    });
  } catch (error) {
    console.error('[Server] Error fetching stats from Redis:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.listen(PORT, () => {
  console.log(`[Server] API is running on http://localhost:${PORT}`);
});