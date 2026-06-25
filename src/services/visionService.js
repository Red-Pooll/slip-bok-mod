const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

async function extractTextFromImage(imageBuffer) {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: imageBuffer.toString('base64'),
              },
            },
            {
              text: 'อ่านข้อความทั้งหมดในสลิปนี้ให้ครบถ้วน ตอบเฉพาะข้อความที่อ่านได้เท่านั้น ไม่ต้องอธิบายเพิ่มเติม',
            },
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
  return text || null;
}

module.exports = { extractTextFromImage };
