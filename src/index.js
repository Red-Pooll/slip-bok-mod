const express = require('express');
const config = require('./config');
const webhookRouter = require('./routes/webhook');
const healthRouter = require('./routes/health');
require('./jobs/weeklyReport');

const app = express();

app.use('/webhook', webhookRouter);
app.use('/health', express.json(), healthRouter);

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`[startup] สลิปบอกหมด running on port ${PORT}`);
  console.log(`[startup] NODE_ENV=${config.nodeEnv}`);
});
