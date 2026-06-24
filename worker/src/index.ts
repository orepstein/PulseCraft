import * as dotenv from 'dotenv';
dotenv.config();

import amqp from 'amqplib';
import * as admin from 'firebase-admin';

// --- Firebase Initialization ---
// This code expects a FIREBASE_SERVICE_ACCOUNT_JSON environment variable
// containing the stringified service account key from Firebase.
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  throw new Error("FATAL: FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set.");
}
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
console.log("Successfully connected to Firebase/Firestore.");
// --------------------------------

// --- RabbitMQ Configuration ---
const QUEUE_NAME = 'events_queue';
const RABBITMQ_URL = process.env.RABBITMQ_URL;
// --------------------------------

async function startWorker() {
  if (!RABBITMQ_URL) {
    throw new Error("RABBITMQ_URL is not defined in environment variables.");
  }

  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log(`Worker is listening for messages on queue: "${QUEUE_NAME}"`);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (msg !== null) {
      const eventPayload = JSON.parse(msg.content.toString());
      console.log(`[i] Received event of type: ${eventPayload.event_type}`);

      try {
        // Save the entire event payload to the 'events' collection in Firestore
        const docRef = await db.collection('events').add(eventPayload);
        
        console.log(`[v] Event successfully saved to Firestore with document ID: ${docRef.id}`);
        
        // Acknowledge the message so RabbitMQ removes it from the queue
        channel.ack(msg);

      } catch (error) {
        console.error("[-] Error writing event to Firestore:", error);
        // In case of an error, we reject the message without requeueing it
        // to prevent an infinite loop of failures.
        channel.nack(msg, false, false);
      }
    }
  });
}

startWorker().catch(error => {
    console.error("Worker failed to start:", error);
    process.exit(1);
});