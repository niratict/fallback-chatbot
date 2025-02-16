
// ฟังก์ชันคำนวณค่าบริการ

const { getThaiTime } = require("./timeService");

function calculateServiceFee(serviceType, hours = 0) {
  const baseFees = {
    basic: 100, // ค่าบริการพื้นฐาน
    premium: 200, // ค่าบริการพิเศษ
  };
  const hourlyRate = 50; // ค่าบริการต่อชั่วโมง

  // คำนวณค่าบริการพื้นฐาน
  const baseFee = baseFees[serviceType] || baseFees.basic;

  // คำนวณค่าบริการเพิ่มตามเวลา
  const hourlyFee = hours * hourlyRate;

  return {
    baseFee,
    hourlyFee,
    total: baseFee + hourlyFee,
  };
}

// ฟังก์ชันคำนวณค่าขนส่ง
function calculateShippingFee(distance, shippingType, needPackaging = false) {
  const shippingRates = {
    standard: 10, // ค่าส่งมาตรฐานต่อกิโลเมตร
    express: 20, // ค่าส่งด่วนต่อกิโลเมตร
  };
  const packagingFee = 30; // ค่าแพ็คสินค้า

  // คำนวณค่าขนส่งตามระยะทาง
  const distanceFee =
    distance * (shippingRates[shippingType] || shippingRates.standard);

  // เพิ่มค่าแพ็คสินค้า (ถ้ามี)
  const packaging = needPackaging ? packagingFee : 0;

  return {
    distanceFee,
    packagingFee: packaging,
    total: distanceFee + packaging,
  };
}

// ฟังก์ชันจัดการ Intent สำหรับคำนวณค่าบริการและค่าขนส่ง
async function handleFeeCalculation(agent, db) {
  try {
    // รับพารามิเตอร์จาก Dialogflow
    const parameters = agent.parameters;

    // ดึงข้อมูลที่จำเป็น
    const serviceType = parameters.serviceType || "basic";
    const hours = parameters.hours || 0;
    const distance = parameters.distance || 0;
    const shippingType = parameters.shippingType || "standard";
    const needPackaging = parameters.needPackaging || false;

    // คำนวณค่าบริการ
    const serviceFee = calculateServiceFee(serviceType, hours);

    // คำนวณค่าขนส่ง
    const shippingFee = calculateShippingFee(
      distance,
      shippingType,
      needPackaging
    );

    // คำนวณยอดรวมทั้งหมด
    const totalFee = serviceFee.total + shippingFee.total;

    // บันทึกข้อมูลการคำนวณลง Firebase
    const userId =
      agent.originalRequest?.payload?.data?.source?.userId || "unknown";
    const calculationRef = db.ref(`fee_calculations/${userId}`);
    await calculationRef.push({
      timestamp: getThaiTime().toISOString(),
      serviceType,
      hours,
      distance,
      shippingType,
      needPackaging,
      serviceFee,
      shippingFee,
      totalFee,
    });

    // สร้างข้อความตอบกลับ
    let response = `🧾 รายละเอียดค่าใช้จ่าย:\n\n`;
    response += `📌 ค่าบริการ:\n`;
    response += `  • ค่าบริการพื้นฐาน: ${serviceFee.baseFee} บาท\n`;
    if (hours > 0) {
      response += `  • ค่าบริการตามเวลา (${hours} ชั่วโมง): ${serviceFee.hourlyFee} บาท\n`;
    }
    response += `  • รวมค่าบริการ: ${serviceFee.total} บาท\n\n`;

    response += `📌 ค่าขนส่ง:\n`;
    response += `  • ค่าส่ง (${distance} กม.): ${shippingFee.distanceFee} บาท\n`;
    if (needPackaging) {
      response += `  • ค่าแพ็คสินค้า: ${shippingFee.packagingFee} บาท\n`;
    }
    response += `  • รวมค่าขนส่ง: ${shippingFee.total} บาท\n\n`;

    response += `💰 ยอดรวมทั้งหมด: ${totalFee} บาท`;
    agent.add(response);
  } catch (error) {
    console.error("❌ Error in handleFeeCalculation:", error);
    agent.add("ขออภัย เกิดข้อผิดพลาดในการคำนวณ กรุณาลองใหม่อีกครั้ง");
  }
}

module.exports = {
  calculateServiceFee,
  calculateShippingFee,
  handleFeeCalculation,
};
