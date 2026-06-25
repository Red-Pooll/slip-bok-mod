const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const config = require('../config');

const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  realtime: {
    transport: WebSocket,
  },
});

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

module.exports = {
  saveTransaction,
  getDailyTotal,
  getWeeklyTotal,
  getMonthlyTotal,
  getWeeklySummary,
  getRecentTransactions,
  getAllUserIds,
  setBudget,
  getBudget,
};
