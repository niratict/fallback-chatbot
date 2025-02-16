// ฟังก์ชันสำหรับ log ข้อมูลในรูปแบบที่กำหนด
const logInfo = (message, data = {}) => {
  console.log(`ℹ️ ${message}`, data);
};

const logError = (message, error) => {
  console.error(`❌ ${message}:`, error);
};

const logSuccess = (message) => {
  console.log(`✅ ${message}`);
};

module.exports = { logInfo, logError, logSuccess };
