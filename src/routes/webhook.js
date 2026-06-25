const express = require('express');
const { middleware, Client } = require('@line/bot-sdk');
const config = require('../config');
const slipHandler = require('../handlers/slipHandler');

const router = express.Router();

const lineConfig = {
  channelAccessToken: config.line.channelAccessToken,
  channelSecret: config.line.channelSecret,
};

const client = new Client(lineConfig);

router.post('/', middleware(lineConfig), async (req, res) => {
  res.sendStatus(200);

  const events = req.body?.events;
  if (!events || events.length === 0) return;
  await Promise.all(events.map((event) => handleEvent(client, event)));
});

async function handleEvent(client, event) {
  if (event.type !== 'message') return;

  if (event.message.type === 'image') {
    await slipHandler.handleSlipImage(client, event);
    return;
  }

  if (event.message.type === 'text') {
    const text = event.message.text.trim();

    if (text === 'สรุป' || text === 'summary') {
      await slipHandler.handleSummaryRequest(client, event);
      return;
    }

    if (text === 'ประวัติ' || text === 'history') {
      await slipHandler.handleHistoryRequest(client, event);
      return;
    }

    const budgetMatch = text.match(/^งบ\s*(\d+(?:\.\d+)?)$/);
    if (budgetMatch) {
      await slipHandler.handleBudgetRequest(client, event, parseFloat(budgetMatch[1]));
      return;
    }
  }
}

module.exports = router;
