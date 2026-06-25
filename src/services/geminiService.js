const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
const model = genAI.getGenerativeModel({ model: config.gemini.model }, { apiVersion: 'v1' });

const CATEGORIES = [
  'อาหาร/เครื่องดื่ม',
  'การเดินทาง/น้ำมัน',
  'ช้อปปิ้ง/เสื้อผ้า',
  'สุขภาพ/ยา',
  'บันเทิง',
  'บิล/สาธารณูปโภค',
  'การศึกษา',
  'อื่นๆ',
];

async function categorizeTransaction(merchantName, amount, rawText) {
  const prompt = `คุณเป็น AI ผู้ช่วยจัดหมวดหมู่รายจ่ายสำหรับคนไทย

ข้อมูลจากสลิป:
- ร้านค้า/ผู้รับเงิน: ${merchantName}
- จำนวนเงิน: ${amount} บาท
- ข้อความ OCR: ${rawText.substring(0, 300)}

หมวดหมู่ที่มี: ${CATEGORIES.join(', ')}

ตอบเป็น JSON เท่านั้น ไม่ต้องอธิบายเพิ่มเติม:
{
  "category": "หมวดหมู่ที่เหมาะสมที่สุด",
  "merchantShortName": "ชื่อร้านสั้นๆ ไม่เกิน 15 ตัวอักษร"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { category: 'อื่นๆ', merchantShortName: merchantName.substring(0, 15) };
  }
}

module.exports = { categorizeTransaction };
