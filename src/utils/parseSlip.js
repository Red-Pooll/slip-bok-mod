// Parses Thai PromptPay slip OCR text into structured fields
function parseSlipText(rawText) {
  const result = {
    amount: null,
    merchantName: null,
    slipDate: null,
    referenceNo: null,
  };

  // Amount — look for Thai baht patterns: "100.00", "1,500.00", or "฿85"
  const amountMatch = rawText.match(/(?:จำนวนเงิน|Amount|฿)[\s:]*([0-9,]+\.?[0-9]*)/i)
    || rawText.match(/([0-9,]+\.[0-9]{2})\s*(?:บาท|THB|Baht)/i)
    || rawText.match(/([0-9,]+)\s*บาท/);

  if (amountMatch) {
    result.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  // Merchant / receiver name
  const merchantMatch = rawText.match(/(?:ผู้รับเงิน|โอนเงินให้|ชื่อบัญชี|บัญชีปลายทาง|Receiver|To)[:\s]+([^\n]+)/i);
  if (merchantMatch) {
    result.merchantName = merchantMatch[1].trim().substring(0, 60);
  }

  // Date — dd/mm/yyyy or dd-mm-yyyy
  const dateMatch = rawText.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dateMatch) {
    const [, d, m, y] = dateMatch;
    const year = y.length === 2 ? `20${y}` : String(parseInt(y) > 2500 ? parseInt(y) - 543 : y);
    result.slipDate = new Date(`${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`).toISOString();
  }

  // Reference / transaction number
  const refMatch = rawText.match(/(?:เลขที่|Ref|Reference|รายการ)[.:\s#]*([A-Z0-9]{8,})/i);
  if (refMatch) {
    result.referenceNo = refMatch[1];
  }

  return result;
}

module.exports = { parseSlipText };
