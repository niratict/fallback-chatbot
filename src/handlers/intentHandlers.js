const { calculateResult } = require("../services/calculator");
const { getThaiTime } = require("../services/timeService");

// ฟังก์ชันจัดการ intent สำหรับการคำนวณ
const handleCalculator = async (agent, db) => {
  try {
    const message = agent.query;
    // Regular expression สำหรับแยกส่วนประกอบของสมการ
    const calculationRegex =
      /^\s*(-?\d+\.?\d*)\s*([\+\-\*\/])\s*(-?\d+\.?\d*)\s*$/;
    const match = message.match(calculationRegex);

    if (!match) {
      agent.add('กรุณาป้อนสมการในรูปแบบที่ถูกต้อง เช่น "10 + 5" หรือ "20 * 3"');
      return;
    }

    // แยกส่วนประกอบของสมการ
    const [, num1Str, operator, num2Str] = match;
    const num1 = parseFloat(num1Str);
    const num2 = parseFloat(num2Str);
    const result = calculateResult(num1, operator, num2);

    if (result === null) {
      agent.add("ไม่สามารถคำนวณได้ กรุณาตรวจสอบตัวเลขและเครื่องหมายที่ใช้");
      return;
    }

    // บันทึกประวัติการคำนวณและส่งผลลัพธ์
    await saveCalculation(db, agent, message, result);
    agent.add(`ผลลัพธ์ของ ${num1} ${operator} ${num2} คือ ${result}`);
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการคำนวณ:", error);
    agent.add("ขออภัย เกิดข้อผิดพลาดในการคำนวณ กรุณาลองใหม่อีกครั้ง");
  }
};

// ฟังก์ชันบันทึกประวัติการคำนวณลง Firebase
const saveCalculation = async (db, agent, expression, result) => {
  const userId =
    agent.originalRequest?.payload?.data?.source?.userId || "unknown";
  const calculationRef = db.ref(`calculations/${userId}`);
  await calculationRef.push({
    expression,
    result,
    timestamp: getThaiTime().toISOString(),
  });
};

module.exports = { handleCalculator };
