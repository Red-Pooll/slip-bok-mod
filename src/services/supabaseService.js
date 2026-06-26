const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const config = require('../config');

const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  realtime: {
    transport: WebSocket,
  },
});

const FREE_SLIP_LIMIT = 20;

async function saveTransaction(userId, data) {
  const { error } = await supabase.from('transactions').insert({
    user_id: userId,
    amount: data.amount,
    merchant: data.merchantShortName,
    category: data.category,
    raw_text: data.rawText,
    slip_date: data.slipDate || new Date().toISOString(),
  });

  if (error) throw error;
}

async function getDailyTotal(userId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .gte('slip_date', start.toISOString());

  if (error) throw error;
  return data.reduce((sum, t) => sum + Number(t.amount), 0);
}

async function getWeeklyTotal(userId) {
  const start = new Date();
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .gte('slip_date', start.toISOString());

  if (error) throw error;
  return data.reduce((sum, t) => sum + Number(t.amount), 0);
}

async function getMonthlyTotal(userId) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .gte('slip_date', start.toISOString());

  if (error) throw error;
  return data.reduce((sum, t) => sum + Number(t.amount), 0);
}

async function getWeeklySummary(userId) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, category, merchant')
    .eq('user_id', userId)
    .gte('slip_date', weekAgo.toISOString())
    .order('slip_date', { ascending: false });

  if (error) throw error;

  const byCategory = {};
  let total = 0;

  for (const t of data) {
    total += Number(t.amount);
    byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount);
  }

  return { total, byCategory, count: data.length };
}

async function getRecentTransactions(userId, limit = 10) {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, merchant, category, slip_date')
    .eq('user_id', userId)
    .order('slip_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getAllUserIds() {
  const { data, error } = await supabase
    .from('transactions')
    .select('user_id')
    .gte('slip_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (error) throw error;
  return [...new Set(data.map((r) => r.user_id))];
}

async function setBudget(userId, amount) {
  const { error } = await supabase
    .from('budgets')
    .upsert({ user_id: userId, monthly_amount: amount, updated_at: new Date().toISOString() });

  if (error) throw error;
}

async function getBudget(userId) {
  const { data, error } = await supabase
    .from('budgets')
    .select('monthly_amount')
    .eq('user_id', userId)
    .single();

  // PGRST116 = row not found — budget not set yet
  if (error && error.code !== 'PGRST116') throw error;
  return data?.monthly_amount ?? null;
}

async function deleteBudget(userId) {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}

async function checkPlan(userId) {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan, slip_count_this_month, month_reset, pro_expires_at')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  if (!data) {
    await supabase.from('subscriptions').insert({
      user_id: userId,
      plan: 'free',
      slip_count_this_month: 0,
      month_reset: firstOfMonth,
    });
    return { plan: 'free', slipCount: 0, slipLimit: FREE_SLIP_LIMIT, proExpiresAt: null };
  }

  let slipCount = data.slip_count_this_month;

  if (data.month_reset < firstOfMonth) {
    slipCount = 0;
    await supabase
      .from('subscriptions')
      .update({ slip_count_this_month: 0, month_reset: firstOfMonth, updated_at: now.toISOString() })
      .eq('user_id', userId);
  }

  let plan = data.plan;
  if (plan === 'pro' && data.pro_expires_at && new Date(data.pro_expires_at) < now) {
    plan = 'free';
    await supabase
      .from('subscriptions')
      .update({ plan: 'free', updated_at: now.toISOString() })
      .eq('user_id', userId);
  }

  return { plan, slipCount, slipLimit: FREE_SLIP_LIMIT, proExpiresAt: data.pro_expires_at };
}

async function incrementSlipCount(userId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('slip_count_this_month')
    .eq('user_id', userId)
    .single();
  if (error) throw error;

  const { error: ue } = await supabase
    .from('subscriptions')
    .update({
      slip_count_this_month: (data.slip_count_this_month || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  if (ue) throw ue;
}

async function getRecentTransactionsByDays(userId, days) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, merchant, category, slip_date')
    .eq('user_id', userId)
    .gte('slip_date', since.toISOString())
    .order('slip_date', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}

async function getProUserIds() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('plan', 'pro')
    .or(`pro_expires_at.is.null,pro_expires_at.gt.${now}`);
  if (error) throw error;
  return data.map((r) => r.user_id);
}

async function deleteAllData(userId) {
  const [t, b] = await Promise.all([
    supabase.from('transactions').delete().eq('user_id', userId),
    supabase.from('budgets').delete().eq('user_id', userId),
  ]);

  if (t.error) throw t.error;
  if (b.error) throw b.error;
}

module.exports = {
  saveTransaction,
  getDailyTotal,
  getWeeklyTotal,
  getMonthlyTotal,
  getWeeklySummary,
  getRecentTransactions,
  getRecentTransactionsByDays,
  getAllUserIds,
  getProUserIds,
  setBudget,
  getBudget,
  deleteBudget,
  deleteAllData,
  checkPlan,
  incrementSlipCount,
};
