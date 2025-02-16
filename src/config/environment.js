// ตัวแปรสำหรับเก็บ environment variables ที่จำเป็น
const requiredEnvVars = [
  "FIREBASE_TYPE",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_DATABASE_URL",
];

// ฟังก์ชันตรวจสอบความถูกต้องของ environment variables
const validateEnvironment = () => {
  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      console.error(`❌ ไม่พบตัวแปร environment ที่จำเป็น: ${varName}`);
      process.exit(1);
    }
  });
};

module.exports = { validateEnvironment };
