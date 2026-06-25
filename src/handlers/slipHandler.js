const lineService = require('../services/lineService');
const visionService = require('../services/visionService');
const geminiService = require('../services/geminiService');
const supabaseService = require('../services/supabaseService');
const { formatSaveConfirmation, formatWeeklySummary, formatParseError } = require('../utils/formatMessage');

async function handleSlipImage(client, event) {
  const { replyToken, source, message } = event;
  const userId = source.userId;

  let imageBuffer;
  try {
    imageBuffer = await lineService.getImageBuffer(message.id);
  } catch {
    await lineService.replyText(replyToken, '❌ ไม่สามารถดาวน์โหลดรูปภาพได้');
    return;
  }

  const parsed = await visionService.extractTextFromImage(imageBuffer);
  if (!parsed || !parsed.amount) {
    await lineService.replyText(replyToken, formatParseError());
    return;
  }

  const recipientName = parsed.recipient || 'ไม่ระบุผู้รับ';
  const { category, merchantShortName } = await geminiService.categorizeTransaction(
    recipientName,
    parsed.amount,
    parsed.recipient || ''
  );

  await supabaseService.saveTransaction(userId, {
    amount: parsed.amount,
    merchantShortName,
    category,
    rawText: parsed.recipient || '',
    slipDate: parsed.date ? new Date(parsed.date).toISOString() : new Date().toISOString(),
  });

  const dailyTotal = await supabaseService.getDailyTotal(userId);
  await lineService.replyText(replyToken, formatSaveConfirmation(merchantShortName, parsed.amount, dailyTotal));
}

async function handleSummaryRequest(client, event) {
  const { replyToken, source } = event;
  const userId = source.userId;

  const summary = await supabaseService.getWeeklySummary(userId);
  await lineService.replyText(replyToken, formatWeeklySummary(summary));
}

module.exports = { handleSlipImage, handleSummaryRequest };
