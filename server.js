const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const cron = require('node-cron');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '9090', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Function to send daily alerts
async function sendDailyAlerts() {
  try {
    const response = await fetch(`http://localhost:${port}/api/cron/daily-alerts`, {
      method: 'POST',
    });
    const result = await response.json();
    console.log('Daily alerts result:', result);
  } catch (error) {
    console.error('Failed to send daily alerts:', error);
  }
}

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);

    // Schedule daily alerts at 9:00 AM Korea time
    cron.schedule('0 9 * * *', async () => {
      console.log('Running daily alert job at', new Date().toISOString());
      await sendDailyAlerts();
    }, {
      timezone: 'Asia/Seoul',
    });

    console.log('> Scheduler started - Daily alerts will run at 9:00 AM KST');
  });
});
