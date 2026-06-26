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

// ── Flex Message builders ─────────────────────────────────────────────────────

const DARK_BG = '#1a1a2e';
const MINT    = '#7dd4b4';
const MUTED   = '#888888';
const LIGHT   = '#cccccc';
const SEP     = '#2a2a4a';
const DANGER  = '#ff6b6b';

const CAT_EMOJI = {
  'อาหาร': '🍜', 'เครื่องดื่ม': '☕', 'การเดินทาง': '🚗',
  'ช้อปปิ้ง': '🛍️', 'ความบันเทิง': '🎮', 'สุขภาพ': '💊',
  'บิล': '💡', 'สาธารณูปโภค': '💡', 'อื่นๆ': '📦',
};

function catEmoji(cat) {
  for (const [k, v] of Object.entries(CAT_EMOJI)) {
    if (cat.includes(k)) return v;
  }
  return '📦';
}

function progressBar(pct, color = MINT, margin) {
  const fill  = Math.min(100, Math.max(0, Math.round(pct)));
  const empty = 100 - fill;
  const contents = [];
  if (fill  > 0) contents.push({ type: 'box', layout: 'vertical', flex: fill,  backgroundColor: color, cornerRadius: '3px', contents: [] });
  if (empty > 0) contents.push({ type: 'box', layout: 'vertical', flex: empty, contents: [] });
  if (!contents.length) contents.push({ type: 'box', layout: 'vertical', flex: 1, contents: [] });
  const bar = { type: 'box', layout: 'horizontal', height: '6px', cornerRadius: '3px', backgroundColor: SEP, contents };
  if (margin) bar.margin = margin;
  return bar;
}

function bubble(headerContents, bodyContents, footerContents) {
  const obj = {
    type: 'bubble',
    styles: {
      header: { backgroundColor: DARK_BG },
      body:   { backgroundColor: DARK_BG },
      footer: { backgroundColor: DARK_BG },
    },
    header: { type: 'box', layout: 'vertical', paddingBottom: 'sm',  contents: headerContents },
    body:   { type: 'box', layout: 'vertical', paddingTop:    'sm',  contents: bodyContents },
  };
  if (footerContents) obj.footer = { type: 'box', layout: 'vertical', paddingTop: 'none', contents: footerContents };
  return obj;
}

function hrow(label, value, valueColor = LIGHT) {
  return {
    type: 'box', layout: 'horizontal',
    contents: [
      { type: 'text', text: label, color: MUTED,       size: 'sm', flex: 1 },
      { type: 'text', text: value, color: valueColor,  size: 'sm', align: 'end' },
    ],
  };
}

function sep(margin = 'md') {
  return { type: 'separator', margin, color: SEP };
}

// 1. Save confirmation
function flexSaveConfirmation(merchantName, amount, category, dailyTotal, budget, monthlyTotal) {
  const body = [
    { type: 'text', text: merchantName, color: '#ffffff', size: 'xl', weight: 'bold', wrap: true },
    { type: 'text', text: category,     color: MUTED,    size: 'sm', margin: 'xs' },
    { type: 'text', text: `฿${fmt(amount)}`, color: MINT, size: 'xxl', weight: 'bold', margin: 'md' },
    sep(),
    { ...hrow('วันนี้ใช้ไปรวม', `฿${fmt(dailyTotal)}`), margin: 'md' },
  ];

  if (budget && monthlyTotal != null) {
    const pct      = Math.round((monthlyTotal / budget) * 100);
    const barColor = pct >= 80 ? DANGER : MINT;
    body.push(
      sep(),
      { ...hrow(`งบเดือนนี้ ฿${fmt(budget)}`, `${pct}%`, barColor), margin: 'md' },
      progressBar(pct, barColor, 'xs'),
      { type: 'text', text: `เหลือ ฿${fmt(Math.max(0, budget - monthlyTotal))}`, color: '#555555', size: 'xs', margin: 'xs', align: 'end' }
    );
  }

  return bubble(
    [{ type: 'text', text: '✅ บันทึกแล้ว', color: MINT, weight: 'bold', size: 'md' }],
    body, null
  );
}

// 2. Full summary
function flexFullSummary(daily, weekly, monthly, budget, byCategory) {
  const body = [
    hrow('วันนี้',      `฿${fmt(daily)}`),
    { ...hrow('อาทิตย์นี้', `฿${fmt(weekly)}`), margin: 'sm' },
  ];

  const catEntries = Object.entries(byCategory).sort(([, a], [, b]) => b - a);
  if (catEntries.length) {
    body.push(sep(), { type: 'text', text: 'หมวดหมู่เดือนนี้', color: MUTED, size: 'xs', margin: 'md' });
    catEntries.forEach(([cat, amt]) => {
      body.push({
        type: 'box', layout: 'horizontal', margin: 'sm',
        contents: [
          { type: 'text', text: `${catEmoji(cat)} ${cat}`, color: LIGHT, size: 'sm', flex: 3 },
          { type: 'text', text: `฿${fmt(amt)}`,            color: MINT,  size: 'sm', align: 'end', flex: 2 },
        ],
      });
    });
  }

  if (budget) {
    const pct      = Math.round((monthly / budget) * 100);
    const barColor = pct >= 80 ? DANGER : MINT;
    body.push(
      sep(),
      { ...hrow(`งบเดือนนี้ ฿${fmt(budget)}`, `${pct}%`, barColor), margin: 'md' },
      progressBar(pct, barColor, 'xs')
    );
  }

  return bubble(
    [{ type: 'text', text: '📊 สรุปการใช้จ่าย', color: MINT, weight: 'bold', size: 'md' }],
    body,
    [
      { type: 'box', layout: 'horizontal', contents: [
        { type: 'text', text: 'รวมเดือนนี้', color: MUTED, size: 'sm', flex: 1 },
        { type: 'text', text: `฿${fmt(monthly)}`, color: MINT, weight: 'bold', size: 'lg', align: 'end' },
      ]},
    ]
  );
}

// 3. Plan status
function flexPlanStatus({ plan, slipCount, slipLimit, proExpiresAt }) {
  const isPro = plan === 'pro';

  const body = isPro ? [
    { type: 'text', text: 'ส่งสลิปได้ไม่จำกัด', color: MINT, size: 'sm' },
    { type: 'text', text: '✓ ตั้งงบประมาณ + แจ้งเตือน',     color: LIGHT,  size: 'sm', margin: 'sm' },
    { type: 'text', text: '✓ ดูประวัติทั้งหมด',              color: LIGHT,  size: 'sm', margin: 'xs' },
    { type: 'text', text: '✓ รายงานรายสัปดาห์อัตโนมัติ',    color: LIGHT,  size: 'sm', margin: 'xs' },
    { type: 'text', text: '✓ Export CSV',                    color: LIGHT,  size: 'sm', margin: 'xs' },
    sep(),
    {
      type: 'text',
      text: proExpiresAt
        ? `หมดอายุ ${new Date(proExpiresAt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
        : 'ไม่มีวันหมดอายุ',
      color: MUTED, size: 'xs', margin: 'md',
    },
  ] : [
    {
      type: 'box', layout: 'horizontal',
      contents: [
        { type: 'text', text: 'สลิปเดือนนี้', color: MUTED,  size: 'sm', flex: 1 },
        { type: 'text', text: `${slipCount}/${slipLimit} ใบ`, color: LIGHT, size: 'sm', align: 'end' },
      ],
    },
    progressBar((slipCount / slipLimit) * 100, slipCount >= slipLimit ? DANGER : MINT, 'sm'),
    { type: 'text', text: `เหลืออีก ${Math.max(0, slipLimit - slipCount)} ใบ`, color: '#555555', size: 'xs', margin: 'xs', align: 'end' },
    sep(),
    { type: 'text', text: '✗ ตั้งงบประมาณ',               color: '#555555', size: 'sm', margin: 'md' },
    { type: 'text', text: '✗ ดูประวัติเกิน 7 วัน',        color: '#555555', size: 'sm', margin: 'xs' },
    { type: 'text', text: '✗ รายงานรายสัปดาห์อัตโนมัติ', color: '#555555', size: 'sm', margin: 'xs' },
  ];

  const footer = !isPro ? [
    {
      type: 'button',
      action: { type: 'message', label: 'อัปเกรด Pro ฿99/เดือน', text: 'อัปเกรด' },
      color: MINT, style: 'primary', height: 'sm',
    },
  ] : null;

  return bubble(
    [
      { type: 'text', text: isPro ? '⭐ PRO' : '📋 FREE', color: isPro ? '#f4c430' : MINT, weight: 'bold', size: 'lg' },
      { type: 'text', text: 'แพลนปัจจุบันของคุณ', color: MUTED, size: 'xs', margin: 'xs' },
    ],
    body, footer
  );
}

// 4. Budget set
function flexBudgetSet(amount, monthlyTotal) {
  const pct      = Math.min(100, Math.round((monthlyTotal / amount) * 100));
  const barColor = pct >= 80 ? DANGER : MINT;
  const remaining = Math.max(0, amount - monthlyTotal);

  return bubble(
    [{ type: 'text', text: '💰 ตั้งงบสำเร็จ', color: MINT, weight: 'bold', size: 'md' }],
    [
      { type: 'text', text: `฿${fmt(amount)}`, color: '#ffffff', size: 'xxl', weight: 'bold' },
      { type: 'text', text: 'งบประมาณต่อเดือน', color: MUTED, size: 'xs', margin: 'xs' },
      sep(),
      { ...hrow('ใช้ไปแล้ว', `฿${fmt(monthlyTotal)}`),          margin: 'md' },
      { ...hrow('คงเหลือ',   `฿${fmt(remaining)}`, MINT),       margin: 'sm' },
      { ...hrow('ใช้ไปแล้ว', `${pct}%`, barColor),              margin: 'md' },
      progressBar(pct, barColor, 'xs'),
    ],
    null
  );
}

// ─────────────────────────────────────────────────────────────────────────────

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
  flexSaveConfirmation,
  flexFullSummary,
  flexPlanStatus,
  flexBudgetSet,
};
