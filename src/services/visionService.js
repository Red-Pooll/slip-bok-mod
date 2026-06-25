const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

async function extractTextFromImage(imageBuffer) {
  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: 'image/jpeg',
      },
    },
    'อ่านข้อความทั้งหมดในสลิปนี้ให้ครบถ้วน ตอบเฉพาะข้อความที่อ่านได้เท่านั้น ไม่ต้องอธิบายเพิ่มเติม',
  ]);

  const text = result.response.text().trim();
  return text || null;
}

module.exports = { extractTextFromImage };
