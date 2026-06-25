const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

const PROMPT = `อ่านสลิปโอนเงิน PromptPay ภาษาไทยนี้ แล้วตอบเป็น JSON เท่านั้น ไม่ต้องอธิบายเพิ่มเติม:
{
  "amount": <ยอดโอนเป็นตัวเลข ไม่มีหน่วย>,
  "recipient": "<ชื่อผู้รับเงิน>",
  "date": "<วันที่ในรูปแบบ YYYY-MM-DD>"
}`;

async function extractTextFromImage(imageBuffer) {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBuffer.toString('base64'),
              },
            },
            { text: PROMPT },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini Vision error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) return null;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  return JSON.parse(jsonMatch[0]);
}

module.exports = { extractTextFromImage };
