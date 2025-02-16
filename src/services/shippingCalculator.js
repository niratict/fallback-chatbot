// src/services/shippingCalculator.js
const { getThaiTime } = require("./timeService");

const VALID_RANKS = ["silver rabbit", "diamond rabbit", "star rabbit"];
const VALID_TYPES = ["ทั่วไป", "ประเภท 1,2", "พิเศษ"];
const VALID_TRANSPORT = ["รถ", "เรือ"];

/**
 * ดึงคำแนะนำวิธีการคำนวณค่าขนส่ง
 * @returns {string} ข้อความคำแนะนำ
 */
function getShippingInstructions() {
  return `📝 วิธีการคำนวณค่าขนส่ง:
1️⃣ รูปแบบการกรอกข้อมูล (กรุณากรอกตามลำดับ โดยคั่นด้วยเครื่องหมาย ,):
   Rank, ประเภทสินค้า, น้ำหนัก, ขนาด, วิธีขนส่ง
2️⃣ ตัวอย่างการกรอก:
   silver rabbit, ทั่วไป, 12kg, 50x40x30 ซม., รถ
3️⃣ รายละเอียดข้อมูลที่รองรับ:
   🏅 Rank: ${VALID_RANKS.join(", ")}
   📦 ประเภทสินค้า: ${VALID_TYPES.join(", ")}
   ⚖️ น้ำหนัก: ระบุเป็นตัวเลขตามด้วย kg (เช่น 12kg)
   📐 ขนาด: กว้างxยาวxสูง ซม. (เช่น 50x40x30 ซม.)
   🚛 วิธีขนส่ง: ${VALID_TRANSPORT.join(", ")}`;
}

/**
 * ตรวจสอบความถูกต้องของข้อมูล
 * @param {Object} params - พารามิเตอร์ที่ต้องการตรวจสอบ
 * @returns {string[]} รายการข้อผิดพลาดที่พบ
 */
function validateInput(params) {
  const errors = [];

  if (!params.rank || !VALID_RANKS.includes(params.rank.toLowerCase())) {
    errors.push(`Rank ไม่ถูกต้อง (ต้องเป็น: ${VALID_RANKS.join(", ")})`);
  }

  if (!params.type || !VALID_TYPES.includes(params.type)) {
    errors.push(`ประเภทสินค้าไม่ถูกต้อง (ต้องเป็น: ${VALID_TYPES.join(", ")})`);
  }

  if (!params.weight || !params.weight.match(/^\d+(\.\d+)?kg$/)) {
    errors.push("น้ำหนักไม่ถูกต้อง (ต้องระบุเป็นตัวเลขตามด้วย kg เช่น 12kg)");
  }

  if (!params.dimensions || !params.dimensions.match(/^\d+x\d+x\d+\s*ซม\.?$/)) {
    errors.push("ขนาดไม่ถูกต้อง (ต้องระบุเป็น กxยxส ซม. เช่น 50x40x30 ซม.)");
  }

  if (!params.transport || !VALID_TRANSPORT.includes(params.transport)) {
    errors.push(
      `วิธีขนส่งไม่ถูกต้อง (ต้องเป็น: ${VALID_TRANSPORT.join(", ")})`
    );
  }

  return errors;
}

/**
 * แปลงข้อความเป็นพารามิเตอร์
 * @param {string} input - ข้อความจากผู้ใช้
 * @returns {Object} พารามิเตอร์ที่แยกแล้ว
 */
function parseInput(input) {
  try {
    if (input.includes(",")) {
      const [rank, type, weight, dimensions, transport] = input
        .split(",")
        .map((s) => s.trim());
      return { rank, type, weight, dimensions, transport };
    }

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
  } catch (error) {
    console.error("Error parsing input:", error);
    throw new Error("รูปแบบข้อมูลไม่ถูกต้อง กรุณาตรวจสอบการกรอกข้อมูล");
  }
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

  const byWeight = weight * rateTable.perKg;
  const byCBM = cbm * rateTable.perCBM;

  return Math.max(byWeight, byCBM);
}

/**
 * ฟังก์ชันจัดการ Intent สำหรับคำนวณค่าขนส่ง
 * @param {DialogflowAgent} agent - Dialogflow agent
 * @param {FirebaseDatabase} db - Firebase database instance
 */
async function handleShippingCalculation(agent, db) {
  try {
    const input = agent.query.trim();

    // ตรวจสอบถ้าผู้ใช้ถามเกี่ยวกับวิธีการคำนวณ
    if (input.match(/วิธี|คำนวณ|คิด|อย่างไร|ยังไง|การกรอก|กรอก/i)) {
      agent.add(getShippingInstructions());
      return;
    }

    const params = parseInput(input);
    const validationErrors = validateInput(params);

    if (validationErrors.length > 0) {
      agent.add(
        `❌ พบข้อผิดพลาดในการกรอกข้อมูล:\n\n${validationErrors.join(
          "\n"
        )}\n\n${getShippingInstructions()}`
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
    agent.add(
      `ขออภัย เกิดข้อผิดพลาดในการคำนวณ\n\n${getShippingInstructions()}`
    );
  }
}

module.exports = {
  calculateCBM,
  calculateShippingFee,
  handleShippingCalculation,
  getShippingInstructions,
  validateInput,
  parseInput,
};
