const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const { handleCalculator } = require("../handlers/intentHandlers");
const { handleFallback } = require("../handlers/fallbackHandler");
const { handleFeeCalculation } = require("../services/feeCalculator");
const { initializeFirebase } = require("../firebase"); // เพิ่ม import firebase

const router = express.Router();

// เริ่มต้นการเชื่อมต่อ Firebase
const db = initializeFirebase();

// เส้นทางสำหรับรับคำขอจาก Dialogflow
router.post("/", async (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  const intentMap = new Map();

  // กำหนดฟังก์ชันจัดการสำหรับแต่ละ intent
  intentMap.set("Default Fallback Intent", (agent) =>
    handleFallback(agent, db)
  );
  intentMap.set("Calculator", (agent) => handleCalculator(agent, db));
  intentMap.set("FeeCalculation", (agent) => handleFeeCalculation(agent, db));

  try {
    await agent.handleRequest(intentMap);
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการจัดการคำขอ webhook:", error);
    res.status(500).send({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
});

module.exports = router;
