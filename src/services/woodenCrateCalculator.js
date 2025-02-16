// src/services/woodenCrateCalculator.js
const { getThaiTime } = require("./timeService");

/**
 * คำนวณปริมาตรของลังไม้เป็นคิว
 * @param {number} width - ความกว้าง (ซม.)
 * @param {number} length - ความยาว (ซม.)
 * @param {number} height - ความสูง (ซม.)
 * @returns {number} ปริมาตรเป็นคิว
 */
function calculateVolume(width, length, height) {
  return (width * length * height) / 1000000;
}

/**
 * คำนวณค่าตีลังไม้ตามปริมาตร
 * @param {number} volume - ปริมาตรเป็นคิว
 * @returns {number} ค่าตีลังไม้เป็นหยวน
 */
function calculateCrateFee(volume) {
  if (volume >= 1.0) return 200; // max fee

  // เริ่มที่ 60 หยวนสำหรับปริมาตรน้อยกว่า 0.2 คิว
  if (volume < 0.2) return 60;

  // คำนวณช่วงปริมาตร (0.2-0.29 = 80, 0.3-0.39 = 100, etc.)
  const bracket = Math.floor(volume * 10) - 1;
  return 60 + bracket * 20;
}

/**
 * ฟังก์ชันจัดการ Intent สำหรับคำนวณค่าตีลังไม้
 * @param {DialogflowAgent} agent - Dialogflow agent
 * @param {FirebaseDatabase} db - Firebase database instance
 */
async function handleWoodenCrateCalculation(agent, db) {
  try {
    // รับพารามิเตอร์จาก Dialogflow
    const { width, length, height } = agent.parameters;

    // ตรวจสอบว่ามีค่าที่จำเป็นครบหรือไม่
    if (!width || !length || !height) {
      agent.add("กรุณาระบุขนาดในรูปแบบ กว้างxยาวxสูง เช่น 50x60x40");
      return;
    }

    // คำนวณปริมาตรและค่าตีลังไม้
    const volume = calculateVolume(width, length, height);
    const fee = calculateCrateFee(volume);

    // บันทึกข้อมูลการคำนวณลง Firebase
    const userId =
      agent.originalRequest?.payload?.data?.source?.userId || "unknown";
    const calculationRef = db.ref(`wooden_crate_calculations/${userId}`);
    await calculationRef.push({
      timestamp: getThaiTime().toISOString(),
      dimensions: { width, length, height },
      volume,
      fee,
    });

    // สร้างข้อความตอบกลับ
    const response =
      `📦 ผลการคำนวณค่าตีลังไม้:\n\n` +
      `📐 ขนาด: ${width}x${length}x${height} ซม.\n` +
      `📊 ปริมาตร: ${volume.toFixed(2)} คิว\n` +
      `💰 ค่าตีลังไม้: ${fee} หยวน`;

    agent.add(response);
  } catch (error) {
    console.error("❌ Error in handleWoodenCrateCalculation:", error);
    agent.add("ขออภัย เกิดข้อผิดพลาดในการคำนวณ กรุณาลองใหม่อีกครั้ง");
  }
}

module.exports = {
  calculateVolume,
  calculateCrateFee,
  handleWoodenCrateCalculation,
};
