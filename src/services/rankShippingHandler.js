// src/services/rankShippingHandler.js
const VALID_RANKS = ["silver rabbit", "diamond rabbit", "star rabbit"];

/**
 * ฟังก์ชันจัดการคำถามเกี่ยวกับ Rank และอัตราค่าขนส่ง
 * @param {DialogflowAgent} agent - Dialogflow agent
 * @param {FirebaseDatabase} db - Firebase database instance
 */
async function handleRankShippingInquiry(agent, db) {
  const intent = agent.intent;

  // Log การสอบถามข้อมูล
  const userId =
    agent.originalRequest?.payload?.data?.source?.userId || "unknown";
  const inquiryRef = db.ref(`rank_shipping_inquiries/${userId}`);
  await inquiryRef.push({
    timestamp: new Date().toISOString(),
    intent: intent,
    query: agent.query,
  });

  switch (intent) {
    case "RankInquiry":
      return handleRankInquiry(agent, db);
    case "CarShippingRates":
      return handleCarShippingRates(agent, db);
    case "ShipShippingRates":
      return handleShipShippingRates(agent, db);
    default:
      return agent.add("ขออภัย ไม่เข้าใจคำถาม กรุณาถามใหม่อีกครั้งค่ะ");
  }
}

/**
 * ฟังก์ชันจัดการคำถามเกี่ยวกับ Rank ที่มีในระบบ
 * @param {DialogflowAgent} agent - Dialogflow agent
 * @param {FirebaseDatabase} db - Firebase database instance
 */
async function handleRankInquiry(agent, db) {
  const response = `📌 ระบบของเรามี 3 ระดับ Rank:

1️⃣ **Silver Rabbit** 🥈  
2️⃣ **Diamond Rabbit** 💎  
3️⃣ **Star Rabbit** ⭐  

🔹 Rank ที่สูงขึ้นจะได้รับค่าขนส่งที่ถูกลง  
🔹 สนใจสอบถามรายละเอียดเพิ่มเติม แจ้งได้เลยนะคะ 😊`;

  agent.add(response);
}

/**
 * ฟังก์ชันจัดการคำถามเกี่ยวกับอัตราค่าขนส่งทางรถ
 * @param {DialogflowAgent} agent - Dialogflow agent
 * @param {FirebaseDatabase} db - Firebase database instance
 */
async function handleCarShippingRates(agent, db) {
  const response = `🚛 **อัตราค่าขนส่งทางรถ (จากจีนมาไทย) ตามระดับ Rank**  

🔹 **Silver Rabbit**  
- ทั่วไป: **50 บาท/kg** หรือ **7,500 บาท/CBM**  
- ประเภท 1,2: **60 บาท/kg** หรือ **8,500 บาท/CBM**  
- พิเศษ: **120 บาท/kg** หรือ **12,000 บาท/CBM**  

🔹 **Diamond Rabbit**  
- ทั่วไป: **45 บาท/kg** หรือ **7,300 บาท/CBM**  
- ประเภท 1,2: **55 บาท/kg** หรือ **8,300 บาท/CBM**  
- พิเศษ: **110 บาท/kg** หรือ **11,000 บาท/CBM**  

🔹 **Star Rabbit**  
- ทั่วไป: **40 บาท/kg** หรือ **6,800 บาท/CBM**  
- ประเภท 1,2: **50 บาท/kg** หรือ **7,800 บาท/CBM**  
- พิเศษ: **100 บาท/kg** หรือ **10,000 บาท/CBM**  

📌 *ค่าขนส่งจะถูกคำนวณจากน้ำหนักจริงหรือ CBM แล้วแต่ว่าค่าไหนสูงกว่า*  
📌 *หากต้องการคำนวณค่าขนส่งจริง แจ้งรายละเอียดสินค้าได้เลยค่ะ* 😊`;

  agent.add(response);
}

/**
 * ฟังก์ชันจัดการคำถามเกี่ยวกับอัตราค่าขนส่งทางเรือ
 * @param {DialogflowAgent} agent - Dialogflow agent
 * @param {FirebaseDatabase} db - Firebase database instance
 */
async function handleShipShippingRates(agent, db) {
  const response = `🚢 **อัตราค่าขนส่งทางเรือ (จากจีนมาไทย) ตามระดับ Rank**  

🔹 **Silver Rabbit**  
- ทั่วไป: **45 บาท/kg** หรือ **5,400 บาท/CBM**  
- ประเภท 1,2: **50 บาท/kg** หรือ **6,900 บาท/CBM**  
- พิเศษ: **120 บาท/kg** หรือ **12,000 บาท/CBM**  

🔹 **Diamond Rabbit**  
- ทั่วไป: **40 บาท/kg** หรือ **4,900 บาท/CBM**  
- ประเภท 1,2: **50 บาท/kg** หรือ **6,500 บาท/CBM**  
- พิเศษ: **110 บาท/kg** หรือ **11,000 บาท/CBM**  

🔹 **Star Rabbit**  
- ทั่วไป: **35 บาท/kg** หรือ **4,500 บาท/CBM**  
- ประเภท 1,2: **45 บาท/kg** หรือ **6,300 บาท/CBM**  
- พิเศษ: **100 บาท/kg** หรือ **10,000 บาท/CBM**  

📌 *ค่าขนส่งจะถูกคำนวณจากน้ำหนักจริงหรือ CBM แล้วแต่ว่าค่าไหนสูงกว่า*  
📌 *หากต้องการคำนวณค่าขนส่งจริง แจ้งรายละเอียดสินค้าได้เลยค่ะ* 😊`;

  agent.add(response);
}

module.exports = {
  handleRankShippingInquiry,
  handleRankInquiry,
  handleCarShippingRates,
  handleShipShippingRates,
};
