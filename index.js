const { validateEnvironment } = require("./src/config/environment");
const { initializeFirebase } = require("./src/config/firebase");
const { createApp } = require("./src/app");
const { getThaiTime } = require("./src/services/timeService");

// ตรวจสอบความถูกต้องของตัวแปรสภาพแวดล้อม
validateEnvironment();

// เริ่มต้นการเชื่อมต่อ Firebase และส่งต่อ db ไปยัง app
const db = initializeFirebase();
const app = createApp(db);

const port = process.env.PORT || 3000;

// เริ่มต้นเซิร์ฟเวอร์
app.listen(port, () => {
  const thaiTime = getThaiTime();
  console.log(`
🚀 เริ่มต้นเซิร์ฟเวอร์สำเร็จ
📋 รายละเอียด:
- พอร์ต: ${port}
- สภาพแวดล้อม: ${process.env.NODE_ENV || "development"}
- โปรเจค Firebase: ${process.env.FIREBASE_PROJECT_ID}
- เวลาเซิร์ฟเวอร์: ${new Date().toISOString()}
- เวลาไทย: ${thaiTime.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
  `);
});

// ตัวจัดการข้อผิดพลาด
process.on("uncaughtException", (error) => {
  console.error("💥 เกิดข้อผิดพลาดที่ไม่ได้จัดการ:", error);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.error("💥 เกิด Promise rejection ที่ไม่ได้จัดการ:", error);
  process.exit(1);
});
