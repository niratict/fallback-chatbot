// src/app.js
const express = require("express");
const webhookRoutes = require("./routes/webhook");
const { getThaiTime } = require("./services/timeService");

// ฟังก์ชันสร้าง Express application
const createApp = () => {
  const app = express();

  // ตั้งค่า Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // เส้นทางหลักสำหรับตรวจสอบสถานะเซิร์ฟเวอร์
  app.get("/", (req, res) => {
    const thaiTime = getThaiTime();
    res.send({
      status: "online",
      timestamp: thaiTime.toISOString(),
      thai_time: thaiTime.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
      service: "Dialogflow Webhook",
    });
  });

  // เพิ่มเส้นทาง webhook
  app.use("/webhook", webhookRoutes);

  return app;
};

module.exports = { createApp };
