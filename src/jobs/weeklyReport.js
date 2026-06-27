const cron = require('node-cron');
const supabaseService = require('../services/supabaseService');
const lineService = require('../services/lineService');
const { flexWeeklySummary } = require('../utils/formatMessage');

// Every Sunday at 20:00 Thailand time (UTC+7 = 13:00 UTC)
cron.schedule('0 13 * * 0', async () => {
  console.log('[weeklyReport] Sending weekly summaries...');
  try {
    const [allUserIds, proUserIds] = await Promise.all([
      supabaseService.getAllUserIds(),
      supabaseService.getProUserIds(),
    ]);
    const proSet = new Set(proUserIds);
    const eligibleUserIds = allUserIds.filter((id) => proSet.has(id));

    await Promise.all(
      eligibleUserIds.map(async (userId) => {
        const summary = await supabaseService.getWeeklySummary(userId);
        if (summary.count === 0) return;
        await lineService.pushFlex(userId, 'สรุป 7 วันที่ผ่านมา', flexWeeklySummary(summary));
      })
    );
    console.log(`[weeklyReport] Sent to ${eligibleUserIds.length} pro users`);
  } catch (err) {
    console.error('[weeklyReport] Error:', err.message);
  }
});
