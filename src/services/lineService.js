const { Client } = require('@line/bot-sdk');
const config = require('../config');

const client = new Client({
  channelAccessToken: config.line.channelAccessToken,
  channelSecret: config.line.channelSecret,
});

async function getImageBuffer(messageId) {
  const stream = await client.getMessageContent(messageId);
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function replyText(replyToken, text) {
  return client.replyMessage(replyToken, { type: 'text', text });
}

async function pushText(userId, text) {
  return client.pushMessage(userId, { type: 'text', text });
}

async function replyFlex(replyToken, altText, contents) {
  return client.replyMessage(replyToken, { type: 'flex', altText, contents });
}

async function pushFlex(userId, altText, contents) {
  return client.pushMessage(userId, { type: 'flex', altText, contents });
}

module.exports = { getImageBuffer, replyText, pushText, replyFlex, pushFlex };
