const { getThaiTime } = require("./timeService");

/**
 * คำนวณปริมาตรเชิงการค้า (CBM)
 * @param {number} width - ความกว้าง (ซม.)
 * @param {number} length - ความยาว (ซม.)
 * @param {number} height - ความสูง (ซม.)
 * @returns {number} ปริมาตรเป็น CBM
 */
function calculateCBM(width, length, height) {
  return (width * length * height) / 1000000;
}

/**
 * กำหนด Rank ตามยอดสะสม
 * @param {number} accumulatedAmount - ยอดสะสมการสั่งซื้อ (บาท)
 * @returns {string} Rank ของลูกค้า
 */
function determineRank(accumulatedAmount = 0) {
  if (accumulatedAmount > 2000000) return "STAR";
  if (accumulatedAmount > 500000) return "DIAMOND";
  return "SILVER";
}

/**
 * ดึงอัตราค่าขนส่งตาม Rank และประเภทสินค้า
 * @param {string} rank - Rank ของลูกค้า
 * @param {string} productType - ประเภทสินค้า ('general', 'type1-2', 'special')
 * @param {string} shippingMethod - วิธีการขนส่ง ('land', 'sea')
 * @returns {Object} อัตราค่าขนส่งต่อ กก. และ CBM
 */
function getShippingRate(
  rank = "SILVER",
  productType = "general",
  shippingMethod = "land"
) {
  // Normalize inputs
  rank = (rank || "SILVER").toUpperCase();
  productType = (productType || "general").toLowerCase();
  shippingMethod = (shippingMethod || "land").toLowerCase();

  // Validate inputs
  const validRanks = ["SILVER", "DIAMOND", "STAR"];
  const validProductTypes = ["general", "type1-2", "special"];
  const validShippingMethods = ["land", "sea"];

  if (!validRanks.includes(rank)) rank = "SILVER";
  if (!validProductTypes.includes(productType)) productType = "general";
  if (!validShippingMethods.includes(shippingMethod)) shippingMethod = "land";

  const rates = {
    SILVER: {
      land: {
        general: { perKg: 50, perCBM: 7500 },
        "type1-2": { perKg: 60, perCBM: 8500 },
        special: { perKg: 120, perCBM: 12000 },
      },
      sea: {
        general: { perKg: 45, perCBM: 5400 },
        "type1-2": { perKg: 50, perCBM: 6900 },
        special: { perKg: 120, perCBM: 12000 },
      },
    },
    DIAMOND: {
      land: {
        general: { perKg: 45, perCBM: 7300 },
        "type1-2": { perKg: 55, perCBM: 8300 },
        special: { perKg: 110, perCBM: 11000 },
      },
      sea: {
        general: { perKg: 40, perCBM: 4900 },
        "type1-2": { perKg: 50, perCBM: 6500 },
        special: { perKg: 110, perCBM: 11000 },
      },
    },
    STAR: {
      land: {
        general: { perKg: 40, perCBM: 6800 },
        "type1-2": { perKg: 50, perCBM: 7800 },
        special: { perKg: 100, perCBM: 10000 },
      },
      sea: {
        general: { perKg: 35, perCBM: 4500 },
        "type1-2": { perKg: 45, perCBM: 6300 },
        special: { perKg: 100, perCBM: 10000 },
      },
    },
  };

  return rates[rank][shippingMethod][productType];
}

/**
 * คำนวณค่าขนส่งสุทธิ
 * @param {number} weight - น้ำหนักจริง (กก.)
 * @param {number} cbm - ปริมาตรเชิงการค้า (CBM)
 * @param {Object} rate - อัตราค่าขนส่ง
 * @returns {Object} ค่าขนส่งและวิธีการคำนวณที่ใช้
 */
function calculateShippingFee(weight, cbm, rate) {
  if (
    !rate ||
    typeof rate.perCBM !== "number" ||
    typeof rate.perKg !== "number"
  ) {
    throw new Error("Invalid rate object provided");
  }

  const volumetricFee = cbm * rate.perCBM;
  const weightFee = weight * rate.perKg;

  return {
    fee: Math.max(volumetricFee, weightFee),
    method: volumetricFee > weightFee ? "CBM" : "WEIGHT",
  };
}

/**
 * ตรวจสอบความถูกต้องของพารามิเตอร์
 * @param {Object} params - พารามิเตอร์ที่ต้องการตรวจสอบ
 * @returns {Object} ผลการตรวจสอบ { isValid, message }
 */
function validateParameters(params) {
  const { width, length, height, weight } = params;

  // Check if all required parameters exist
  if (!width || !length || !height || !weight) {
    return {
      isValid: false,
      message:
        "กรุณาระบุข้อมูลให้ครบถ้วน (กว้าง x ยาว x สูง และน้ำหนัก) เช่น:\n- กว้าง 50 ซม.\n- ยาว 60 ซม.\n- สูง 40 ซม.\n- น้ำหนัก 5 กก.",
    };
  }

  // Check if all parameters are numbers and positive
  if (
    typeof width !== "number" ||
    typeof length !== "number" ||
    typeof height !== "number" ||
    typeof weight !== "number"
  ) {
    return {
      isValid: false,
      message: "ขนาดและน้ำหนักต้องเป็นตัวเลขเท่านั้น",
    };
  }

  if (width <= 0 || length <= 0 || height <= 0 || weight <= 0) {
    return {
      isValid: false,
      message: "ขนาดและน้ำหนักต้องเป็นค่าที่มากกว่า 0",
    };
  }

  // Add maximum size constraints if needed
  const MAX_DIMENSION = 1000; // 10 meters in cm
  const MAX_WEIGHT = 10000; // 10 tons in kg

  if (
    width > MAX_DIMENSION ||
    length > MAX_DIMENSION ||
    height > MAX_DIMENSION
  ) {
    return {
      isValid: false,
      message: "ขนาดต้องไม่เกิน 1000 ซม. (10 เมตร)",
    };
  }

  if (weight > MAX_WEIGHT) {
    return {
      isValid: false,
      message: "น้ำหนักต้องไม่เกิน 10,000 กก. (10 ตัน)",
    };
  }

  return { isValid: true };
}

/**
 * บันทึกข้อมูลการคำนวณลงฐานข้อมูล
 * @param {Object} data - ข้อมูลที่จะบันทึก
 * @param {FirebaseDatabase} db - Firebase database instance
 * @param {string} userId - ID ของผู้ใช้
 * @returns {Promise<void>}
 */
async function saveCalculationData(data, db, userId) {
  if (!db || !userId) {
    console.warn("Missing database instance or user ID");
    return;
  }

  try {
    const calculationRef = db.ref(`shipping_calculations/${userId}`);
    await calculationRef.push({
      ...data,
      timestamp: getThaiTime().toISOString(),
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database error:", error);
    // ไม่ throw error เพื่อให้การคำนวณดำเนินต่อได้
  }
}

/**
 * สร้างข้อความตอบกลับ
 * @param {Object} data - ข้อมูลสำหรับสร้างข้อความ
 * @returns {string} ข้อความตอบกลับ
 */
function createResponse(data) {
  const {
    width,
    length,
    height,
    weight,
    cbm,
    rank,
    productType,
    shippingMethod,
    fee,
    method,
  } = data;

  const productTypeMapping = {
    general: "สินค้าทั่วไป",
    "type1-2": "สินค้าประเภท 1,2",
    special: "สินค้าพิเศษ",
  };

  return (
    `🚚 ผลการคำนวณค่าขนส่ง:\n\n` +
    `📦 ขนาด: ${width}x${length}x${height} ซม.\n` +
    `⚖️ น้ำหนัก: ${weight} กก.\n` +
    `📊 ปริมาตร: ${cbm.toFixed(3)} CBM\n` +
    `🏆 Rank: ${rank} Rabbit\n` +
    `🏷️ ประเภทสินค้า: ${productTypeMapping[productType] || productType}\n` +
    `🚛 วิธีขนส่ง: ${shippingMethod === "land" ? "ทางรถ" : "ทางเรือ"}\n` +
    `💰 ค่าขนส่ง: ${fee.toFixed(2)} บาท\n` +
    `ℹ️ คิดตาม: ${method === "CBM" ? "ปริมาตร" : "น้ำหนัก"}`
  );
}

/**
 * ฟังก์ชันจัดการ Intent สำหรับคำนวณค่าขนส่ง
 * @param {DialogflowAgent} agent - Dialogflow agent
 * @param {FirebaseDatabase} db - Firebase database instance
 */
async function handleShippingCalculation(agent, db) {
  try {
    // รับพารามิเตอร์จาก Dialogflow พร้อมค่าเริ่มต้น
    const parameters = agent.parameters || {};
    const {
      width = 0,
      length = 0,
      height = 0,
      weight = 0,
      productType = "general",
      shippingMethod = "land",
      accumulatedAmount = 0,
    } = parameters;

    // ตรวจสอบความถูกต้องของพารามิเตอร์
    const validation = validateParameters({ width, length, height, weight });
    if (!validation.isValid) {
      agent.add(validation.message);
      return;
    }

    // คำนวณค่าต่างๆ
    const cbm = calculateCBM(width, length, height);
    const rank = determineRank(accumulatedAmount);

    try {
      const rate = getShippingRate(rank, productType, shippingMethod);
      const { fee, method } = calculateShippingFee(weight, cbm, rate);

      // เตรียมข้อมูลสำหรับบันทึกและสร้างการตอบกลับ
      const calculationData = {
        dimensions: { width, length, height },
        weight,
        cbm,
        productType,
        shippingMethod,
        rank,
        fee,
        calculationMethod: method,
      };

      // บันทึกข้อมูล
      const userId =
        agent.originalRequest?.payload?.data?.source?.userId || "unknown";
      await saveCalculationData(calculationData, db, userId);

      // สร้างและส่งการตอบกลับ
      const response = createResponse({
        width,
        length,
        height,
        weight,
        cbm,
        rank,
        productType,
        shippingMethod,
        fee,
        method,
      });

      agent.add(response);
    } catch (error) {
      console.error("Rate calculation error:", error);
      agent.add(
        "ขออภัย พบข้อผิดพลาดในการคำนวณอัตราค่าขนส่ง กรุณาตรวจสอบข้อมูลที่ระบุ"
      );
    }
  } catch (error) {
    console.error("❌ Error in handleShippingCalculation:", error);
    agent.add("ขออภัย เกิดข้อผิดพลาดในการคำนวณ กรุณาลองใหม่อีกครั้ง");
  }
}

module.exports = {
  calculateCBM,
  determineRank,
  getShippingRate,
  calculateShippingFee,
  handleShippingCalculation,
  validateParameters,
  saveCalculationData,
  createResponse,
};
