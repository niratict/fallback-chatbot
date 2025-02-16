const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const { handleCalculator } = require("../handlers/intentHandlers");
const { handleFallback } = require("../handlers/fallbackHandler");
const { handleFeeCalculation } = require("../services/feeCalculator");
const { handleWoodenCrateCalculation } = require("../services/woodenCrateCalculator");
const { 
  handleShippingCalculation,
  handleShippingByWeight,
  handleShippingByDimension
} = require("../services/shippingCalculator");

module.exports = (db) => {
  const router = express.Router();

  router.post("/", async (req, res) => {
    const agent = new WebhookClient({ request: req, response: res });
    const intentMap = new Map();

    // Base intents
    intentMap.set("Default Fallback Intent", (agent) =>
      handleFallback(agent, db)
    );
    intentMap.set("Calculator", (agent) => 
      handleCalculator(agent, db)
    );
    intentMap.set("FeeCalculation", (agent) => 
      handleFeeCalculation(agent, db)
    );
    intentMap.set("WoodenCrateCalculation", (agent) => 
      handleWoodenCrateCalculation(agent, db)
    );

    // Shipping calculation intents
    intentMap.set("ShippingCalculation", (agent) => 
      handleShippingCalculation(agent, db)
    );
    intentMap.set("ShippingCalculation.askForDimensions", (agent) => 
      handleShippingByDimension(agent, db)
    );
    intentMap.set("ShippingCalculation.askForWeight", (agent) => 
      handleShippingByWeight(agent, db)
    );

    // Shipping rate inquiry intents
    intentMap.set("ShippingRateInquiry", (agent) => {
      const { rank = 'SILVER', shippingMethod = 'land' } = agent.parameters;
      let response = `🚚 อัตราค่าขนส่งสำหรับ ${rank} Rabbit:\n\n`;
      
      if (rank === 'SILVER') {
        if (shippingMethod === 'land') {
          response += "• สินค้าทั่วไป: 50 บาท/กก. | 7,500 บาท/CBM\n";
          response += "• สินค้าประเภท 1,2: 60 บาท/กก. | 8,500 บาท/CBM\n";
          response += "• สินค้าพิเศษ: 120 บาท/กก. | 12,000 บาท/CBM";
        } else {
          response += "• สินค้าทั่วไป: 45 บาท/กก. | 5,400 บาท/CBM\n";
          response += "• สินค้าประเภท 1,2: 50 บาท/กก. | 6,900 บาท/CBM\n";
          response += "• สินค้าพิเศษ: 120 บาท/กก. | 12,000 บาท/CBM";
        }
      }
      // เพิ่มเงื่อนไขสำหรับ Rank อื่นๆ
      
      agent.add(response);
    });

    intentMap.set("RankInquiry", (agent) => {
      const response = 
        "🏆 Rank ลูกค้าแบ่งตามยอดสะสม:\n\n" +
        "🥈 Silver Rabbit: 0 - 500,000 บาท\n" +
        "💎 Diamond Rabbit: 500,000 - 2,000,000 บาท\n" +
        "⭐ Star Rabbit: มากกว่า 2,000,000 บาท";
      
      agent.add(response);
    });

    try {
      await agent.handleRequest(intentMap);
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการจัดการคำขอ webhook:", error);
      res.status(500).send({ 
        error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
        details: error.message 
      });
    }
  });

  return router;
};