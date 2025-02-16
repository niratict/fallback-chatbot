// index.js
const { validateEnvironment } = require("./src/config/environment");
const { initializeFirebase } = require("./src/config/firebase");
const { createApp } = require("./src/app");
const { getThaiTime } = require("./src/services/timeService");

// ตรวจสอบความถูกต้องของตัวแปรสภาพแวดล้อม
validateEnvironment();

// เริ่มต้นการเชื่อมต่อ Firebase และส่งต่อ db ไปยัง app
const db = initializeFirebase();
const app = createApp(db); // ส่ง db เข้าไปใน createApp

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

// ส่วนของ error handling คงเดิม...

// app.js
const express = require("express");
const { getThaiTime } = require("./services/timeService");

const createApp = (db) => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ส่ง db ไปยัง webhook routes
  const webhookRoutes = require("./routes/webhook")(db);

  app.get("/", (req, res) => {
    const thaiTime = getThaiTime();
    res.send({
      status: "online",
      timestamp: thaiTime.toISOString(),
      thai_time: thaiTime.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
      service: "Dialogflow Webhook",
    });
  });

  app.use("/webhook", webhookRoutes);

  return app;
};
