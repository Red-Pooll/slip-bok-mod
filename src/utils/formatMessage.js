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

function formatHistory(transactions) {
  if (!transactions.length) return '📋 ยังไม่มีรายการ';
  const lines = transactions.map((t, i) => {
    const date = new Date(t.slip_date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' });
    return `${i + 1}. ${date} ${t.merchant} ฿${fmt(t.amount)} [${t.category}]`;
  });
  return `📋 รายการล่าสุด 10 อัน\n\n${lines.join('\n')}`;
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

module.exports = {
  formatSaveConfirmation,
  formatFullSummary,
  formatHistory,
  formatBudgetSet,
  formatBudgetAlert,
  formatWeeklySummary,
  formatParseError,
};
