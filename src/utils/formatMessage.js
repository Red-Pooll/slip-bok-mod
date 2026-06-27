const fmt = (n) => Number(n).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG      = '#0d1412';
const MINT    = '#7dd4b4';
const WHITE   = '#ffffff';
const MUTED   = '#888888';
const SUBTLE  = '#cccccc';
const SEP_COL = '#1a2822';
const DANGER  = '#ff6b6b';
const LOCKED  = '#2e3e3a';
const LOGO    = 'https://slip-bok-mod-production.up.railway.app/logo.png';

// ── Primitives ─────────────────────────────────────────────────────────────────

function heroImage() {
  return {
    type: 'image',
    url: LOGO,
    size: 'xs',
    aspectRatio: '20:3',
    aspectMode: 'cover',
  };
}

function sep(margin = 'lg') {
  return { type: 'separator', margin, color: SEP_COL };
}

function hrow(label, value, valueColor = MUTED) {
  return {
    type: 'box', layout: 'horizontal',
    contents: [
      { type: 'text', text: label, color: MUTED,      size: 'sm', flex: 1 },
      { type: 'text', text: value, color: valueColor, size: 'sm', align: 'end' },
    ],
  };
}

function progressBar(pct, color = MINT, margin = 'sm') {
  const fill  = Math.min(100, Math.max(0, Math.round(pct)));
  const empty = 100 - fill;
  const contents = [];
  if (fill  > 0) contents.push({ type: 'box', layout: 'vertical', flex: fill,  backgroundColor: color,   cornerRadius: '4px', contents: [] });
  if (empty > 0) contents.push({ type: 'box', layout: 'vertical', flex: empty, backgroundColor: SEP_COL, cornerRadius: '4px', contents: [] });
  if (!contents.length) contents.push({ type: 'box', layout: 'vertical', flex: 1, backgroundColor: SEP_COL, cornerRadius: '4px', contents: [] });
  return { type: 'box', layout: 'horizontal', height: '4px', cornerRadius: '4px', margin, contents };
}

function bubble({ headerContents, bodyContents, footerContents } = {}) {
  const obj = {
    type: 'bubble',
    hero: heroImage(),
    styles: {
      hero:   { backgroundColor: BG },
      header: { backgroundColor: BG },
      body:   { backgroundColor: BG },
      footer: { backgroundColor: BG },
    },
    header: {
      type: 'box', layout: 'vertical',
      paddingAll: 'xl', paddingBottom: 'sm',
      contents: headerContents,
    },
    body: {
      type: 'box', layout: 'vertical',
      paddingAll: 'xl', paddingTop: 'md',
      contents: bodyContents,
    },
  };
  if (footerContents) {
    obj.footer = {
      type: 'box', layout: 'vertical',
      paddingAll: 'xl', paddingTop: 'md',
      contents: footerContents,
    };
  }
  return obj;
}

// ── Plain-text formatters ──────────────────────────────────────────────────────

function formatSaveConfirmation(merchantName, amount, dailyTotal) {
  return `บันทึกแล้ว — ${merchantName} ฿${fmt(amount)}\nวันนี้ใช้ไปรวม ฿${fmt(dailyTotal)}`;
}

function formatFullSummary(daily, weekly, monthly, budget) {
  let text = `สรุปค่าใช้จ่าย\n\nวันนี้: ฿${fmt(daily)}\nอาทิตย์นี้: ฿${fmt(weekly)}\nเดือนนี้: ฿${fmt(monthly)}`;
  if (budget) {
    const pct = Math.round((monthly / budget) * 100);
    text += `\n\nงบเดือนนี้: ฿${fmt(budget)}\nใช้ไปแล้ว ${pct}% · คงเหลือ ฿${fmt(budget - monthly)}`;
  }
  return text;
}

function formatHistory(transactions, limited = false) {
  if (!transactions.length) {
    return limited
      ? 'ไม่มีรายการใน 7 วันที่ผ่านมา\n\nดูประวัติทั้งหมด → Pro ฿99/เดือน'
      : 'ยังไม่มีรายการ';
  }
  const lines = transactions.map((t, i) => {
    const date = new Date(t.slip_date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' });
    return `${i + 1}. ${date} ${t.merchant} ฿${fmt(t.amount)} [${t.category}]`;
  });
  const header = limited ? 'รายการ 7 วันที่ผ่านมา' : 'รายการล่าสุด 10 อัน';
  const footer = limited ? '\n\nดูประวัติทั้งหมด → Pro ฿99/เดือน' : '';
  return `${header}\n\n${lines.join('\n')}${footer}`;
}

function formatBudgetSet(amount) {
  return `ตั้งงบเดือนนี้ ฿${fmt(amount)} เรียบร้อยแล้ว`;
}

function formatBudgetAlert(used, budget) {
  const pct = Math.round((used / budget) * 100);
  return `ใช้เงินไปแล้ว ${pct}% ของงบเดือนนี้\nใช้ไป ฿${fmt(used)} / งบ ฿${fmt(budget)}\nคงเหลือ ฿${fmt(budget - used)}`;
}

function formatWeeklySummary(summary) {
  const { total, byCategory, count } = summary;
  const categoryLines = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => {
      const pct = Math.round((amt / total) * 100);
      return `  · ${cat}: ฿${fmt(amt)} (${pct}%)`;
    })
    .join('\n');
  return `สรุปรายสัปดาห์\nรายการทั้งหมด ${count} รายการ\nรวม ฿${fmt(total)}\n\n${categoryLines}`;
}

function formatParseError() {
  return 'ไม่สามารถอ่านสลิปได้ กรุณาส่งรูปสลิปที่ชัดเจนอีกครั้ง';
}

function formatSlipLimitReached() {
  return 'คุณใช้ครบ 20 สลิปฟรีแล้วเดือนนี้\nอัปเกรด Pro เพียง ฿99/เดือน เพื่อใช้ไม่จำกัด';
}

function formatProOnly() {
  return 'ฟีเจอร์นี้สำหรับ Pro เท่านั้น\nอัปเกรดเพียง ฿99/เดือน';
}

function formatPlanStatus({ plan, slipCount, slipLimit, proExpiresAt }) {
  if (plan === 'pro') {
    const expiry = proExpiresAt
      ? new Date(proExpiresAt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : 'ไม่มีกำหนด';
    return `แพลนปัจจุบัน: Pro\nใช้ได้ไม่จำกัด หมดอายุ ${expiry}`;
  }
  const remaining = Math.max(0, slipLimit - slipCount);
  return `แพลนปัจจุบัน: Free\nเดือนนี้ใช้ไป ${slipCount}/${slipLimit} สลิป\nเหลืออีก ${remaining} ใบ`;
}

// ── Flex Message builders ──────────────────────────────────────────────────────

// 1. Save confirmation
function flexSaveConfirmation(merchantName, amount, category, dailyTotal, budget, monthlyTotal) {
  const body = [
    { type: 'text', text: `฿${fmt(amount)}`, color: MINT, size: 'xxl', weight: 'bold' },
    sep(),
    { ...hrow('วันนี้', `฿${fmt(dailyTotal)}`), margin: 'lg' },
  ];

  if (budget && monthlyTotal != null) {
    const pct       = Math.min(100, Math.round((monthlyTotal / budget) * 100));
    const barColor  = pct >= 80 ? DANGER : MINT;
    const remaining = Math.max(0, budget - monthlyTotal);
    body.push(
      sep(),
      { ...hrow('งบเดือนนี้', `${pct}%`, pct >= 80 ? DANGER : MUTED), margin: 'lg' },
      progressBar(pct, barColor),
      {
        type: 'text',
        text: `เหลือ ฿${fmt(remaining)}`,
        color: pct >= 80 ? DANGER : MINT,
        size: 'sm', margin: 'sm', align: 'end',
      }
    );
  }

  return bubble({
    headerContents: [
      { type: 'text', text: merchantName, color: WHITE, size: 'lg', weight: 'bold', wrap: true },
      { type: 'text', text: category,     color: MUTED, size: 'sm', margin: 'xs' },
    ],
    bodyContents: body,
  });
}

// 2. Full monthly summary (triggered by "สรุป")
function flexFullSummary(daily, weekly, monthly, budget, byCategory) {
  const body = [];

  const catEntries = Object.entries(byCategory).sort(([, a], [, b]) => b - a);
  catEntries.forEach(([cat, amt], i) => {
    body.push({
      type: 'box', layout: 'horizontal',
      margin: i === 0 ? 'none' : 'md',
      contents: [
        { type: 'text', text: cat,            color: SUBTLE, size: 'sm', flex: 3 },
        { type: 'text', text: `฿${fmt(amt)}`, color: MUTED,  size: 'sm', align: 'end', flex: 2 },
      ],
    });
  });

  if (catEntries.length) body.push(sep());

  body.push(
    { ...hrow('วันนี้',     `฿${fmt(daily)}`),  margin: 'lg' },
    { ...hrow('สัปดาห์นี้', `฿${fmt(weekly)}`), margin: 'md' },
  );

  if (budget) {
    const pct      = Math.min(100, Math.round((monthly / budget) * 100));
    const barColor = pct >= 80 ? DANGER : MINT;
    body.push(
      sep(),
      { ...hrow('งบเดือนนี้', `${pct}%`, pct >= 80 ? DANGER : MUTED), margin: 'lg' },
      progressBar(pct, barColor),
    );
  }

  return bubble({
    headerContents: [
      { type: 'text', text: 'สรุปการใช้จ่าย', color: WHITE, size: 'lg', weight: 'bold' },
      { type: 'text', text: 'เดือนนี้',        color: MUTED, size: 'sm', margin: 'xs' },
    ],
    bodyContents: body,
    footerContents: [
      {
        type: 'box', layout: 'horizontal',
        contents: [
          { type: 'text', text: 'รวมเดือนนี้',      color: MUTED, size: 'sm',  flex: 1 },
          { type: 'text', text: `฿${fmt(monthly)}`, color: MINT,  size: 'lg',  weight: 'bold', align: 'end' },
        ],
      },
    ],
  });
}

// 3. Weekly summary (used by cron job push)
function flexWeeklySummary({ total, byCategory, count }) {
  const body = [];

  const catEntries = Object.entries(byCategory).sort(([, a], [, b]) => b - a);
  catEntries.forEach(([cat, amt], i) => {
    body.push({
      type: 'box', layout: 'horizontal',
      margin: i === 0 ? 'none' : 'md',
      contents: [
        { type: 'text', text: cat,            color: SUBTLE, size: 'sm', flex: 3 },
        { type: 'text', text: `฿${fmt(amt)}`, color: MUTED,  size: 'sm', align: 'end', flex: 2 },
      ],
    });
  });

  if (catEntries.length) body.push(sep());

  body.push({
    type: 'text',
    text: `${count} รายการ`,
    color: MUTED, size: 'xs', margin: 'lg', align: 'end',
  });

  return bubble({
    headerContents: [
      { type: 'text', text: 'สรุป 7 วันที่ผ่านมา', color: WHITE, size: 'lg', weight: 'bold' },
      { type: 'text', text: 'รายสัปดาห์',           color: MUTED, size: 'sm', margin: 'xs' },
    ],
    bodyContents: body,
    footerContents: [
      {
        type: 'box', layout: 'horizontal',
        contents: [
          { type: 'text', text: 'รวมทั้งสิ้น',       color: MUTED, size: 'sm',  flex: 1 },
          { type: 'text', text: `฿${fmt(total)}`,   color: MINT,  size: 'lg',  weight: 'bold', align: 'end' },
        ],
      },
    ],
  });
}

// 4. Plan status
function flexPlanStatus({ plan, slipCount, slipLimit, proExpiresAt }) {
  const isPro = plan === 'pro';

  const body = isPro ? [
    { type: 'text', text: 'ส่งสลิปได้ไม่จำกัด', color: MINT, size: 'sm' },
    sep(),
    { type: 'text', text: 'ตั้งงบประมาณและแจ้งเตือน',  color: SUBTLE, size: 'sm', margin: 'lg' },
    { type: 'text', text: 'ดูประวัติทั้งหมด',          color: SUBTLE, size: 'sm', margin: 'sm' },
    { type: 'text', text: 'รายงานรายสัปดาห์อัตโนมัติ', color: SUBTLE, size: 'sm', margin: 'sm' },
    { type: 'text', text: 'Export CSV',                color: SUBTLE, size: 'sm', margin: 'sm' },
    sep(),
    {
      type: 'text',
      text: proExpiresAt
        ? `หมดอายุ ${new Date(proExpiresAt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
        : 'ไม่มีวันหมดอายุ',
      color: MUTED, size: 'xs', margin: 'lg',
    },
  ] : [
    {
      type: 'box', layout: 'horizontal',
      contents: [
        { type: 'text', text: 'สลิปเดือนนี้', color: MUTED, size: 'sm', flex: 1 },
        { type: 'text', text: `${slipCount} / ${slipLimit}`, color: WHITE, size: 'sm', align: 'end' },
      ],
    },
    progressBar((slipCount / slipLimit) * 100, slipCount >= slipLimit ? DANGER : MINT),
    { type: 'text', text: `เหลือ ${Math.max(0, slipLimit - slipCount)} ใบ`, color: MUTED, size: 'xs', margin: 'xs', align: 'end' },
    sep(),
    { type: 'text', text: 'ตั้งงบประมาณ',         color: LOCKED, size: 'sm', margin: 'lg' },
    { type: 'text', text: 'ดูประวัติเกิน 7 วัน',  color: LOCKED, size: 'sm', margin: 'sm' },
    { type: 'text', text: 'รายงานรายสัปดาห์',     color: LOCKED, size: 'sm', margin: 'sm' },
  ];

  const footer = !isPro ? [
    {
      type: 'button',
      action: { type: 'message', label: 'อัปเกรดเป็น Pro', text: 'อัปเกรด' },
      color: MINT, style: 'primary', height: 'sm',
    },
  ] : null;

  return bubble({
    headerContents: [
      { type: 'text', text: isPro ? 'Pro' : 'Free', color: isPro ? MINT : WHITE, size: 'xl', weight: 'bold' },
      { type: 'text', text: 'แพลนปัจจุบัน', color: MUTED, size: 'sm', margin: 'xs' },
    ],
    bodyContents: body,
    footerContents: footer,
  });
}

// 5. Budget set
function flexBudgetSet(amount, monthlyTotal) {
  const pct       = Math.min(100, Math.round((monthlyTotal / amount) * 100));
  const barColor  = pct >= 80 ? DANGER : MINT;
  const remaining = Math.max(0, amount - monthlyTotal);

  return bubble({
    headerContents: [
      { type: 'text', text: 'งบเดือนนี้',         color: WHITE, size: 'lg', weight: 'bold' },
      { type: 'text', text: 'ตั้งงบเรียบร้อยแล้ว', color: MUTED, size: 'sm', margin: 'xs' },
    ],
    bodyContents: [
      { type: 'text', text: `฿${fmt(amount)}`, color: WHITE, size: 'xxl', weight: 'bold' },
      sep(),
      { ...hrow('ใช้ไปแล้ว', `฿${fmt(monthlyTotal)}`), margin: 'lg' },
      progressBar(pct, barColor),
      {
        type: 'box', layout: 'horizontal', margin: 'sm',
        contents: [
          { type: 'text', text: `${pct}%`,             color: barColor,                    size: 'xs', flex: 1 },
          { type: 'text', text: `เหลือ ฿${fmt(remaining)}`, color: pct >= 80 ? DANGER : MINT, size: 'sm', align: 'end' },
        ],
      },
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────

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
  flexWeeklySummary,
  flexPlanStatus,
  flexBudgetSet,
};
