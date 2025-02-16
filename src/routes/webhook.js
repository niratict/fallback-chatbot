const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const { handleCalculator } = require("../handlers/intentHandlers");
const { handleFallback } = require("../handlers/fallbackHandler");
const { handleFeeCalculation } = require("../services/feeCalculator");
const { handleWoodenCrateCalculation } = require("../services/woodenCrateCalculator");

module.exports = (db) => {
  const router = express.Router();

  router.post("/", async (req, res) => {
    const agent = new WebhookClient({ request: req, response: res });
    const intentMap = new Map();

    intentMap.set("Default Fallback Intent", (agent) =>
      handleFallback(agent, db)
    );
    intentMap.set("Calculator", (agent) => handleCalculator(agent, db));
    intentMap.set("FeeCalculation", (agent) => handleFeeCalculation(agent, db));
    intentMap.set("WoodenCrateCalculation", (agent) => 
      handleWoodenCrateCalculation(agent, db)
    );

    try {
      await agent.handleRequest(intentMap);
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการจัดการคำขอ webhook:", error);
      res.status(500).send({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
  });

  return router;
};
