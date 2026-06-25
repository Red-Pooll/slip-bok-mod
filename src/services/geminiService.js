async function categorizeTransaction(merchantName, amount, rawText) {
  return {
    category: "อาหาร/เครื่องดื่ม",
    merchantShortName: merchantName || "ร้านค้า",
  };
}

module.exports = { categorizeTransaction };
