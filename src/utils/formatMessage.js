const fmt = (n) => Number(n).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function formatSaveConfirmation(merchantName, amount, dailyTotal) {
  return `✅ บันทึกแล้ว — ${merchantName} ฿${fmt(amount)}\nวันนี้ใช้ไปรวม ฿${fmt(dailyTotal)}`;
}

function formatFullSummary(daily, weekly, monthly, budget) {
  let text = `📊 สรุปค่าใช้จ่าย\n\nวันนี้: ฿${fmt(daily)}\nอาทิตย์นี้: ฿${fmt(weekly)}\nเดือนนี้: ฿${fmt(monthly)}`;
  if (budget) {
    const pct = Math.round((monthly / budget) * 100);
    text += `\n\n💰 งบเดือนนี้: ฿${fmt(budget)}\nใช้ไปแล้ว ${pct}% · คงเหลือ ฿${fmt(budget - monthly)}`;
  }
  return text;
}

function formatHistory(transactions, limited = false) {
  if (!transactions.length) {
    return limited
      ? '📋 ไม่มีรายการใน 7 วันที่ผ่านมา\n\n🔒 ดูประวัติทั้งหมด → Pro ฿99/เดือน'
      : '📋 ยังไม่มีรายการ';
  }
  const lines = transactions.map((t, i) => {
    const date = new Date(t.slip_date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' });
    return `${i + 1}. ${date} ${t.merchant} ฿${fmt(t.amount)} [${t.category}]`;
  });
  const header = limited ? '📋 รายการ 7 วันที่ผ่านมา' : '📋 รายการล่าสุด 10 อัน';
  const footer = limited ? '\n\n🔒 ดูประวัติทั้งหมด → Pro ฿99/เดือน' : '';
  return `${header}\n\n${lines.join('\n')}${footer}`;
}

function formatBudgetSet(amount) {
  return `✅ ตั้งงบเดือนนี้ ฿${fmt(amount)} เรียบร้อยแล้ว`;
}

function formatBudgetAlert(used, budget) {
  const pct = Math.round((used / budget) * 100);
  return `⚠️ ใช้เงินไปแล้ว ${pct}% ของงบเดือนนี้\nใช้ไป ฿${fmt(used)} / งบ ฿${fmt(budget)}\nคงเหลือ ฿${fmt(budget - used)}`;
}

function formatWeeklySummary(summary) {
  const { total, byCategory, count } = summary;
  const categoryLines = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => {
      const pct = Math.round((amt / total) * 100);
      return `  • ${cat}: ฿${fmt(amt)} (${pct}%)`;
    })
    .join('\n');

  return `📊 สรุปรายสัปดาห์\nรายการทั้งหมด ${count} รายการ\nรวม ฿${fmt(total)}\n\n${categoryLines}`;
}

function formatParseError() {
  return '❌ ไม่สามารถอ่านสลิปได้ กรุณาส่งรูปสลิปที่ชัดเจนอีกครั้ง';
}

function formatSlipLimitReached() {
  return 'คุณใช้ครบ 20 สลิปฟรีแล้วเดือนนี้ 🙏\nอัปเกรด Pro เพียง ฿99/เดือน เพื่อใช้ไม่จำกัด 🚀';
}

function formatProOnly() {
  return '🔒 ฟีเจอร์นี้สำหรับ Pro เท่านั้น\nอัปเกรดเพียง ฿99/เดือน';
}

function formatPlanStatus({ plan, slipCount, slipLimit, proExpiresAt }) {
  if (plan === 'pro') {
    const expiry = proExpiresAt
      ? new Date(proExpiresAt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : 'ไม่มีกำหนด';
    return `⭐ แพลนปัจจุบัน: Pro\nใช้ได้ไม่จำกัด หมดอายุ ${expiry}`;
  }
  const remaining = Math.max(0, slipLimit - slipCount);
  return `📋 แพลนปัจจุบัน: Free\nเดือนนี้ใช้ไป ${slipCount}/${slipLimit} สลิป\nเหลืออีก ${remaining} ใบ`;
}

module.exports = {
  formatSaveConfirmation,
  formatFullSummary,
  formatHistory,
  formatBudgetSet,
  formatBudgetAlert,
  formatWeeklySummary,
  formatParseError,
  formatSlipLimitReached,
  formatProOnly,
  formatPlanStatus,
};
