const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const { handleCalculator } = require("../handlers/intentHandlers");
const { handleFallback } = require("../handlers/fallbackHandler");
const { handleFeeCalculation } = require("../services/feeCalculator");
const {
  handleWoodenCrateCalculation,
} = require("../services/woodenCrateCalculator");
const {
  handleShippingCalculation,
  handleShippingByWeight,
  handleShippingByDimension,
} = require("../services/shippingCalculator");

module.exports = (db) => {
  if (!db) {
    console.error("Database instance is required");
    throw new Error("Database instance must be provided");
  }

  const router = express.Router();

  // Middleware to validate request
  const validateRequest = (req, res, next) => {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }
    next();
  };

  // Middleware to handle errors
  const errorHandler = (err, req, res, next) => {
    console.error("Webhook Error:", err);
    res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
    });
  };

  router.post("/", validateRequest, async (req, res) => {
    let agent;
    try {
      agent = new WebhookClient({ request: req, response: res });
    } catch (error) {
      console.error("Error creating WebhookClient:", error);
      return res.status(400).json({ error: "Invalid request format" });
    }

    const intentMap = new Map();

    // Base intents
    intentMap.set("Default Fallback Intent", async (agent) => {
      try {
        await handleFallback(agent, db);
      } catch (error) {
        console.error("Fallback handler error:", error);
        agent.add("ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
    });

    // Calculator intents with error handling
    intentMap.set("Calculator", async (agent) => {
      try {
        await handleCalculator(agent, db);
      } catch (error) {
        console.error("Calculator handler error:", error);
        agent.add("ขออภัย เกิดข้อผิดพลาดในการคำนวณ กรุณาลองใหม่อีกครั้ง");
      }
    });

    intentMap.set("FeeCalculation", async (agent) => {
      try {
        await handleFeeCalculation(agent, db);
      } catch (error) {
        console.error("Fee calculation error:", error);
        agent.add(
          "ขออภัย เกิดข้อผิดพลาดในการคำนวณค่าธรรมเนียม กรุณาลองใหม่อีกครั้ง"
        );
      }
    });

    intentMap.set("WoodenCrateCalculation", async (agent) => {
      try {
        await handleWoodenCrateCalculation(agent, db);
      } catch (error) {
        console.error("Wooden crate calculation error:", error);
        agent.add("ขออภัย เกิดข้อผิดพลาดในการคำนวณลังไม้ กรุณาลองใหม่อีกครั้ง");
      }
    });

    // Shipping calculation intents with error handling
    intentMap.set("ShippingCalculation", async (agent) => {
      try {
        await handleShippingCalculation(agent, db);
      } catch (error) {
        console.error("Shipping calculation error:", error);
        agent.add(
          "ขออภัย เกิดข้อผิดพลาดในการคำนวณค่าขนส่ง กรุณาลองใหม่อีกครั้ง"
        );
      }
    });

    intentMap.set("ShippingCalculation.askForDimensions", async (agent) => {
      try {
        await handleShippingByDimension(agent, db);
      } catch (error) {
        console.error("Shipping dimension handler error:", error);
        agent.add("ขออภัย เกิดข้อผิดพลาดในการระบุขนาด กรุณาลองใหม่อีกครั้ง");
      }
    });

    intentMap.set("ShippingCalculation.askForWeight", async (agent) => {
      try {
        await handleShippingByWeight(agent, db);
      } catch (error) {
        console.error("Shipping weight handler error:", error);
        agent.add("ขออภัย เกิดข้อผิดพลาดในการระบุน้ำหนัก กรุณาลองใหม่อีกครั้ง");
      }
    });

    // Shipping rate inquiry with error handling
    intentMap.set("ShippingRateInquiry", async (agent) => {
      try {
        const { rank = "SILVER", shippingMethod = "land" } = agent.parameters;
        let response = `🚚 อัตราค่าขนส่งสำหรับ ${rank} Rabbit:\n\n`;

        if (rank === "SILVER") {
          if (shippingMethod === "land") {
            response += "• สินค้าทั่วไป: 50 บาท/กก. | 7,500 บาท/CBM\n";
            response += "• สินค้าประเภท 1,2: 60 บาท/กก. | 8,500 บาท/CBM\n";
            response += "• สินค้าพิเศษ: 120 บาท/กก. | 12,000 บาท/CBM";
          } else {
            response += "• สินค้าทั่วไป: 45 บาท/กก. | 5,400 บาท/CBM\n";
            response += "• สินค้าประเภท 1,2: 50 บาท/กก. | 6,900 บาท/CBM\n";
            response += "• สินค้าพิเศษ: 120 บาท/กก. | 12,000 บาท/CBM";
          }
        }
        agent.add(response);
      } catch (error) {
        console.error("Rate inquiry error:", error);
        agent.add(
          "ขออภัย เกิดข้อผิดพลาดในการแสดงอัตราค่าขนส่ง กรุณาลองใหม่อีกครั้ง"
        );
      }
    });

    intentMap.set("RankInquiry", (agent) => {
      try {
        const response =
          "🏆 Rank ลูกค้าแบ่งตามยอดสะสม:\n\n" +
          "🥈 Silver Rabbit: 0 - 500,000 บาท\n" +
          "💎 Diamond Rabbit: 500,000 - 2,000,000 บาท\n" +
          "⭐ Star Rabbit: มากกว่า 2,000,000 บาท";

        agent.add(response);
      } catch (error) {
        console.error("Rank inquiry error:", error);
        agent.add(
          "ขออภัย เกิดข้อผิดพลาดในการแสดงข้อมูล Rank กรุณาลองใหม่อีกครั้ง"
        );
      }
    });

    try {
      await agent.handleRequest(intentMap);
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการจัดการคำขอ webhook:", error);
      res.status(500).json({
        error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // Apply error handler
  router.use(errorHandler);

  return router;
};
