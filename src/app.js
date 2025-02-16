const express = require("express");
const { getThaiTime } = require("./services/timeService");

const createApp = (db) => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

module.exports = { createApp };
