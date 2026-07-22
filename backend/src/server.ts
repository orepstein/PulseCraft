import http from 'http';

let totalProcessed = 0;

const server = http.createServer((req, res) => {
  // הגדרות חובה: CORS (בלעדיהן הדפדפן יחסום את הנתונים בענן)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API חדש: מחזיר נתונים משתנים בזמן אמת לגרף
  if (req.method === 'GET' && req.url === '/api/metrics') {
    const currentSpeed = Math.floor(Math.random() * 40) + 10; // מייצר קצב בין 10 ל-50 הודעות
    totalProcessed += currentSpeed;

    const metrics = {
      rabbitStatus: 'online',
      rabbitMetric: 'Connected (Ready)',
      workerStatus: 'processing',
      workerMetric: `${currentSpeed} msgs / sec`,
      dbStatus: 'online',
      dbMetric: `Connected (${totalProcessed} rows)`
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(metrics));
  } 
  // API קיים לאירועים נכנסים
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
// האזנה ל-0.0.0.0 חיונית כדי שסביבת הענן (Vite Proxy) תוכל לגשת לשרת
server.listen(port, '0.0.0.0', () => {
  console.log(`Backend API Server running at port ${port}`);
});