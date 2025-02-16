const {
  isWithinBusinessHours,
  getThaiTime,
} = require("../services/timeService");

// ฟังก์ชันจัดการ Default Fallback Intent
const handleFallback = async (agent, db) => {
  try {
    // ดึง userId จาก LINE
    const userId =
      agent.originalRequest?.payload?.data?.source?.userId || "unknown";
    console.log(`👤 กำลังประมวลผล fallback สำหรับผู้ใช้: ${userId}`);

    // ตรวจสอบและอัพเดทข้อมูลผู้ใช้ใน Firebase
    const userRef = db.ref(`users/${userId}`);
    const snapshot = await userRef.once("value");
    const userData = snapshot.val() || {};
    const lastFallbackTime = userData.lastFallbackTime || 0;
    const currentTime = Date.now();
    const COOLDOWN_PERIOD = 1800000; // 30 นาที

    // ตรวจสอบช่วงเวลา cooldown
    if (currentTime - lastFallbackTime >= COOLDOWN_PERIOD) {
      // อัพเดทเวลาล่าสุดที่ผู้ใช้ได้รับข้อความ fallback
      await userRef.update({
        lastFallbackTime: currentTime,
        lastUpdated: getThaiTime().toISOString(),
        userId: userId,
      });

      // ส่งข้อความตามเวลาทำการ
      if (isWithinBusinessHours()) {
        agent.add("รบกวนคุณลูกค้ารอเจ้าหน้าที่ฝ่ายบริการตอบกลับอีกครั้งนะคะ");
      } else {
        agent.add(
          "รบกวนคุณลูกค้ารอเจ้าหน้าที่ฝ่ายบริการตอบกลับอีกครั้งนะคะ " +
            "ทั้งนี้เจ้าหน้าที่ฝ่ายบริการทำการจันทร์-เสาร์ เวลา 09.00-00.00 น. " +
            "และวันอาทิตย์ทำการเวลา 09.00-18.00 น. ค่ะ"
        );
      }
      console.log(`✅ อัพเดทเวลา fallback สำหรับผู้ใช้: ${userId}`);
    } else {
      agent.add(""); // ไม่ส่งข้อความถ้าอยู่ในช่วง cooldown
      console.log(`ℹ️ ผู้ใช้ ${userId} อยู่ในช่วง cooldown`);
    }
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดใน handleFallback:", error);
    agent.add("ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
  }
};

module.exports = { handleFallback };
