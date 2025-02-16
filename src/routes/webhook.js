const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const { handleCalculator } = require("../handlers/intentHandlers");
const { handleFallback } = require("../handlers/fallbackHandler");
const { handleFeeCalculation } = require("../services/feeCalculator");
const {
  handleWoodenCrateCalculation,
} = require("../services/woodenCrateCalculator");
const { handleShippingCalculation } = require("../services/shippingCalculator");

module.exports = (db) => {
  const router = express.Router();

  router.post("/", async (req, res) => {
    const agent = new WebhookClient({ request: req, response: res });

    // Log intent name for debugging
    console.log("📨 Received intent:", agent.intent);

    const intentMap = new Map();

    // Set handlers for each intent
    intentMap.set("Default Fallback Intent", (agent) =>
      handleFallback(agent, db)
    );
    intentMap.set("Calculator", (agent) => handleCalculator(agent, db));
    intentMap.set("FeeCalculation", (agent) => handleFeeCalculation(agent, db));
    intentMap.set("WoodenCrateCalculation", (agent) =>
      handleWoodenCrateCalculation(agent, db)
    );
    intentMap.set("ShippingCalculation", (agent) =>
      handleShippingCalculation(agent, db)
    );

    // Add default handler for unhandled intents
    intentMap.set(null, (agent) => {
      console.log("⚠️ No specific handler for intent:", agent.intent);
      agent.add("ขออภัย ระบบไม่สามารถประมวลผลคำขอนี้ได้ กรุณาลองใหม่อีกครั้ง");
    });

    try {
      await agent.handleRequest(intentMap);
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการจัดการคำขอ webhook:", error);
      console.error("Intent:", agent.intent);
      console.error("Query:", agent.query);
      res.status(500).send({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
  });

  return router;
};
