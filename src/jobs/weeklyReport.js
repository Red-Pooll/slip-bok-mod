const cron = require('node-cron');
const supabaseService = require('../services/supabaseService');
const lineService = require('../services/lineService');
const { formatWeeklySummary } = require('../utils/formatMessage');

// Every Sunday at 20:00 Thailand time (UTC+7 = 13:00 UTC)
cron.schedule('0 13 * * 0', async () => {
  console.log('[weeklyReport] Sending weekly summaries...');
  try {
    const userIds = await supabaseService.getAllUserIds();
    await Promise.all(
      userIds.map(async (userId) => {
        const summary = await supabaseService.getWeeklySummary(userId);
        if (summary.count === 0) return;
        await lineService.pushText(userId, formatWeeklySummary(summary));
      })
    );
    console.log(`[weeklyReport] Sent to ${userIds.length} users`);
  } catch (err) {
    console.error('[weeklyReport] Error:', err.message);
  }
});
