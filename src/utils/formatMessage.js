function formatSaveConfirmation(merchantName, amount, dailyTotal) {
  const amountStr = amount.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const dailyStr = dailyTotal.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `✅ บันทึกแล้ว — ${merchantName} ฿${amountStr}\nวันนี้ใช้ไปรวม ฿${dailyStr}`;
}

function formatWeeklySummary(summary) {
  const { total, byCategory, count } = summary;
  const totalStr = total.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const categoryLines = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => {
      const pct = Math.round((amt / total) * 100);
      const amtStr = amt.toLocaleString('th-TH', { minimumFractionDigits: 0 });
      return `  • ${cat}: ฿${amtStr} (${pct}%)`;
    })
    .join('\n');

  return `📊 สรุปรายสัปดาห์\nรายการทั้งหมด ${count} รายการ\nรวม ฿${totalStr}\n\n${categoryLines}`;
}

function formatParseError() {
  return '❌ ไม่สามารถอ่านสลิปได้ กรุณาส่งรูปสลิปที่ชัดเจนอีกครั้ง';
}

module.exports = { formatSaveConfirmation, formatWeeklySummary, formatParseError };
