const lineService = require('../services/lineService');
const visionService = require('../services/visionService');
const geminiService = require('../services/geminiService');
const supabaseService = require('../services/supabaseService');
const { parseSlipText } = require('../utils/parseSlip');
const {
  formatSaveConfirmation,
  formatFullSummary,
  formatHistory,
  formatBudgetSet,
  formatBudgetAlert,
  formatWeeklySummary,
  formatParseError,
} = require('../utils/formatMessage');

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

  const rawText = await visionService.extractTextFromImage(imageBuffer);
  if (!rawText) {
    await lineService.replyText(replyToken, formatParseError());
    return;
  }

  const parsed = parseSlipText(rawText);
  if (parsed.amount == null || parsed.amount <= 0) {
    await lineService.replyText(replyToken, formatParseError());
    return;
  }

  const merchantName = parsed.merchantName || 'ไม่ระบุร้านค้า';
  const { category, merchantShortName } = await geminiService.categorizeTransaction(
    merchantName,
    parsed.amount,
    rawText
  );

  await supabaseService.saveTransaction(userId, {
    amount: parsed.amount,
    merchantShortName,
    category,
    rawText,
    slipDate: parsed.slipDate,
  });

  const dailyTotal = await supabaseService.getDailyTotal(userId);
  await lineService.replyText(replyToken, formatSaveConfirmation(merchantShortName, parsed.amount, dailyTotal));

  // Budget alert when usage hits 80%
  const budget = await supabaseService.getBudget(userId);
  if (budget) {
    const monthlyTotal = await supabaseService.getMonthlyTotal(userId);
    if (monthlyTotal / budget >= 0.8) {
      await lineService.pushText(userId, formatBudgetAlert(monthlyTotal, budget));
    }
  }
}

async function handleSummaryRequest(client, event) {
  const { replyToken, source } = event;
  const userId = source.userId;

  const [daily, weekly, monthly, budget] = await Promise.all([
    supabaseService.getDailyTotal(userId),
    supabaseService.getWeeklyTotal(userId),
    supabaseService.getMonthlyTotal(userId),
    supabaseService.getBudget(userId),
  ]);

  await lineService.replyText(replyToken, formatFullSummary(daily, weekly, monthly, budget));
}

async function handleHistoryRequest(client, event) {
  const { replyToken, source } = event;
  const userId = source.userId;

  const transactions = await supabaseService.getRecentTransactions(userId, 10);
  await lineService.replyText(replyToken, formatHistory(transactions));
}

async function handleBudgetRequest(client, event, amount) {
  const { replyToken, source } = event;
  const userId = source.userId;

  await supabaseService.setBudget(userId, amount);
  await lineService.replyText(replyToken, formatBudgetSet(amount));
}

async function handleWeeklySummary(client, event) {
  const { replyToken, source } = event;
  const userId = source.userId;

  const summary = await supabaseService.getWeeklySummary(userId);
  await lineService.replyText(replyToken, formatWeeklySummary(summary));
}

module.exports = { handleSlipImage, handleSummaryRequest, handleHistoryRequest, handleBudgetRequest, handleWeeklySummary };
