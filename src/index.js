const express = require('express');
const config = require('./config');
const webhookRouter = require('./routes/webhook');
const healthRouter = require('./routes/health');
require('./jobs/weeklyReport');

const app = express();

app.use('/webhook', express.raw({ type: 'application/json' }), webhookRouter);
app.use('/health', express.json(), healthRouter);

app.listen(config.port, () => {
  console.log(`สลิปบอกหมด running on port ${config.port}`);
});
