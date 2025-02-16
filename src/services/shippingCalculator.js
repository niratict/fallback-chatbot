// src/services/shippingCalculator.js
const { getThaiTime } = require("./timeService");

/**
 * แปลงข้อความเป็นพารามิเตอร์
 * @param {string} input - ข้อความจากผู้ใช้
 * @returns {Object} พารามิเตอร์ที่แยกแล้ว
 */
function parseInput(input) {
  // กรณีข้อความแบบบรรทัดเดียว
  if (input.includes(",")) {
    const [rank, type, weight, dimensions, transport] = input
      .split(",")
      .map((s) => s.trim());
    return { rank, type, weight, dimensions, transport };
  }

  // กรณีข้อความแบบหลายบรรทัด
  const lines = input.split("\n");
  const params = {};

  lines.forEach((line) => {
    const [key, value] = line.split(":").map((s) => s.trim());
    switch (key.toLowerCase()) {
      case "rank":
        params.rank = value;
        break;
      case "ประเภท":
        params.type = value;
        break;
      case "น้ำหนัก":
        params.weight = value;
        break;
      case "ขนาด":
        params.dimensions = value;
        break;
      case "ขนส่ง":
        params.transport = value;
        break;
    }
  });

  return params;
}

/**
 * คำนวณปริมาตร (CBM)
 * @param {string} dimensions - ขนาดในรูปแบบ กxยxส
 * @returns {number} ปริมาตรเป็น CBM
 */
function calculateCBM(dimensions) {
  const [width, length, height] = dimensions
    .toLowerCase()
    .replace("ซม.", "")
    .split("x")
    .map(Number);
  return (width * length * height) / 1000000;
}

/**
 * คำนวณค่าขนส่ง
 * @param {string} rank - ระดับลูกค้า
 * @param {string} type - ประเภทสินค้า
 * @param {number} weight - น้ำหนักเป็น kg
 * @param {number} cbm - ปริมาตรเป็น CBM
 * @param {string} transport - วิธีขนส่ง
 * @returns {number} ค่าขนส่ง
 */
function calculateShippingFee(rank, type, weight, cbm, transport) {
  const rates = {
    car: {
      "silver rabbit": {
        ทั่วไป: { perKg: 50, perCBM: 7500 },
        "ประเภท 1,2": { perKg: 60, perCBM: 8500 },
        พิเศษ: { perKg: 120, perCBM: 12000 },
      },
      "diamond rabbit": {
        ทั่วไป: { perKg: 45, perCBM: 7300 },
        "ประเภท 1,2": { perKg: 55, perCBM: 8300 },
        พิเศษ: { perKg: 110, perCBM: 11000 },
      },
      "star rabbit": {
        ทั่วไป: { perKg: 40, perCBM: 6800 },
        "ประเภท 1,2": { perKg: 50, perCBM: 7800 },
        พิเศษ: { perKg: 100, perCBM: 10000 },
      },
    },
    ship: {
      "silver rabbit": {
        ทั่วไป: { perKg: 45, perCBM: 5400 },
        "ประเภท 1,2": { perKg: 50, perCBM: 6900 },
        พิเศษ: { perKg: 120, perCBM: 12000 },
      },
      "diamond rabbit": {
        ทั่วไป: { perKg: 40, perCBM: 4900 },
        "ประเภท 1,2": { perKg: 50, perCBM: 6500 },
        พิเศษ: { perKg: 110, perCBM: 11000 },
      },
      "star rabbit": {
        ทั่วไป: { perKg: 35, perCBM: 4500 },
        "ประเภท 1,2": { perKg: 45, perCBM: 6300 },
        พิเศษ: { perKg: 100, perCBM: 10000 },
      },
    },
  };

  const transportType = transport === "รถ" ? "car" : "ship";
  const rateTable = rates[transportType][rank.toLowerCase()][type];

  // คำนวณค่าขนส่งทั้งแบบ kg และ CBM
  const byWeight = weight * rateTable.perKg;
  const byCBM = cbm * rateTable.perCBM;

  // เลือกค่าที่มากกว่า
  return Math.max(byWeight, byCBM);
}

/**
 * ฟังก์ชันจัดการ Intent สำหรับคำนวณค่าขนส่ง
 * @param {DialogflowAgent} agent - Dialogflow agent
 * @param {FirebaseDatabase} db - Firebase database instance
 */
async function handleShippingCalculation(agent, db) {
  try {
    const input = agent.query;
    const params = parseInput(input);

    // ตรวจสอบข้อมูลที่จำเป็น
    if (
      !params.rank ||
      !params.type ||
      !params.weight ||
      !params.dimensions ||
      !params.transport
    ) {
      agent.add(
        "กรุณาระบุข้อมูลให้ครบถ้วนในรูปแบบ:\nRank: [ระดับ]\nประเภท: [ประเภทสินค้า]\nน้ำหนัก: [น้ำหนัก]kg\nขนาด: [กว้าง]x[ยาว]x[สูง] ซม.\nขนส่ง: [รถ/เรือ]"
      );
      return;
    }

    // แปลงน้ำหนักเป็นตัวเลข
    const weight = parseFloat(params.weight.replace("kg", ""));
    const cbm = calculateCBM(params.dimensions);

    // คำนวณค่าขนส่ง
    const shippingFee = calculateShippingFee(
      params.rank,
      params.type,
      weight,
      cbm,
      params.transport
    );
    const isCalculatedByCBM = cbm > weight;

    // บันทึกข้อมูลการคำนวณลง Firebase
    const userId =
      agent.originalRequest?.payload?.data?.source?.userId || "unknown";
    const calculationRef = db.ref(`shipping_calculations/${userId}`);
    await calculationRef.push({
      timestamp: getThaiTime().toISOString(),
      params,
      weight,
      cbm,
      shippingFee,
      calculatedBy: isCalculatedByCBM ? "CBM" : "KG",
    });

    // สร้างข้อความตอบกลับ
    const response =
      `🚚 ค่าขนส่งคำนวณได้ดังนี้:\n\n` +
      `📌 Rank: ${params.rank}\n` +
      `📦 ประเภทสินค้า: ${params.type}\n` +
      `⚖️ น้ำหนัก: ${weight}kg\n` +
      `📐 ขนาด: ${params.dimensions}\n` +
      `🛣 วิธีขนส่ง: ${params.transport}\n\n` +
      `✅ สินค้าถูกคำนวณเป็น ${isCalculatedByCBM ? "CBM" : "KG"}\n` +
      `💰 ค่าขนส่งจากจีนมาไทย: ${shippingFee.toFixed(2)} บาท\n` +
      `🚛 ค่าขนส่งในไทย: รับที่บริษัท (ฟรี)\n` +
      `📌 ยอดรวมค่าขนส่ง: ${shippingFee.toFixed(2)} บาท`;

    agent.add(response);
  } catch (error) {
    console.error("❌ Error in handleShippingCalculation:", error);
    agent.add("ขออภัย เกิดข้อผิดพลาดในการคำนวณ กรุณาลองใหม่อีกครั้ง");
  }
}

module.exports = {
  calculateCBM,
  calculateShippingFee,
  handleShippingCalculation,
};
